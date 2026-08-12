import { useEffect, useState } from "react";
import { apiClient } from "../../api/client";

interface Professor {
  userId: string;
  fullName: string;
  institutionalEmail: string;
  isActive: boolean;
  role: string;
}

/** CRUD de Docentes (Catedrático/Auxiliar) — reutiliza sp_register_user
 * para el alta y sp_set_professor_active para activar/desactivar. */
export default function AdminProfessors() {
  const [professors, setProfessors] = useState<Professor[]>([]);
  const [form, setForm] = useState({
    institutionalEmail: "",
    fullName: "",
    password: "",
    carnet: "",
    role: "ROLE_CATEDRATICO",
  });
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const res = await apiClient.get("/admin/professors");
    setProfessors(res.data?.professors ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await apiClient.post("/admin/professors", form);
      setForm({ institutionalEmail: "", fullName: "", password: "", carnet: "", role: "ROLE_CATEDRATICO" });
      await load();
    } catch (err: any) {
      setError(err?.response?.data?.error ?? "Error al crear el docente.");
    }
  }

  async function toggleActive(p: Professor) {
    await apiClient.patch(`/admin/professors/${p.userId}/active`, { isActive: !p.isActive });
    await load();
  }

  return (
    <section className="card">
      <h2>Docentes</h2>

      <form onSubmit={handleCreate} className="form-inline">
        <input
          className="input"
          placeholder="Correo institucional"
          type="email"
          value={form.institutionalEmail}
          onChange={(e) => setForm({ ...form, institutionalEmail: e.target.value })}
          required
          style={{ minWidth: 220 }}
        />
        <input
          className="input"
          placeholder="Nombre completo"
          value={form.fullName}
          onChange={(e) => setForm({ ...form, fullName: e.target.value })}
          required
          style={{ minWidth: 180 }}
        />
        <input
          className="input"
          placeholder="Contraseña temporal"
          type="password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
          style={{ maxWidth: 180 }}
        />
        <input
          className="input"
          placeholder="Carné"
          value={form.carnet}
          onChange={(e) => setForm({ ...form, carnet: e.target.value })}
          style={{ maxWidth: 140 }}
        />
        <select
          className="select"
          value={form.role}
          onChange={(e) => setForm({ ...form, role: e.target.value })}
          style={{ maxWidth: 160 }}
        >
          <option value="ROLE_CATEDRATICO">Catedrático</option>
          <option value="ROLE_AUXILIAR">Auxiliar</option>
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
              <th>Nombre</th>
              <th>Correo</th>
              <th>Rol</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {professors.map((p) => (
              <tr key={p.userId}>
                <td>{p.fullName}</td>
                <td>{p.institutionalEmail}</td>
                <td>{p.role === "ROLE_AUXILIAR" ? "Auxiliar" : "Catedrático"}</td>
                <td>
                  {p.isActive ? (
                    <span className="badge badge-success">Activo</span>
                  ) : (
                    <span className="badge badge-muted">Inactivo</span>
                  )}
                </td>
                <td>
                  <button className="btn btn-secondary btn-sm" onClick={() => toggleActive(p)}>
                    {p.isActive ? "Desactivar" : "Activar"}
                  </button>
                </td>
              </tr>
            ))}
            {professors.length === 0 && (
              <tr>
                <td colSpan={5} className="table-empty">
                  No hay docentes registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
