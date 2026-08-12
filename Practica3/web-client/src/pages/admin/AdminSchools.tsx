import { useEffect, useState } from "react";
import { apiClient } from "../../api/client";

interface School {
  schoolId: string;
  name: string;
  isActive: boolean;
}

/** CRUD de Escuelas/Áreas — invoca sp_upsert_school / sp_delete_school
 * (identity-service) a través de /admin/schools. */
export default function AdminSchools() {
  const [schools, setSchools] = useState<School[]>([]);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const res = await apiClient.get("/admin/schools");
    setSchools(res.data?.schools ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await apiClient.post("/admin/schools", { name });
      setName("");
      await load();
    } catch (err: any) {
      setError(err?.response?.data?.error ?? "Error al crear la escuela.");
    }
  }

  async function handleDelete(schoolId: string) {
    if (!confirm("¿Eliminar esta escuela?")) return;
    await apiClient.delete(`/admin/schools/${schoolId}`);
    await load();
  }

  return (
    <section className="card">
      <h2>Escuelas / Áreas</h2>

      <form onSubmit={handleCreate} className="form-inline">
        <input
          className="input"
          placeholder="Nombre de la escuela/área"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          style={{ flex: 1, minWidth: 240 }}
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
              <th>Nombre</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {schools.map((s) => (
              <tr key={s.schoolId}>
                <td>{s.name}</td>
                <td>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(s.schoolId)}>
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
            {schools.length === 0 && (
              <tr>
                <td colSpan={2} className="table-empty">
                  No hay escuelas registradas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
