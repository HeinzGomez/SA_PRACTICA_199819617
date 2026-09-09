-- Creación de la tabla Rol
CREATE TABLE rol (
    id_rol SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    descripcion TEXT
);

-- Creación de la tabla Area
CREATE TABLE area (
    id_area SERIAL PRIMARY KEY,
    codigo VARCHAR(20) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT
);

-- Creación de la tabla Estado_Matricula
CREATE TABLE estado_matricula (
    id_estado SERIAL PRIMARY KEY,
    codigo VARCHAR(20) NOT NULL,
    nombre VARCHAR(50) NOT NULL,
    descripcion TEXT
);

-- Creación de la tabla Periodo
CREATE TABLE periodo (
    id_periodo SERIAL PRIMARY KEY,
    anio INT NOT NULL,
    num_semestre INT NOT NULL
);

-- Creación de la tabla Pensum
CREATE TABLE pensum (
    id_pensum SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT
);

-- Creación de la tabla Curso
CREATE TABLE curso (
    id_curso SERIAL PRIMARY KEY,
    codigo VARCHAR(20) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    id_area INT NOT NULL,
    fecha_inscripcion TIMESTAMP,
    CONSTRAINT fk_curso_area 
        FOREIGN KEY (id_area) 
        REFERENCES area(id_area)
);

-- Creación de la tabla Carrera
CREATE TABLE carrera (
    id_carrera SERIAL PRIMARY KEY,
    facultad VARCHAR(100) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    id_pensum INT NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_carrera_pensum 
        FOREIGN KEY (id_pensum) 
        REFERENCES pensum(id_pensum)
);

-- Creación de la tabla Perfil_Academico
CREATE TABLE perfil_academico (
    id_perfil SERIAL PRIMARY KEY,
    id_usuario INT NOT NULL,
    registro_academico VARCHAR(50) UNIQUE,
    dpi VARCHAR(20) UNIQUE,
    fecha_nacimiento DATE,
    telefono VARCHAR(20),
    id_carrera INT,
    direccion TEXT,
    CONSTRAINT fk_perfil_carrera 
        FOREIGN KEY (id_carrera) 
        REFERENCES carrera(id_carrera)
);

-- Creación de la tabla Inscripcion
CREATE TABLE inscripcion (
    id_inscripcion SERIAL PRIMARY KEY,
    id_usuario INT NOT NULL,
    id_curso INT NOT NULL,
    id_periodo INT NOT NULL,
    id_estado_matricula INT NOT NULL,
    fecha_inscripcion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    tipo_inscripcion VARCHAR(50),
    CONSTRAINT fk_inscripcion_curso 
        FOREIGN KEY (id_curso) 
        REFERENCES curso(id_curso),
    CONSTRAINT fk_inscripcion_periodo 
        FOREIGN KEY (id_periodo) 
        REFERENCES periodo(id_periodo),
    CONSTRAINT fk_inscripcion_estado 
        FOREIGN KEY (id_estado_matricula) 
        REFERENCES estado_matricula(id_estado)
);

-- Creación de la tabla intermedia Usuario_Rol (Relación N a M)
CREATE TABLE usuario_rol (
    id_rol INT NOT NULL,
    id_usuario INT NOT NULL,
    PRIMARY KEY (id_rol, id_usuario),
    CONSTRAINT fk_usuariorol_rol 
        FOREIGN KEY (id_rol) 
        REFERENCES rol(id_rol) 
        ON DELETE CASCADE
);

-- Creación de la tabla Audit_Logs
CREATE TABLE audit_logs (
    id_auditoria SERIAL PRIMARY KEY,
    usuario_responsable INT NOT NULL,
    operacion VARCHAR(50) NOT NULL,
    tabla_afectada VARCHAR(50) NOT NULL,
    fecha_evento TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estado_anterior JSONB,
    estado_nuevo JSONB
);

-- funciones

