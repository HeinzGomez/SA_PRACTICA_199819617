// HeinzGomez - Práctica 9: repositorio PostgreSQL (talleres_db) de eventos académicos
import { Pool } from 'pg';
import { Evento } from '../types/evento';
import { EventoRepository } from './evento.repository';

const MIGRACION = `
CREATE TABLE IF NOT EXISTS ponente (
  id      SERIAL PRIMARY KEY,
  nombre  VARCHAR(120) NOT NULL,
  titulo  VARCHAR(150),
  bio     TEXT,
  correo  VARCHAR(150) UNIQUE
);
CREATE TABLE IF NOT EXISTS evento (
  id                  VARCHAR(40) PRIMARY KEY,
  titulo              VARCHAR(200) NOT NULL,
  descripcion         TEXT,
  tipo                VARCHAR(15) NOT NULL CHECK (tipo IN ('TALLER','CONFERENCIA','LABORATORIO','CERTIFICACION')),
  curso_codigo        VARCHAR(10) NOT NULL,
  curso_nombre        VARCHAR(120),
  fecha_inicio        TIMESTAMPTZ NOT NULL,
  duracion_min        INTEGER NOT NULL CHECK (duracion_min >= 15),
  lugar               VARCHAR(200),
  cupo_total          INTEGER NOT NULL CHECK (cupo_total > 0),
  cupo_disponible     INTEGER NOT NULL CHECK (cupo_disponible >= 0),
  ponente_id          INTEGER REFERENCES ponente(id),
  tiene_certificacion BOOLEAN NOT NULL DEFAULT false,
  actualizado_en      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS evento_prerrequisito (
  evento_id           VARCHAR(40) REFERENCES evento(id) ON DELETE CASCADE,
  descripcion          VARCHAR(200) NOT NULL,
  PRIMARY KEY (evento_id, descripcion)
);
CREATE INDEX IF NOT EXISTS idx_evento_curso_fecha ON evento(curso_codigo, fecha_inicio);
`;

type FilaEvento = {
  id: string; titulo: string; descripcion: string | null; tipo: Evento['tipo'];
  curso_codigo: string; curso_nombre: string | null; fecha_inicio: Date; duracion_min: number;
  lugar: string | null; cupo_total: number; cupo_disponible: number; tiene_certificacion: boolean;
  p_nombre: string | null; p_titulo: string | null; p_bio: string | null; p_correo: string | null;
  prerrequisitos: string[] | null;
};

const mapear = (r: FilaEvento): Evento => ({
  id: r.id, titulo: r.titulo, descripcion: r.descripcion ?? '', tipo: r.tipo,
  curso_codigo: r.curso_codigo, curso_nombre: r.curso_nombre ?? '',
  fecha_inicio: new Date(r.fecha_inicio).toISOString(), duracion_min: r.duracion_min,
  lugar: r.lugar ?? '', cupo_total: r.cupo_total, cupo_disponible: r.cupo_disponible,
  ponente: { nombre: r.p_nombre ?? '', titulo: r.p_titulo ?? '', bio: r.p_bio ?? '', correo: r.p_correo ?? '' },
  prerrequisitos: r.prerrequisitos ?? [], tiene_certificacion: r.tiene_certificacion,
});

export class PgEventoRepository implements EventoRepository {
  constructor(private readonly pool: Pool) {}

  /** No forma parte del puerto: solo lo usa el arranque (esquema + seed si la tabla está vacía). */
  async migrar(seed: Evento[]): Promise<boolean> {
    await this.pool.query(MIGRACION);
    const { rows } = await this.pool.query('SELECT count(*)::int AS n FROM evento');
    if (rows[0].n > 0) return false;
    for (const e of seed) await this.guardar(e);
    return true;
  }

