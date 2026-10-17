// HeinzGomez - Práctica 10: consumidor de eventos de dominio del Servicio de Reservas.
// `reserva.confirmada` trae el cupo restante YA descontado atómicamente en Redis;
// aquí se persiste en Postgres para que la lectura degrade bien si Redis cae.
import type { Telemetria } from '../observabilidad/metricas';
import { TalleresService } from '../service/talleres.service';
import { Manejadores } from '../types/mensajes';
import { MensajeReserva, RK_RESERVA_CONFIRMADA } from '../types/reserva';

export class EventosController {
  constructor(
    private readonly servicio: TalleresService,
    /** Opcional (DIP): en pruebas se inyecta un doble o se omite. */
    private readonly telemetria?: Telemetria,
  ) {}

  /** Routing keys de eventos -> handler. Un error lanza NACK y el mensaje va a la DLQ. */
  manejadores(): Manejadores {
    return {
      [RK_RESERVA_CONFIRMADA]: async (entrada) => {
        const mensaje = (entrada.cuerpo ?? {}) as Partial<MensajeReserva>;
        const cupo = Number(mensaje.cupoRestante);
        if (!mensaje.eventoId || Number.isNaN(cupo)) {
          this.telemetria?.cupoSincronizado('invalido');
          throw new Error(`reserva.confirmada inválido: ${JSON.stringify(entrada.cuerpo)}`);
        }
        await this.servicio.sincronizarCupo(mensaje.eventoId, cupo);
        this.telemetria?.cupoSincronizado('sincronizado');
      },
    };
  }
}
