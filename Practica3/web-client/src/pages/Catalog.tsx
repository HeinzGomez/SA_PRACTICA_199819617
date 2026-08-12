import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiClient } from "../api/client";

interface RecordingSummary {
  recordingId: string;
  title: string;
  courseId: string;
  semester: string;
  school: string;
}

interface Option {
  id: string;
  label: string;
}

const PAGE_SIZE = 10; // tope exigido por la Practica 3

/** Pantalla 2/6: Catálogo por Semestre, con búsqueda, filtros combinados
 * (Semestre, Escuela, Curso, Docente) y paginación desde el servidor. */
export default function Catalog() {
  const [semester, setSemester] = useState("");
  const [school, setSchool] = useState("");
  const [courseId, setCourseId] = useState("");
  const [professorId, setProfessorId] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const [results, setResults] = useState<RecordingSummary[]>([]);
  const [total, setTotal] = useState(0);

  const [semesters, setSemesters] = useState<Option[]>([]);
  const [schools, setSchools] = useState<Option[]>([]);
  const [courses, setCourses] = useState<Option[]>([]);
  const [professors, setProfessors] = useState<Option[]>([]);

  // Carga las opciones de los 4 filtros combinados una sola vez.
  useEffect(() => {
    apiClient.get("/catalog/semesters").then((res) =>
      setSemesters((res.data?.semesters ?? []).map((s: any) => ({ id: s.code, label: s.code })))
    );
    apiClient.get("/catalog/schools").then((res) =>
      setSchools((res.data?.schools ?? []).map((s: any) => ({ id: s.name, label: s.name })))
    );
    apiClient.get("/catalog/courses").then((res) =>
      setCourses((res.data?.courses ?? []).map((c: any) => ({ id: c.courseId, label: c.name })))
    );
    apiClient.get("/catalog/professors").then((res) =>
      setProfessors((res.data?.professors ?? []).map((p: any) => ({ id: p.userId, label: p.fullName })))
    );
  }, []);

  // Vuelve a la página 1 cada vez que cambia algún filtro.
  useEffect(() => {
    setPage(1);
  }, [semester, school, courseId, professorId, query]);

  useEffect(() => {
    apiClient
      .get("/catalog/recordings", {
        params: { semester, school, courseId, professorId, q: query, page, pageSize: PAGE_SIZE },
      })
      .then((res) => {
        setResults(res.data?.results ?? []);
        setTotal(res.data?.total ?? 0);
      })
      .catch(() => {
        setResults([]);
        setTotal(0);
      });
  }, [semester, school, courseId, professorId, query, page]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <main className="page">
      <div className="page-header">
        <h1>Catálogo de clases grabadas</h1>
        <p className="page-subtitle">Busca por título o combina los filtros de semestre, escuela, curso y docente.</p>
      </div>

      <div className="filter-bar">
        <input
          className="input"
          type="text"
          placeholder="Buscar por título..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select className="select" value={semester} onChange={(e) => setSemester(e.target.value)}>
          <option value="">Todos los semestres</option>
          {semesters.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
        <select className="select" value={school} onChange={(e) => setSchool(e.target.value)}>
          <option value="">Todas las escuelas</option>
          {schools.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
        <select className="select" value={courseId} onChange={(e) => setCourseId(e.target.value)}>
          <option value="">Todos los cursos</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
        <select className="select" value={professorId} onChange={(e) => setProfessorId(e.target.value)}>
          <option value="">Todos los docentes</option>
          {professors.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>
      </div>

      {results.length === 0 ? (
        <div className="card">
          <p className="text-muted" style={{ margin: 0 }}>
            No se encontraron grabaciones con los filtros seleccionados.
          </p>
        </div>
      ) : (
        <div className="catalog-grid">
          {results.map((r) => (
            <Link key={r.recordingId} to={`/clase/${r.recordingId}`} className="catalog-card">
              <div className="catalog-card__title">{r.title}</div>
              <div className="catalog-card__meta">
                {r.school} · {r.semester}
              </div>
            </Link>
          ))}
        </div>
      )}

      {total > 0 && (
        <div className="pagination">
          <button className="btn btn-secondary btn-sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Anterior
          </button>
          <span>
            Página {page} de {totalPages} ({total} resultados, máx. {PAGE_SIZE} por página)
          </span>
          <button
            className="btn btn-secondary btn-sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Siguiente
          </button>
        </div>
      )}
    </main>
  );
}
