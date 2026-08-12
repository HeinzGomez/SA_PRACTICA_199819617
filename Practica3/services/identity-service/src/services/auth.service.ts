import bcrypt from "bcryptjs";
import { UserRepository } from "../repositories/user.repository";
import { env } from "../config/env";

export function isInstitutionalEmail(email: string): boolean {
  const domain = email.split("@")[1]?.toLowerCase();
  return !!domain && env.allowedEmailDomains.includes(domain);
}

export const AuthService = {
  async register(params: {
    email: string;
    fullName: string;
    password: string;
    carnet: string;
    initialRole: string;
  }) {
    if (!isInstitutionalEmail(params.email)) {
      return { success: false, error: "Dominio de correo no institucional." };
    }
    const existing = await UserRepository.findByEmail(params.email);
    if (existing) {
      return { success: false, error: "El correo ya se encuentra registrado." };
    }
    const passwordHash = await bcrypt.hash(params.password, 10);
    const userId = await UserRepository.registerInstitutionalUser({
      email: params.email,
      fullName: params.fullName,
      passwordHash,
      carnet: params.carnet,
      initialRole: params.initialRole,
    });
    return { success: true, userId };
  },

  async validateCredentials(email: string, password: string) {
    if (!isInstitutionalEmail(email)) {
      return { valid: false, error: "Dominio de correo no institucional." };
    }
    const user = await UserRepository.findByEmail(email);
    if (!user) {
      return { valid: false, error: "Usuario no encontrado." };
    }
    const matches = await bcrypt.compare(password, user.password_hash);
    if (!matches) {
      return { valid: false, error: "Contrasena incorrecta." };
    }
    const roles = await UserRepository.getRoles(user.user_id);
    return { valid: true, userId: user.user_id, roles };
  },
};
