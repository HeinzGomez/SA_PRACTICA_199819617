// HeinzGomez - Práctica 9: reglas de validación y filtrado de eventos (pura, sin I/O)
import { Evento, FiltroEventos, TIPOS, TipoEvento } from './evento';

export function validarEvento(e: Partial<Evento>): string[] {
  const errores: string[] = [];
  if (!e.titulo || e.titulo.trim().length < 5) errores.push('El título debe tener al menos 5 caracteres');
  if (!e.tipo || !TIPOS.includes(e.tipo as TipoEvento)) errores.push(`Tipo inválido (${TIPOS.join('|')})`);
  if (!e.curso_codigo) errores.push('Debe vincularse a un curso de YOUSAC');
  if (!e.fecha_inicio || Number.isNaN(Date.parse(e.fecha_inicio))) errores.push('Fecha de inicio inválida');
  if (!Number.isInteger(e.cupo_total) || (e.cupo_total ?? 0) < 1 || (e.cupo_total ?? 0) > 5000) {
    errores.push('El cupo total debe ser un entero entre 1 y 5000');
  }
  if (!Number.isInteger(e.duracion_min) || (e.duracion_min ?? 0) < 15) errores.push('Duración mínima de 15 minutos');
  if (!e.ponente?.nombre) errores.push('Debe indicar el ponente');
  return errores;
}

export function coincideFiltro(e: Evento, f: FiltroEventos): boolean {
  if (f.curso_codigo && e.curso_codigo !== f.curso_codigo) return false;
  if (f.tipo && e.tipo !== f.tipo) return false;
  const t = Date.parse(e.fecha_inicio);
  if (f.fecha_desde && t < Date.parse(f.fecha_desde)) return false;
  // fecha_hasta es inclusiva: se toma hasta el final del día
  if (f.fecha_hasta && t > Date.parse(f.fecha_hasta) + (f.fecha_hasta.length <= 10 ? 86_399_999 : 0)) return false;
  return true;
}
