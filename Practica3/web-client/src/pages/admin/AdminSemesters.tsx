import { useEffect, useState } from "react";
import { apiClient } from "../../api/client";

interface Semester {
  semesterId: string;
  code: string;
  label: string;
  startsOn: string;
  endsOn: string;
  isActive: boolean;
}

/** CRUD de Semestres — invoca sp_upsert_semester / sp_delete_semester
 * (identity-service) a través de /admin/semesters. */
export default function AdminSemesters() {
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [form, setForm] = useState({ code: "", label: "", startsOn: "", endsOn: "" });
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const res = await apiClient.get("/admin/semesters");
    setSemesters(res.data?.semesters ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await apiClient.post("/admin/semesters", form);
      setForm({ code: "", label: "", startsOn: "", endsOn: "" });
      await load();
    } catch (err: any) {
      setError(err?.response?.data?.error ?? "Error al crear el semestre.");
    }
  }

  async function handleDelete(semesterId: string) {
    if (!confirm("¿Eliminar este semestre?")) return;
    await apiClient.delete(`/admin/semesters/${semesterId}`);
    await load();
  }

  return (
    <section className="card">
      <h2>Semestres</h2>

      <form onSubmit={handleCreate} className="form-inline">
        <input
          className="input"
          placeholder="Código (ej. 2026-S2)"
          value={form.code}
          onChange={(e) => setForm({ ...form, code: e.target.value })}
          required
          style={{ maxWidth: 160 }}
        />
        <input
          className="input"
          placeholder="Etiqueta (ej. Segundo Semestre 2026)"
          value={form.label}
          onChange={(e) => setForm({ ...form, label: e.target.value })}
          required
          style={{ flex: 1, minWidth: 220 }}
        />
        <input
          className="input"
          type="date"
          value={form.startsOn}
          onChange={(e) => setForm({ ...form, startsOn: e.target.value })}
          style={{ maxWidth: 160 }}
        />
        <input
          className="input"
          type="date"
          value={form.endsOn}
          onChange={(e) => setForm({ ...form, endsOn: e.target.value })}
          style={{ maxWidth: 160 }}
        />
        <button type="submit" className="btn btn-primary">
          Agregar
        </button>
      </form>

      {error && <p className="alert alert-error">{error}</p>}

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Código</th>
              <th>Etiqueta</th>
              <th>Inicio</th>
              <th>Fin</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {semesters.map((s) => (
              <tr key={s.semesterId}>
                <td>{s.code}</td>
                <td>{s.label}</td>
                <td>{s.startsOn}</td>
                <td>{s.endsOn}</td>
                <td>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(s.semesterId)}>
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
            {semesters.length === 0 && (
              <tr>
                <td colSpan={5} className="table-empty">
                  No hay semestres registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
