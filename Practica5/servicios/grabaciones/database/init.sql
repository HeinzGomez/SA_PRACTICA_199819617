-------------------------------
-- Creación de la tabla Unidad
CREATE TABLE unidad (
    id_unidad SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT
);

-- Creación de la tabla Tema
CREATE TABLE tema (
    id_tema SERIAL PRIMARY KEY,
    id_unidad INT NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    CONSTRAINT fk_tema_unidad 
        FOREIGN KEY (id_unidad) 
        REFERENCES unidad(id_unidad)
);

-- Creación de la tabla Clase_Grabada
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

-- Creación de la tabla intermedia Clase_Tema (Relación N a M entre Clase_Grabada y Tema)
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

-- Creación de la tabla intermedia Clase_Docente (Relación N a M entre Clase_Grabada y Usuario)
CREATE TABLE clase_docente (
    id_clase INT NOT NULL,
    id_usuario INT NOT NULL,
    PRIMARY KEY (id_clase, id_usuario),
    CONSTRAINT fk_clasedocente_clase 
        FOREIGN KEY (id_clase) 
        REFERENCES clase_grabada(id_clase) 
        ON DELETE CASCADE
);

-- Creación de la tabla intermedia Clase_Auxiliar (Relación N a M entre Clase_Grabada y Usuario)
CREATE TABLE clase_auxiliar (
    id_clase INT NOT NULL,
    id_usuario INT NOT NULL,
    PRIMARY KEY (id_clase, id_usuario),
    CONSTRAINT fk_claseauxiliar_clase 
        FOREIGN KEY (id_clase) 
        REFERENCES clase_grabada(id_clase) 
        ON DELETE CASCADE
);

-- Creación de la tabla Material_Apoyo (Relación 1 a N con Clase_Grabada)
CREATE TABLE material_apoyo (
    id_material SERIAL PRIMARY KEY,
    id_clase INT NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    url VARCHAR(255) NOT NULL,
    CONSTRAINT fk_material_clase 
        FOREIGN KEY (id_clase) 
        REFERENCES clase_grabada(id_clase) 
        ON DELETE CASCADE
);

-- HeinzGomez - Tabla de capítulos (segmentación de clases por bloques temáticos)
CREATE TABLE capitulo (
    id_capitulo SERIAL PRIMARY KEY,
    id_clase INT NOT NULL,
    titulo VARCHAR(150) NOT NULL,
    tiempo_inicio INT NOT NULL, -- segundos desde el inicio del video
    CONSTRAINT fk_capitulo_clase
        FOREIGN KEY (id_clase)
        REFERENCES clase_grabada(id_clase)
        ON DELETE CASCADE,
    CONSTRAINT chk_capitulo_tiempo CHECK (tiempo_inicio >= 0),
    CONSTRAINT uq_capitulo_clase_tiempo UNIQUE (id_clase, tiempo_inicio)
);

