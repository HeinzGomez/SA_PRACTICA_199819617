CREATE OR REPLACE VIEW vw_usuarios AS
SELECT
    id,
    nombres,
    apellidos,
    correo,
    activo,
    ultimo_login,
    created_at,
    updated_at
FROM usuario
WHERE deleted_at IS NULL;


CREATE OR REPLACE VIEW vw_usuarios_activos AS
SELECT
    id,
    nombres,
    apellidos,
    correo
FROM usuario
WHERE activo = TRUE
AND deleted_at IS NULL;


CREATE OR REPLACE VIEW vw_sesiones_activas AS
SELECT
    s.id,
    s.usuario_id,
    u.nombres,
    u.apellidos,
    u.correo,
    s.ip,
    s.user_agent,
    s.expira,
    s.created_at
FROM sesion s
INNER JOIN usuario u
ON u.id=s.usuario_id
WHERE
    s.activa = TRUE
AND u.deleted_at IS NULL;



CREATE OR REPLACE VIEW vw_historial_login AS
SELECT
    u.nombres,
    u.apellidos,
    u.correo,
    s.ip,
    s.user_agent,
    s.created_at,
    s.expira
FROM sesion s
INNER JOIN usuario u
ON u.id=s.usuario_id
WHERE u.deleted_at IS NULL;



CREATE OR REPLACE VIEW vw_usuarios_conectados AS
SELECT DISTINCT
    u.id,
    u.nombres,
    u.apellidos,
    u.correo
FROM usuario u
INNER JOIN sesion s
ON s.usuario_id=u.id
WHERE
    s.activa = TRUE
AND s.expira > CURRENT_TIMESTAMP
AND u.deleted_at IS NULL;


