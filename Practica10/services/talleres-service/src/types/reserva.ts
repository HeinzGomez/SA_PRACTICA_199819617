// HeinzGomez - Práctica 9: contrato de eventos de dominio publicados por el Servicio de Reservas.
// Exchange topic `academix.events`; el descuento atómico del cupo lo hace reservas-service
// en Redis (script Lua) y aquí solo se persiste el resultado en Postgres.
export const RK_RESERVA_CONFIRMADA = 'reserva.confirmada';

export type EstadoReserva = 'PENDIENTE' | 'CONFIRMADA' | 'RECHAZADA';

/** Payload JSON que viaja por RabbitMQ (camelCase: lo genera el Servicio de Reservas en Go). */
export interface MensajeReserva {
  ticketId: string;
  usuarioId: string;
  eventoId: string;
  tipo: string;
  estado: EstadoReserva;
  motivo?: string;
  cupoRestante: number;
  timestamp: string;
}
