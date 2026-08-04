-- ==========================================================
-- Función: fn_validar_correo_institucional
-- Descripción:
-- Valida que el correo pertenezca a un dominio permitido.
-- ==========================================================

CREATE OR REPLACE FUNCTION fn_validar_correo_institucional(
    p_correo VARCHAR
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS
$$
BEGIN

    RETURN (
        p_correo ILIKE '%@ingenieria.usac.edu.gt'
        OR
        p_correo ILIKE '%@ing.usac.edu.gt'
    );

END;
$$;

-- ==========================================================
-- Función : fn_obtener_usuario_por_correo
-- Descripción:
-- Obtiene un usuario activo por su correo institucional.
-- ==========================================================

CREATE OR REPLACE FUNCTION fn_obtener_usuario_por_correo(
    p_correo VARCHAR(150)
)
RETURNS TABLE
(
    id UUID,
    nombres VARCHAR(100),
    apellidos VARCHAR(100),
    correo VARCHAR(150),
    password_hash TEXT,
    activo BOOLEAN,
    ultimo_login TIMESTAMP
)
LANGUAGE plpgsql
AS
$$
BEGIN

    IF NOT fn_validar_correo_institucional(p_correo) THEN
        RAISE EXCEPTION 'El correo no pertenece al dominio institucional.';
    END IF;

    RETURN QUERY

    SELECT
        u.id,
        u.nombres,
        u.apellidos,
        u.correo,
        u.password_hash,
        u.activo,
        u.ultimo_login
    FROM usuario u
    WHERE LOWER(u.correo) = LOWER(p_correo)
      AND u.deleted_at IS NULL;

END;
$$;

CREATE OR REPLACE FUNCTION fn_obtener_usuario_por_id(
    p_usuario_id UUID
)
RETURNS TABLE
(
    id UUID,
    nombres VARCHAR(100),
    apellidos VARCHAR(100),
    correo VARCHAR(150),
    activo BOOLEAN,
    ultimo_login TIMESTAMP
)
LANGUAGE plpgsql
AS
$$
BEGIN

    RETURN QUERY

    SELECT
        u.id,
        u.nombres,
        u.apellidos,
        u.correo,
        u.activo,
        u.ultimo_login
    FROM usuario u
    WHERE u.id = p_usuario_id
      AND u.deleted_at IS NULL;

END;
$$;

CREATE OR REPLACE FUNCTION fn_existe_correo(
    p_correo VARCHAR(150)
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS
$$
BEGIN

    RETURN EXISTS
    (
        SELECT 1
        FROM usuario
        WHERE LOWER(correo)=LOWER(p_correo)
          AND deleted_at IS NULL
    );

END;
$$;