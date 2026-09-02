
-- Catálogo de referencia (espejo mínimo de grabaciones para joins de analítica)
CREATE TABLE unidad (
    id_unidad SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT
);

CREATE TABLE tema (
    id_tema SERIAL PRIMARY KEY,
    id_unidad INT NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    CONSTRAINT fk_tema_unidad
        FOREIGN KEY (id_unidad)
        REFERENCES unidad(id_unidad)
);

CREATE TABLE clase_grabada (
    id_clase SERIAL PRIMARY KEY,
    id_curso INT NOT NULL,
    id_periodo INT NOT NULL,
    id_area INT NOT NULL,
    titulo VARCHAR(150) NOT NULL,
    fecha_impartida TIMESTAMP NOT NULL,
    duracio_min INT NOT NULL,
    descripcion TEXT,
    url_video VARCHAR(255) NOT NULL,
    anio INT NOT NULL,
    num_semestre INT NOT NULL
);

CREATE TABLE clase_tema (
    id_clase INT NOT NULL,
    id_tema INT NOT NULL,
    PRIMARY KEY (id_clase, id_tema),
    CONSTRAINT fk_clasetema_clase
        FOREIGN KEY (id_clase)
        REFERENCES clase_grabada(id_clase)
        ON DELETE CASCADE,
    CONSTRAINT fk_clasetema_tema
        FOREIGN KEY (id_tema)
        REFERENCES tema(id_tema)
        ON DELETE CASCADE
);