  async listar(): Promise<Evento[]> {
    const { rows } = await this.pool.query(`
      SELECT e.*, p.nombre AS p_nombre, p.titulo AS p_titulo, p.bio AS p_bio, p.correo AS p_correo,
             COALESCE(array_agg(pr.descripcion) FILTER (WHERE pr.descripcion IS NOT NULL), '{}') AS prerrequisitos
      FROM evento e LEFT JOIN ponente p ON e.ponente_id = p.id
      LEFT JOIN evento_prerrequisito pr ON pr.evento_id = e.id
      GROUP BY e.id, p.id`);
    return rows.map(mapear);
  }

  async obtener(id: string): Promise<Evento | null> {
    const { rows } = await this.pool.query(`
      SELECT e.*, p.nombre AS p_nombre, p.titulo AS p_titulo, p.bio AS p_bio, p.correo AS p_correo,
             COALESCE(array_agg(pr.descripcion) FILTER (WHERE pr.descripcion IS NOT NULL), '{}') AS prerrequisitos
      FROM evento e LEFT JOIN ponente p ON e.ponente_id = p.id
      LEFT JOIN evento_prerrequisito pr ON pr.evento_id = e.id
      WHERE e.id = $1
      GROUP BY e.id, p.id`, [id]);
    return rows[0] ? mapear(rows[0]) : null;
  }

  async guardar(e: Evento): Promise<void> {
    const c = await this.pool.connect();
    try {
      await c.query('BEGIN');
      const p = await c.query(
        `INSERT INTO ponente (nombre,titulo,bio,correo) VALUES ($1,$2,$3,$4)
         ON CONFLICT (correo) DO UPDATE SET nombre=EXCLUDED.nombre, titulo=EXCLUDED.titulo, bio=EXCLUDED.bio, correo=EXCLUDED.correo
         RETURNING id`,
        [e.ponente.nombre, e.ponente.titulo, e.ponente.bio, e.ponente.correo]);
      await c.query(
        `INSERT INTO evento (id,titulo,descripcion,tipo,curso_codigo,curso_nombre,fecha_inicio,duracion_min,lugar,
           cupo_total,cupo_disponible,ponente_id,tiene_certificacion,actualizado_en)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,now())
         ON CONFLICT (id) DO UPDATE SET titulo=EXCLUDED.titulo, descripcion=EXCLUDED.descripcion, tipo=EXCLUDED.tipo,
           curso_codigo=EXCLUDED.curso_codigo, curso_nombre=EXCLUDED.curso_nombre, fecha_inicio=EXCLUDED.fecha_inicio,
           duracion_min=EXCLUDED.duracion_min, lugar=EXCLUDED.lugar, cupo_total=EXCLUDED.cupo_total,
           cupo_disponible=EXCLUDED.cupo_disponible, ponente_id=EXCLUDED.ponente_id,
           tiene_certificacion=EXCLUDED.tiene_certificacion, actualizado_en=now()
         RETURNING id`,
        [e.id, e.titulo, e.descripcion, e.tipo, e.curso_codigo, e.curso_nombre, e.fecha_inicio, e.duracion_min, e.lugar,
          e.cupo_total, e.cupo_disponible, p.rows[0].id, e.tiene_certificacion]);
      await c.query('DELETE FROM evento_prerrequisito WHERE evento_id=$1', [e.id]);
      for (const pr of new Set(e.prerrequisitos)) {
        if (pr) await c.query('INSERT INTO evento_prerrequisito(evento_id,descripcion) VALUES ($1,$2)', [e.id, pr]);
      }
      await c.query('COMMIT');
    } catch (err) {
      await c.query('ROLLBACK');
      throw err;
    } finally {
      c.release();
    }
  }

  async eliminar(id: string): Promise<boolean> {
    const r = await this.pool.query('DELETE FROM evento WHERE id=$1', [id]);
    return (r.rowCount ?? 0) > 0;
  }

  /** Tolerante a mensajes fuera de orden: solo baja el cupo, nunca lo sube. */
  async actualizarCupoDisponible(id: string, cupo: number): Promise<void> {
    await this.pool.query(
      'UPDATE evento SET cupo_disponible=LEAST(cupo_disponible,$2), actualizado_en=now() WHERE id=$1',
      [id, cupo]);
  }
}
