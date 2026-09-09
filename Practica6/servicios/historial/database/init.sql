
-- Creación de la tabla Historial_Reproduccion
CREATE TABLE historial_reproduccion (
    id_historial SERIAL PRIMARY KEY,
    id_usuario INT NOT NULL,
    id_clase INT NOT NULL,
    id_tema INT NOT NULL,
    minuto_actual INT NOT NULL,
    segundo_actual INT NOT NULL DEFAULT 0,
    duracion_total INT NOT NULL,
    porcentaje_visto DECIMAL(5,2) NOT NULL,
    fecha_ultima_reproduccion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completada BOOLEAN NOT NULL
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

CREATE OR REPLACE FUNCTION fn_calcular_porcentaje_visto(
    p_minuto_actual INT,
    p_duracion_total INT
)
RETURNS DECIMAL(5,2)
LANGUAGE plpgsql
AS $$
BEGIN
    IF p_duracion_total <= 0 THEN
        RETURN 0;
    END IF;

    RETURN ROUND(
        (p_minuto_actual::NUMERIC / p_duracion_total::NUMERIC) * 100,
        2
    );
END;
$$;

CREATE OR REPLACE FUNCTION fn_obtener_checkpoint(
    p_usuario INT,
    p_clase INT
)
RETURNS TABLE(
    id_tema INT,
    minuto_actual INT,
    segundo_actual INT,
    porcentaje_visto DECIMAL(5,2),
    completada BOOLEAN,
    fecha_ultima_reproduccion TIMESTAMP
)
LANGUAGE plpgsql
AS $$
BEGIN

RETURN QUERY

SELECT
    h.id_tema,
    h.minuto_actual,
    h.segundo_actual,
    h.porcentaje_visto,
    h.completada,
    h.fecha_ultima_reproduccion
FROM historial_reproduccion h
WHERE h.id_usuario=p_usuario
AND h.id_clase=p_clase;

END;
$$;

CREATE OR REPLACE FUNCTION fn_auditar_cambios()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN

    IF TG_OP = 'INSERT' THEN

        INSERT INTO audit_logs (
            usuario_responsable,
            operacion,
            tabla_afectada,
            estado_anterior,
            estado_nuevo
        )
        VALUES (
            NEW.id_usuario,
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
            NEW.id_usuario,
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
            OLD.id_usuario,
            'DELETE',
            TG_TABLE_NAME,
            to_jsonb(OLD),
            NULL
        );

        RETURN OLD;

    END IF;

    RETURN NULL;

END;
$$;

--- Procedures

CREATE OR REPLACE PROCEDURE sp_registrar_progreso(
    p_id_usuario INT,
    p_id_clase INT,
    p_id_tema INT,
    p_minuto_actual INT,
    p_segundo_actual INT,
    p_duracion_total INT
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_porcentaje DECIMAL(5,2);
BEGIN

    v_porcentaje := fn_calcular_porcentaje_visto(
        p_minuto_actual,
        p_duracion_total
    );

    IF EXISTS (
        SELECT 1
        FROM historial_reproduccion
        WHERE id_usuario = p_id_usuario
          AND id_clase = p_id_clase
    ) THEN

        UPDATE historial_reproduccion
        SET
            id_tema = p_id_tema,
            minuto_actual = p_minuto_actual,
            segundo_actual = p_segundo_actual,
            duracion_total = p_duracion_total,
            porcentaje_visto = v_porcentaje,
            fecha_ultima_reproduccion = CURRENT_TIMESTAMP,
            fecha_actualizacion = CURRENT_TIMESTAMP,
            completada = (v_porcentaje >= 100)
        WHERE id_usuario = p_id_usuario
          AND id_clase = p_id_clase;

    ELSE

        INSERT INTO historial_reproduccion(
            id_usuario,
            id_clase,
            id_tema,
            minuto_actual,
            segundo_actual,
            duracion_total,
            porcentaje_visto,
            completada
        )
        VALUES(
            p_id_usuario,
            p_id_clase,
            p_id_tema,
            p_minuto_actual,
            p_segundo_actual,
            p_duracion_total,
            v_porcentaje,
            (v_porcentaje >= 100)
        );

    END IF;

END;
$$;

CREATE OR REPLACE PROCEDURE sp_marcar_completada(
    p_id_usuario INT,
    p_id_clase INT
)
LANGUAGE plpgsql
AS $$
BEGIN

UPDATE historial_reproduccion
SET
    minuto_actual = duracion_total,
    segundo_actual = 0,
    porcentaje_visto = 100,
    completada = TRUE,
    fecha_actualizacion = CURRENT_TIMESTAMP,
    fecha_ultima_reproduccion = CURRENT_TIMESTAMP
WHERE id_usuario = p_id_usuario
AND id_clase = p_id_clase;

END;
$$;

CREATE OR REPLACE PROCEDURE sp_actualizar_checkpoint(
    p_id_usuario INT,
    p_id_clase INT,
    p_id_tema INT,
    p_minuto_actual INT,
    p_segundo_actual INT
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_duracion INT;
    v_porcentaje DECIMAL(5,2);
BEGIN

    SELECT duracion_total
    INTO v_duracion
    FROM historial_reproduccion
    WHERE id_usuario = p_id_usuario
      AND id_clase = p_id_clase;

    v_porcentaje := fn_calcular_porcentaje_visto(
        p_minuto_actual,
        v_duracion
    );

    UPDATE historial_reproduccion
    SET
        id_tema = p_id_tema,
        minuto_actual = p_minuto_actual,
        segundo_actual = p_segundo_actual,
        porcentaje_visto = v_porcentaje,
        fecha_actualizacion = CURRENT_TIMESTAMP,
        fecha_ultima_reproduccion = CURRENT_TIMESTAMP,
        completada = (v_porcentaje >= 100)
    WHERE id_usuario = p_id_usuario
      AND id_clase = p_id_clase;

END;
$$;

--- Triggers

CREATE OR REPLACE TRIGGER trg_auditoria_historial
AFTER INSERT OR UPDATE OR DELETE
ON historial_reproduccion
FOR EACH ROW
EXECUTE FUNCTION fn_auditar_cambios();

--- Vistas

CREATE OR REPLACE VIEW vw_historial_reproduccion AS
SELECT
    h.id_historial,
    h.id_usuario,
    h.id_clase,
    h.id_tema,
    h.minuto_actual,
    h.segundo_actual,
    h.duracion_total,
    h.porcentaje_visto,
    h.fecha_ultima_reproduccion,
    h.fecha_creacion,
    h.fecha_actualizacion,
    h.completada
FROM historial_reproduccion h;

--- Vista de auditoría

CREATE OR REPLACE VIEW vw_audit_logs AS
SELECT
    a.id_auditoria,
    a.usuario_responsable,
    a.operacion,
    a.tabla_afectada,
    to_char(a.fecha_evento, 'YYYY-MM-DD HH24:MI:SS') AS fecha_evento,
    a.estado_anterior::text AS estado_anterior,
    a.estado_nuevo::text AS estado_nuevo
FROM audit_logs a;