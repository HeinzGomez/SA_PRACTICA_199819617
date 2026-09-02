import { Router, Request, Response } from "express";
import { AuthClient } from "../grpc/auth.client";
import { AuthMiddleware } from "../middleware/auth.middleware";
import { RoleMiddleware } from "../middleware/role.middleware";
import { BaseRoutes } from "./base.routes";
import { servicesConfig } from "../config/services";
import { OAuthOnboardingService } from "../services/oauth-onboarding.service";

export class AuthRoutes extends BaseRoutes {
  public readonly router: Router;

  constructor(
    private authClient: AuthClient,
    authMiddleware: AuthMiddleware,
    private onboardingService?: OAuthOnboardingService,
    roleMiddleware?: RoleMiddleware
  ) {
    super(authMiddleware, roleMiddleware);
    this.router = Router();
    this.router.post("/registrar", this.registrar.bind(this));
    this.router.post("/login", this.login.bind(this));
    this.router.post("/logout", this.validar, this.logout.bind(this));

    this.router.post("/password", this.validar, this.cambiarPassword.bind(this));
    this.router.get("/validar", this.validar, this.validarSesion.bind(this));
    this.router.get("/audit", this.validar, this.requerirRol("Administrador") , this.consultarAudit.bind(this));
    this.router.get("/usuarios", this.validar, this.requerirRol("Administrador"), this.consultarUsuarios.bind(this));
    this.router.get("/usuario/:id", this.validar, this.consultarUsuario.bind(this));
    this.router.get("/google", this.iniciarOAuthGoogle.bind(this));
    this.router.get("/google/callback", this.autenticarConGoogle.bind(this));
  }