-- Creación de la tabla Visualizaciones_clase
CREATE TABLE visualizaciones_clase (
    id_visualizacion SERIAL PRIMARY KEY,
    id_clase INT NOT NULL,
    fecha_visualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Creación de la tabla Calificacion_clase
CREATE TABLE calificacion_clase (
    id_calificacion SERIAL PRIMARY KEY,
    id_clase INT NOT NULL,
    id_usuario INT NOT NULL,
    puntuacion INT NOT NULL,
    fecha_calificacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_calificacion_clase_usuario UNIQUE (id_clase, id_usuario)
);

-- Creación de la tabla Audit_Logs con JSONB
CREATE TABLE audit_logs (
    id_auditoria SERIAL PRIMARY KEY,
    usuario_responsable INT NOT NULL,
    operacion VARCHAR(50) NOT NULL,
    tabla_afectada VARCHAR(50) NOT NULL,
    fecha_evento TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estado_anterior JSONB,
    estado_nuevo JSONB
);

--- Funciones

CREATE OR REPLACE FUNCTION fn_promedio_calificacion(
    p_id_clase INT
)
RETURNS NUMERIC
LANGUAGE plpgsql
AS
$$
DECLARE
    v_promedio NUMERIC;
BEGIN

    SELECT COALESCE(AVG(puntuacion),0)
    INTO v_promedio
    FROM calificacion_clase
    WHERE id_clase = p_id_clase;

    RETURN ROUND(v_promedio,2);

END;
$$;

CREATE OR REPLACE FUNCTION fn_total_visualizaciones(
    p_id_clase INT
)
RETURNS INT
LANGUAGE plpgsql
AS
$$
DECLARE
    v_total INT;
BEGIN

    SELECT COUNT(*)
    INTO v_total
    FROM visualizaciones_clase
    WHERE id_clase = p_id_clase;

    RETURN v_total;

END;
$$;

CREATE OR REPLACE FUNCTION fn_clase_vista(
    p_id_clase INT
)
RETURNS TABLE(
    id_clase INT,
    titulo VARCHAR(150),
    total_visualizaciones BIGINT
)
LANGUAGE plpgsql
AS
$$
BEGIN

RETURN QUERY

SELECT
    cg.id_clase,
    cg.titulo,
    COUNT(v.id_visualizacion) AS total_visualizaciones
FROM clase_grabada cg
LEFT JOIN visualizaciones_clase v
    ON cg.id_clase = v.id_clase
WHERE cg.id_clase = p_id_clase
GROUP BY cg.id_clase, cg.titulo;

END;
$$;

CREATE OR REPLACE FUNCTION fn_ranking_valoradas(
    p_limite INT DEFAULT 0
)
RETURNS TABLE(
    id_clase INT,
    titulo VARCHAR(150),
    promedio NUMERIC,
    total_calificaciones BIGINT
)
LANGUAGE plpgsql
AS
$$
BEGIN

RETURN QUERY

SELECT
    c.id_clase,
    cg.titulo,
    ROUND(AVG(c.puntuacion),2),
    COUNT(*)
FROM calificacion_clase c
INNER JOIN clase_grabada cg
    ON c.id_clase = cg.id_clase
GROUP BY c.id_clase, cg.titulo
ORDER BY AVG(c.puntuacion) DESC
LIMIT CASE WHEN p_limite > 0 THEN p_limite ELSE NULL END;

END;
$$;

CREATE OR REPLACE FUNCTION fn_clases_mas_vistas(
    p_fecha_inicio DATE,
    p_fecha_fin DATE,
    p_limite INT DEFAULT 0
)
RETURNS TABLE(
    id_clase INT,
    titulo VARCHAR(150),
    total_visualizaciones BIGINT
)
LANGUAGE plpgsql
AS
$$
BEGIN

RETURN QUERY

SELECT
    cg.id_clase,
    cg.titulo,
    COUNT(v.id_visualizacion) AS total_visualizaciones
FROM visualizaciones_clase v
INNER JOIN clase_grabada cg
    ON v.id_clase = cg.id_clase
WHERE (p_fecha_inicio IS NULL OR DATE(v.fecha_visualizacion) >= p_fecha_inicio)
  AND (p_fecha_fin IS NULL OR DATE(v.fecha_visualizacion) <= p_fecha_fin)
GROUP BY cg.id_clase, cg.titulo
ORDER BY total_visualizaciones DESC
LIMIT CASE WHEN p_limite > 0 THEN p_limite ELSE NULL END;

END;
$$;

CREATE OR REPLACE FUNCTION fn_temas_tendencia(
    p_fecha_inicio DATE,
    p_fecha_fin DATE,
    p_limite INT DEFAULT 0
)
RETURNS TABLE(
    id_tema INT,
    nombre VARCHAR(100),
    unidad VARCHAR(100),
    total_visualizaciones BIGINT
)
LANGUAGE plpgsql
AS
$$
BEGIN

RETURN QUERY

SELECT
    t.id_tema,
    t.nombre,
    u.nombre AS unidad,
    COUNT(v.id_visualizacion) AS total_visualizaciones
FROM visualizaciones_clase v
INNER JOIN clase_tema ct
    ON v.id_clase = ct.id_clase
INNER JOIN tema t
    ON ct.id_tema = t.id_tema
INNER JOIN unidad u
    ON t.id_unidad = u.id_unidad
WHERE (p_fecha_inicio IS NULL OR DATE(v.fecha_visualizacion) >= p_fecha_inicio)
  AND (p_fecha_fin IS NULL OR DATE(v.fecha_visualizacion) <= p_fecha_fin)
GROUP BY t.id_tema, t.nombre, u.nombre
ORDER BY total_visualizaciones DESC
LIMIT CASE WHEN p_limite > 0 THEN p_limite ELSE NULL END;

END;
$$;

CREATE OR REPLACE FUNCTION fn_auditar_cambios()
RETURNS TRIGGER
LANGUAGE plpgsql
AS
$$
BEGIN

    IF TG_OP = 'INSERT' THEN

        INSERT INTO audit_logs(
            usuario_responsable,
            operacion,
            tabla_afectada,
            estado_anterior,
            estado_nuevo
        )
        VALUES(
            0,
            TG_OP,
            TG_TABLE_NAME,
            NULL,
            to_jsonb(NEW)
        );

        RETURN NEW;

    ELSIF TG_OP = 'UPDATE' THEN

        INSERT INTO audit_logs(
            usuario_responsable,
            operacion,
            tabla_afectada,
            estado_anterior,
            estado_nuevo
        )
        VALUES(
            0,
            TG_OP,
            TG_TABLE_NAME,
            to_jsonb(OLD),
            to_jsonb(NEW)
        );

        RETURN NEW;

    ELSIF TG_OP = 'DELETE' THEN

        INSERT INTO audit_logs(
            usuario_responsable,
            operacion,
            tabla_afectada,
            estado_anterior,
            estado_nuevo
        )
        VALUES(
            0,
            TG_OP,
            TG_TABLE_NAME,
            to_jsonb(OLD),
            NULL
        );

        RETURN OLD;

    END IF;

END;
$$;

--- Procedures

CREATE OR REPLACE PROCEDURE sp_registrar_clase(
    IN p_id_curso INT,
    IN p_id_periodo INT,
    IN p_id_area INT,
    IN p_titulo VARCHAR,
    IN p_fecha_impartida TIMESTAMP,
    IN p_duracion INT,
    IN p_descripcion TEXT,
    IN p_url_video VARCHAR,
    IN p_anio INT,
    IN p_num_semestre INT
)
LANGUAGE plpgsql
AS $$
BEGIN

    IF p_duracion <= 0 THEN
        RAISE EXCEPTION 'La duración debe ser mayor a cero.';
    END IF;

    INSERT INTO clase_grabada(
        id_curso,
        id_periodo,
        id_area,
        titulo,
        fecha_impartida,
        duracio_min,
        descripcion,
        url_video,
        anio,
        num_semestre
    )
    VALUES(
        p_id_curso,
        p_id_periodo,
        p_id_area,
        p_titulo,
        p_fecha_impartida,
        p_duracion,
        p_descripcion,
        p_url_video,
        p_anio,
        p_num_semestre
    );

END;
$$;

CREATE OR REPLACE PROCEDURE sp_carga_masiva_clases(
    IN p_clases JSONB
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_item JSONB;
    v_idx INT := 0;
    v_results JSONB := '[]'::JSONB;
    v_id_curso INT;
    v_id_periodo INT;
    v_id_area INT;
    v_titulo TEXT;
    v_fecha TIMESTAMP;
    v_duracion INT;
    v_descripcion TEXT;
    v_url TEXT;
    v_anio INT;
    v_num_semestre INT;
    v_new_id INT;
BEGIN

    IF p_clases IS NULL OR jsonb_typeof(p_clases) <> 'array' THEN
        RAISE EXCEPTION 'p_clases must be a JSON array';
    END IF;

    FOR v_item IN SELECT * FROM jsonb_array_elements(p_clases)
    LOOP
        v_idx := v_idx + 1;
        BEGIN
            
            v_id_curso := CASE WHEN v_item ? 'id_curso' THEN (v_item->>'id_curso')::INT ELSE NULL END;
            v_id_periodo := CASE WHEN v_item ? 'id_periodo' THEN (v_item->>'id_periodo')::INT ELSE NULL END;
            v_id_area := CASE WHEN v_item ? 'id_area' THEN (v_item->>'id_area')::INT ELSE NULL END;
            v_titulo := CASE WHEN v_item ? 'titulo' THEN v_item->>'titulo' ELSE NULL END;
            v_fecha := CASE WHEN v_item ? 'fecha_impartida' THEN (v_item->>'fecha_impartida')::TIMESTAMP ELSE NULL END;
            v_duracion := CASE WHEN v_item ? 'duracion_min' THEN (v_item->>'duracion_min')::INT ELSE NULL END;
            v_descripcion := CASE WHEN v_item ? 'descripcion' THEN v_item->>'descripcion' ELSE NULL END;
            v_url := CASE WHEN v_item ? 'url_video' THEN v_item->>'url_video' ELSE NULL END;
            v_anio := CASE WHEN v_item ? 'anio' THEN (v_item->>'anio')::INT ELSE NULL END;
            v_num_semestre := CASE WHEN v_item ? 'num_semestre' THEN (v_item->>'num_semestre')::INT ELSE NULL END;

            IF v_id_curso IS NULL OR v_id_periodo IS NULL OR v_id_area IS NULL THEN
                v_results := v_results || jsonb_build_object('index', v_idx, 'status', 'error', 'message', 'campos_obligatorios_faltan', 'item', v_item);
                CONTINUE;
            END IF;

            IF v_duracion IS NULL OR v_duracion <= 0 THEN
                v_results := v_results || jsonb_build_object('index', v_idx, 'status', 'error', 'message', 'duracion_invalida', 'item', v_item);
                CONTINUE;
            END IF;

         
            SELECT nextval(pg_get_serial_sequence('clase_grabada', 'id_clase')) INTO v_new_id;

            INSERT INTO clase_grabada(
                id_clase, id_curso, id_periodo, id_area, titulo,
                fecha_impartida, duracio_min, descripcion, url_video, anio, num_semestre
            ) VALUES (
                v_new_id, v_id_curso, v_id_periodo, v_id_area, v_titulo,
                COALESCE(v_fecha, now()), v_duracion, v_descripcion, COALESCE(v_url, ''), COALESCE(v_anio, EXTRACT(YEAR FROM now())::INT), COALESCE(v_num_semestre, 1)
            );

            v_results := v_results || jsonb_build_object('index', v_idx, 'status', 'ok', 'id_clase', v_new_id);

        EXCEPTION WHEN OTHERS THEN
            v_results := v_results || jsonb_build_object('index', v_idx, 'status', 'error', 'message', SQLERRM, 'item', v_item);
            
        END;
    END LOOP;

END;
$$;


CREATE OR REPLACE PROCEDURE sp_registrar_visualizacion(
    p_id_clase INT
)
LANGUAGE plpgsql
AS
$$
BEGIN

    -- Verificar que la clase exista
    IF NOT EXISTS (
        SELECT 1
        FROM clase_grabada
        WHERE id_clase = p_id_clase
    ) THEN
        RAISE EXCEPTION 'La clase % no existe.', p_id_clase;
    END IF;

    -- Registrar visualización
    INSERT INTO visualizaciones_clase(
        id_clase,
        fecha_visualizacion
    )
    VALUES(
        p_id_clase,
        CURRENT_TIMESTAMP
    );

END;
$$;

CREATE OR REPLACE PROCEDURE sp_registrar_calificacion(
    p_id_clase INT,
    p_id_usuario INT,
    p_puntuacion INT
)
LANGUAGE plpgsql
AS
$$
BEGIN

    -- Validar existencia de la clase
    IF NOT EXISTS (
        SELECT 1
        FROM clase_grabada
        WHERE id_clase = p_id_clase
    ) THEN
        RAISE EXCEPTION 'La clase % no existe.', p_id_clase;
    END IF;

    -- Validar rango de calificación
    IF p_puntuacion < 1 OR p_puntuacion > 5 THEN
        RAISE EXCEPTION 'La puntuación debe estar entre 1 y 5.';
    END IF;

    -- Validar que el usuario no haya calificado antes la clase
    IF EXISTS (
        SELECT 1
        FROM calificacion_clase
        WHERE id_clase = p_id_clase AND id_usuario = p_id_usuario
    ) THEN
        RAISE EXCEPTION 'El usuario % ya calificó la clase %.', p_id_usuario, p_id_clase;
    END IF;

    -- Registrar calificación
    INSERT INTO calificacion_clase(
        id_clase,
        id_usuario,
        puntuacion,
        fecha_calificacion
    )
    VALUES(
        p_id_clase,
        p_id_usuario,
        p_puntuacion,
        CURRENT_TIMESTAMP
    );

END;
$$;

--- Triggers

CREATE OR REPLACE TRIGGER trg_auditoria_visualizacion
AFTER INSERT OR UPDATE OR DELETE
ON visualizaciones_clase
FOR EACH ROW
EXECUTE FUNCTION fn_auditar_cambios();

CREATE OR REPLACE TRIGGER trg_auditoria_calificacion
AFTER INSERT OR UPDATE OR DELETE
ON calificacion_clase
FOR EACH ROW
EXECUTE FUNCTION fn_auditar_cambios();

--- Vistas

CREATE OR REPLACE VIEW vw_ranking_clases AS
SELECT
    cc.id_clase,
    fn_promedio_calificacion(cc.id_clase) AS promedio_calificacion,
    COUNT(cc.id_calificacion) AS total_calificaciones
FROM calificacion_clase cc
GROUP BY cc.id_clase
ORDER BY promedio_calificacion DESC;

CREATE OR REPLACE VIEW vw_clases_mas_vistas AS
SELECT
    vc.id_clase,
    COUNT(*) AS total_visualizaciones,
    MAX(vc.fecha_visualizacion) AS ultima_visualizacion
FROM visualizaciones_clase vc
GROUP BY vc.id_clase
ORDER BY total_visualizaciones DESC;

CREATE OR REPLACE VIEW vw_tendencias AS
SELECT
    t.id_tema,
    t.nombre AS tema,
    u.nombre AS unidad,
    COUNT(v.id_visualizacion) AS total_visualizaciones
FROM visualizaciones_clase v
INNER JOIN clase_grabada cg
    ON v.id_clase = cg.id_clase
INNER JOIN clase_tema ct
    ON cg.id_clase = ct.id_clase
INNER JOIN tema t
    ON ct.id_tema = t.id_tema
INNER JOIN unidad u
    ON t.id_unidad = u.id_unidad
GROUP BY
    t.id_tema,
    t.nombre,
    u.nombre
ORDER BY total_visualizaciones DESC;

-- ==============================================
-- Datos de prueba (espejo de grabaciones)
-- ==============================================

-- Clases grabadas de prueba
-- id_curso / id_area referencian los catálogos de la DB de inscripción
-- (1 = Sistemas Operativos 1, 2 = Matemática Aplicada 1, 3 = Filosofía)
INSERT INTO clase_grabada (
    id_curso,
    id_periodo,
    id_area,
    titulo,
    fecha_impartida,
    duracio_min,
    descripcion,
    url_video,
    anio,
    num_semestre
) VALUES
    (1, 1, 1, 'Sistemas Operativos 1 - Introducción', '2025-01-20 09:00:00', 90, 'Primera sesión del curso de Sistemas Operativos 1', 'https://drive.google.com/file/d/1L9OR9vOyvuF7ztRSUiFi91ZK2VkkED46/view?usp=sharing', 2025, 1),
    (2, 1, 2, 'Matemática Aplicada 1 - Repaso de fundamentos', '2025-07-21 09:00:00', 120, 'Repaso de fundamentos de Matemática Aplicada 1', 'https://www.youtube.com/embed/dpLEgXcWtik?si=xsP39dFdfamVlugC', 2025, 2),
    (3, 1, 3, 'Filosofía - Historia del pensamiento', '2026-01-22 09:00:00', 75, 'Introducción a la historia del pensamiento filosófico', 'https://www.youtube.com/embed/7J6flw_5nfo?si=fKsLPoGcSpiE6zBG', 2026, 1);

-- Unidades y temas de prueba (espejo de grabaciones)
INSERT INTO unidad (nombre, descripcion) VALUES
    ('Unidad 1: Introducción', 'Conceptos fundamentales del curso'),
    ('Unidad 2: Desarrollo', 'Temas avanzados del curso'),
    ('Unidad 3: Procesos y planificación', 'Gestión de procesos y planificación de CPU'),
    ('Unidad 4: Memoria y archivos', 'Manejo de memoria y sistemas de archivos'),
    ('Unidad 5: Modelo relacional', 'Fundamentos del modelo relacional de base de datos'),
    ('Unidad 6: SQL y transacciones', 'Consultas SQL, transacciones y optimización'),
    ('Unidad 7: Modelado de sistemas', 'Casos de uso, diagramas y requerimientos'),
    ('Unidad 8: Cálculo y series', 'Cálculo diferencial, integral y series'),
    ('Unidad 9: Probabilidad y estadística', 'Distribuciones y análisis estadístico'),
    ('Unidad 10: Vectores y matrices', 'Álgebra lineal: vectores, matrices, sistemas'),
    ('Unidad 11: Pensamiento científico', 'Historia y filosofía de la ciencia'),
    ('Unidad 12: Comunicación y redacción', 'Redacción profesional y comunicación efectiva'),
    ('Unidad 13: Fundamentos económicos', 'Microeconomía, oferta y demanda');

INSERT INTO tema (id_unidad, nombre, descripcion) VALUES
    (1, 'Introducción', 'Primera sesión: fundamentos y contextualización'),
    (2, 'Tema avanzado', 'Sesión complementaria con temas avanzados'),
    (3, 'Planificación de CPU', 'Algoritmos FIFO, SJF, Round Robin y prioridades'),
    (3, 'Sincronización', 'Semáforos, monitores y exclusión mutua'),
    (4, 'Gestión de memoria', 'Particiones, paginación y segmentación'),
    (4, 'Sistemas de archivos', 'Estructura de directorios y permisos'),
    (5, 'Modelo entidad-relación', 'Entidades, atributos y relaciones'),
    (5, 'Diseño de esquemas', 'Normalización y claves'),
    (6, 'Consultas SQL', 'SELECT, JOIN, GROUP BY y subconsultas'),
    (6, 'Transacciones', 'ACID, niveles de aislamiento y concurrencia'),
    (7, 'Casos de uso', 'Actores, escenarios y diagramas UML'),
    (7, 'Requerimientos', 'Levantamiento y especificación de requerimientos'),
    (8, 'Límites y derivadas', 'Conceptos de límite y derivada'),
    (8, 'Integrales y series', 'Integrales definidas y series de potencias'),
    (9, 'Distribuciones', 'Distribución normal, binomial y Poisson'),
    (9, 'Inferencia', 'Intervalos de confianza y pruebas de hipótesis'),
    (10, 'Vectores', 'Operaciones con vectores y espacios vectoriales'),
    (10, 'Matrices', 'Operaciones matriciales y determinantes'),
    (11, 'Método científico', 'Observación, hipótesis y experimentación'),
    (11, 'Historia de la ciencia', 'Evolución del pensamiento científico'),
    (12, 'Redacción académica', 'Estructura, coherencia y citas'),
    (12, 'Comunicación oral', 'Presentaciones y argumentación'),
    (13, 'Oferta y demanda', 'Curvas de oferta y demanda, equilibrio de mercado'),
    (13, 'Costos y producción', 'Tipos de costos y teoría de la producción');

-- Temas asociados a cada clase grabada (espejo de grabaciones)
INSERT INTO clase_tema (id_clase, id_tema) VALUES
    (1, 1),
    (2, 1),
    (3, 2);