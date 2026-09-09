-- 1. Tabla Repositorio
CREATE TABLE Repositorio (
    id_repositorio SERIAL PRIMARY KEY,
    id_clase INT NOT NULL,
    nombre VARCHAR(150) NOT NULL
);

-- 2. Tabla Archivos 
CREATE TABLE Archivos (
    id_archivo SERIAL PRIMARY KEY,
    id_repositorio INT NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    CONSTRAINT fk_archivos_repositorio FOREIGN KEY (id_repositorio) 
        REFERENCES Repositorio(id_repositorio) ON DELETE CASCADE
);

-- 3. Tabla Version 
CREATE TABLE Version (
    id_version SERIAL PRIMARY KEY,
    id_archivo INT NOT NULL,
    link TEXT,
    tag VARCHAR(50),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    hash VARCHAR(255),
    latest BOOLEAN,
    CONSTRAINT fk_version_archivo FOREIGN KEY (id_archivo) 
        REFERENCES Archivos(id_archivo) ON DELETE CASCADE
);

-- 4. Tabla Dudas
CREATE TABLE Dudas (
    id_dudas SERIAL PRIMARY KEY, 
    id_clase INT NOT NULL,
    id_usuario INT NOT NULL,
    duda TEXT NOT NULL,
    segundo INT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Tabla Respuestas 
CREATE TABLE Respuestas (
    id_respuesta SERIAL PRIMARY KEY,
    id_duda INT NOT NULL,
    id_usuario INT NOT NULL,
    respuesta TEXT NOT NULL,
    marcada BOOLEAN DEFAULT FALSE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_respuestas_dudas FOREIGN KEY (id_duda) 
        REFERENCES Dudas(id_dudas) ON DELETE CASCADE
);

-- 6. Tabla Apuntes
CREATE TABLE Apuntes (
    id_apunte SERIAL PRIMARY KEY,
    id_clase INT NOT NULL,
    id_usuario INT NOT NULL,
    titulo VARCHAR(150) NOT NULL,
    contenido_markdown TEXT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Tabla Marcador Tiempo 
CREATE TABLE Marcador_Tiempo (
    id_marcador SERIAL PRIMARY KEY,
    id_apunte INT NOT NULL,
    segundo INT,
    texto TEXT,
    CONSTRAINT fk_marcador_apuntes FOREIGN KEY (id_apunte) 
        REFERENCES Apuntes(id_apunte) ON DELETE CASCADE
);

-- 8. Tabla Audit_Logs
CREATE TABLE Audit_Logs(
    id_auditoria SERIAL PRIMARY KEY,
    usuario_responsable VARCHAR(100),
    operacion VARCHAR(50),
    tabla_afectada VARCHAR(100),
    fecha_evento TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estado_anterior TEXT,
    estado_nuevo TEXT
);

-- =============================================
-- Función de auditoría genérica (Archivos y Version)
-- =============================================

CREATE OR REPLACE FUNCTION fn_auditar_cambios()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_estado_anterior TEXT;
    v_estado_nuevo TEXT;
BEGIN
    IF TG_OP = 'INSERT' THEN
        v_estado_nuevo := '';
        IF TG_TABLE_NAME = 'Archivos' THEN
            v_estado_nuevo := 'id_archivo=' || NEW.id_archivo || ', id_repositorio=' || NEW.id_repositorio || ', nombre=' || NEW.nombre;
        ELSIF TG_TABLE_NAME = 'Version' THEN
            v_estado_nuevo := 'id_version=' || NEW.id_version || ', id_archivo=' || NEW.id_archivo || ', tag=' || COALESCE(NEW.tag, '') || ', latest=' || NEW.latest;
        END IF;
        INSERT INTO Audit_Logs (usuario_responsable, operacion, tabla_afectada, estado_anterior, estado_nuevo)
        VALUES (COALESCE(current_setting('app.usuario_id', true), '0'), 'INSERT', TG_TABLE_NAME, NULL, v_estado_nuevo);
        RETURN NEW;

    ELSIF TG_OP = 'UPDATE' THEN
        v_estado_anterior := '';
        v_estado_nuevo := '';
        IF TG_TABLE_NAME = 'Archivos' THEN
            v_estado_anterior := 'id_archivo=' || OLD.id_archivo || ', id_repositorio=' || OLD.id_repositorio || ', nombre=' || OLD.nombre;
            v_estado_nuevo := 'id_archivo=' || NEW.id_archivo || ', id_repositorio=' || NEW.id_repositorio || ', nombre=' || NEW.nombre;
        ELSIF TG_TABLE_NAME = 'Version' THEN
            v_estado_anterior := 'id_version=' || OLD.id_version || ', id_archivo=' || OLD.id_archivo || ', tag=' || COALESCE(OLD.tag, '') || ', latest=' || OLD.latest;
            v_estado_nuevo := 'id_version=' || NEW.id_version || ', id_archivo=' || NEW.id_archivo || ', tag=' || COALESCE(NEW.tag, '') || ', latest=' || NEW.latest;
        END IF;
        INSERT INTO Audit_Logs (usuario_responsable, operacion, tabla_afectada, estado_anterior, estado_nuevo)
        VALUES (COALESCE(current_setting('app.usuario_id', true), '0'), 'UPDATE', TG_TABLE_NAME, v_estado_anterior, v_estado_nuevo);
        RETURN NEW;

    ELSIF TG_OP = 'DELETE' THEN
        v_estado_anterior := '';
        IF TG_TABLE_NAME = 'Archivos' THEN
            v_estado_anterior := 'id_archivo=' || OLD.id_archivo || ', id_repositorio=' || OLD.id_repositorio || ', nombre=' || OLD.nombre;
        ELSIF TG_TABLE_NAME = 'Version' THEN
            v_estado_anterior := 'id_version=' || OLD.id_version || ', id_archivo=' || OLD.id_archivo || ', tag=' || COALESCE(OLD.tag, '') || ', latest=' || OLD.latest;
        END IF;
        INSERT INTO Audit_Logs (usuario_responsable, operacion, tabla_afectada, estado_anterior, estado_nuevo)
        VALUES (COALESCE(current_setting('app.usuario_id', true), '0'), 'DELETE', TG_TABLE_NAME, v_estado_anterior, NULL);
        RETURN OLD;
    END IF;

    RETURN NULL;
END;
$$;

-- =============================================
-- Triggers de auditoría (ambos usan la misma función)
-- =============================================

CREATE TRIGGER trg_auditar_archivos
AFTER INSERT OR UPDATE OR DELETE
ON Archivos
FOR EACH ROW
EXECUTE FUNCTION fn_auditar_cambios();

CREATE TRIGGER trg_auditar_version
AFTER INSERT OR UPDATE OR DELETE
ON Version
FOR EACH ROW
EXECUTE FUNCTION fn_auditar_cambios();

-- =============================================
-- Vista: repositorio con sus archivos
-- =============================================

CREATE OR REPLACE VIEW vw_archivos_por_repositorio AS
SELECT
    r.id_repositorio,
    r.id_clase,
    r.nombre AS repositorio_nombre,
    a.id_archivo,
    a.nombre AS archivo_nombre,
    v.id_version,
    v.link,
    v.tag,
    v.hash,
    v.latest,
    v.fecha_creacion AS version_fecha_creacion
FROM Repositorio r
LEFT JOIN Archivos a ON a.id_repositorio = r.id_repositorio
LEFT JOIN Version v ON v.id_archivo = a.id_archivo AND v.latest = TRUE;

-- =============================================
-- Procedures
-- =============================================

-- Agregar un archivo nuevo al repositorio
CREATE OR REPLACE PROCEDURE sp_agregar_archivo(
    IN p_id_repositorio INT,
    IN p_nombre VARCHAR,
    IN p_link TEXT,
    IN p_tag VARCHAR,
    IN p_hash VARCHAR
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_id_archivo INT;
BEGIN
    INSERT INTO Archivos (id_repositorio, nombre)
    VALUES (p_id_repositorio, p_nombre)
    RETURNING id_archivo INTO v_id_archivo;

    INSERT INTO Version (id_archivo, link, tag, hash, latest)
    VALUES (v_id_archivo, p_link, p_tag, p_hash, TRUE);
END;
$$;

-- Actualizar la versión de un archivo (sube nueva versión)
CREATE OR REPLACE PROCEDURE sp_actualizar_version_archivo(
    IN p_id_archivo INT,
    IN p_link TEXT,
    IN p_tag VARCHAR,
    IN p_hash VARCHAR
)
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE Version SET latest = FALSE WHERE id_archivo = p_id_archivo AND latest = TRUE;

    INSERT INTO Version (id_archivo, link, tag, hash, latest)
    VALUES (p_id_archivo, p_link, p_tag, p_hash, TRUE);
END;
$$;

-- Eliminar un archivo y todas sus versiones
CREATE OR REPLACE PROCEDURE sp_eliminar_archivo(
    IN p_id_archivo INT
)
LANGUAGE plpgsql
AS $$
BEGIN
    DELETE FROM Archivos WHERE id_archivo = p_id_archivo;
END;
$$;

-- =============================================
-- Datos de prueba (seed)
-- =============================================

-- Repositorios (uno por clase grabada)
INSERT INTO Repositorio (id_repositorio, id_clase, nombre) VALUES
    (1, 1, 'Recursos SO1 - Introducción'),
    (2, 2, 'Recursos MA1 - Repaso de fundamentos'),
    (3, 3, 'Recursos Filosofía - Historia del pensamiento');

-- Archivos (2 por repositorio)
INSERT INTO Archivos (id_archivo, id_repositorio, nombre) VALUES
    -- Repositorio 1 (Clase 1 - SO1)
    (1, 1, 'Presentación de la clase.pdf'),
    (2, 1, 'Ejercicios prácticos.pdf'),
    -- Repositorio 2 (Clase 2 - MA1)
    (3, 2, 'Presentación de la clase.pdf'),
    (4, 2, 'Ejercicios prácticos.pdf'),
    -- Repositorio 3 (Clase 3 - Filosofía)
    (5, 3, 'Presentación de la clase.pdf'),
    (6, 3, 'Ejercicios prácticos.pdf');

-- Versiones (2 por archivo, la segunda es latest)
INSERT INTO Version (id_version, id_archivo, link, tag, hash, latest) VALUES
    -- Archivo 1 (Repositorio 1 - Presentación)
    (1, 1, 'https://drive.google.com/file/d/1wDxrP3qT50MjhCptemHKMlDELDhJrgfl/view?usp=sharing', 'v1', 'abc123', FALSE),
    (2, 1, 'https://drive.google.com/file/d/1jE4q2XCu8VZLQ0x2r7wOYWjQV4tSvlL3/view?usp=sharing', NULL, 'def456', TRUE),
    -- Archivo 2 (Repositorio 1 - Ejercicios)
    (3, 2, 'https://drive.google.com/file/d/1wDxrP3qT50MjhCptemHKMlDELDhJrgfl/view?usp=sharing', 'v1', 'ghi789', FALSE),
    (4, 2, 'https://drive.google.com/file/d/1jE4q2XCu8VZLQ0x2r7wOYWjQV4tSvlL3/view?usp=sharing', NULL, 'jkl012', TRUE),
    -- Archivo 3 (Repositorio 2 - Presentación)
    (5, 3, 'https://drive.google.com/file/d/1wDxrP3qT50MjhCptemHKMlDELDhJrgfl/view?usp=sharing', 'v1', 'mno345', FALSE),
    (6, 3, 'https://drive.google.com/file/d/1jE4q2XCu8VZLQ0x2r7wOYWjQV4tSvlL3/view?usp=sharing', NULL, 'pqr678', TRUE),
    -- Archivo 4 (Repositorio 2 - Ejercicios)
    (7, 4, 'https://drive.google.com/file/d/1wDxrP3qT50MjhCptemHKMlDELDhJrgfl/view?usp=sharing', 'v1', 'stu901', FALSE),
    (8, 4, 'https://drive.google.com/file/d/1jE4q2XCu8VZLQ0x2r7wOYWjQV4tSvlL3/view?usp=sharing', NULL, 'vwx234', TRUE),
    -- Archivo 5 (Repositorio 3 - Presentación)
    (9, 5, 'https://drive.google.com/file/d/1wDxrP3qT50MjhCptemHKMlDELDhJrgfl/view?usp=sharing', 'v1', 'yza567', FALSE),
    (10, 5, 'https://drive.google.com/file/d/1jE4q2XCu8VZLQ0x2r7wOYWjQV4tSvlL3/view?usp=sharing', NULL, 'bcd890', TRUE),
    -- Archivo 6 (Repositorio 3 - Ejercicios)
    (11, 6, 'https://drive.google.com/file/d/1wDxrP3qT50MjhCptemHKMlDELDhJrgfl/view?usp=sharing', 'v1', 'efg123', FALSE),
    (12, 6, 'https://drive.google.com/file/d/1jE4q2XCu8VZLQ0x2r7wOYWjQV4tSvlL3/view?usp=sharing', NULL, 'hij456', TRUE);

-- =============================================
-- Resetear secuencias para evitar conflictos con IDs semilla
-- =============================================
SELECT setval('Repositorio_id_repositorio_seq', (SELECT MAX(id_repositorio) FROM Repositorio));
SELECT setval('Archivos_id_archivo_seq', (SELECT MAX(id_archivo) FROM Archivos));
SELECT setval('Version_id_version_seq', (SELECT MAX(id_version) FROM Version));

-- =============================================
-- Datos de prueba — Foro (Dudas y Respuestas)
-- Clase: id_clase = 3 (Filosofía - Historia del pensamiento)
-- Usuarios:
--   id_usuario 1 = Estudiante Prueba
--   id_usuario 3 = Docente Prueba
--   id_usuario 4 = Auxiliar Prueba
-- =============================================

INSERT INTO Dudas (id_clase, id_usuario, duda, segundo, fecha_creacion) VALUES
    (3, 1, '¿Qué significado tiene la alegoría de la cueva de Platón?', 120, '2026-09-01 10:00:00'),
    (3, 1, '¿Cuál es la diferencia entre empirismo y racionalismo?', 360, '2026-09-02 11:30:00'),
    (3, 1, '¿Cuándo es la próxima entrega del proyecto?', 999, '2026-09-03 09:15:00');

-- Respuestas para Duda 1 (2 respuestas, 1 marcada)
INSERT INTO Respuestas (id_duda, id_usuario, respuesta, marcada, fecha_creacion) VALUES
    (1, 3, 'La alegoría de la cueva representa la educación y la salida del mundo de las apariencias hacia el mundo de las Ideas. Los prisioneros son como los estudiantes que deben ascender hacia el conocimiento verdadero.', FALSE, '2026-09-01 10:30:00'),
    (1, 4, 'Además de lo anterior, Platón usa esta metáfora para explicar la teoría de las Ideas: lo que los prisioneros ven son sombras (mundo sensible), mientras que afuera está la luz del sol (Idea del Bien).', TRUE, '2026-09-01 11:00:00');

-- Respuesta para Duda 2
INSERT INTO Respuestas (id_duda, id_usuario, respuesta, marcada, fecha_creacion) VALUES
    (2, 3, 'El empirismo sostiene que todo conocimiento proviene de la experiencia sensorial (Locke, Hume), mientras que el racionalismo defiende que la razón es la fuente principal del conocimiento (Descartes, Leibniz).', FALSE, '2026-09-02 12:00:00');

-- Resetear secuencias
SELECT setval('Dudas_id_dudas_seq', (SELECT MAX(id_dudas) FROM Dudas));
SELECT setval('Respuestas_id_respuesta_seq', (SELECT MAX(id_respuesta) FROM Respuestas));