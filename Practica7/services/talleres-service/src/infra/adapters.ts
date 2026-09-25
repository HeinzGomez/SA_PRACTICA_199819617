// HeinzGomez - Práctica 7: adaptadores de infraestructura (PostgreSQL, Redis, RabbitMQ)
import { Pool } from 'pg';
import Redis from 'ioredis';
import amqp from 'amqplib';
import { Evento } from '../domain';
import { CupoCache, EventoRepository } from '../talleres.service';

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
  tipo                VARCHAR(20) NOT NULL CHECK (tipo IN ('TALLER','CONFERENCIA','LABORATORIO','CERTIFICACION')),
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
  evento_id   VARCHAR(40) REFERENCES evento(id) ON DELETE CASCADE,
  descripcion VARCHAR(200) NOT NULL,
  PRIMARY KEY (evento_id, descripcion)
);
CREATE INDEX IF NOT EXISTS idx_evento_curso_fecha ON evento(curso_codigo, fecha_inicio);
`;

export class PgEventoRepository implements EventoRepository {
  constructor(private readonly pool: Pool) {}

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
      FROM evento e LEFT JOIN ponente p ON p.id = e.ponente_id
      LEFT JOIN evento_prerrequisito pr ON pr.evento_id = e.id
      GROUP BY e.id, p.id`);
    return rows.map((r) => ({
      id: r.id, titulo: r.titulo, descripcion: r.descripcion ?? '', tipo: r.tipo, curso_codigo: r.curso_codigo,
      curso_nombre: r.curso_nombre ?? '', fecha_inicio: new Date(r.fecha_inicio).toISOString(), duracion_min: r.duracion_min,
      lugar: r.lugar ?? '', cupo_total: r.cupo_total, cupo_disponible: r.cupo_disponible,
      ponente: { nombre: r.p_nombre ?? '', titulo: r.p_titulo ?? '', bio: r.p_bio ?? '', correo: r.p_correo ?? '' },
      prerrequisitos: r.prerrequisitos, tiene_certificacion: r.tiene_certificacion,
    }));
  }

  async obtener(id: string) {
    return (await this.listar()).find((e) => e.id === id) ?? null;
  }

  async guardar(e: Evento) {
    const c = await this.pool.connect();
    try {
      await c.query('BEGIN');
      const p = await c.query(
        `INSERT INTO ponente (nombre,titulo,bio,correo) VALUES ($1,$2,$3,$4)
         ON CONFLICT (correo) DO UPDATE SET nombre=EXCLUDED.nombre, titulo=EXCLUDED.titulo, bio=EXCLUDED.bio RETURNING id`,
        [e.ponente.nombre, e.ponente.titulo, e.ponente.bio, e.ponente.correo || null]);
      await c.query(
        `INSERT INTO evento (id,titulo,descripcion,tipo,curso_codigo,curso_nombre,fecha_inicio,duracion_min,lugar,cupo_total,cupo_disponible,ponente_id,tiene_certificacion)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
         ON CONFLICT (id) DO UPDATE SET titulo=$2,descripcion=$3,tipo=$4,curso_codigo=$5,curso_nombre=$6,fecha_inicio=$7,
           duracion_min=$8,lugar=$9,cupo_total=$10,cupo_disponible=$11,ponente_id=$12,tiene_certificacion=$13,actualizado_en=now()`,
        [e.id, e.titulo, e.descripcion, e.tipo, e.curso_codigo, e.curso_nombre, e.fecha_inicio, e.duracion_min, e.lugar,
          e.cupo_total, e.cupo_disponible, p.rows[0].id, e.tiene_certificacion]);
      await c.query('DELETE FROM evento_prerrequisito WHERE evento_id=$1', [e.id]);
      for (const pr of new Set(e.prerrequisitos)) {
        await c.query('INSERT INTO evento_prerrequisito (evento_id,descripcion) VALUES ($1,$2)', [e.id, pr]);
      }
      await c.query('COMMIT');
    } catch (err) {
      await c.query('ROLLBACK');
      throw err;
    } finally {
      c.release();
    }
  }

  async eliminar(id: string) {
    const r = await this.pool.query('DELETE FROM evento WHERE id=$1', [id]);
    return (r.rowCount ?? 0) > 0;
  }

  async actualizarCupoDisponible(id: string, cupo: number) {
    // Solo disminuye: tolera mensajes fuera de orden entre consumidores
    await this.pool.query('UPDATE evento SET cupo_disponible=LEAST(cupo_disponible,$2), actualizado_en=now() WHERE id=$1', [id, cupo]);
  }
}

export const cupoKey = (id: string) => `cupo:evento:${id}`;
export const inscritosKey = (id: string) => `inscritos:evento:${id}`;

export class RedisCupoCache implements CupoCache {
  constructor(private readonly redis: Redis) {}
  async inicializar(id: string, cupo: number) { await this.redis.set(cupoKey(id), cupo, 'NX'); }
  async ajustar(id: string, delta: number) { return this.redis.incrby(cupoKey(id), delta); }
  async obtener(ids: string[]) {
    const vals = await this.redis.mget(ids.map(cupoKey));
    const m = new Map<string, number>();
    ids.forEach((id, i) => { if (vals[i] !== null) m.set(id, Number(vals[i])); });
    return m;
  }
  async eliminar(id: string) { await this.redis.del(cupoKey(id), inscritosKey(id)); }
}

export async function consumirConfirmaciones(
  url: string,
  onConfirmada: (eventoId: string, cupoRestante: number) => Promise<void>,
  alCerrar?: () => void,
): Promise<void> {
  const conn = await amqp.connect(url);
  conn.on('error', (e) => console.error('[rabbitmq] error de conexión', e.message));
  if (alCerrar) conn.on('close', alCerrar);
  const ch = await conn.createChannel();
  await ch.assertExchange('academix.events', 'topic', { durable: true });
  const q = await ch.assertQueue('talleres.cupos', { durable: true });
  await ch.bindQueue(q.queue, 'academix.events', 'reserva.confirmada');
  await ch.prefetch(50);
  await ch.consume(q.queue, async (msg) => {
    if (!msg) return;
    try {
      const body = JSON.parse(msg.content.toString());
      await onConfirmada(body.eventoId, Number(body.cupoRestante));
      ch.ack(msg);
    } catch (e) {
      console.error('[talleres.cupos] mensaje descartado', e);
      ch.nack(msg, false, false);
    }
  });
}
