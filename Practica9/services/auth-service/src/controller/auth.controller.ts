// HeinzGomez - Práctica 9: controlador del Servicio de Autenticación.
// Es el adaptador de entrada: mapea las operaciones del bus a la lógica de negocio y
// traduce los errores de dominio al contrato de respuesta (antes: handlers gRPC).
import { AuthService } from '../service/auth.service';
import { AuthError, CodigoError } from '../types/errores';
import { Credenciales, RegistroInput, SolicitudValidacion } from '../types/auth';
import { Entrada, Manejadores, OPERACIONES, Respuesta, exitosa, fallida } from '../types/mensajes';

export class AuthController {
  constructor(private readonly servicio: AuthService) {}

  /** Contrato expuesto por el servicio: routing key -> handler. */
  manejadores(): Manejadores {
    return {
      [OPERACIONES.registro]: this.responder((cuerpo) => this.servicio.register(cuerpo as RegistroInput)),
      [OPERACIONES.login]: this.responder((cuerpo) => {
        const { correo, password } = (cuerpo ?? {}) as Credenciales;
        return this.servicio.login(correo, password);
      }),
      [OPERACIONES.validacion]: this.responder((cuerpo) =>
        this.servicio.validateToken((cuerpo as SolicitudValidacion | null)?.token ?? '')),
    };
  }

  private responder<T>(ejecutar: (cuerpo: unknown) => Promise<T>) {
    return async (entrada: Entrada): Promise<void> => {
      const respuesta = await this.ejecutar(ejecutar, entrada.cuerpo);
      if (entrada.replyTo) await entrada.responder(respuesta);
    };
  }

  /** Los errores de negocio se responden como error; solo falla (NACK) lo inesperado. */
  private async ejecutar<T>(fn: (cuerpo: unknown) => Promise<T>, cuerpo: unknown): Promise<Respuesta<T>> {
    try {
      return exitosa(await fn(cuerpo ?? {}));
    } catch (e) {
      const [codigo, mensaje] = this.mapear(e);
      return fallida(codigo, mensaje);
    }
  }

  private mapear(e: unknown): [CodigoError, string] {
    if (e instanceof AuthError) return [e.code, e.message];
    console.error('[auth] error inesperado:', e);
    return ['INTERNAL', 'Error interno'];
  }
}
