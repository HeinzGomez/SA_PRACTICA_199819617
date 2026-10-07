// HeinzGomez - Práctica 7: validaciones compartidas (mismas reglas que auth-service y talleres-service)
import type { Evento, RegistroInput } from './types';

export const DOMINIOS_INSTITUCIONALES = ['ingenieria.usac.edu.gt', 'usac.edu.gt'];

export function validarRegistro(i: RegistroInput): string[] {
  const e: string[] = [];
  if (!i.nombre || i.nombre.trim().length < 3) e.push('El nombre debe tener al menos 3 caracteres');
  if (!/^\d{9}$/.test((i.carnet ?? '').trim())) e.push('El carnet debe tener 9 dígitos');
  const correo = (i.correo ?? '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) e.push('Correo con formato inválido');
  else if (!DOMINIOS_INSTITUCIONALES.some((d) => correo.endsWith('@' + d))) {
    e.push(`Debe usar su correo institucional (${DOMINIOS_INSTITUCIONALES.join(', ')})`);
  }
  const p = i.password ?? '';
  if (p.length < 8 || !/[A-Z]/.test(p) || !/\d/.test(p)) e.push('La contraseña debe tener mínimo 8 caracteres, una mayúscula y un número');
  return e;
}

export const TIPOS_EVENTO = ['TALLER', 'CONFERENCIA', 'LABORATORIO', 'CERTIFICACION'] as const;

export function validarEvento(e: Partial<Evento>): string[] {
  const errores: string[] = [];
  if (!e.titulo || e.titulo.trim().length < 5) errores.push('El título debe tener al menos 5 caracteres');
  if (!e.tipo || !TIPOS_EVENTO.includes(e.tipo)) errores.push('Tipo de evento inválido');
  if (!e.curso_codigo) errores.push('Debe vincularse a un curso de YOUSAC');
  if (!e.fecha_inicio || Number.isNaN(Date.parse(e.fecha_inicio))) errores.push('Fecha de inicio inválida');
  if (!Number.isInteger(e.cupo_total) || (e.cupo_total ?? 0) < 1 || (e.cupo_total ?? 0) > 5000) errores.push('El cupo total debe ser un entero entre 1 y 5000');
  if (!Number.isInteger(e.duracion_min) || (e.duracion_min ?? 0) < 15) errores.push('Duración mínima de 15 minutos');
  if (!e.ponente?.nombre) errores.push('Debe indicar el ponente');
  return errores;
}

export function coincideFiltro(e: Evento, f: { curso?: string; tipo?: string; desde?: string; hasta?: string }): boolean {
  if (f.curso && e.curso_codigo !== f.curso) return false;
  if (f.tipo && e.tipo !== f.tipo) return false;
  const t = Date.parse(e.fecha_inicio);
  if (f.desde && t < Date.parse(f.desde)) return false;
  if (f.hasta && t > Date.parse(f.hasta) + (f.hasta.length <= 10 ? 86_399_999 : 0)) return false;
  return true;
}
