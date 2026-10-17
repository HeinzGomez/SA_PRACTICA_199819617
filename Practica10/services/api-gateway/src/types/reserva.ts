// HeinzGomez - Práctica 9: tickets de reserva que produce reservas-service (Go).
export type TipoReserva = 'ACREDITACION' | 'EXAMEN_CERTIFICACION';

export interface SolicitudReserva {
  usuario_id: string;
  evento_id: string;
  tipo: TipoReserva | string;
}

export interface Ticket {
  id: string;
  usuario_id: string;
  evento_id: string;
  estado: 'PENDIENTE' | 'CONFIRMADA' | 'RECHAZADA' | string;
  motivo: string;
  tipo: string;
  creado_en: string;
  actualizado_en: string;
  cupo_restante: number;
}
