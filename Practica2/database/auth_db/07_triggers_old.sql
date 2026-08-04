CREATE OR REPLACE FUNCTION trg_fn_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS
$$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


CREATE OR REPLACE FUNCTION trg_fn_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS
$$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


CREATE TRIGGER trg_sesion_updated_at
BEFORE UPDATE
ON sesion
FOR EACH ROW
EXECUTE FUNCTION trg_fn_updated_at();


CREATE OR REPLACE FUNCTION trg_fn_prevenir_delete_usuario()
RETURNS TRIGGER
LANGUAGE plpgsql
AS
$$
BEGIN
    RAISE EXCEPTION
    'Los usuarios no pueden eliminarse físicamente. Utilice Soft Delete.';
END;
$$;


CREATE TRIGGER trg_usuario_delete
BEFORE DELETE
ON usuario
FOR EACH ROW
EXECUTE FUNCTION trg_fn_prevenir_delete_usuario();


CREATE OR REPLACE FUNCTION trg_fn_log_sesion()
RETURNS TRIGGER
LANGUAGE plpgsql
AS
$$
BEGIN
    RAISE NOTICE
    'Nueva sesión creada para el usuario %',
    NEW.usuario_id;
    RETURN NEW;
END;
$$;


CREATE TRIGGER trg_sesion_insert
AFTER INSERT
ON sesion
FOR EACH ROW
EXECUTE FUNCTION trg_fn_log_sesion();