CREATE OR REPLACE FUNCTION fn_usuario_tiene_rol(
    p_id_usuario INT,
    p_nombre_rol VARCHAR(50)
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
    v_tiene_rol BOOLEAN;
BEGIN

    SELECT EXISTS (
        SELECT 1
        FROM usuario_rol ur
        INNER JOIN rol r
            ON r.id_rol = ur.id_rol
        WHERE ur.id_usuario = p_id_usuario
          AND LOWER(r.nombre) = LOWER(p_nombre_rol)
    )
    INTO v_tiene_rol;

    RETURN v_tiene_rol;

END;
$$;

CREATE OR REPLACE FUNCTION fn_auditar_cambios()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_usuario_responsable INT;
BEGIN

    v_usuario_responsable :=
        NULLIF(current_setting('app.usuario_id', true), '')::INT;

    IF TG_OP = 'INSERT' THEN

        INSERT INTO audit_logs (
            usuario_responsable,
            operacion,
            tabla_afectada,
            estado_anterior,
            estado_nuevo
        )
        VALUES (
            v_usuario_responsable,
            'INSERT',
            TG_TABLE_NAME,
            NULL,
            to_jsonb(NEW)
        );

        RETURN NEW;

    ELSIF TG_OP = 'UPDATE' THEN

        INSERT INTO audit_logs (
            usuario_responsable,
            operacion,
            tabla_afectada,
            estado_anterior,
            estado_nuevo
        )
        VALUES (
            v_usuario_responsable,
            'UPDATE',
            TG_TABLE_NAME,
            to_jsonb(OLD),
            to_jsonb(NEW)
        );

        RETURN NEW;

    ELSIF TG_OP = 'DELETE' THEN

        INSERT INTO audit_logs (
            usuario_responsable,
            operacion,
            tabla_afectada,
            estado_anterior,
            estado_nuevo
        )
        VALUES (
            v_usuario_responsable,
            'DELETE',
            TG_TABLE_NAME,
            to_jsonb(OLD),
            NULL
        );

        RETURN OLD;

    END IF;

END;
$$;

-- procedures

CREATE OR REPLACE PROCEDURE sp_inscribir_estudiante(
    p_id_usuario INT,
    p_id_curso INT,
    p_id_periodo INT,
    p_id_estado_matricula INT,
    p_tipo_inscripcion VARCHAR(50)
)
LANGUAGE plpgsql
AS $$
BEGIN
    -- Validar que el curso exista
    IF NOT EXISTS (
        SELECT 1
        FROM curso
        WHERE id_curso = p_id_curso
    ) THEN
        RAISE EXCEPTION 'El curso no existe';
    END IF;

    -- Validar que el período exista
    IF NOT EXISTS (
        SELECT 1
        FROM periodo
        WHERE id_periodo = p_id_periodo
    ) THEN
        RAISE EXCEPTION 'El período académico no existe';
    END IF;

    -- Validar que el estado de matrícula exista
    IF NOT EXISTS (
        SELECT 1
        FROM estado_matricula
        WHERE id_estado = p_id_estado_matricula
    ) THEN
        RAISE EXCEPTION 'El estado de matrícula no existe';
    END IF;

    -- Evitar duplicados
    IF EXISTS (
        SELECT 1
        FROM inscripcion
        WHERE id_usuario = p_id_usuario
          AND id_curso = p_id_curso
          AND id_periodo = p_id_periodo
    ) THEN
        RAISE EXCEPTION 'El estudiante ya está inscrito en este curso durante este período';
    END IF;

    -- Crear inscripción
    INSERT INTO inscripcion (
        id_usuario,
        id_curso,
        id_periodo,
        id_estado_matricula,
        tipo_inscripcion
    )
    VALUES (
        p_id_usuario,
        p_id_curso,
        p_id_periodo,
        p_id_estado_matricula,
        p_tipo_inscripcion
    );
END;
$$;

CREATE OR REPLACE PROCEDURE sp_actualizar_estado_matricula(
    p_id_inscripcion INT,
    p_nuevo_estado INT
)
LANGUAGE plpgsql
AS $$
BEGIN

    IF NOT EXISTS (
        SELECT 1
        FROM estado_matricula
        WHERE id_estado = p_nuevo_estado
    ) THEN
        RAISE EXCEPTION 'El estado de matrícula no existe';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM inscripcion
        WHERE id_inscripcion = p_id_inscripcion
    ) THEN
        RAISE EXCEPTION 'La inscripción no existe';
    END IF;

    UPDATE inscripcion
    SET id_estado_matricula = p_nuevo_estado
    WHERE id_inscripcion = p_id_inscripcion;

