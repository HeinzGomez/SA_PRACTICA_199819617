-- ==========================================================
-- Índices
-- ==========================================================

CREATE INDEX idx_usuario_activo
ON usuario(activo);

-- ==========================================================
-- Índices tabla sesion
-- ==========================================================

CREATE INDEX idx_sesion_usuario
ON sesion(usuario_id);

CREATE INDEX idx_sesion_refresh_token
ON sesion(refresh_token);

CREATE INDEX idx_sesion_activa
ON sesion(activa);

CREATE INDEX idx_sesion_expira
ON sesion(expira);