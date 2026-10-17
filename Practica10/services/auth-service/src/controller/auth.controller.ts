// HeinzGomez - Práctica 10: controlador del Servicio de Autenticación.
// Es el adaptador de entrada: mapea las operaciones del bus a la lógica de negocio y
// traduce los errores de dominio al contrato de respuesta (antes: handlers gRPC).
// La telemetría de negocio (registros y logins) llega por inyección: el controlador no conoce Prometheus (DIP).
import type { Logger } from 'pino';
import type { Telemetria } from '../observabilidad/metricas';
import { loggerPorDefecto } from '../observabilidad/logger';
import { AuthService } from '../service/auth.service';
import { AuthError, CodigoError } from '../types/errores';
import { Credenciales, RegistroInput, SolicitudValidacion } from '../types/auth';
import { Entrada, Manejadores, OPERACIONES, Respuesta, exitosa, fallida } from '../types/mensajes';

export class AuthController {
  constructor(
    private readonly servicio: AuthService,
    private readonly telemetria?: Telemetria,
    private readonly log: Logger = loggerPorDefecto(),
  ) {}

  /** Contrato expuesto por el servicio: routing key -> handler. */
  manejadores(): Manejadores {
    return {
      [OPERACIONES.registro]: this.responder(
        OPERACIONES.registro,
        (cuerpo) => this.servicio.register(cuerpo as RegistroInput),
      ),
      [OPERACIONES.login]: this.responder(OPERACIONES.login, (cuerpo) => {
        const { correo, password } = (cuerpo ?? {}) as Credenciales;
        return this.servicio.login(correo, password);
      }),
      [OPERACIONES.validacion]: this.responder(
        OPERACIONES.validacion,
        (cuerpo) => this.servicio.validateToken((cuerpo as SolicitudValidacion | null)?.token ?? ''),
      ),
    };
  }

  private responder<T>(operacion: string, ejecutar: (cuerpo: unknown) => Promise<T>) {
    return async (entrada: Entrada): Promise<void> => {
      const respuesta = await this.ejecutar(operacion, ejecutar, entrada.cuerpo);
      if (entrada.replyTo) await entrada.responder(respuesta);
    };
  }

  /** Los errores de negocio se responden como error; solo falla (NACK) lo inesperado. */
  private async ejecutar<T>(
    operacion: string,
    fn: (cuerpo: unknown) => Promise<T>,
    cuerpo: unknown,
  ): Promise<Respuesta<T>> {
    try {
      const datos = await fn(cuerpo ?? {});
      this.contarExito(operacion);
      return exitosa(datos);
    } catch (e) {
      this.contarFallo(operacion);
      const [codigo, mensaje] = this.mapear(e);
      return fallida(codigo, mensaje);
    }
  }

  private contarExito(operacion: string): void {
    if (operacion === OPERACIONES.registro) this.telemetria?.registro();
    if (operacion === OPERACIONES.login) this.telemetria?.login('exitoso');
  }

  /** Solo el login cuenta el fallo: un registro inválido nunca llegó a registrar. */
  private contarFallo(operacion: string): void {
    if (operacion === OPERACIONES.login) this.telemetria?.login('fallido');
  }

  private mapear(e: unknown): [CodigoError, string] {
    if (e instanceof AuthError) return [e.code, e.message];
    this.log.error(e as Error, '[auth] error inesperado');
    return ['INTERNAL', 'Error interno'];
  }
}
