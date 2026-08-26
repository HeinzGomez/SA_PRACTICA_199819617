export interface RegistrarUsuarioInput {
  nombre: string;
  apellido: string;
  correo: string;
  password: string;
}

export interface CredencialesInput {
  correo: string;
  password: string;
}

export interface CambiarPasswordInput {
  id_usuario: number;
  password_actual: string;
  password_nueva: string;
}

export const CORREO_INSTITUCIONAL_REGEX =
  /^[a-z0-9._%+-]+@(ingenieria)\.usac\.edu\.gt$/;