  async registrar(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.authClient.registrarUsuario({
        nombre: req.body.nombre,
        apellido: req.body.apellido,
        correo: req.body.correo,
        password: req.body.password,
      });
      res.status(201).json(result);
    } catch (error) {
      this.handleError(error, res, "autenticación");
    }
  }

  async login(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.authClient.crearSesion({
        correo: req.body.correo,
        password: req.body.password,
      });

      if (!result.exito || !result.access_token) {
        res.status(401).json({
          exito: false,
          mensaje: result.mensaje || "Credenciales inválidas",
        });
        return;
      }

      res.cookie("access_token", result.access_token, {
        httpOnly: true,
        secure: servicesConfig.frontend.produccion === "production",
        sameSite: servicesConfig.frontend.produccion === "production" ? "none" : "lax",
        maxAge: 60 * 60 * 1000,
        path: "/",
      });

      res.status(200).json(result);
    } catch (error) {
      this.handleError(error, res, "autenticación");
    }
  }

  async logout(req: Request, res: Response): Promise<void> {
    try {
      const idSesion = req.sesion?.id_sesion;
      if (!idSesion) {
        this.eliminarCookies(res);
        res.status(401).json({ exito: false, mensaje: "No hay una sesión activa" });
        return;
      }
      const result = await this.authClient.cerrarSesion({ id_sesion: idSesion });

      this.eliminarCookies(res);
      res.status(200).json(result);
    } catch (error) {
      this.handleError(error, res, "autenticación");
    }
  }

  async validarSesion(req: Request, res: Response): Promise<void> {
    res.status(200).json({
      exito: true,
      mensaje: "Sesión válida",
      sesion: req.sesion,
      usuario: req.usuario,
    });
  }

  async cambiarPassword(req: Request, res: Response): Promise<void> {
    try {
      const idUsuario = req.usuario?.id_usuario;
      if (!idUsuario) {
        res.status(401).json({ exito: false, mensaje: "No hay una sesión válida" });
        return;
      }
      const result = await this.authClient.cambiarPassword({
        id_usuario: idUsuario,
        password_actual: req.body.password_actual,
        password_nueva: req.body.password_nueva,
      });
      res.status(200).json(result);
    } catch (error) {
      this.handleError(error, res, "autenticación");
    }
  }

  async consultarAudit(req: Request, res: Response): Promise<void> {
    try {
      const pagina = Number(req.query.pagina ?? 1);
      const usuarioFiltro = Number(req.query.usuario_filtro ?? 0);
      const tablaFiltro = String(req.query.tabla_filtro ?? "");

      const result = await this.authClient.consultarAuditLogs({
        pagina,
        usuario_filtro: usuarioFiltro,
        tabla_filtro: tablaFiltro,
      });
      res.status(200).json(result);
    } catch (error) {
      this.handleError(error, res, "autenticación");
    }
  }

  async consultarUsuario(req: Request, res: Response): Promise<void> {
    try {
      const idUsuario = Number(req.params.id);
      const result = await this.authClient.consultarUsuario({ id_usuario: idUsuario });
      res.status(200).json(result);
    } catch (error) {
      this.handleError(error, res, "autenticación");
    }

  }

  async consultarUsuarios(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.authClient.consultarUsuarios({});
      res.status(200).json(result);
    } catch (error) {
      this.handleError(error, res, "autenticación");
    }
  }

  private eliminarCookies(res: Response): void {
    res.clearCookie("access_token", {
      httpOnly: true,
      secure: servicesConfig.frontend.produccion === "production",
      sameSite: servicesConfig.frontend.produccion === "production" ? "none" : "lax",
      path: "/",
    });

    res.clearCookie("refresh_token", {
      httpOnly: true,
      secure: servicesConfig.frontend.produccion === "production",
      sameSite: servicesConfig.frontend.produccion === "production" ? "none" : "lax",
      path: "/auth",
    });
  }

  async iniciarOAuthGoogle(req: Request, res: Response): Promise<void> {
    try {
      const state = req.query.state
        ? String(req.query.state)
        : "";

      const result = await this.authClient.iniciarOAuthGoogle({
        state,
      });

      if (!result.exito || !result.authorization_url) {
        res.status(400).json({
          exito: false,
          mensaje: result.mensaje || "No se pudo iniciar la autenticación con Google",
        });
        return;
      }

      res.redirect(result.authorization_url);
    } catch (error) {
      this.handleError(error, res, "autenticación");
    }
  }

  async autenticarConGoogle(req: Request,res: Response): Promise<void> {
    try {
      const code = String(req.query.code ?? "");
      const state = String(req.query.state ?? "");

      if (!code || !state) {
        res.status(400).json({
          exito: false,
          mensaje: "Google no proporcionó los parámetros requeridos",
        });
        return;
      }

      const result = await this.authClient.autenticarConGoogle({
        code,
        state,
      });

      if (!result.exito || !result.access_token) {
        res.status(401).json({
          exito: false,
          mensaje: result.mensaje || "No se pudo autenticar con Google",
        });
        return;
      }

      if (this.onboardingService && result.usuario) {
        try {
          await this.onboardingService.asegurarEstudiante(result.usuario);
        } catch (error) {
          console.error(`[Auth][Google] Error en onboarding de estudiante:`, error);
        }
      }

        // Debug: log tokens (masked) and cookie options to help diagnose
        // why the browser might not preserve the session after redirect.
        const maskedAccess = result.access_token ? `${result.access_token.slice(0,8)}...` : null;
        const maskedRefresh = result.refresh_token ? `${result.refresh_token.slice(0,8)}...` : null;
        console.log(`[Auth][Google] result exito=${result.exito} access=${maskedAccess} refresh=${maskedRefresh}`);

      res.cookie("access_token", result.access_token, {
        httpOnly: true,
        secure: servicesConfig.frontend.produccion === "production",
        sameSite: servicesConfig.frontend.produccion === "production" ? "none" : "lax",
        maxAge: 60 * 60 * 1000,
        path: "/",
      });

      if (result.refresh_token) {
        res.cookie("refresh_token", result.refresh_token, {
          httpOnly: true,
          secure: servicesConfig.frontend.produccion === "production",
          sameSite: servicesConfig.frontend.produccion === "production" ? "none" : "lax",
          maxAge: 7 * 24 * 60 * 60 * 1000,
          path: "/",
        });
      }

      const redirectTo = servicesConfig.frontend.httpurl || "/";
      res.redirect(302, redirectTo);
    } catch (error) {
      this.handleError(error, res, "autenticación");
    }
  }
}