END;
$$;

-- triggers

CREATE TRIGGER trg_auditoria_usuario_rol
AFTER INSERT OR UPDATE OR DELETE
ON usuario_rol
FOR EACH ROW
EXECUTE FUNCTION fn_auditar_cambios();

CREATE TRIGGER trg_auditoria_inscripcion
AFTER INSERT OR UPDATE OR DELETE
ON inscripcion
FOR EACH ROW
EXECUTE FUNCTION fn_auditar_cambios();

-- vistas

CREATE OR REPLACE VIEW vw_cursos_estudiante AS
SELECT
    i.id_inscripcion,
    i.id_usuario,
    c.id_curso,
    c.codigo AS codigo_curso,
    c.nombre AS curso,
    a.codigo AS codigo_area,
    a.nombre AS area,
    p.anio,
    p.num_semestre AS semestre,
    em.codigo AS codigo_estado,
    em.nombre AS estado_matricula,
    i.tipo_inscripcion,
    i.fecha_inscripcion
FROM inscripcion i
INNER JOIN curso c
    ON c.id_curso = i.id_curso
INNER JOIN area a
    ON a.id_area = c.id_area
INNER JOIN periodo p
    ON p.id_periodo = i.id_periodo
INNER JOIN estado_matricula em
    ON em.id_estado = i.id_estado_matricula;

CREATE OR REPLACE VIEW vw_usuarios_roles AS
SELECT
    ur.id_usuario,
    r.id_rol,
    r.nombre AS rol,
    r.descripcion
FROM usuario_rol ur
INNER JOIN rol r
    ON r.id_rol = ur.id_rol;

CREATE OR REPLACE VIEW vw_audit_logs_paginados AS
SELECT
    id_auditoria,
    usuario_responsable,
    operacion,
    tabla_afectada,
    fecha_evento,
    estado_anterior,
    estado_nuevo,

    ROW_NUMBER() OVER (
        ORDER BY fecha_evento DESC, id_auditoria DESC
    ) AS numero_registro,

    CEIL(
        ROW_NUMBER() OVER (
            ORDER BY fecha_evento DESC, id_auditoria DESC
        ) / 10.0
    )::INT AS pagina

FROM audit_logs;

-- ==============================================
-- Datos de prueba (seed)
-- ==============================================

-- Roles de la aplicación
INSERT INTO rol (nombre, descripcion) VALUES
    ('Estudiante', 'Rol para estudiantes'),
    ('Docente', 'Rol para docentes'),
    ('Auxiliar', 'Rol para auxiliares'),
    ('Administrador', 'Rol para administradores');

-- Áreas
INSERT INTO area (codigo, nombre, descripcion) VALUES
    ('AREA-CYS', 'Ciencias y Sistemas', 'Área de la carrera de Ingeniería en Ciencias y Sistemas'),
    ('AREA-MAT', 'Matemática', 'Área de ciencias matemáticas'),
    ('AREA-HUM', 'Humanística', 'Área de ciencias humanísticas y sociales');

-- Pensums
INSERT INTO pensum (nombre, descripcion) VALUES
    ('Pensum Ingeniería en Ciencias y Sistemas', 'Pensum 2024 de la carrera de Ingeniería en Ciencias y Sistemas'),
    ('Pensum Ingeniería Civil', 'Pensum 2024 de la carrera de Ingeniería Civil'),
    ('Pensum Ingeniería Química', 'Pensum 2024 de la carrera de Ingeniería Química');

-- Carreras (cada una con su pensum)
INSERT INTO carrera (facultad, nombre, descripcion, id_pensum) VALUES
    ('Ingeniería', 'Ingeniería en Ciencias y Sistemas', 'Carrera de Ingeniería en Ciencias y Sistemas', 1),
    ('Ingeniería', 'Ingeniería Civil', 'Carrera de Ingeniería Civil', 2),
    ('Ingeniería', 'Ingeniería Química', 'Carrera de Ingeniería Química', 3);

