import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "../api/client";

const ALLOWED_DOMAINS = ["ingenieria.usac.edu.gt", "ing.usac.edu.gt"];

function isInstitutionalEmail(email: string): boolean {
  const domain = email.split("@")[1]?.toLowerCase();
  return !!domain && ALLOWED_DOMAINS.includes(domain);
}

/** Pantalla 1/6: Login Institucional con validacion de dominio. */
export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!isInstitutionalEmail(email)) {
      setError(`Solo se permite el acceso con correo institucional (${ALLOWED_DOMAINS.join(", ")}).`);
      return;
    }

    try {
      await apiClient.post("/auth/login", { institutionalEmail: email, password });
      navigate("/catalogo");
    } catch (err: any) {
      setError(err?.response?.data?.error ?? "Error al iniciar sesion.");
    }
  }

  return (
    <div className="login-shell">
      <div className="login-card">
        <div className="login-card__logo">Y</div>
        <h1>YoUSAC</h1>
        <p className="text-muted">Ingresa con tu correo institucional de la Facultad de Ingeniería.</p>

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="email">Correo institucional</label>
            <input
              id="email"
              className="input"
              type="email"
              placeholder="usuario@ingenieria.usac.edu.gt"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <p className="alert alert-error">{error}</p>}

          <div className="login-card__actions">
            <button type="submit" className="btn btn-primary btn-block">
              Ingresar
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-block"
              onClick={() => (window.location.href = "/api/auth/oauth/callback")}
            >
              Ingresar con OAuth institucional
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
