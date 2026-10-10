// HeinzGomez - Práctica 7: utilidades de formato para la UI
import type { EstadoTicket, TipoEvento } from './types';

const TZ = 'America/Guatemala';
const SIN_DATO = '—';

const valido = (iso: string) => typeof iso === 'string' && iso !== '' && !Number.isNaN(Date.parse(iso));

export function fechaLarga(iso: string): string {
  if (!valido(iso)) return SIN_DATO;
  return new Intl.DateTimeFormat('es-GT', { dateStyle: 'full', timeStyle: 'short', timeZone: TZ }).format(new Date(iso));
}

export function fechaCorta(iso: string): string {
  if (!valido(iso)) return SIN_DATO;
  return new Intl.DateTimeFormat('es-GT', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: TZ }).format(new Date(iso));
}

export function duracion(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return [h ? `${h} h` : '', m ? `${m} min` : ''].filter(Boolean).join(' ') || '0 min';
}

export const ETIQUETA_TIPO: Record<TipoEvento, string> = {
  TALLER: 'Taller', CONFERENCIA: 'Conferencia', LABORATORIO: 'Laboratorio', CERTIFICACION: 'Certificación',
};

export const ETIQUETA_MOTIVO: Record<string, string> = {
  SIN_CUPO: 'Ya no hay cupo disponible',
  RESERVA_DUPLICADA: 'Ya tienes una reserva confirmada en esta actividad',
  EVENTO_NO_EXISTE: 'La actividad ya no existe',
  ERROR_INTERNO: 'El sistema de colas no estaba disponible',
};

export const ETIQUETA_ESTADO: Record<EstadoTicket, string> = {
  PENDIENTE: 'En cola', CONFIRMADA: 'Confirmada', RECHAZADA: 'Rechazada',
};

export type NivelCupo = 'alto' | 'medio' | 'bajo' | 'agotado';

export function nivelCupo(disponible: number, total: number): NivelCupo {
  if (disponible <= 0) return 'agotado';
  const r = disponible / total;
  if (r <= 0.15) return 'bajo';
  if (r <= 0.5) return 'medio';
  return 'alto';
}

export function hashCorto(h: string): string {
  if (!h) return SIN_DATO;
  return h.length > 20 ? `${h.slice(0, 10)}…${h.slice(-8)}` : h;
}