CREATE TABLE playlist (
    id_playlist SERIAL PRIMARY KEY,
    id_usuario INT NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    descripciion TEXT,
    visibilidad VARCHAR(50),
    share_token VARCHAR(100),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE playlist_clases (
    id_playlist_clases SERIAL PRIMARY KEY,
    id_playlist INT NOT NULL,
    id_clase INT NOT NULL,
    tiempo_inicio INT,
    tiempo_final INT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_playlist 
        FOREIGN KEY (id_playlist) 
        REFERENCES playlist(id_playlist) 
        ON DELETE CASCADE,
    CONSTRAINT fk_clase 
        FOREIGN KEY (id_clase) 
        REFERENCES clase_grabada(id_clase) 
        ON DELETE CASCADE
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

CREATE OR REPLACE FUNCTION fn_busqueda_avanzada(
    p_anio INT DEFAULT NULL,
    p_semestre INT DEFAULT NULL,
    p_id_area INT DEFAULT NULL,
    p_id_curso INT DEFAULT NULL,
    p_id_docente INT DEFAULT NULL,
    p_id_tema INT DEFAULT NULL
)
RETURNS TABLE(
    id_clase INT,
    titulo VARCHAR,
    descripcion TEXT,
    fecha_impartida TIMESTAMP,
    duracion INT,
    url_video VARCHAR,
    anio INT,
    semestre INT,
    id_curso INT,
    id_area INT,
    id_periodo INT
)
LANGUAGE plpgsql
AS $$
BEGIN

RETURN QUERY

SELECT DISTINCT

cg.id_clase,
cg.titulo,
cg.descripcion,
cg.fecha_impartida,
cg.duracio_min,
cg.url_video,
cg.anio,
cg.num_semestre,
cg.id_curso,
cg.id_area,
cg.id_periodo

FROM clase_grabada cg

LEFT JOIN clase_docente cd
ON cg.id_clase=cd.id_clase

LEFT JOIN clase_tema ct
ON cg.id_clase=ct.id_clase

WHERE

(p_anio IS NULL OR cg.anio=p_anio)

AND

(p_semestre IS NULL OR cg.num_semestre=p_semestre)

AND

(p_id_area IS NULL OR cg.id_area=p_id_area)

AND

(p_id_curso IS NULL OR cg.id_curso=p_id_curso)

AND

(p_id_docente IS NULL OR cd.id_usuario=p_id_docente)

AND

(p_id_tema IS NULL OR ct.id_tema=p_id_tema);

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

    -- Obtener un valor de secuencia explícito y usarlo en el INSERT
    DECLARE v_new_id INT;
    BEGIN
        SELECT nextval(pg_get_serial_sequence('clase_grabada', 'id_clase')) INTO v_new_id;

        INSERT INTO clase_grabada(
            id_clase,
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
            v_new_id,
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

END;
$$;

CREATE OR REPLACE PROCEDURE sp_agregar_material(
    IN p_id_clase INT,
    IN p_nombre VARCHAR,
    IN p_tipo VARCHAR,
    IN p_url VARCHAR
)
LANGUAGE plpgsql
AS $$
BEGIN

    IF NOT EXISTS(
        SELECT 1
        FROM clase_grabada
        WHERE id_clase = p_id_clase
    ) THEN
        RAISE EXCEPTION 'La clase indicada no existe.';
    END IF;

    -- Obtener un valor de secuencia explícito y usarlo en el INSERT
    DECLARE v_new_id INT;
    BEGIN
        SELECT nextval(pg_get_serial_sequence('material_apoyo', 'id_material')) INTO v_new_id;

        INSERT INTO material_apoyo(
            id_material,
            id_clase,
            nombre,
            tipo,
            url
        )
        VALUES(
            v_new_id,
            p_id_clase,
            p_nombre,
            p_tipo,
            p_url
        );
    END;

END;
$$;

CREATE OR REPLACE PROCEDURE sp_asignar_docente(
    IN p_id_clase INT,
    IN p_id_usuario INT
)
LANGUAGE plpgsql
AS $$
BEGIN

    IF EXISTS(
        SELECT 1
        FROM clase_docente
        WHERE id_clase = p_id_clase
        AND id_usuario = p_id_usuario
    ) THEN

        RAISE EXCEPTION 'El docente ya fue asignado a la clase.';

    END IF;

    INSERT INTO clase_docente(
        id_clase,
        id_usuario
    )
    VALUES(
        p_id_clase,
        p_id_usuario
    );

END;
$$;

CREATE OR REPLACE PROCEDURE sp_asignar_auxiliar(
    IN p_id_clase INT,
    IN p_id_usuario INT
)
LANGUAGE plpgsql
AS $$
BEGIN

    IF EXISTS(
        SELECT 1
        FROM clase_auxiliar
        WHERE id_clase = p_id_clase
        AND id_usuario = p_id_usuario
    ) THEN

        RAISE EXCEPTION 'El auxiliar ya fue asignado a la clase.';

    END IF;

    INSERT INTO clase_auxiliar(
        id_clase,
        id_usuario
    )
    VALUES(
        p_id_clase,
        p_id_usuario
    );

END;
$$;

CREATE OR REPLACE PROCEDURE sp_asignar_tema_clase(
    IN p_id_clase INT,
    IN p_id_tema INT
)
LANGUAGE plpgsql
AS $$
BEGIN

    IF EXISTS(
        SELECT 1
        FROM clase_tema
        WHERE id_clase = p_id_clase
        AND id_tema = p_id_tema
    ) THEN

        RAISE EXCEPTION 'El tema ya está asociado a la clase.';

    END IF;

    INSERT INTO clase_tema(
        id_clase,
        id_tema
    )
    VALUES(
        p_id_clase,
        p_id_tema
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

-- HeinzGomez - Procedimiento almacenado para registrar un capítulo con validaciones en BD
CREATE OR REPLACE PROCEDURE sp_registrar_capitulo(
    IN p_id_clase INT,
    IN p_titulo VARCHAR,
    IN p_tiempo_inicio INT
)
LANGUAGE plpgsql
AS $$
BEGIN

    IF NOT EXISTS (SELECT 1 FROM clase_grabada WHERE id_clase = p_id_clase) THEN
        RAISE EXCEPTION 'La clase indicada no existe.';
    END IF;

    IF p_tiempo_inicio < 0 THEN
        RAISE EXCEPTION 'La marca de tiempo no puede ser negativa.';
    END IF;

    IF EXISTS (
        SELECT 1 FROM capitulo
        WHERE id_clase = p_id_clase AND tiempo_inicio = p_tiempo_inicio
    ) THEN
        RAISE EXCEPTION 'Ya existe un capítulo en esa marca de tiempo para la clase.';
    END IF;

    INSERT INTO capitulo(id_clase, titulo, tiempo_inicio)
    VALUES(p_id_clase, p_titulo, p_tiempo_inicio);

END;
$$;

--- Triggers

CREATE OR REPLACE TRIGGER trg_auditoria_clase
AFTER INSERT OR UPDATE OR DELETE
ON clase_grabada
FOR EACH ROW
EXECUTE FUNCTION fn_auditar_cambios();

CREATE OR REPLACE TRIGGER trg_auditoria_material
AFTER INSERT OR UPDATE OR DELETE
ON material_apoyo
FOR EACH ROW
EXECUTE FUNCTION fn_auditar_cambios();

-- HeinzGomez - Trigger de auditoría para la tabla capitulo
CREATE OR REPLACE TRIGGER trg_auditoria_capitulo
AFTER INSERT OR UPDATE OR DELETE
ON capitulo
FOR EACH ROW
EXECUTE FUNCTION fn_auditar_cambios();

--- Vistas

CREATE OR REPLACE VIEW vw_catalogo_clases AS
SELECT
    cg.id_clase,
    cg.titulo,
    cg.descripcion,
    cg.fecha_impartida,
    cg.duracio_min,
    cg.url_video,
    cg.anio,
    cg.num_semestre,
    cg.id_curso,
    cg.id_area,
    cg.id_periodo
FROM clase_grabada cg;

CREATE OR REPLACE VIEW vw_ficha_tecnica AS
SELECT
    cg.id_clase,
    cg.titulo,
    cg.descripcion,
    cg.fecha_impartida,
    cg.duracio_min,
    cg.url_video,

    u.id_unidad,
    u.nombre AS unidad,

    t.id_tema,
    t.nombre AS tema,

    ma.id_material,
    ma.nombre AS material,
    ma.tipo,
    ma.url

FROM clase_grabada cg

LEFT JOIN clase_tema ct
    ON cg.id_clase = ct.id_clase

LEFT JOIN tema t
    ON ct.id_tema = t.id_tema

LEFT JOIN unidad u
    ON t.id_unidad = u.id_unidad

LEFT JOIN material_apoyo ma
    ON cg.id_clase = ma.id_clase;

CREATE OR REPLACE VIEW vw_docentes_auxiliares AS

SELECT
    cd.id_clase,
    cd.id_usuario,
    'DOCENTE' AS tipo_participante
FROM clase_docente cd

UNION ALL

SELECT
    ca.id_clase,
    ca.id_usuario,
    'AUXILIAR' AS tipo_participante
FROM clase_auxiliar ca;

-- ==============================================
-- Datos de prueba (seed)
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

-- Material de apoyo de prueba (asignado a cada clase grabada)
INSERT INTO material_apoyo (id_clase, nombre, tipo, url) VALUES
    (1, 'Material de apoyo.pdf', 'pdf', 'https://drive.google.com/file/d/1jE4q2XCu8VZLQ0x2r7wOYWjQV4tSvlL3/view?usp=sharing'),
    (2, 'Material de apoyo.pdf', 'pdf', 'https://drive.google.com/file/d/1jE4q2XCu8VZLQ0x2r7wOYWjQV4tSvlL3/view?usp=sharing'),
    (3, 'Material de apoyo.pdf', 'pdf', 'https://drive.google.com/file/d/1jE4q2XCu8VZLQ0x2r7wOYWjQV4tSvlL3/view?usp=sharing');

-- Unidades y temas de prueba
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

-- Temas asociados a cada clase grabada
INSERT INTO clase_tema (id_clase, id_tema) VALUES
    (1, 1),
    (2, 1),
    (3, 2);

-- Docentes y auxiliares de prueba asignados a las clases grabadas
-- (id_usuario referencian los usuarios de la DB de autenticación:
--  3 = Docente Prueba, 4 = Auxiliar Prueba)
INSERT INTO clase_docente (id_clase, id_usuario) VALUES
    (1, 3),
    (2, 3),
    (3, 3);

INSERT INTO clase_auxiliar (id_clase, id_usuario) VALUES
    (1, 4),
    (2, 4),
    (3, 4);


-- HeinzGomez - Capítulos de prueba para las clases grabadas existentes
INSERT INTO capitulo (id_clase, titulo, tiempo_inicio) VALUES
    (1, 'Introducción', 0),
    (1, 'Fundamentos teóricos', 750),
    (1, 'Ejemplo en código', 2100),
    (1, 'Resolución de dudas', 3300),
    (2, 'Introducción', 0),
    (2, 'Repaso de fundamentos', 900),
    (3, 'Introducción', 0),
    (3, 'Historia del pensamiento', 600);
