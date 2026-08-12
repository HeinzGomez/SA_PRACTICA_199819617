import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface Props {
  children: JSX.Element;
  requiredRoles?: string[];
}

/**
 * Protección de rutas en el cliente (RBAC): si no hay sesión, redirige a
 * /login; si hay sesión pero el rol no está autorizado, muestra un aviso
 * en vez del contenido. La validación real e infranqueable ocurre en el
 * API Gateway y en los Procedimientos Almacenados — esto solo evita que
 * un usuario sin permisos vea la interfaz administrativa.
 */
export default function ProtectedRoute({ children, requiredRoles }: Props) {
  const { user, loading, hasAnyRole } = useAuth();

  if (loading) {
    return <p className="loading-state">Verificando sesión...</p>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRoles && requiredRoles.length > 0 && !hasAnyRole(...requiredRoles)) {
    return (
      <main className="page page--narrow" style={{ textAlign: "center" }}>
        <div className="card">
          <h1>Acceso no autorizado</h1>
          <p className="text-muted" style={{ marginBottom: 0 }}>
            Tu rol actual no tiene permisos para ver esta sección. Se requiere uno de los
            siguientes roles: {requiredRoles.join(", ")}.
          </p>
        </div>
      </main>
    );
  }

  return children;
}
