-- Creación de la tabla Notificaciones
CREATE TABLE notificaciones (
    id_notificacion SERIAL PRIMARY KEY,
    id_usuario INT NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    asunto VARCHAR(150) NOT NULL,
    mensaje TEXT NOT NULL,
    fecha_envio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estado VARCHAR(20) NOT NULL
);

-- Creación de la tabla Audit_Notification
CREATE TABLE audit_notification (
    id_auditoria SERIAL PRIMARY KEY,
    usuario_responsable INT NOT NULL,
    operacion VARCHAR(50) NOT NULL,
    tabla_afectada VARCHAR(50) NOT NULL,
    fecha_evento TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estado_anterior JSONB,
    estado_nuevo JSONB
);

--- Funciones

CREATE OR REPLACE FUNCTION fn_auditar_notificacion()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN

    IF TG_OP = 'INSERT' THEN

        INSERT INTO audit_notification (
            usuario_responsable,
            operacion,
            tabla_afectada,
            fecha_evento,
            estado_anterior,
            estado_nuevo
        )
        VALUES (
            COALESCE(NEW.id_usuario, 0),
            'INSERT',
            TG_TABLE_NAME,
            CURRENT_TIMESTAMP,
            NULL,
            to_jsonb(NEW)
        );

        RETURN NEW;

    ELSIF TG_OP = 'UPDATE' THEN

        INSERT INTO audit_notification (
            usuario_responsable,
            operacion,
            tabla_afectada,
            fecha_evento,
            estado_anterior,
            estado_nuevo
        )
        VALUES (
            COALESCE(NEW.id_usuario, 0),
            'UPDATE',
            TG_TABLE_NAME,
            CURRENT_TIMESTAMP,
            to_jsonb(OLD),
            to_jsonb(NEW)
        );

        RETURN NEW;

    ELSIF TG_OP = 'DELETE' THEN

        INSERT INTO audit_notification (
            usuario_responsable,
            operacion,
            tabla_afectada,
            fecha_evento,
            estado_anterior,
            estado_nuevo
        )
        VALUES (
            COALESCE(OLD.id_usuario, 0),
            'DELETE',
            TG_TABLE_NAME,
            CURRENT_TIMESTAMP,
            to_jsonb(OLD),
            NULL
        );

        RETURN OLD;

    END IF;

    RETURN NULL;
END;
$$;


--- Procedures

CREATE OR REPLACE PROCEDURE sp_registrar_notificacion(
    p_id_usuario INT,
    p_tipo VARCHAR(50),
    p_asunto VARCHAR(150),
    p_mensaje TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO notificaciones (
        id_usuario,
        tipo,
        asunto,
        mensaje,
        fecha_envio,
        estado
    )
    VALUES (
        p_id_usuario,
        p_tipo,
        p_asunto,
        p_mensaje,
        CURRENT_TIMESTAMP,
        'ENVIADO'
    );
END;
$$;

--- Triggers

CREATE TRIGGER trg_auditoria_notificaciones
AFTER INSERT OR UPDATE OR DELETE
ON notificaciones
FOR EACH ROW
EXECUTE FUNCTION fn_auditar_notificacion();

--- Vistas

CREATE OR REPLACE VIEW vw_notificaciones AS
SELECT
    n.id_notificacion,
    n.id_usuario,
    n.tipo,
    n.asunto,
    n.mensaje,
    n.fecha_envio,
    n.estado
FROM notificaciones n
ORDER BY n.fecha_envio DESC;