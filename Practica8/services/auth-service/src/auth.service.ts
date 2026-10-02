// HeinzGomez - Práctica 7: lógica de negocio del Servicio de Autenticación (CDU 1.1, 1.2, 1.3)
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';

export type Rol = 'ESTUDIANTE' | 'ADMINISTRADOR';

export interface Usuario {
  id: string;
  nombre: string;
  carnet: string;
  correo: string;
  rol: Rol;
}

export interface UsuarioConHash extends Usuario {
  passwordHash: string;
}

export interface UsuarioRepository {
  buscarPorCorreo(correo: string): Promise<UsuarioConHash | null>;
  buscarPorId(id: string): Promise<UsuarioConHash | null>;
  crear(u: UsuarioConHash): Promise<void>;
}

export class AuthError extends Error {
  constructor(public readonly code: 'INVALID_ARGUMENT' | 'ALREADY_EXISTS' | 'UNAUTHENTICATED', message: string) {
    super(message);
  }
}

export interface AuthConfig {
  jwtSecret: string;
  jwtExpiresIn: string;
  dominiosPermitidos: string[];
  bcryptRounds: number;
}

export interface RegisterInput {
  nombre: string;
  carnet: string;
  correo: string;
  password: string;
}

const CORREO_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CARNET_RE = /^\d{9}$/;

export class AuthService {
  constructor(private readonly repo: UsuarioRepository, private readonly cfg: AuthConfig) {}

  validarRegistro(input: RegisterInput): string[] {
    const errores: string[] = [];
    if (!input.nombre || input.nombre.trim().length < 3) errores.push('El nombre debe tener al menos 3 caracteres');
    if (!CARNET_RE.test((input.carnet ?? '').trim())) errores.push('El carnet debe tener 9 dígitos');
    const correo = (input.correo ?? '').trim().toLowerCase();
    if (!CORREO_RE.test(correo)) {
      errores.push('Correo con formato inválido');
    } else if (!this.cfg.dominiosPermitidos.some((d) => correo.endsWith('@' + d))) {
      errores.push(`Debe usar su correo institucional (${this.cfg.dominiosPermitidos.join(', ')})`);
    }
    const p = input.password ?? '';
    if (p.length < 8 || !/[A-Z]/.test(p) || !/\d/.test(p)) {
      errores.push('La contraseña debe tener mínimo 8 caracteres, una mayúscula y un número');
    }
    return errores;
  }

  async register(input: RegisterInput): Promise<{ token: string; usuario: Usuario }> {
    const errores = this.validarRegistro(input);
    if (errores.length) throw new AuthError('INVALID_ARGUMENT', errores.join('; '));
    const correo = input.correo.trim().toLowerCase();
    if (await this.repo.buscarPorCorreo(correo)) {
      throw new AuthError('ALREADY_EXISTS', 'El correo ya está registrado');
    }
    const usuario: UsuarioConHash = {
      id: randomUUID(),
      nombre: input.nombre.trim(),
      carnet: input.carnet.trim(),
      correo,
      rol: 'ESTUDIANTE', // el rol ADMINISTRADOR solo se asigna por seed / base de datos
      passwordHash: await bcrypt.hash(input.password, this.cfg.bcryptRounds),
    };
    await this.repo.crear(usuario);
    return { token: this.firmar(usuario), usuario: publico(usuario) };
  }

  async login(correo: string, password: string): Promise<{ token: string; usuario: Usuario }> {
    const u = await this.repo.buscarPorCorreo((correo ?? '').trim().toLowerCase());
    // Mismo mensaje para usuario inexistente o contraseña errónea (no revela cuentas)
    if (!u || !(await bcrypt.compare(password ?? '', u.passwordHash))) {
      throw new AuthError('UNAUTHENTICATED', 'Credenciales incorrectas');
    }
    return { token: this.firmar(u), usuario: publico(u) };
  }

  async validateToken(token: string): Promise<{ valido: boolean; usuario?: Usuario }> {
    try {
      const payload = jwt.verify(token, this.cfg.jwtSecret) as jwt.JwtPayload;
      const u = await this.repo.buscarPorId(String(payload.sub));
      if (!u) return { valido: false };
      return { valido: true, usuario: publico(u) };
    } catch {
      return { valido: false };
    }
  }

  private firmar(u: Usuario): string {
    return jwt.sign({ rol: u.rol, correo: u.correo }, this.cfg.jwtSecret, {
      subject: u.id,
      expiresIn: this.cfg.jwtExpiresIn as jwt.SignOptions['expiresIn'],
      issuer: 'academix-auth',
    });
  }
}

export function publico(u: UsuarioConHash): Usuario {
  const { passwordHash: _omit, ...resto } = u;
  return resto;
}

export class InMemoryUsuarioRepository implements UsuarioRepository {
  private readonly datos = new Map<string, UsuarioConHash>();
  async buscarPorCorreo(correo: string) {
    return [...this.datos.values()].find((u) => u.correo === correo) ?? null;
  }
  async buscarPorId(id: string) {
    return this.datos.get(id) ?? null;
  }
  async crear(u: UsuarioConHash) {
    this.datos.set(u.id, u);
  }
}
