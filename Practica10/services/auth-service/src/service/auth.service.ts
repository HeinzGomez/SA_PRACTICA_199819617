// HeinzGomez - Práctica 9: lógica de negocio del Servicio de Autenticación (CDU 1.1, 1.2, 1.3)
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { AuthError } from '../types/errores';
import {
  ConfiguracionAuth, RegistroInput, ResultadoValidacion, Sesion,
} from '../types/auth';
import { Usuario, UsuarioConHash } from '../types/usuario';
import { UsuarioRepository } from '../repository/usuario.repository';

const CORREO_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CARNET_RE = /^\d{9}$/;

export class AuthService {
  constructor(private readonly repo: UsuarioRepository, private readonly cfg: ConfiguracionAuth) {}

  validarRegistro(input: RegistroInput): string[] {
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

  async register(input: RegistroInput): Promise<Sesion> {
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

  async login(correo: string, password: string): Promise<Sesion> {
    const u = await this.repo.buscarPorCorreo((correo ?? '').trim().toLowerCase());
    // Mismo mensaje para usuario inexistente o contraseña errónea (no revela cuentas)
    if (!u || !(await bcrypt.compare(password ?? '', u.passwordHash))) {
      throw new AuthError('UNAUTHENTICATED', 'Credenciales incorrectas');
    }
    return { token: this.firmar(u), usuario: publico(u) };
  }

  async validateToken(token: string): Promise<ResultadoValidacion> {
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
