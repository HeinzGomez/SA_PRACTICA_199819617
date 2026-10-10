// HeinzGomez - Práctica 9: consumidor de eventos de dominio del Servicio de Reservas.
// `reserva.confirmada` trae el cupo restante YA descontado atómicamente en Redis;
// aquí se persiste en Postgres para que la lectura degrade bien si Redis cae.
import { TalleresService } from '../service/talleres.service';
import { Manejadores } from '../types/mensajes';
import { MensajeReserva, RK_RESERVA_CONFIRMADA } from '../types/reserva';

export class EventosController {
  constructor(private readonly servicio: TalleresService) {}

  /** Routing keys de eventos -> handler. Un error lanza NACK y el mensaje va a la DLQ. */
  manejadores(): Manejadores {
    return {
      [RK_RESERVA_CONFIRMADA]: async (entrada) => {
        const mensaje = (entrada.cuerpo ?? {}) as Partial<MensajeReserva>;
        const cupo = Number(mensaje.cupoRestante);
        if (!mensaje.eventoId || Number.isNaN(cupo)) {
          throw new Error(`reserva.confirmada inválido: ${JSON.stringify(entrada.cuerpo)}`);
        }
        await this.servicio.sincronizarCupo(mensaje.eventoId, cupo);
      },
    };
  }
}
