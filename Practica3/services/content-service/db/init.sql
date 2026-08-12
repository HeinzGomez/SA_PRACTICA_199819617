-- =====================================================================
-- content-service :: PostgreSQL init script
-- Database per Microservice: propiedad exclusiva de content-service.
-- Optimizado para ingesta de alta concurrencia (playback_events).
--
-- Practica 3 agrega: columna "school" denormalizada (para poder filtrar
-- el catalogo por Escuela sin cruzar bases de datos), paginacion server-
-- side limitada a 10 resultados, y el Procedimiento Almacenado de carga
-- masiva por CSV (sp_bulk_ingest_recordings_csv).
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------
-- Tablas
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS recordings (
    recording_id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title          VARCHAR(200) NOT NULL,
    course_id      UUID NOT NULL, -- referencia logica a identity-service.courses (sin FK cruzada)
    semester       VARCHAR(20) NOT NULL,
    school         VARCHAR(120), -- denormalizado desde identity-service al momento de la ingesta
    unit           VARCHAR(100),
    syllabus_url   TEXT,
    video_url      TEXT NOT NULL,
    recorded_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    view_count     BIGINT NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_recordings_filters ON recordings(semester, school, course_id);

CREATE TABLE IF NOT EXISTS recording_professors (
    recording_id  UUID REFERENCES recordings(recording_id) ON DELETE CASCADE,
    professor_ref VARCHAR(150) NOT NULL, -- nombre/identificador de docente/auxiliar
    role          VARCHAR(20) NOT NULL DEFAULT 'PROFESOR', -- PROFESOR | AUXILIAR
    PRIMARY KEY (recording_id, professor_ref)
);

CREATE TABLE IF NOT EXISTS recording_tags (
    recording_id  UUID REFERENCES recordings(recording_id) ON DELETE CASCADE,
    tag           VARCHAR(60) NOT NULL,
    PRIMARY KEY (recording_id, tag)
);

-- Tabla de alta concurrencia: un registro por evento de reproduccion
CREATE TABLE IF NOT EXISTS playback_events (
    event_id          BIGSERIAL PRIMARY KEY,
    user_id            UUID NOT NULL,
    recording_id       UUID REFERENCES recordings(recording_id) ON DELETE CASCADE,
    event_type         VARCHAR(20) NOT NULL, -- play | pause | seek | complete
    position_seconds   INTEGER NOT NULL DEFAULT 0,
    occurred_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_playback_events_recording ON playback_events(recording_id, occurred_at DESC);

CREATE TABLE IF NOT EXISTS checkpoints (
    user_id            UUID NOT NULL,
    recording_id       UUID REFERENCES recordings(recording_id) ON DELETE CASCADE,
    position_seconds   INTEGER NOT NULL,
    unit               VARCHAR(100),
    topic              VARCHAR(150),
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, recording_id)
);

-- Bitacora de cargas masivas CSV (trazabilidad de quien y cuando)
CREATE TABLE IF NOT EXISTS csv_ingest_log (
    ingest_id       BIGSERIAL PRIMARY KEY,
    actor_user_id   UUID,
    rows_processed  INT NOT NULL,
    rows_failed     INT NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- Vistas: catalogo y detalle listos para consumo del handler gRPC
-- ---------------------------------------------------------------------
CREATE OR REPLACE VIEW v_recording_catalog AS
SELECT
    r.recording_id,
    r.title,
    r.course_id,
    r.semester,
    r.school,
    r.recorded_at,
    COALESCE(array_agg(DISTINCT t.tag) FILTER (WHERE t.tag IS NOT NULL), '{}') AS tags,
    (SELECT professor_ref FROM recording_professors rp
       WHERE rp.recording_id = r.recording_id AND rp.role = 'PROFESOR' LIMIT 1) AS professor_id
FROM recordings r
LEFT JOIN recording_tags t ON t.recording_id = r.recording_id
GROUP BY r.recording_id;

CREATE OR REPLACE VIEW v_recording_detail AS
SELECT
    r.recording_id,
    r.title,
    r.course_id,
    r.semester,
    r.school,
    r.unit,
    r.syllabus_url,
    r.video_url,
    r.recorded_at,
    COALESCE(array_agg(DISTINCT rp.professor_ref) FILTER (WHERE rp.role = 'PROFESOR'), '{}') AS professors,
    COALESCE(array_agg(DISTINCT rp2.professor_ref) FILTER (WHERE rp2.role = 'AUXILIAR'), '{}') AS auxiliaries,
    COALESCE(array_agg(DISTINCT t.tag) FILTER (WHERE t.tag IS NOT NULL), '{}') AS tags
FROM recordings r
LEFT JOIN recording_professors rp ON rp.recording_id = r.recording_id AND rp.role = 'PROFESOR'
LEFT JOIN recording_professors rp2 ON rp2.recording_id = r.recording_id AND rp2.role = 'AUXILIAR'
LEFT JOIN recording_tags t ON t.recording_id = r.recording_id
GROUP BY r.recording_id;

-- Historial reciente: ultimo checkpoint por grabacion, unido al catalogo
CREATE OR REPLACE VIEW v_recent_history AS
SELECT
    c.user_id,
    c.recording_id,
    r.title,
    r.course_id,
    c.unit,
    c.topic,
    c.position_seconds,
    c.updated_at AS last_watched_at
FROM checkpoints c
JOIN recordings r ON r.recording_id = c.recording_id;

-- ---------------------------------------------------------------------
-- Funcion: calcula el porcentaje de avance de un checkpoint respecto a
-- la duracion estimada (usada para UI de progreso).
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_progress_percentage(p_position_seconds INTEGER, p_duration_seconds INTEGER)
RETURNS NUMERIC AS $$
BEGIN
    IF p_duration_seconds IS NULL OR p_duration_seconds = 0 THEN
        RETURN 0;
    END IF;
    RETURN ROUND((p_position_seconds::NUMERIC / p_duration_seconds::NUMERIC) * 100, 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ---------------------------------------------------------------------
-- Procedimiento almacenado: ingesta transaccional de una nueva grabacion
-- junto con sus docentes/auxiliares y etiquetas. Usado tanto por la
-- ingesta individual (IngestRecording) como, fila a fila, por la carga
-- masiva CSV (sp_bulk_ingest_recordings_csv).
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_ingest_recording(
    p_title        VARCHAR,
    p_course_id    UUID,
    p_semester     VARCHAR,
    p_unit         VARCHAR,
    p_video_url    TEXT,
    p_professors   TEXT[],
    p_tags         TEXT[],
    p_school       VARCHAR DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_recording_id UUID;
    v_professor TEXT;
    v_tag TEXT;
BEGIN
    IF p_title IS NULL OR length(trim(p_title)) = 0 THEN
        RAISE EXCEPTION 'El titulo de la grabacion es obligatorio';
    END IF;
    IF p_course_id IS NULL THEN
        RAISE EXCEPTION 'course_id es obligatorio';
    END IF;
    IF p_video_url IS NULL OR length(trim(p_video_url)) = 0 THEN
        RAISE EXCEPTION 'video_url es obligatorio';
    END IF;

    INSERT INTO recordings (title, course_id, semester, school, unit, video_url)
    VALUES (p_title, p_course_id, p_semester, p_school, p_unit, p_video_url)
    RETURNING recording_id INTO v_recording_id;

    IF p_professors IS NOT NULL THEN
        FOREACH v_professor IN ARRAY p_professors LOOP
            IF length(trim(v_professor)) > 0 THEN
                INSERT INTO recording_professors (recording_id, professor_ref, role)
                VALUES (v_recording_id, v_professor, 'PROFESOR')
                ON CONFLICT DO NOTHING;
            END IF;
        END LOOP;
    END IF;

    IF p_tags IS NOT NULL THEN
        FOREACH v_tag IN ARRAY p_tags LOOP
            IF length(trim(v_tag)) > 0 THEN
                INSERT INTO recording_tags (recording_id, tag)
                VALUES (v_recording_id, v_tag)
                ON CONFLICT DO NOTHING;
            END IF;
        END LOOP;
    END IF;

    RETURN v_recording_id;
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------------
-- Procedimiento almacenado (Practica 3): carga masiva de grabaciones a
-- partir de un arreglo JSONB (una entrada por fila del CSV, ya parseado
-- por content-service en Go). Cada fila se procesa en su propio bloque
-- BEGIN/EXCEPTION (savepoint implicito de PostgreSQL): un error en una
-- fila NO aborta el resto del archivo, solo se reporta en "errors".
-- Esto es lo que el enunciado exige como "Procedimientos Almacenados
-- para manejar las inserciones complejas del archivo CSV".
-- ---------------------------------------------------------------------
DROP TYPE IF EXISTS bulk_ingest_result CASCADE;
CREATE TYPE bulk_ingest_result AS (
    rows_processed INT,
    rows_failed    INT,
    errors         TEXT[]
);

CREATE OR REPLACE FUNCTION sp_bulk_ingest_recordings_csv(p_rows JSONB)
RETURNS bulk_ingest_result AS $$
DECLARE
    v_row JSONB;
    v_result bulk_ingest_result;
    v_processed INT := 0;
    v_failed INT := 0;
    v_errors TEXT[] := '{}';
BEGIN
    FOR v_row IN SELECT * FROM jsonb_array_elements(p_rows)
    LOOP
        BEGIN
            PERFORM sp_ingest_recording(
                v_row->>'title',
                (v_row->>'course_id')::UUID,
                v_row->>'semester',
                v_row->>'unit',
                v_row->>'video_url',
                ARRAY(SELECT jsonb_array_elements_text(COALESCE(v_row->'professors', '[]'::jsonb))),
                ARRAY(SELECT jsonb_array_elements_text(COALESCE(v_row->'tags', '[]'::jsonb))),
                v_row->>'school'
            );
            v_processed := v_processed + 1;
        EXCEPTION WHEN OTHERS THEN
            v_failed := v_failed + 1;
            v_errors := array_append(
                v_errors,
                format('Fila "%s": %s', COALESCE(v_row->>'title', '(sin titulo)'), SQLERRM)
            );
        END;
    END LOOP;

    v_result.rows_processed := v_processed;
    v_result.rows_failed := v_failed;
    v_result.errors := v_errors;
    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------------
-- Trigger: mantiene actualizado recordings.view_count ante cada evento
-- de reproduccion de tipo 'play', evitando recalcular agregados en caliente.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION trg_fn_update_view_counters() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.event_type = 'play' THEN
        UPDATE recordings SET view_count = view_count + 1 WHERE recording_id = NEW.recording_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_view_counters ON playback_events;
CREATE TRIGGER trg_update_view_counters
    AFTER INSERT ON playback_events
    FOR EACH ROW
    EXECUTE FUNCTION trg_fn_update_view_counters();

-- ---------------------------------------------------------------------
-- Datos semilla minimos para pruebas locales: una grabacion de ejemplo
-- con un video de muestra publico (Big Buck Bunny, Blender Foundation,
-- licencia Creative Commons Attribution 3.0), para poder demostrar el
-- reproductor con checkpoint end-to-end sin depender de contenido propio.
-- El course_id coincide con el curso semilla de identity-service
-- (services/identity-service/db/init.sql) solo como referencia logica.
-- ---------------------------------------------------------------------
INSERT INTO recordings (recording_id, title, course_id, semester, school, unit, syllabus_url, video_url, recorded_at)
VALUES (
    '22222222-2222-2222-2222-222222222222',
    'Clase demo: Arquitectura de Microservicios Políglota',
    '11111111-1111-1111-1111-111111111111',
    '2026-S2',
    'Ciencias y Sistemas',
    'Unidad 1 - Introducción',
    NULL,
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    now() - interval '3 days'
)
ON CONFLICT (recording_id) DO NOTHING;

INSERT INTO recording_professors (recording_id, professor_ref, role)
VALUES ('22222222-2222-2222-2222-222222222222', 'Ing. Everest Medinilla', 'PROFESOR')
ON CONFLICT DO NOTHING;

INSERT INTO recording_tags (recording_id, tag)
VALUES
    ('22222222-2222-2222-2222-222222222222', 'microservicios'),
    ('22222222-2222-2222-2222-222222222222', 'grpc'),
    ('22222222-2222-2222-2222-222222222222', 'arquitectura')
ON CONFLICT DO NOTHING;
