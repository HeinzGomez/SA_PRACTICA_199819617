import { pool } from "../config/db";

export interface UserRow {
  user_id: string;
  institutional_email: string;
  full_name: string;
  carnet: string;
  password_hash: string;
  created_at: Date;
}

const COURSE_COLUMNS = `
  course_id, name, school_id, school, semester_id, semester,
  professor_id, professor_name, is_active
`;

export const UserRepository = {
  async findByEmail(email: string): Promise<UserRow | null> {
    const { rows } = await pool.query<UserRow>(
      `SELECT user_id, institutional_email, full_name, carnet, password_hash, created_at
       FROM users WHERE institutional_email = $1`,
      [email]
    );
    return rows[0] ?? null;
  },

  async findById(userId: string): Promise<UserRow | null> {
    const { rows } = await pool.query<UserRow>(
      `SELECT user_id, institutional_email, full_name, carnet, password_hash, created_at
       FROM users WHERE user_id = $1`,
      [userId]
    );
    return rows[0] ?? null;
  },

  async getRoles(userId: string): Promise<string[]> {
    // Consulta contra la vista v_user_roles (ver db/init.sql)
    const { rows } = await pool.query<{ role_name: string }>(
      `SELECT role_name FROM v_user_roles WHERE user_id = $1`,
      [userId]
    );
    return rows.map((r) => r.role_name);
  },

  /**
   * Inscribe/registra un usuario institucional mediante el procedimiento
   * almacenado sp_register_user, que crea el usuario, le asigna el rol
   * inicial y registra la auditoria (trigger trg_audit_user_changes).
   * Tambien se usa para crear Docentes desde el Panel de Administracion.
   */
  async registerInstitutionalUser(params: {
    email: string;
    fullName: string;
    passwordHash: string;
    carnet: string;
    initialRole: string;
  }): Promise<string> {
    const { rows } = await pool.query<{ new_user_id: string }>(
      `SELECT sp_register_user($1, $2, $3, $4, $5) AS new_user_id`,
      [params.email, params.fullName, params.passwordHash, params.carnet, params.initialRole]
    );
    return rows[0].new_user_id;
  },

  async getEnrolledCourses(userId: string, semester?: string) {
    const { rows } = await pool.query(
      `SELECT ${COURSE_COLUMNS}
       FROM v_course_catalog c
       JOIN enrollments e ON e.course_id = c.course_id
       WHERE e.user_id = $1 AND ($2::text IS NULL OR c.semester = $2) AND c.is_active`,
      [userId, semester ?? null]
    );
    return rows;
  },

  async verifyCourseAccess(userId: string, courseId: string): Promise<boolean> {
    const { rows } = await pool.query<{ has_access: boolean }>(
      `SELECT fn_has_course_access($1, $2) AS has_access`,
      [userId, courseId]
    );
    return rows[0]?.has_access ?? false;
  },

  async listCourses(filter: { semester?: string; school?: string; professorId?: string }) {
    const { rows } = await pool.query(
      `SELECT ${COURSE_COLUMNS}
       FROM v_course_catalog
       WHERE ($1::text IS NULL OR semester = $1)
         AND ($2::text IS NULL OR school = $2)
         AND ($3::text IS NULL OR professor_id = $3)
         AND is_active`,
      [filter.semester ?? null, filter.school ?? null, filter.professorId ?? null]
    );
    return rows;
  },

  // -----------------------------------------------------------------
  // Panel de Administración (RBAC) — Práctica 3
  // Todos los métodos delegan en Procedimientos Almacenados que
  // re-validan el rol del actor a nivel de base de datos
  // (fn_is_admin_role), como defensa en profundidad además del RBAC
  // ya aplicado en el API Gateway y en el middleware de este servicio.
  // -----------------------------------------------------------------

  async listSchools() {
    const { rows } = await pool.query(
      `SELECT school_id, name, is_active FROM schools WHERE is_active ORDER BY name`
    );
    return rows;
  },

  async upsertSchool(actorUserId: string, schoolId: string | null, name: string) {
    const { rows } = await pool.query<{ school_id: string }>(
      `SELECT sp_upsert_school($1, $2, $3) AS school_id`,
      [actorUserId, schoolId, name]
    );
    return rows[0];
  },

  async deleteSchool(actorUserId: string, schoolId: string) {
    await pool.query(`SELECT sp_delete_school($1, $2)`, [actorUserId, schoolId]);
  },

  async listSemesters() {
    const { rows } = await pool.query(
      `SELECT semester_id, code, label, starts_on, ends_on, is_active
       FROM semesters WHERE is_active ORDER BY code DESC`
    );
    return rows;
  },

  async upsertSemester(
    actorUserId: string,
    semesterId: string | null,
    code: string,
    label: string,
    startsOn: string | null,
    endsOn: string | null
  ) {
    const { rows } = await pool.query(
      `SELECT sp_upsert_semester($1, $2, $3, $4, $5, $6) AS semester_id`,
      [actorUserId, semesterId, code, label, startsOn, endsOn]
    );
    return rows[0];
  },

  async deleteSemester(actorUserId: string, semesterId: string) {
    await pool.query(`SELECT sp_delete_semester($1, $2)`, [actorUserId, semesterId]);
  },

  async upsertCourse(
    actorUserId: string,
    courseId: string | null,
    name: string,
    schoolId: string,
    semesterId: string
  ) {
    const { rows } = await pool.query<{ course_id: string }>(
      `SELECT sp_upsert_course($1, $2, $3, $4, $5) AS course_id`,
      [actorUserId, courseId, name, schoolId, semesterId]
    );
    return rows[0];
  },

  async deleteCourse(actorUserId: string, courseId: string) {
    await pool.query(`SELECT sp_delete_course($1, $2)`, [actorUserId, courseId]);
  },

  async getCourseById(courseId: string) {
    const { rows } = await pool.query(
      `SELECT ${COURSE_COLUMNS} FROM v_course_catalog WHERE course_id = $1`,
      [courseId]
    );
    return rows[0] ?? null;
  },

  async assignProfessorToCourse(actorUserId: string, courseId: string, professorId: string) {
    await pool.query(`SELECT sp_assign_professor_to_course($1, $2, $3)`, [
      actorUserId,
      courseId,
      professorId,
    ]);
  },

  async listProfessors() {
    const { rows } = await pool.query(
      `SELECT user_id, full_name, institutional_email, is_active, role_name
       FROM v_professors ORDER BY full_name`
    );
    return rows;
  },

  async setProfessorActive(actorUserId: string, professorId: string, isActive: boolean) {
    await pool.query(`SELECT sp_set_professor_active($1, $2, $3)`, [
      actorUserId,
      professorId,
      isActive,
    ]);
  },
};
