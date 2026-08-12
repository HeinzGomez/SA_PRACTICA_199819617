-- =====================================================================
-- identity-service :: PostgreSQL init script
-- Database per Microservice: este esquema es propiedad EXCLUSIVA de
-- identity-service. Ningun otro microservicio debe conectarse aqui
-- directamente (toda integracion cruzada ocurre via gRPC).
--
-- Practica 3 agrega: catalogo maestro de Semestres/Escuelas (antes eran
-- texto libre en "courses"), y los Procedimientos Almacenados que
-- soportan el Panel de Administracion (RBAC) y las asignaciones
-- academicas docente-curso.
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto; -- gen_random_uuid()

-- ---------------------------------------------------------------------
-- Tablas
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS roles (
    role_id     SMALLSERIAL PRIMARY KEY,
    role_name   VARCHAR(30) UNIQUE NOT NULL
);

INSERT INTO roles (role_name) VALUES
    ('ROLE_ESTUDIANTE'), ('ROLE_CATEDRATICO'), ('ROLE_AUXILIAR'), ('ROLE_ADMIN')
ON CONFLICT (role_name) DO NOTHING;

CREATE TABLE IF NOT EXISTS users (
    user_id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institutional_email   VARCHAR(150) UNIQUE NOT NULL
        CHECK (institutional_email ~* '^[a-zA-Z0-9._%+-]+@(ingenieria|ing)\.usac\.edu\.gt$'),
    full_name             VARCHAR(150) NOT NULL,
    carnet                VARCHAR(20),
    password_hash         VARCHAR(200) NOT NULL,
    is_active             BOOLEAN NOT NULL DEFAULT TRUE,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_roles (
    user_id   UUID REFERENCES users(user_id) ON DELETE CASCADE,
    role_id   SMALLINT REFERENCES roles(role_id),
    PRIMARY KEY (user_id, role_id)
);

-- ---------------------------------------------------------------------
-- Catalogo maestro (Practica 3): Escuelas/Areas y Semestres administrables
-- desde el Panel Web de Administracion (RBAC), en vez de texto libre.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS schools (
    school_id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name         VARCHAR(120) UNIQUE NOT NULL,
    is_active    BOOLEAN NOT NULL DEFAULT TRUE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS semesters (
    semester_id  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code         VARCHAR(20) UNIQUE NOT NULL, -- p.ej. "2026-S2"
    label        VARCHAR(60) NOT NULL,        -- p.ej. "Segundo Semestre 2026"
    starts_on    DATE,
    ends_on      DATE,
    is_active    BOOLEAN NOT NULL DEFAULT TRUE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS courses (
    course_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name          VARCHAR(150) NOT NULL,
    school_id     UUID NOT NULL REFERENCES schools(school_id),
    semester_id   UUID NOT NULL REFERENCES semesters(semester_id),
    professor_id  UUID REFERENCES users(user_id), -- docente asignado (ROLE_CATEDRATICO/ROLE_AUXILIAR)
    is_active     BOOLEAN NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS enrollments (
    enrollment_id  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id        UUID REFERENCES users(user_id) ON DELETE CASCADE,
    course_id      UUID REFERENCES courses(course_id) ON DELETE CASCADE,
    enrolled_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    status         VARCHAR(20) NOT NULL DEFAULT 'ACTIVA',
    UNIQUE (user_id, course_id)
);

-- Auditoria de cambios sensibles (credenciales / permisos / catalogo admin)
CREATE TABLE IF NOT EXISTS user_audit_log (
    audit_id     BIGSERIAL PRIMARY KEY,
    user_id      UUID NOT NULL,
    change_type  VARCHAR(50) NOT NULL,
    old_value    TEXT,
    new_value    TEXT,
    changed_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS admin_audit_log (
    audit_id      BIGSERIAL PRIMARY KEY,
    actor_user_id UUID,                 -- usuario admin/catedratico/auxiliar que ejecuto la accion
    entity        VARCHAR(30) NOT NULL, -- SCHOOL | SEMESTER | COURSE | PROFESSOR_ASSIGNMENT
    entity_id     UUID,
    action        VARCHAR(20) NOT NULL, -- CREATE | UPDATE | DELETE | ASSIGN
    details       TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- Vistas
-- ---------------------------------------------------------------------

-- Catalogo de cursos con nombres resueltos de escuela/semestre, listo
-- para el Gateway/API y para el Panel de Administracion.
CREATE OR REPLACE VIEW v_course_catalog AS
SELECT
    c.course_id,
    c.name,
    c.school_id,
    sc.name        AS school,
    c.semester_id,
    se.code        AS semester,
    c.professor_id,
    u.full_name    AS professor_name,
    c.is_active
FROM courses c
JOIN schools sc     ON sc.school_id = c.school_id
JOIN semesters se    ON se.semester_id = c.semester_id
LEFT JOIN users u    ON u.user_id = c.professor_id;

-- Roles por usuario (evita joins repetidos en la capa de aplicacion)
CREATE OR REPLACE VIEW v_user_roles AS
SELECT
    u.user_id,
    r.role_name
FROM users u
JOIN user_roles ur ON ur.user_id = u.user_id
JOIN roles r ON r.role_id = ur.role_id;

-- Docentes (Catedratico/Auxiliar) para el Panel de Administracion
CREATE OR REPLACE VIEW v_professors AS
SELECT DISTINCT
    u.user_id,
    u.full_name,
    u.institutional_email,
    u.is_active,
    r.role_name
FROM users u
JOIN user_roles ur ON ur.user_id = u.user_id
JOIN roles r ON r.role_id = ur.role_id
WHERE r.role_name IN ('ROLE_CATEDRATICO', 'ROLE_AUXILIAR');

-- ---------------------------------------------------------------------
-- Funcion: verifica si un usuario tiene acceso vigente a un curso
-- (usada por identity-service.VerifyCourseAccess)
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_has_course_access(p_user_id UUID, p_course_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM enrollments
        WHERE user_id = p_user_id
          AND course_id = p_course_id
          AND status = 'ACTIVA'
    ) INTO v_exists;
    RETURN v_exists;
END;
$$ LANGUAGE plpgsql STABLE;

-- Funcion: valida si un usuario tiene rol administrativo habilitado
-- para el Panel Web (Admin, Catedratico o Auxiliar), usada por los SPs
-- de escritura del catalogo administrativo para reforzar RBAC tambien
-- a nivel de base de datos (defensa en profundidad, no solo en el Gateway).
CREATE OR REPLACE FUNCTION fn_is_admin_role(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM v_user_roles
        WHERE user_id = p_user_id
          AND role_name IN ('ROLE_ADMIN', 'ROLE_CATEDRATICO', 'ROLE_AUXILIAR')
    ) INTO v_exists;
    RETURN v_exists;
END;
$$ LANGUAGE plpgsql STABLE;

-- ---------------------------------------------------------------------
-- Procedimientos almacenados
-- ---------------------------------------------------------------------

-- Registro transaccional de un usuario institucional + asignacion de su
-- rol inicial (todo o nada). Tambien se usa para crear Docentes.
CREATE OR REPLACE FUNCTION sp_register_user(
    p_email          VARCHAR,
    p_full_name      VARCHAR,
    p_password_hash  VARCHAR,
    p_carnet         VARCHAR,
    p_initial_role   VARCHAR
) RETURNS UUID AS $$
DECLARE
    v_user_id UUID;
    v_role_id SMALLINT;
BEGIN
    INSERT INTO users (institutional_email, full_name, password_hash, carnet)
    VALUES (p_email, p_full_name, p_password_hash, p_carnet)
    RETURNING user_id INTO v_user_id;

    SELECT role_id INTO v_role_id FROM roles WHERE role_name = p_initial_role;
    IF v_role_id IS NULL THEN
        SELECT role_id INTO v_role_id FROM roles WHERE role_name = 'ROLE_ESTUDIANTE';
    END IF;

    INSERT INTO user_roles (user_id, role_id) VALUES (v_user_id, v_role_id);

    RETURN v_user_id;
END;
$$ LANGUAGE plpgsql;

-- CRUD administrativo de Escuelas/Areas (RBAC: solo Admin/Catedratico/Auxiliar)
CREATE OR REPLACE FUNCTION sp_upsert_school(
    p_actor_user_id UUID,
    p_school_id     UUID,   -- NULL = crear nueva
    p_name          VARCHAR
) RETURNS UUID AS $$
DECLARE
    v_school_id UUID;
BEGIN
    IF NOT fn_is_admin_role(p_actor_user_id) THEN
        RAISE EXCEPTION 'RBAC: el usuario % no tiene permisos administrativos', p_actor_user_id;
    END IF;

    IF p_school_id IS NULL THEN
        INSERT INTO schools (name) VALUES (p_name) RETURNING school_id INTO v_school_id;
        INSERT INTO admin_audit_log (actor_user_id, entity, entity_id, action, details)
        VALUES (p_actor_user_id, 'SCHOOL', v_school_id, 'CREATE', p_name);
    ELSE
        UPDATE schools SET name = p_name WHERE school_id = p_school_id RETURNING school_id INTO v_school_id;
        INSERT INTO admin_audit_log (actor_user_id, entity, entity_id, action, details)
        VALUES (p_actor_user_id, 'SCHOOL', v_school_id, 'UPDATE', p_name);
    END IF;

    RETURN v_school_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION sp_delete_school(p_actor_user_id UUID, p_school_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    IF NOT fn_is_admin_role(p_actor_user_id) THEN
        RAISE EXCEPTION 'RBAC: el usuario % no tiene permisos administrativos', p_actor_user_id;
    END IF;

    UPDATE schools SET is_active = FALSE WHERE school_id = p_school_id;

    INSERT INTO admin_audit_log (actor_user_id, entity, entity_id, action)
    VALUES (p_actor_user_id, 'SCHOOL', p_school_id, 'DELETE');

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- CRUD administrativo de Semestres
CREATE OR REPLACE FUNCTION sp_upsert_semester(
    p_actor_user_id UUID,
    p_semester_id   UUID,  -- NULL = crear nuevo
    p_code          VARCHAR,
    p_label         VARCHAR,
    p_starts_on     DATE,
    p_ends_on       DATE
) RETURNS UUID AS $$
DECLARE
    v_semester_id UUID;
BEGIN
    IF NOT fn_is_admin_role(p_actor_user_id) THEN
        RAISE EXCEPTION 'RBAC: el usuario % no tiene permisos administrativos', p_actor_user_id;
    END IF;

    IF p_semester_id IS NULL THEN
        INSERT INTO semesters (code, label, starts_on, ends_on)
        VALUES (p_code, p_label, p_starts_on, p_ends_on)
        RETURNING semester_id INTO v_semester_id;
        INSERT INTO admin_audit_log (actor_user_id, entity, entity_id, action, details)
        VALUES (p_actor_user_id, 'SEMESTER', v_semester_id, 'CREATE', p_code);
    ELSE
        UPDATE semesters
        SET code = p_code, label = p_label, starts_on = p_starts_on, ends_on = p_ends_on
        WHERE semester_id = p_semester_id
        RETURNING semester_id INTO v_semester_id;
        INSERT INTO admin_audit_log (actor_user_id, entity, entity_id, action, details)
        VALUES (p_actor_user_id, 'SEMESTER', v_semester_id, 'UPDATE', p_code);
    END IF;

    RETURN v_semester_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION sp_delete_semester(p_actor_user_id UUID, p_semester_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    IF NOT fn_is_admin_role(p_actor_user_id) THEN
        RAISE EXCEPTION 'RBAC: el usuario % no tiene permisos administrativos', p_actor_user_id;
    END IF;

    UPDATE semesters SET is_active = FALSE WHERE semester_id = p_semester_id;

    INSERT INTO admin_audit_log (actor_user_id, entity, entity_id, action)
    VALUES (p_actor_user_id, 'SEMESTER', p_semester_id, 'DELETE');

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- CRUD administrativo de Cursos (valida existencia de escuela/semestre
-- de forma transaccional: todo o nada).
CREATE OR REPLACE FUNCTION sp_upsert_course(
    p_actor_user_id UUID,
    p_course_id     UUID,  -- NULL = crear nuevo
    p_name          VARCHAR,
    p_school_id     UUID,
    p_semester_id   UUID
) RETURNS UUID AS $$
DECLARE
    v_course_id UUID;
BEGIN
    IF NOT fn_is_admin_role(p_actor_user_id) THEN
        RAISE EXCEPTION 'RBAC: el usuario % no tiene permisos administrativos', p_actor_user_id;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM schools WHERE school_id = p_school_id AND is_active) THEN
        RAISE EXCEPTION 'La escuela % no existe o esta inactiva', p_school_id;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM semesters WHERE semester_id = p_semester_id AND is_active) THEN
        RAISE EXCEPTION 'El semestre % no existe o esta inactivo', p_semester_id;
    END IF;

    IF p_course_id IS NULL THEN
        INSERT INTO courses (name, school_id, semester_id)
        VALUES (p_name, p_school_id, p_semester_id)
        RETURNING course_id INTO v_course_id;
        INSERT INTO admin_audit_log (actor_user_id, entity, entity_id, action, details)
        VALUES (p_actor_user_id, 'COURSE', v_course_id, 'CREATE', p_name);
    ELSE
        UPDATE courses
        SET name = p_name, school_id = p_school_id, semester_id = p_semester_id
        WHERE course_id = p_course_id
        RETURNING course_id INTO v_course_id;
        INSERT INTO admin_audit_log (actor_user_id, entity, entity_id, action, details)
        VALUES (p_actor_user_id, 'COURSE', v_course_id, 'UPDATE', p_name);
    END IF;

    RETURN v_course_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION sp_delete_course(p_actor_user_id UUID, p_course_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    IF NOT fn_is_admin_role(p_actor_user_id) THEN
        RAISE EXCEPTION 'RBAC: el usuario % no tiene permisos administrativos', p_actor_user_id;
    END IF;

    UPDATE courses SET is_active = FALSE WHERE course_id = p_course_id;

    INSERT INTO admin_audit_log (actor_user_id, entity, entity_id, action)
    VALUES (p_actor_user_id, 'COURSE', p_course_id, 'DELETE');

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Asignacion academica: asigna un docente (Catedratico/Auxiliar) a un
-- curso de forma transaccional, validando rol y existencia (todo o nada).
-- Este es el SP explicitamente exigido por el enunciado para
-- "las asignaciones academicas".
CREATE OR REPLACE FUNCTION sp_assign_professor_to_course(
    p_actor_user_id UUID,
    p_course_id     UUID,
    p_professor_id  UUID
) RETURNS BOOLEAN AS $$
DECLARE
    v_is_professor BOOLEAN;
BEGIN
    IF NOT fn_is_admin_role(p_actor_user_id) THEN
        RAISE EXCEPTION 'RBAC: el usuario % no tiene permisos administrativos', p_actor_user_id;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM courses WHERE course_id = p_course_id AND is_active) THEN
        RAISE EXCEPTION 'El curso % no existe o esta inactivo', p_course_id;
    END IF;

    SELECT EXISTS (
        SELECT 1 FROM v_user_roles
        WHERE user_id = p_professor_id
          AND role_name IN ('ROLE_CATEDRATICO', 'ROLE_AUXILIAR')
    ) INTO v_is_professor;

    IF NOT v_is_professor THEN
        RAISE EXCEPTION 'El usuario % no tiene rol de Catedratico/Auxiliar', p_professor_id;
    END IF;

    UPDATE courses SET professor_id = p_professor_id WHERE course_id = p_course_id;

    INSERT INTO admin_audit_log (actor_user_id, entity, entity_id, action, details)
    VALUES (p_actor_user_id, 'PROFESSOR_ASSIGNMENT', p_course_id, 'ASSIGN', p_professor_id::TEXT);

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Activar/desactivar un docente (soft-delete de "Docentes" en el Panel Admin)
CREATE OR REPLACE FUNCTION sp_set_professor_active(
    p_actor_user_id UUID,
    p_professor_id  UUID,
    p_is_active     BOOLEAN
) RETURNS BOOLEAN AS $$
BEGIN
    IF NOT fn_is_admin_role(p_actor_user_id) THEN
        RAISE EXCEPTION 'RBAC: el usuario % no tiene permisos administrativos', p_actor_user_id;
    END IF;

    UPDATE users SET is_active = p_is_active WHERE user_id = p_professor_id;

    INSERT INTO admin_audit_log (actor_user_id, entity, entity_id, action, details)
    VALUES (p_actor_user_id, 'PROFESSOR', p_professor_id, 'UPDATE', 'is_active=' || p_is_active::TEXT);

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------------
-- Triggers: auditoria automatica de cambios de credenciales/permisos
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION trg_fn_audit_user_changes() RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' AND (OLD.password_hash IS DISTINCT FROM NEW.password_hash) THEN
        INSERT INTO user_audit_log (user_id, change_type, old_value, new_value)
        VALUES (NEW.user_id, 'PASSWORD_CHANGE', '***', '***');
    END IF;

    IF TG_OP = 'UPDATE' AND (OLD.is_active IS DISTINCT FROM NEW.is_active) THEN
        INSERT INTO user_audit_log (user_id, change_type, old_value, new_value)
        VALUES (NEW.user_id, 'STATUS_CHANGE', OLD.is_active::TEXT, NEW.is_active::TEXT);
    END IF;

    NEW.updated_at := now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_audit_user_changes ON users;
CREATE TRIGGER trg_audit_user_changes
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION trg_fn_audit_user_changes();

CREATE OR REPLACE FUNCTION trg_fn_audit_role_changes() RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_audit_log (user_id, change_type, old_value, new_value)
    VALUES (
        COALESCE(NEW.user_id, OLD.user_id),
        'ROLE_' || TG_OP,
        CASE WHEN TG_OP = 'DELETE' THEN OLD.role_id::TEXT ELSE NULL END,
        CASE WHEN TG_OP IN ('INSERT','UPDATE') THEN NEW.role_id::TEXT ELSE NULL END
    );
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_audit_role_changes ON user_roles;
CREATE TRIGGER trg_audit_role_changes
    AFTER INSERT OR UPDATE OR DELETE ON user_roles
    FOR EACH ROW
    EXECUTE FUNCTION trg_fn_audit_role_changes();

-- ---------------------------------------------------------------------
-- Datos semilla minimos para pruebas locales
-- ---------------------------------------------------------------------

-- Password de ejemplo (bcrypt real de "Prueba123!") — SOLO para entorno local/dev.
INSERT INTO users (institutional_email, full_name, carnet, password_hash)
VALUES ('estudiante.demo@ingenieria.usac.edu.gt', 'Estudiante Demo', '201900000',
        '$2b$10$baI5JRjwmmpcTDmA7L4WoeA/ouVdFP.WpEk81JudCIwswdsmKa0lq')
ON CONFLICT DO NOTHING;

-- Usuario Administrador de ejemplo (misma contrasena "Prueba123!"), para
-- probar el Panel Web de Administracion (RBAC) de la Practica 3.
INSERT INTO users (institutional_email, full_name, carnet, password_hash)
VALUES ('admin.demo@ingenieria.usac.edu.gt', 'Admin Demo', '201900001',
        '$2b$10$baI5JRjwmmpcTDmA7L4WoeA/ouVdFP.WpEk81JudCIwswdsmKa0lq')
ON CONFLICT DO NOTHING;

-- Usuario Catedratico de ejemplo (misma contrasena), para probar
-- asignaciones academicas.
INSERT INTO users (institutional_email, full_name, carnet, password_hash)
VALUES ('catedratico.demo@ingenieria.usac.edu.gt', 'Catedrático Demo', '201900002',
        '$2b$10$baI5JRjwmmpcTDmA7L4WoeA/ouVdFP.WpEk81JudCIwswdsmKa0lq')
ON CONFLICT DO NOTHING;

INSERT INTO user_roles (user_id, role_id)
SELECT u.user_id, r.role_id FROM users u, roles r
WHERE u.institutional_email = 'estudiante.demo@ingenieria.usac.edu.gt' AND r.role_name = 'ROLE_ESTUDIANTE'
ON CONFLICT DO NOTHING;

INSERT INTO user_roles (user_id, role_id)
SELECT u.user_id, r.role_id FROM users u, roles r
WHERE u.institutional_email = 'admin.demo@ingenieria.usac.edu.gt' AND r.role_name = 'ROLE_ADMIN'
ON CONFLICT DO NOTHING;

INSERT INTO user_roles (user_id, role_id)
SELECT u.user_id, r.role_id FROM users u, roles r
WHERE u.institutional_email = 'catedratico.demo@ingenieria.usac.edu.gt' AND r.role_name = 'ROLE_CATEDRATICO'
ON CONFLICT DO NOTHING;

-- Escuela y semestre semilla
INSERT INTO schools (school_id, name)
VALUES ('33333333-3333-3333-3333-333333333333', 'Ciencias y Sistemas')
ON CONFLICT (school_id) DO NOTHING;

INSERT INTO semesters (semester_id, code, label, starts_on, ends_on)
VALUES ('44444444-4444-4444-4444-444444444444', '2026-S2', 'Segundo Semestre 2026', '2026-07-01', '2026-11-30')
ON CONFLICT (semester_id) DO NOTHING;

-- Curso de ejemplo e inscripcion del usuario demo (para probar
-- GetEnrolledCourses / VerifyCourseAccess / ListCourses end-to-end)
INSERT INTO courses (course_id, name, school_id, semester_id, professor_id)
SELECT '11111111-1111-1111-1111-111111111111', 'Software Avanzado',
       '33333333-3333-3333-3333-333333333333',
       '44444444-4444-4444-4444-444444444444',
       u.user_id
FROM users u WHERE u.institutional_email = 'catedratico.demo@ingenieria.usac.edu.gt'
ON CONFLICT (course_id) DO NOTHING;

INSERT INTO enrollments (user_id, course_id, status)
SELECT u.user_id, '11111111-1111-1111-1111-111111111111', 'ACTIVA'
FROM users u
WHERE u.institutional_email = 'estudiante.demo@ingenieria.usac.edu.gt'
ON CONFLICT (user_id, course_id) DO NOTHING;
