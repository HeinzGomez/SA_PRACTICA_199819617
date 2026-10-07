// HeinzGomez - Práctica 9: casos de uso del Servicio de Talleres (CDU 2.1 - 2.8)
import { randomUUID } from 'crypto';
import { Cupo, Evento, FiltroEventos } from '../types/evento';
import { TalleresError } from '../types/errores';
import { coincideFiltro, validarEvento } from '../types/validaciones';
import { CupoCache } from '../repository/cupo.cache';
import { EventoRepository } from '../repository/evento.repository';

export class TalleresService {
  constructor(private readonly repo: EventoRepository, private readonly cache: CupoCache) {}

  async listar(f: FiltroEventos): Promise<Evento[]> {
    const eventos = (await this.repo.listar()).filter((e) => coincideFiltro(e, f));
    eventos.sort((a, b) => Date.parse(a.fecha_inicio) - Date.parse(b.fecha_inicio));
    return this.conCupoEnVivo(eventos);
  }

  async obtener(id: string): Promise<Evento> {
    const e = await this.repo.obtener(id);
    if (!e) throw new TalleresError('NOT_FOUND', `Evento ${id} no existe`);
    return (await this.conCupoEnVivo([e]))[0];
  }

  async cupos(ids: string[]): Promise<Cupo[]> {
    const eventos = ids.length
      ? (await Promise.all(ids.map((id) => this.repo.obtener(id)))).filter((e): e is Evento => !!e)
      : await this.repo.listar();
    return (await this.conCupoEnVivo(eventos)).map((e) => ({
      evento_id: e.id, cupo_total: e.cupo_total, cupo_disponible: e.cupo_disponible,
    }));
  }

  async crear(input: Partial<Evento>): Promise<Evento> {
    const errores = validarEvento(input);
    if (errores.length) throw new TalleresError('INVALID_ARGUMENT', errores.join('; '));
    const e: Evento = normalizar({ ...input, id: input.id || `evt-${randomUUID().slice(0, 8)}` });
    e.cupo_disponible = e.cupo_total;
    await this.repo.guardar(e);
    await this.cache.inicializar(e.id, e.cupo_total);
    return e;
  }

  async actualizar(input: Partial<Evento>): Promise<Evento> {
    const actual = await this.repo.obtener(input.id ?? '');
    if (!actual) throw new TalleresError('NOT_FOUND', `Evento ${input.id} no existe`);
    const combinado = normalizar({ ...actual, ...input, ponente: { ...actual.ponente, ...(input.ponente ?? {}) } });
    const errores = validarEvento(combinado);
    if (errores.length) throw new TalleresError('INVALID_ARGUMENT', errores.join('; '));

    const vivo = await this.conCupoEnVivo([actual]);
    const ocupados = actual.cupo_total - vivo[0].cupo_disponible;
    if (combinado.cupo_total < ocupados) {
      throw new TalleresError('FAILED_PRECONDITION', `No se puede reducir el cupo por debajo de ${ocupados} reservas confirmadas`);
    }
    const delta = combinado.cupo_total - actual.cupo_total;
    combinado.cupo_disponible = delta !== 0 ? await this.cache.ajustar(actual.id, delta) : vivo[0].cupo_disponible;
    await this.repo.guardar(combinado);
    return combinado;
  }

  async eliminar(id: string): Promise<boolean> {
    const e = await this.obtener(id);
    if (e.cupo_disponible < e.cupo_total) {
      throw new TalleresError('FAILED_PRECONDITION', 'El evento tiene reservas confirmadas; no puede eliminarse');
    }
    await this.cache.eliminar(id);
    return this.repo.eliminar(id);
  }

  /** Consumidor de "reserva.confirmada": persiste el cupo (consistencia eventual en Postgres). */
  async sincronizarCupo(eventoId: string, cupoRestante: number): Promise<void> {
    if (cupoRestante >= 0) await this.repo.actualizarCupoDisponible(eventoId, cupoRestante);
  }

  /** Lee el contador vivo de Redis; si no responde, degrada al último valor de Postgres. */
  private async conCupoEnVivo(eventos: Evento[]): Promise<Evento[]> {
    if (!eventos.length) return eventos;
    let vivos = new Map<string, number>();
    try {
      vivos = await this.cache.obtener(eventos.map((e) => e.id));
    } catch {
      // Si Redis no responde se degrada al último valor persistido en Postgres.
    }
    return eventos.map((e) => ({ ...e, cupo_disponible: vivos.get(e.id) ?? e.cupo_disponible }));
  }
}

function normalizar(e: Partial<Evento>): Evento {
  return {
    id: e.id!,
    titulo: (e.titulo ?? '').trim(),
    descripcion: (e.descripcion ?? '').trim(),
    tipo: e.tipo!,
    curso_codigo: e.curso_codigo ?? '',
    curso_nombre: e.curso_nombre ?? '',
    fecha_inicio: new Date(e.fecha_inicio ?? '').toString() === 'Invalid Date' ? (e.fecha_inicio ?? '') : new Date(e.fecha_inicio!).toISOString(),
    duracion_min: Number(e.duracion_min),
    lugar: e.lugar ?? '',
    cupo_total: Number(e.cupo_total),
    cupo_disponible: Number(e.cupo_disponible ?? e.cupo_total),
    ponente: { nombre: '', titulo: '', bio: '', correo: '', ...(e.ponente ?? {}) },
    prerrequisitos: (e.prerrequisitos ?? []).filter(Boolean),
    tiene_certificacion: Boolean(e.tiene_certificacion),
  };
}
