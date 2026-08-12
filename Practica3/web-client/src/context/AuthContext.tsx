import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { apiClient } from "../api/client";

export interface AuthUser {
  userId: string;
  fullName: string;
  institutionalEmail: string;
  carnet: string;
  roles: string[];
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  hasAnyRole: (...roles: string[]) => boolean;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  hasAnyRole: () => false,
  refresh: async () => {},
});

/**
 * Provee el usuario autenticado (via /auth/me, respaldado por la Session
 * Cookie HttpOnly) a toda la aplicación. Se usa tanto para mostrar/ocultar
 * el enlace "Administración" en la navegación como para proteger las
 * rutas del Panel Web Administrativo (RBAC) en el propio cliente — la
 * autoridad real sigue siendo el API Gateway/identity-service, esto es
 * solo UX (evita parpadeos de contenido no autorizado).
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    setLoading(true);
    try {
      const res = await apiClient.get("/auth/me");
      setUser(res.data);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  function hasAnyRole(...roles: string[]) {
    return !!user && user.roles.some((r) => roles.includes(r));
  }

  return (
    <AuthContext.Provider value={{ user, loading, hasAnyRole, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
