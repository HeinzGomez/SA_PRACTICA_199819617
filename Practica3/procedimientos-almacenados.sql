-- =====================================================================
-- YoUSAC — Práctica 3: Panel de administración, carga masiva y
-- transacciones en Base de datos
--
-- Script consolidado con los Procedimientos Almacenados (SPs) nuevos de
-- esta práctica. Es la copia de entrega exigida por el enunciado
-- ("2. Script SQL"); la fuente de verdad que realmente ejecuta
-- docker-compose.local.yml al inicializar los contenedores vive en:
--   - services/identity-service/db/init.sql   (RBAC administrativo)
--   - services/content-service/db/init.sql    (carga masiva CSV)
--
-- Ambos esquemas son bases de datos PostgreSQL INDEPENDIENTES (patrón
-- Database per Microservice): las secciones de abajo están separadas
-- por servicio y no deben ejecutarse contra la misma base de datos.
-- =====================================================================


-- #######################################################################
-- # identity-service (identity_db)
-- # RBAC del Panel Web de Administración: CRUD de Escuelas, Semestres,
-- # Cursos y la asignación académica Docente-Curso.
-- #######################################################################

-- Reutiliza el catalogo de roles/usuarios ya creado en la Práctica 1/2
-- (roles, users, user_roles). Requiere tambien las tablas nuevas de esta
-- práctica: schools, semesters, courses (con FK a schools/semesters),
-- admin_audit_log — ver services/identity-service/db/init.sql para el
-- DDL completo de tablas y vistas.

-- Función de soporte: valida RBAC a nivel de base de datos (defensa en
-- profundidad, además de la validación ya hecha en el API Gateway).
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

-- CRUD administrativo de Escuelas/Areas
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
-- de forma transaccional: todo o nada)
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

-- Asignación académica: asigna un docente (Catedrático/Auxiliar) a un
-- curso de forma transaccional, validando rol y existencia (todo o
-- nada). Este es el SP explícitamente exigido por el enunciado para
-- "las asignaciones académicas".
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

-- Activar/desactivar un docente (soft-delete de "Docentes")
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


-- #######################################################################
-- # content-service (content_db)
-- # Carga masiva de grabaciones vía CSV, ejecutada íntegramente a
-- # través de Procedimientos Almacenados.
-- #######################################################################

-- Procedimiento almacenado: ingesta transaccional de una nueva
-- grabación junto con sus docentes/auxiliares y etiquetas. Se usa tanto
-- para la ingesta individual como, fila a fila, para la carga masiva.
CREATE OR REPLACE FUNCTION sp_ingest_recording(
    p_title        VARCHAR,
    p_course_id    UUID,
    p_semester     VARCHAR,
    p_unit         VARCHAR,
    p_video_url    TEXT,
    p_professors   TEXT[],
    p_tags         TEXT[],
    p_school       VARCHAR DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_recording_id UUID;
    v_professor TEXT;
    v_tag TEXT;
BEGIN
    IF p_title IS NULL OR length(trim(p_title)) = 0 THEN
        RAISE EXCEPTION 'El titulo de la grabacion es obligatorio';
    END IF;
    IF p_course_id IS NULL THEN
        RAISE EXCEPTION 'course_id es obligatorio';
    END IF;
    IF p_video_url IS NULL OR length(trim(p_video_url)) = 0 THEN
        RAISE EXCEPTION 'video_url es obligatorio';
    END IF;

    INSERT INTO recordings (title, course_id, semester, school, unit, video_url)
    VALUES (p_title, p_course_id, p_semester, p_school, p_unit, p_video_url)
    RETURNING recording_id INTO v_recording_id;

    IF p_professors IS NOT NULL THEN
        FOREACH v_professor IN ARRAY p_professors LOOP
            IF length(trim(v_professor)) > 0 THEN
                INSERT INTO recording_professors (recording_id, professor_ref, role)
                VALUES (v_recording_id, v_professor, 'PROFESOR')
                ON CONFLICT DO NOTHING;
            END IF;
        END LOOP;
    END IF;

    IF p_tags IS NOT NULL THEN
        FOREACH v_tag IN ARRAY p_tags LOOP
            IF length(trim(v_tag)) > 0 THEN
                INSERT INTO recording_tags (recording_id, tag)
                VALUES (v_recording_id, v_tag)
                ON CONFLICT DO NOTHING;
            END IF;
        END LOOP;
    END IF;

    RETURN v_recording_id;
END;
$$ LANGUAGE plpgsql;

-- Tipo compuesto de retorno de la carga masiva
DROP TYPE IF EXISTS bulk_ingest_result CASCADE;
CREATE TYPE bulk_ingest_result AS (
    rows_processed INT,
    rows_failed    INT,
    errors         TEXT[]
);

-- Procedimiento almacenado: carga masiva de grabaciones a partir de un
-- arreglo JSONB (una entrada por fila del CSV, parseado por
-- content-service en Go — ver internal/csvparser/csvparser.go). Cada
-- fila se procesa en su propio bloque BEGIN/EXCEPTION (equivalente a un
-- savepoint): un error en una fila NO aborta el resto del archivo, solo
-- se reporta en "errors". Esto es lo que el enunciado exige como
-- "Procedimientos Almacenados para manejar las inserciones complejas
-- del archivo CSV".
CREATE OR REPLACE FUNCTION sp_bulk_ingest_recordings_csv(p_rows JSONB)
RETURNS bulk_ingest_result AS $$
DECLARE
    v_row JSONB;
    v_result bulk_ingest_result;
    v_processed INT := 0;
    v_failed INT := 0;
    v_errors TEXT[] := '{}';
BEGIN
    FOR v_row IN SELECT * FROM jsonb_array_elements(p_rows)
    LOOP
        BEGIN
            PERFORM sp_ingest_recording(
                v_row->>'title',
                (v_row->>'course_id')::UUID,
                v_row->>'semester',
                v_row->>'unit',
                v_row->>'video_url',
                ARRAY(SELECT jsonb_array_elements_text(COALESCE(v_row->'professors', '[]'::jsonb))),
                ARRAY(SELECT jsonb_array_elements_text(COALESCE(v_row->'tags', '[]'::jsonb))),
                v_row->>'school'
            );
            v_processed := v_processed + 1;
        EXCEPTION WHEN OTHERS THEN
            v_failed := v_failed + 1;
            v_errors := array_append(
                v_errors,
                format('Fila "%s": %s', COALESCE(v_row->>'title', '(sin titulo)'), SQLERRM)
            );
        END;
    END LOOP;

    v_result.rows_processed := v_processed;
    v_result.rows_failed := v_failed;
    v_result.errors := v_errors;
    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- =====================================================================
-- Ejemplo de invocación manual (para pruebas desde psql):
--
-- SELECT sp_upsert_school('<uuid-admin>', NULL, 'Ciencias y Sistemas');
--
-- SELECT * FROM sp_bulk_ingest_recordings_csv('[
--   {"title":"Clase 1","course_id":"11111111-1111-1111-1111-111111111111",
--    "semester":"2026-S2","school":"Ciencias y Sistemas","unit":"Unidad 1",
--    "video_url":"https://ejemplo.com/v1.mp4","professors":["Ing. X"],"tags":["grpc"]}
-- ]'::jsonb);
-- =====================================================================
