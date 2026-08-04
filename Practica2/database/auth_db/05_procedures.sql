CREATE OR REPLACE PROCEDURE sp_crear_usuario(

    IN p_nombres VARCHAR(100),
    IN p_apellidos VARCHAR(100),
    IN p_correo VARCHAR(150),
    IN p_password_hash TEXT

)
LANGUAGE plpgsql
AS
$$
BEGIN
    IF fn_existe_correo(p_correo) THEN
        RAISE EXCEPTION 'El correo ya existe.';
    END IF;
    INSERT INTO usuario
    (
        nombres,
        apellidos,
        correo,
        password_hash
    )
    VALUES
    (
        p_nombres,
        p_apellidos,
        LOWER(p_correo),
        p_password_hash
    );

END;
$$;

CREATE OR REPLACE PROCEDURE sp_actualizar_usuario(

    IN p_usuario_id UUID,
    IN p_nombres VARCHAR(100),
    IN p_apellidos VARCHAR(100)

)
LANGUAGE plpgsql
AS
$$
BEGIN

    UPDATE usuario
    SET

        nombres = p_nombres,

        apellidos = p_apellidos,

        updated_at = CURRENT_TIMESTAMP

    WHERE id = p_usuario_id;

END;
$$;

CREATE OR REPLACE PROCEDURE sp_cambiar_password(
    IN p_usuario_id UUID,
    IN p_password_hash TEXT

)
LANGUAGE plpgsql
AS
$$
BEGIN
    UPDATE usuario
       SET
           password_hash = p_password_hash,
           updated_at = CURRENT_TIMESTAMP
     WHERE id = p_usuario_id;
END;
$$;


CREATE OR REPLACE PROCEDURE sp_actualizar_ultimo_login(
    IN p_usuario_id UUID
)
LANGUAGE plpgsql
AS
$$
BEGIN
    UPDATE usuario
       SET
           ultimo_login = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
     WHERE id = p_usuario_id;
END;
$$;


CREATE OR REPLACE PROCEDURE sp_registrar_sesion(
    IN p_usuario_id UUID,
    IN p_refresh_token TEXT,
    IN p_ip VARCHAR(45),
    IN p_user_agent TEXT,
    IN p_expira TIMESTAMP
)
LANGUAGE plpgsql
AS
$$
BEGIN
    INSERT INTO sesion
    (
        usuario_id,
        refresh_token,
        ip,
        user_agent,
        expira
    )
    VALUES
    (
        p_usuario_id,
        p_refresh_token,
        p_ip,
        p_user_agent,
        p_expira
    );
END;
$$;


CREATE OR REPLACE PROCEDURE sp_cerrar_sesion(
    IN p_refresh_token TEXT
)
LANGUAGE plpgsql
AS
$$
BEGIN
    UPDATE sesion
       SET
           activa = FALSE,
           updated_at = CURRENT_TIMESTAMP
     WHERE refresh_token = p_refresh_token;
END;
$$;


CREATE OR REPLACE PROCEDURE sp_revocar_sesiones(
    IN p_usuario_id UUID
)
LANGUAGE plpgsql
AS
$$
BEGIN
    UPDATE sesion
       SET
           activa = FALSE,
           updated_at = CURRENT_TIMESTAMP
     WHERE usuario_id = p_usuario_id;
END;
$$;

