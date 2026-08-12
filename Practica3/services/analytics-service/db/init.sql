-- =====================================================================
-- analytics-service :: PostgreSQL init script
-- Database per Microservice: propiedad exclusiva de analytics-service.
-- Alimentada por eventos replicados/exportados desde content-service e
-- identity-service (integracion asincrona/ETL), y por cargas masivas CSV.
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------
-- Tablas
-- ---------------------------------------------------------------------

-- Vista materializada de visitas, alimentada por eventos de content-service
-- o por carga masiva CSV (BulkIngestCsv -> dataset "views_history").
CREATE TABLE IF NOT EXISTS views_history_raw (
    id            BIGSERIAL PRIMARY KEY,
    user_id       UUID NOT NULL,
    recording_id  UUID NOT NULL,
    viewed_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    semester      VARCHAR(20)
);

CREATE TABLE IF NOT EXISTS ratings_raw (
    id            BIGSERIAL PRIMARY KEY,
    user_id       UUID NOT NULL,
    recording_id  UUID NOT NULL,
    rating        SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    rated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS recordings_meta (
    recording_id  UUID PRIMARY KEY,
    title         VARCHAR(200) NOT NULL,
    course_id     UUID,
    semester      VARCHAR(20)
);

CREATE TABLE IF NOT EXISTS notification_log (
    message_id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institutional_email   VARCHAR(150) NOT NULL,
    notification_type     VARCHAR(60) NOT NULL,
    sent_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
    status                 VARCHAR(20) NOT NULL DEFAULT 'QUEUED'
);

-- ---------------------------------------------------------------------
-- Vistas: rankings de tendencias (respaldadas ademas por cache Redis)
-- ---------------------------------------------------------------------
CREATE OR REPLACE VIEW v_weekly_ranking AS
SELECT
    m.recording_id,
    m.title,
    m.semester,
    count(v.id) FILTER (WHERE v.viewed_at >= now() - interval '7 days') AS view_count
FROM recordings_meta m
LEFT JOIN views_history_raw v ON v.recording_id = m.recording_id
GROUP BY m.recording_id, m.title, m.semester;

CREATE OR REPLACE VIEW v_top_rated AS
SELECT
    m.recording_id,
    m.title,
    m.course_id,
    avg(r.rating)::NUMERIC(3,2) AS avg_rating,
    count(r.id) AS rating_count
FROM recordings_meta m
JOIN ratings_raw r ON r.recording_id = m.recording_id
GROUP BY m.recording_id, m.title, m.course_id;

-- ---------------------------------------------------------------------
-- Funcion: determina si la fecha dada cae en epoca de examenes
-- (parcial/final), configurable por calendario academico.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS exam_periods (
    period_id   SERIAL PRIMARY KEY,
    starts_on   DATE NOT NULL,
    ends_on     DATE NOT NULL,
    label       VARCHAR(50)
);

CREATE OR REPLACE FUNCTION fn_is_exam_season(p_timestamp TIMESTAMPTZ)
RETURNS BOOLEAN AS $$
DECLARE
    v_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM exam_periods
        WHERE p_timestamp::date BETWEEN starts_on AND ends_on
    ) INTO v_exists;
    RETURN v_exists;
END;
$$ LANGUAGE plpgsql STABLE;

-- ---------------------------------------------------------------------
-- Funcion: calculo dinamico del % de recomendacion academica combinando
-- valoracion promedio y frecuencia de repaso reciente del propio usuario.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_recommendation_score(p_user_id UUID, p_recording_id UUID)
RETURNS NUMERIC AS $$
DECLARE
    v_avg_rating NUMERIC;
    v_user_views INTEGER;
    v_score NUMERIC;
BEGIN
    SELECT avg(rating) INTO v_avg_rating FROM ratings_raw WHERE recording_id = p_recording_id;
    SELECT count(*) INTO v_user_views FROM views_history_raw
        WHERE recording_id = p_recording_id AND user_id = p_user_id;

    v_score := COALESCE(v_avg_rating, 3) * 20 + LEAST(v_user_views, 5) * 2;
    RETURN LEAST(ROUND(v_score, 2), 100);
END;
$$ LANGUAGE plpgsql STABLE;

-- ---------------------------------------------------------------------
-- Procedimiento almacenado: registra el envio de una notificacion
-- (usado por SendNotification via gRPC) de forma transaccional/auditable.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_log_notification(
    p_email VARCHAR,
    p_type  VARCHAR
) RETURNS UUID AS $$
DECLARE
    v_message_id UUID;
BEGIN
    INSERT INTO notification_log (institutional_email, notification_type, status)
    VALUES (p_email, p_type, 'QUEUED')
    RETURNING message_id INTO v_message_id;
    RETURN v_message_id;
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------------
-- Trigger: evita registrar valoraciones duplicadas del mismo usuario
-- sobre la misma grabacion (normaliza a un UPDATE en vez de duplicar).
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION trg_fn_prevent_duplicate_rating() RETURNS TRIGGER AS $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM ratings_raw
        WHERE user_id = NEW.user_id AND recording_id = NEW.recording_id AND id <> NEW.id
    ) THEN
        RAISE EXCEPTION 'El usuario % ya valoro la grabacion %', NEW.user_id, NEW.recording_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_duplicate_rating ON ratings_raw;
CREATE TRIGGER trg_prevent_duplicate_rating
    BEFORE INSERT ON ratings_raw
    FOR EACH ROW
    EXECUTE FUNCTION trg_fn_prevent_duplicate_rating();

-- Semilla minima de periodo de examenes para pruebas locales
INSERT INTO exam_periods (starts_on, ends_on, label)
VALUES (CURRENT_DATE, CURRENT_DATE + INTERVAL '15 days', 'Parcial demo')
ON CONFLICT DO NOTHING;