-- Cursos de prueba (cada uno con su área)
INSERT INTO curso (codigo, nombre, descripcion, id_area) VALUES
    ('SO1', 'Sistemas Operativos 1', 'Curso del área de Ciencias y Sistemas', 1),
    ('MA1', 'Matemática Aplicada 1', 'Curso del área de Matemática', 2),
    ('FI1', 'Filosofía', 'Curso del área de Humanística', 3);

-- Cursos adicionales de prueba (más áreas y temas para carga masiva)
INSERT INTO curso (codigo, nombre, descripcion, id_area) VALUES
    ('SO2', 'Sistemas Operativos 2', 'Curso del área de Ciencias y Sistemas', 1),
    ('BD1', 'Bases de Datos 1', 'Curso del área de Ciencias y Sistemas', 1),
    ('AD1', 'Análisis y Diseño de Sistemas 1', 'Curso del área de Ciencias y Sistemas', 1),
    ('MA2', 'Matemática Aplicada 2', 'Curso del área de Matemática', 2),
    ('ES1', 'Estadística 1', 'Curso del área de Matemática', 2),
    ('AL1', 'Álgebra Lineal 1', 'Curso del área de Matemática', 2),
    ('FI2', 'Filosofía de la Ciencia', 'Curso del área de Humanística', 3),
    ('RED1', 'Redacción y Comunicación Profesional', 'Curso del área de Humanística', 3),
    ('ECO1', 'Economía', 'Curso del área de Humanística', 3);

-- Estados de matrícula
INSERT INTO estado_matricula (codigo, nombre, descripcion) VALUES
    ('INSCRITO', 'Inscrito', 'Estudiante inscrito en el curso'),
    ('APROBADO', 'Aprobado', 'Curso aprobado'),
    ('REPROBADO', 'Reprobado', 'Curso reprobado'),
    ('RETIRADO', 'Retirado', 'Estudiante retirado del curso'),
    ('CANCELADO', 'Cancelado', 'Inscripcion Cancelada');

-- Períodos académicos
INSERT INTO periodo (anio, num_semestre) VALUES
    (2025, 1),
    (2025, 2),
    (2026, 1);

-- Períodos académicos adicionales
INSERT INTO periodo (anio, num_semestre) VALUES
    (2026, 2),
    (2027, 1),
    (2027, 2);

-- Perfiles académicos de prueba
-- id_usuario 1 = Estudiante Prueba, id_usuario 2 = Admin Sistema (ver autenticacion/init.sql)
INSERT INTO perfil_academico (id_usuario, registro_academico, dpi, fecha_nacimiento, telefono, id_carrera, direccion) VALUES
    (1, '202010044', '1234567890101', '2001-05-15', '5555-0101', 1, 'Guatemala, Ciudad'),
    (2, '201800123', '1234567890102', '1998-01-10', '5555-0102', 1, 'Guatemala, Zona 12');

-- Roles de usuario (requieren app.usuario_id por el trigger de auditoría)
SET app.usuario_id = '2';

INSERT INTO usuario_rol (id_rol, id_usuario) VALUES
    (1, 1),  -- Estudiante Prueba → Estudiante
    (2, 3),  -- Docente Prueba → Docente
    (3, 4),  -- Auxiliar Prueba → Auxiliar
    (4, 2);  -- Admin Sistema → Administrador

-- Inscripciones del estudiante para probar ConsultarCursosEstudiante
INSERT INTO inscripcion (id_usuario, id_curso, id_periodo, id_estado_matricula, tipo_inscripcion) VALUES
    (1, 1, 1, 1, 'ORDINARIA'),  -- SO1 en 2025-1, inscrito
    (1, 2, 2, 2, 'ORDINARIA'),  -- MA1 en 2025-2, aprobado
    (1, 3, 3, 1, 'ORDINARIA');  -- FI1 en 2026-1, inscrito

RESET app.usuario_id;