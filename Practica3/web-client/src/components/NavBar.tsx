import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ADMIN_ROLES = ["ROLE_ADMIN", "ROLE_CATEDRATICO", "ROLE_AUXILIAR"];

const NAV_LINKS = [
  { to: "/catalogo", label: "Catálogo" },
  { to: "/mis-cursos", label: "Mis cursos" },
];

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
}

/** Barra de navegación superior. El enlace "Administración" solo se
 * muestra a usuarios con rol Admin/Catedrático/Auxiliar (RBAC). */
export default function NavBar() {
  const { user, hasAnyRole } = useAuth();
  const location = useLocation();

  if (!user || location.pathname === "/login") return null;

  const links = hasAnyRole(...ADMIN_ROLES)
    ? [...NAV_LINKS, { to: "/admin", label: "Administración" }]
    : NAV_LINKS;

  return (
    <nav className="navbar">
      <span className="navbar__brand">
        <span className="navbar__brand-dot" />
        YoUSAC
      </span>

      <div className="navbar__links">
        {links.map((l) => (
          <Link
            key={l.to}
            to={l.to}
            className={
              "navbar__link" +
              (location.pathname.startsWith(l.to) ? " navbar__link--active" : "")
            }
          >
            {l.label}
          </Link>
        ))}
      </div>

      <span className="navbar__spacer" />

      <Link to="/cuenta" className="navbar__user">
        <span className="navbar__avatar">{initials(user.fullName)}</span>
        {user.fullName}
      </Link>
    </nav>
  );
}
