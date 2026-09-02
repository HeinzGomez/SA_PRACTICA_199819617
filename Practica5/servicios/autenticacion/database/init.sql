-- Creación de la tabla Usuario
CREATE TABLE usuario (
    id_usuario SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    apellido VARCHAR(50) NOT NULL,
    correo_institucional VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    google_id VARCHAR(255) UNIQUE,
    estado VARCHAR(20) NOT NULL,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Creación de la tabla Sesion (Relación 1 a N con Usuario)
CREATE TABLE sesion (
    id_sesion SERIAL PRIMARY KEY,
    id_usuario INT NOT NULL,
    token_hash VARCHAR(255) NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_expiracion TIMESTAMP NOT NULL,
    estado VARCHAR(20) NOT NULL,
    CONSTRAINT fk_sesion_usuario 
        FOREIGN KEY (id_usuario) 
        REFERENCES usuario(id_usuario) 
        ON DELETE CASCADE
);

-- Creación de la tabla Audit_Logs (Relación 1 a N con Usuario a través de usuario_responsable)
CREATE TABLE audit_logs (
    id_auditoria SERIAL PRIMARY KEY,
    usuario_responsable INT NOT NULL,
    operacion VARCHAR(50) NOT NULL,
    tabla_afectada VARCHAR(50) NOT NULL,
    fecha_evento TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estado_anterior JSONB,
    estado_nuevo JSONB
);


-- Funciones

CREATE OR REPLACE FUNCTION fn_correo_institucional_valido(
    p_correo VARCHAR
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN LOWER(p_correo) ~ '^[a-z0-9._%+-]+@(ingenieria)\.usac\.edu\.gt$';
END;
$$;

CREATE OR REPLACE FUNCTION fn_sesion_valida(
    p_id_sesion INT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
    v_valida BOOLEAN;
BEGIN

    SELECT 
        estado = 'ACTIVA'
        AND fecha_expiracion > CURRENT_TIMESTAMP
    INTO v_valida
    FROM sesion
    WHERE id_sesion = p_id_sesion;

    RETURN COALESCE(v_valida, FALSE);

END;
$$;

CREATE OR REPLACE FUNCTION fn_auditar_cambios()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_usuario_responsable INT;
    v_estado_anterior JSONB;
    v_estado_nuevo JSONB;
BEGIN

    -- Determinar usuario responsable
    IF TG_TABLE_NAME = 'usuario' THEN

        IF TG_OP = 'DELETE' THEN
            v_usuario_responsable := OLD.id_usuario;
        ELSE
            v_usuario_responsable := NEW.id_usuario;
        END IF;

    ELSIF TG_TABLE_NAME = 'sesion' THEN

        IF TG_OP = 'DELETE' THEN
            v_usuario_responsable := OLD.id_usuario;
        ELSE
            v_usuario_responsable := NEW.id_usuario;
        END IF;

    END IF;

    -- Determinar estado anterior y nuevo
    IF TG_OP = 'INSERT' THEN

        v_estado_anterior := NULL;
        v_estado_nuevo := to_jsonb(NEW);

    ELSIF TG_OP = 'UPDATE' THEN

        v_estado_anterior := to_jsonb(OLD);
        v_estado_nuevo := to_jsonb(NEW);

    ELSIF TG_OP = 'DELETE' THEN

        v_estado_anterior := to_jsonb(OLD);
        v_estado_nuevo := NULL;

    END IF;

    -- Registrar auditoría
    INSERT INTO audit_logs (
        usuario_responsable,
        operacion,
        tabla_afectada,
        fecha_evento,
        estado_anterior,
        estado_nuevo
    )
    VALUES (
        v_usuario_responsable,
        TG_OP,
        TG_TABLE_NAME,
        CURRENT_TIMESTAMP,
        v_estado_anterior,
        v_estado_nuevo
    );

    -- Retorno requerido por el trigger
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;

END;
$$;

-- triggers

CREATE TRIGGER trg_auditoria_usuario
AFTER INSERT OR UPDATE OR DELETE
ON usuario
FOR EACH ROW
EXECUTE FUNCTION fn_auditar_cambios();

CREATE TRIGGER trg_auditoria_sesion
AFTER INSERT OR UPDATE OR DELETE
ON sesion
FOR EACH ROW
EXECUTE FUNCTION fn_auditar_cambios();

-- Procedures

CREATE OR REPLACE PROCEDURE sp_registrar_usuario(
    p_nombre VARCHAR,
    p_apellido VARCHAR,
    p_correo VARCHAR,
    p_password_hash VARCHAR,
    p_estado VARCHAR
)
LANGUAGE plpgsql
AS $$
BEGIN

    -- Validar correo institucional
    IF NOT fn_correo_institucional_valido(p_correo) THEN
        RAISE EXCEPTION 
            'El correo debe pertenecer al dominio institucional de la Facultad de Ingeniería';
    END IF;

    -- Verificar que el correo no exista
    IF EXISTS (
        SELECT 1
        FROM usuario
        WHERE correo_institucional = LOWER(p_correo)
    ) THEN
        RAISE EXCEPTION 
            'El correo institucional ya se encuentra registrado';
    END IF;

    -- Registrar usuario
    INSERT INTO usuario (
        nombre,
        apellido,
        correo_institucional,
        password_hash,
        estado
    )
    VALUES (
        p_nombre,
        p_apellido,
        LOWER(p_correo),
        p_password_hash,
        p_estado
    );

END;
$$;

CREATE OR REPLACE PROCEDURE sp_registrar_usuario_google(
    p_nombre VARCHAR,
    p_apellido VARCHAR,
    p_correo VARCHAR,
    p_google_id VARCHAR,
    p_estado VARCHAR
)
LANGUAGE plpgsql
AS $$
BEGIN

    -- Validar correo institucional
    IF NOT fn_correo_institucional_valido(p_correo) THEN
        RAISE EXCEPTION
            'El correo debe pertenecer al dominio institucional de la Facultad de Ingeniería';
    END IF;

    -- Verificar que el correo no exista
    IF EXISTS (
        SELECT 1
        FROM usuario
        WHERE correo_institucional = LOWER(p_correo)
    ) THEN
        RAISE EXCEPTION
            'El correo institucional ya se encuentra registrado';
    END IF;

    -- Verificar que el Google ID no exista
    IF EXISTS (
        SELECT 1
        FROM usuario
        WHERE google_id = p_google_id
    ) THEN
        RAISE EXCEPTION
            'La cuenta de Google ya se encuentra vinculada a un usuario';
    END IF;

    INSERT INTO usuario (
        nombre,
        apellido,
        correo_institucional,
        password_hash,
        google_id,
        estado
    )
    VALUES (
        p_nombre,
        p_apellido,
        LOWER(p_correo),
        NULL,
        p_google_id,
        p_estado
    );

END;
$$;

CREATE OR REPLACE PROCEDURE sp_crear_sesion(
    p_id_usuario INT,
    p_token_hash VARCHAR,
    p_fecha_expiracion TIMESTAMP
)
LANGUAGE plpgsql
AS $$
BEGIN

    -- Verificar que exista el usuario
    IF NOT EXISTS (
        SELECT 1
        FROM usuario
        WHERE id_usuario = p_id_usuario
    ) THEN
        RAISE EXCEPTION 
            'El usuario indicado no existe';
    END IF;

    -- Verificar que el usuario esté activo
    IF NOT EXISTS (
        SELECT 1
        FROM usuario
        WHERE id_usuario = p_id_usuario
          AND estado = 'ACTIVO'
    ) THEN
        RAISE EXCEPTION 
            'El usuario no se encuentra activo';
    END IF;

    -- Verificar que la expiración sea posterior al momento actual
    IF p_fecha_expiracion <= CURRENT_TIMESTAMP THEN
        RAISE EXCEPTION 
            'La fecha de expiración debe ser posterior a la fecha actual';
    END IF;

    INSERT INTO sesion (
        id_usuario,
        token_hash,
        fecha_expiracion,
        estado
    )
    VALUES (
        p_id_usuario,
        p_token_hash,
        p_fecha_expiracion,
        'ACTIVA'
    );

END;
$$;

CREATE OR REPLACE PROCEDURE sp_cerrar_sesion(
    p_id_sesion INT
)
LANGUAGE plpgsql
AS $$
BEGIN

    IF NOT EXISTS (
        SELECT 1
        FROM sesion
        WHERE id_sesion = p_id_sesion
    ) THEN
        RAISE EXCEPTION 
            'La sesión indicada no existe';
    END IF;

    UPDATE sesion
    SET estado = 'INACTIVA'
    WHERE id_sesion = p_id_sesion;

END;
$$;

-- vista
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

-- Usuarios de prueba
-- Contraseña de ambos: 123456789
INSERT INTO usuario (nombre, apellido, correo_institucional, password_hash, estado) VALUES
    ('Estudiante', 'Prueba', 'estudiante@ingenieria.usac.edu.gt', '$2a$12$IJQKQIxC/PuzAG/Bwq5IoumuXl0ZBAJxLTtx2yxVp.le1HhYvMgh2', 'ACTIVO'),
    ('Admin', 'Sistema', 'admin@ingenieria.usac.edu.gt', '$2a$12$IJQKQIxC/PuzAG/Bwq5IoumuXl0ZBAJxLTtx2yxVp.le1HhYvMgh2', 'ACTIVO'),
    ('Docente', 'Prueba', 'docente@ingenieria.usac.edu.gt', '$2a$12$IJQKQIxC/PuzAG/Bwq5IoumuXl0ZBAJxLTtx2yxVp.le1HhYvMgh2', 'ACTIVO'),
    ('Auxiliar', 'Prueba', 'auxiliar@ingenieria.usac.edu.gt', '$2a$12$IJQKQIxC/PuzAG/Bwq5IoumuXl0ZBAJxLTtx2yxVp.le1HhYvMgh2', 'ACTIVO');

