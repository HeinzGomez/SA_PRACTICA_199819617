import { useEffect, useState } from "react";
import { apiClient } from "../../api/client";

interface School {
  schoolId: string;
  name: string;
}
interface Semester {
  semesterId: string;
  code: string;
}
interface Professor {
  userId: string;
  fullName: string;
  role: string;
}
interface Course {
  courseId: string;
  name: string;
  school: string;
  schoolId: string;
  semester: string;
  semesterId: string;
  professorId: string;
  professorName: string;
}

/**
 * CRUD de Cursos + asignación académica de docente. Invoca
 * sp_upsert_course / sp_delete_course / sp_assign_professor_to_course
 * (identity-service) a través de /admin/courses.
 */
export default function AdminCourses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [professors, setProfessors] = useState<Professor[]>([]);
  const [form, setForm] = useState({ name: "", schoolId: "", semesterId: "" });
  const [assignments, setAssignments] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  async function loadAll() {
    const [coursesRes, schoolsRes, semestersRes, professorsRes] = await Promise.all([
      apiClient.get("/catalog/courses"),
      apiClient.get("/admin/schools"),
      apiClient.get("/admin/semesters"),
      apiClient.get("/admin/professors"),
    ]);
    setCourses(coursesRes.data?.courses ?? []);
    setSchools(schoolsRes.data?.schools ?? []);
    setSemesters(semestersRes.data?.semesters ?? []);
    setProfessors(professorsRes.data?.professors ?? []);
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await apiClient.post("/admin/courses", form);
      setForm({ name: "", schoolId: "", semesterId: "" });
      await loadAll();
    } catch (err: any) {
      setError(err?.response?.data?.error ?? "Error al crear el curso.");
    }
  }

  async function handleDelete(courseId: string) {
    if (!confirm("¿Eliminar este curso?")) return;
    await apiClient.delete(`/admin/courses/${courseId}`);
    await loadAll();
  }

  async function handleAssign(courseId: string) {
    const professorId = assignments[courseId];
    if (!professorId) return;
    await apiClient.post(`/admin/courses/${courseId}/assign-professor`, { professorId });
    await loadAll();
  }

  return (
    <section className="card">
      <h2>Cursos</h2>

      <form onSubmit={handleCreate} className="form-inline">
        <input
          className="input"
          placeholder="Nombre del curso"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
          style={{ flex: 1, minWidth: 220 }}
        />
        <select
          className="select"
          value={form.schoolId}
          onChange={(e) => setForm({ ...form, schoolId: e.target.value })}
          required
          style={{ maxWidth: 220 }}
        >
          <option value="">Escuela...</option>
          {schools.map((s) => (
            <option key={s.schoolId} value={s.schoolId}>
              {s.name}
            </option>
          ))}
        </select>
        <select
          className="select"
          value={form.semesterId}
          onChange={(e) => setForm({ ...form, semesterId: e.target.value })}
          required
          style={{ maxWidth: 160 }}
        >
          <option value="">Semestre...</option>
          {semesters.map((s) => (
            <option key={s.semesterId} value={s.semesterId}>
              {s.code}
            </option>
          ))}
        </select>
        <button type="submit" className="btn btn-primary">
          Agregar
        </button>
      </form>

      {error && <p className="alert alert-error">{error}</p>}

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Curso</th>
              <th>Escuela</th>
              <th>Semestre</th>
              <th>Docente asignado</th>
              <th>Asignar docente</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {courses.map((c) => (
              <tr key={c.courseId}>
                <td>{c.name}</td>
                <td>{c.school}</td>
                <td>{c.semester}</td>
                <td>
                  {c.professorName ? (
                    <span className="badge badge-success">{c.professorName}</span>
                  ) : (
                    <span className="badge badge-muted">Sin asignar</span>
                  )}
                </td>
                <td>
                  <div style={{ display: "flex", gap: 6 }}>
                    <select
                      className="select"
                      value={assignments[c.courseId] ?? ""}
                      onChange={(e) => setAssignments({ ...assignments, [c.courseId]: e.target.value })}
                      style={{ minWidth: 160 }}
                    >
                      <option value="">Seleccionar docente...</option>
                      {professors.map((p) => (
                        <option key={p.userId} value={p.userId}>
                          {p.fullName} ({p.role === "ROLE_AUXILIAR" ? "Auxiliar" : "Catedrático"})
                        </option>
                      ))}
                    </select>
                    <button className="btn btn-secondary btn-sm" onClick={() => handleAssign(c.courseId)}>
                      Asignar
                    </button>
                  </div>
                </td>
                <td>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(c.courseId)}>
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
            {courses.length === 0 && (
              <tr>
                <td colSpan={6} className="table-empty">
                  No hay cursos registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
