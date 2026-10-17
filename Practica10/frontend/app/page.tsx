'use client';
// HeinzGomez - Práctica 7: Catálogo de eventos académicos (CDU 2.1, 2.2, 2.4)
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useSesion } from '@/components/Sesion';
import { Alerta, BarraCupo, useCupos } from '@/components/Ui';
import { duracion, ETIQUETA_TIPO, fechaCorta } from '@/lib/formato';
import type { Evento, FiltroEventos } from '@/lib/types';

export default function Catalogo() {
  const { api } = useSesion();
  const [todos, setTodos] = useState<Evento[]>([]);
  const [eventos, setEventos] = useState<Evento[] | null>(null);
  const [filtro, setFiltro] = useState<FiltroEventos>({});
  const [error, setError] = useState<unknown>(null);
  const cupos = useCupos();

  useEffect(() => { api.listarEventos().then(setTodos).catch(setError); }, [api]);
  useEffect(() => {
    setError(null);
    api.listarEventos(filtro).then(setEventos).catch(setError);
  }, [api, filtro]);

  const cursos = useMemo(() => {
    const m = new Map<string, string>();
    todos.forEach((e) => m.set(e.curso_codigo, e.curso_nombre));
    return [...m.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [todos]);

  const set = (k: keyof FiltroEventos) => (ev: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setFiltro((f) => ({ ...f, [k]: ev.target.value || undefined }));

  return (
    <div className="pila">
      <div className="fila entre">
        <div>
          <h1>Eventos académicos disponibles</h1>
          <p className="muted">Talleres, conferencias, laboratorios y exámenes de certificación vinculados a tus cursos de YOUSAC.</p>
        </div>
        <span className="en-vivo">Cupos en tiempo real</span>
      </div>

      <section className="card filtros" aria-label="Filtros">
        <div>
          <label htmlFor="f-curso">Curso</label>
          <select id="f-curso" value={filtro.curso ?? ''} onChange={set('curso')}>
            <option value="">Todos los cursos</option>
            {cursos.map(([c, n]) => <option key={c} value={c}>{c} · {n}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="f-tipo">Tipo</label>
          <select id="f-tipo" value={filtro.tipo ?? ''} onChange={set('tipo')}>
            <option value="">Todos</option>
            {Object.entries(ETIQUETA_TIPO).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="f-desde">Desde</label>
          <input id="f-desde" type="date" value={filtro.desde ?? ''} onChange={set('desde')} />
        </div>
        <div>
          <label htmlFor="f-hasta">Hasta</label>
          <input id="f-hasta" type="date" value={filtro.hasta ?? ''} onChange={set('hasta')} />
        </div>
        <div>
          <button className="btn secundario" style={{ width: '100%' }} onClick={() => setFiltro({})}>Limpiar filtros</button>
        </div>
      </section>

      <Alerta error={error} />

      {eventos === null ? <p className="muted">Cargando eventos…</p> : eventos.length === 0 ? (
        <div className="card vacio">No hay eventos que coincidan con los filtros seleccionados.</div>
      ) : (
        <div className="grid">
          {eventos.map((e) => {
            const c = cupos.get(e.id);
            return (
              <article key={e.id} className="card evento">
                <div className="fila">
                  <span className="chip primario">{ETIQUETA_TIPO[e.tipo]}</span>
                  {e.tiene_certificacion && <span className="chip oro">Otorga diploma</span>}
                </div>
                <h3><Link href={`/eventos/${e.id}`}>{e.titulo}</Link></h3>
                <p className="meta">{e.curso_codigo} · {e.curso_nombre}</p>
                <p className="meta">{fechaCorta(e.fecha_inicio)} · {duracion(e.duracion_min)}<br />{e.lugar}</p>
                <p className="meta">Ponente: <strong>{e.ponente.nombre}</strong></p>
                <BarraCupo disponible={c?.cupo_disponible ?? e.cupo_disponible} total={c?.cupo_total ?? e.cupo_total} compacta />
                <div className="pie">
                  <span className="pequeno muted">{e.prerrequisitos.length ? `${e.prerrequisitos.length} prerrequisito(s)` : 'Sin prerrequisitos'}</span>
                  <Link href={`/eventos/${e.id}`} className="btn chico">Ver y reservar</Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
