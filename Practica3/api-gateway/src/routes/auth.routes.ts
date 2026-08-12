import { Router } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { identityClient, grpcCall } from "../grpc/clients";
import { isInstitutionalEmail, requireAuth } from "../middleware/auth.middleware";

export const authRouter = Router();

/** POST /auth/register — registro restringido al dominio institucional */
authRouter.post("/register", async (req, res, next) => {
  try {
    const { institutionalEmail, fullName, password, carnet } = req.body;

    if (!isInstitutionalEmail(institutionalEmail)) {
      return res.status(400).json({
        error: `El correo debe pertenecer a un dominio institucional permitido: ${env.allowedEmailDomains.join(", ")}`,
      });
    }

    const response = await grpcCall(identityClient, "RegisterInstitutionalUser", {
      institutionalEmail,
      fullName,
      password,
      carnet,
      initialRole: "ROLE_ESTUDIANTE",
    });

    res.status(201).json(response);
  } catch (err) {
    next(err);
  }
});

/** POST /auth/login — valida credenciales y emite JWT + Session Cookie */
authRouter.post("/login", async (req, res, next) => {
  try {
    const { institutionalEmail, password } = req.body;

    if (!isInstitutionalEmail(institutionalEmail)) {
      return res.status(400).json({
        error: `Acceso restringido a correos institucionales: ${env.allowedEmailDomains.join(", ")}`,
      });
    }

    const result: any = await grpcCall(identityClient, "ValidateCredentials", {
      institutionalEmail,
      password,
    });

    if (!result.valid) {
      return res.status(401).json({ error: result.errorMessage ?? "Credenciales invalidas." });
    }

    const token = jwt.sign(
      { userId: result.userId, email: institutionalEmail, roles: result.roles },
      env.jwtSecret,
      { expiresIn: env.jwtExpiresIn }
    );

    res.cookie(env.sessionCookieName, token, {
      httpOnly: env.sessionCookieHttpOnly,
      secure: env.sessionCookieSecure,
      sameSite: "lax",
      maxAge: 8 * 60 * 60 * 1000,
    });

    res.json({ userId: result.userId, roles: result.roles, token });
  } catch (err) {
    next(err);
  }
});

/** POST /auth/logout — limpia la Session Cookie */
authRouter.post("/logout", (req, res) => {
  res.clearCookie(env.sessionCookieName);
  res.status(204).send();
});

/** GET /auth/me — perfil del usuario autenticado */
authRouter.get("/me", requireAuth, async (req, res, next) => {
  try {
    const profile = await grpcCall(identityClient, "GetUserProfile", { userId: req.user!.userId });
    res.json(profile);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /auth/oauth/callback — flujo de autorizacion delegada OAuth 2.0
 * institucional. La validacion final del token/perfil se delega en
 * identity-service via gRPC.
 */
authRouter.get("/oauth/callback", async (req, res, next) => {
  try {
    const { code } = req.query;
    if (!code) return res.status(400).json({ error: "Falta el parametro 'code' de OAuth." });

    // TODO: intercambiar 'code' por tokens con el proveedor OAuth institucional
    // y delegar la validacion/creacion de sesion en identity-service.
    res.status(501).json({ error: "OAuth institucional pendiente de configuracion (.env)." });
  } catch (err) {
    next(err);
  }
});
