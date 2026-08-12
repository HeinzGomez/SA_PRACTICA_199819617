import { useEffect, useState } from "react";
import { apiClient } from "../api/client";

interface Course {
  courseId: string;
  name: string;
  semester: string;
  school: string;
}

/** Pantalla 5/6: Panel de Asignaciones — cursos inscritos y estado de
 * matriculación del estudiante. */
export default function EnrollmentPanel() {
  const [courses, setCourses] = useState<Course[]>([]);

  useEffect(() => {
    apiClient.get("/catalog/courses").then((res) => setCourses(res.data?.courses ?? []));
  }, []);

  return (
    <main className="page">
      <div className="page-header">
        <h1>Mis cursos inscritos</h1>
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Curso</th>
              <th>Escuela</th>
              <th>Semestre</th>
            </tr>
          </thead>
          <tbody>
            {courses.map((c) => (
              <tr key={c.courseId}>
                <td>{c.name}</td>
                <td>{c.school}</td>
                <td>{c.semester}</td>
              </tr>
            ))}
            {courses.length === 0 && (
              <tr>
                <td colSpan={3} className="table-empty">
                  No tienes cursos inscritos todavía.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
