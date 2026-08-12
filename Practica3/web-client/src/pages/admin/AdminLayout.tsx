import { NavLink, Outlet } from "react-router-dom";

const tabs = [
  { to: "schools", label: "Escuelas / Áreas" },
  { to: "semesters", label: "Semestres" },
  { to: "courses", label: "Cursos" },
  { to: "professors", label: "Docentes" },
  { to: "csv", label: "Carga masiva CSV" },
];

/** Layout del Panel Web de Administración (RBAC): navegación por pestañas
 * entre los 4 catálogos administrables + carga masiva CSV. */
export default function AdminLayout() {
  return (
    <main className="page">
      <div className="page-header">
        <h1>Panel de Administración</h1>
        <p className="page-subtitle">
          Gestión de Semestres, Escuelas/Áreas, Cursos y Docentes. Visible solo para roles
          Administrador, Catedrático o Auxiliar.
        </p>
      </div>

      <nav className="tabs">
        {tabs.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            className={({ isActive }) => "tab-link" + (isActive ? " tab-link--active" : "")}
          >
            {t.label}
          </NavLink>
        ))}
      </nav>

      <Outlet />
    </main>
  );
}
