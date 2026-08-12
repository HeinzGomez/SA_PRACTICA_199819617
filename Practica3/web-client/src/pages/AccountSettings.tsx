import { useEffect, useState } from "react";
import { apiClient } from "../api/client";

interface Profile {
  fullName: string;
  institutionalEmail: string;
  carnet: string;
  roles: string[];
}

const ROLE_LABELS: Record<string, string> = {
  ROLE_ESTUDIANTE: "Estudiante",
  ROLE_CATEDRATICO: "Catedrático",
  ROLE_AUXILIAR: "Auxiliar",
  ROLE_ADMIN: "Administrador",
};

/** Pantalla 6/6: Configuración de Cuenta — perfil y roles del usuario. */
export default function AccountSettings() {
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    apiClient.get("/auth/me").then((res) => setProfile(res.data));
  }, []);

  if (!profile) return <p className="loading-state">Cargando...</p>;

  return (
    <main className="page page--narrow">
      <div className="page-header">
        <h1>Configuración de cuenta</h1>
      </div>

      <div className="card">
        <div className="detail-row">
          <span className="detail-row__label">Nombre</span>
          <span>{profile.fullName}</span>
        </div>
        <div className="detail-row">
          <span className="detail-row__label">Correo institucional</span>
          <span>{profile.institutionalEmail}</span>
        </div>
        <div className="detail-row">
          <span className="detail-row__label">Carné</span>
          <span>{profile.carnet}</span>
        </div>
        <div className="detail-row">
          <span className="detail-row__label">Roles</span>
          <span>
            {profile.roles?.map((r) => (
              <span key={r} className="badge" style={{ marginRight: 6 }}>
                {ROLE_LABELS[r] ?? r}
              </span>
            ))}
          </span>
        </div>
      </div>

      <button
        className="btn btn-danger"
        style={{ marginTop: 16 }}
        onClick={async () => {
          await apiClient.post("/auth/logout");
          window.location.href = "/login";
        }}
      >
        Cerrar sesión
      </button>
    </main>
  );
}
