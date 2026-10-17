'use client';
// HeinzGomez - Práctica 9: administración de eventos académicos (CDU 2.5 - 2.8)
// y del examen de certificación que los acompaña (CDU 3.6 - administración).
import { useCallback, useEffect, useState } from 'react';
import { useSesion } from '@/components/Sesion';
import { Alerta, BarraCupo, Requiere, useCupos } from '@/components/Ui';
import { ApiError, type Evento, type ExamenAdmin, type TipoEvento } from '@/lib/types';
import { ETIQUETA_TIPO, fechaCorta } from '@/lib/formato';
import { validarEvento } from '@/lib/validaciones';

type Form = {
  id?: string; titulo: string; descripcion: string; tipo: TipoEvento; curso_codigo: string; curso_nombre: string;
  fecha_inicio: string; duracion_min: string; lugar: string; cupo_total: string; tiene_certificacion: boolean;
  ponente_nombre: string; ponente_titulo: string; ponente_bio: string; ponente_correo: string; prerrequisitos: string;
};

const VACIO: Form = {
  titulo: '', descripcion: '', tipo: 'TALLER', curso_codigo: '0970', curso_nombre: 'Software Avanzado', fecha_inicio: '',
  duracion_min: '90', lugar: '', cupo_total: '30', tiene_certificacion: false, ponente_nombre: '', ponente_titulo: '',
  ponente_bio: '', ponente_correo: '', prerrequisitos: '',
};

/** Borrador de una pregunta del examen: 4 opciones, una o varias marcadas como correctas. */
type OpcionBorrador = { texto: string; correcta: boolean };
type BorradorPregunta = { enunciado: string; opciones: OpcionBorrador[] };

const OPCIONES_BORRADOR = 4;

const nuevaPregunta = (): BorradorPregunta => ({
  enunciado: '',
  opciones: Array.from({ length: OPCIONES_BORRADOR }, () => ({ texto: '', correcta: false })),
});

function validarPregunta(b: BorradorPregunta): string[] {
  const e: string[] = [];
  if (!b.enunciado.trim()) e.push('Escribe el enunciado de la pregunta');
  if (b.opciones.some((o) => !o.texto.trim())) e.push(`Completa las ${OPCIONES_BORRADOR} opciones de respuesta`);
  if (!b.opciones.some((o) => o.correcta)) e.push('Marca al menos una respuesta como correcta');
  if (b.opciones.filter((o) => o.correcta).length === b.opciones.length) {
    e.push('Todas las opciones no pueden ser correctas');
  }
  return e;
}

function aLocal(iso: string) {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

function aForm(e: Evento): Form {
  return {
    id: e.id, titulo: e.titulo, descripcion: e.descripcion, tipo: e.tipo, curso_codigo: e.curso_codigo, curso_nombre: e.curso_nombre,
    fecha_inicio: aLocal(e.fecha_inicio), duracion_min: String(e.duracion_min), lugar: e.lugar, cupo_total: String(e.cupo_total),
    tiene_certificacion: e.tiene_certificacion, ponente_nombre: e.ponente.nombre, ponente_titulo: e.ponente.titulo,
    ponente_bio: e.ponente.bio, ponente_correo: e.ponente.correo, prerrequisitos: e.prerrequisitos.join('\n'),
  };
}

function aEvento(f: Form): Partial<Evento> {
  return {
    ...(f.id ? { id: f.id } : {}), titulo: f.titulo, descripcion: f.descripcion, tipo: f.tipo, curso_codigo: f.curso_codigo,
    curso_nombre: f.curso_nombre, fecha_inicio: f.fecha_inicio ? new Date(f.fecha_inicio).toISOString() : '',
    duracion_min: Number(f.duracion_min), lugar: f.lugar, cupo_total: Number(f.cupo_total), tiene_certificacion: f.tiene_certificacion,
    ponente: { nombre: f.ponente_nombre, titulo: f.ponente_titulo, bio: f.ponente_bio, correo: f.ponente_correo },
    prerrequisitos: f.prerrequisitos.split('\n').map((s) => s.trim()).filter(Boolean),
  };
}

function Panel() {
  const { api, sesion } = useSesion();
  const cupos = useCupos();
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [form, setForm] = useState<Form | null>(null);
  const [errores, setErrores] = useState<string[]>([]);
  const [error, setError] = useState<unknown>(null);
  const [aviso, setAviso] = useState('');
  const [aEliminar, setAEliminar] = useState<Evento | null>(null);

  // --- examen de certificación del evento que se está editando
  const [examen, setExamen] = useState<ExamenAdmin | null>(null);
  const [cargandoExamen, setCargandoExamen] = useState(false);
  const [errorExamen, setErrorExamen] = useState<unknown>(null);
  const [pregunta, setPregunta] = useState<BorradorPregunta>(nuevaPregunta());
  const [erroresPregunta, setErroresPregunta] = useState<string[]>([]);

  const cargar = useCallback(() => api.listarEventos().then(setEventos).catch(setError), [api]);
  useEffect(() => { cargar(); }, [cargar]);

  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => f && ({ ...f, [k]: e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value }));

  const limpiarExamen = () => { setExamen(null); setErrorExamen(null); setPregunta(nuevaPregunta()); setErroresPregunta([]); };

  /** Trae el examen de la actividad; si `crearSiFalta` y no existe, lo crea (CDU 3.6). */
  const cargarExamen = useCallback(async (eventoId: string, crearSiFalta: boolean, titulo: string) => {
    setCargandoExamen(true);
    setErrorExamen(null);
    try {
      setExamen(await api.obtenerExamenAdmin(sesion!.token, eventoId));
    } catch (err) {
      const sinExamen = err instanceof ApiError && err.status === 404;
      if (sinExamen && crearSiFalta) {
        try {
          setExamen(await api.crearExamen(sesion!.token, {
            evento_id: eventoId, titulo: `Examen de certificación: ${titulo || eventoId}`,
          }));
        } catch (e2) { setExamen(null); setErrorExamen(e2); }
      } else {
        setExamen(null);
        if (!sinExamen) setErrorExamen(err);
      }
    } finally { setCargandoExamen(false); }
  }, [api, sesion]);

  const alternarCertificacion = (marcado: boolean) => {
    setForm((f) => f && ({ ...f, tiene_certificacion: marcado }));
    limpiarExamen();
    if (marcado && form?.id) void cargarExamen(form.id, true, form.titulo);
  };

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    const ev = aEvento(form);
    const v = validarEvento(ev);
    setErrores(v);
    if (v.length) return;
    setError(null);
    try {
      const nuevo = !form.id;
      const guardado = form.id
        ? await api.actualizarEvento(sesion!.token, ev as Evento)
        : await api.crearEvento(sesion!.token, ev);
      setAviso(nuevo ? 'Evento creado' : 'Evento actualizado');
      if (form.tiene_certificacion) {
        // El formulario pasa a modo edición para que se puedan agregar las preguntas del examen.
        const id = form.id ?? guardado.id;
        setForm({ ...form, id });
        await cargarExamen(id, true, form.titulo);
      } else {
        limpiarExamen();
        setForm(null);
      }
      cargar();
    } catch (err) { setError(err); }
  }

  async function eliminar(ev: Evento) {
    setError(null);
    try { await api.eliminarEvento(sesion!.token, ev.id); setAviso('Evento eliminado'); cargar(); } catch (err) { setError(err); }
    setAEliminar(null);
  }

  function editar(ev: Evento) {
    setForm(aForm({ ...ev, cupo_disponible: cupos.get(ev.id)?.cupo_disponible ?? ev.cupo_disponible }));
    setErrores([]); setAviso(''); setError(null); limpiarExamen();
    if (ev.tiene_certificacion) void cargarExamen(ev.id, true, ev.titulo);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function guardarPregunta() {
    if (!form?.id || !examen) return;
    const v = validarPregunta(pregunta);
    setErroresPregunta(v);
    if (v.length) return;
    setErrorExamen(null);
    try {
      await api.agregarPregunta(sesion!.token, {
        id_examen: examen.id_examen,
        enunciado: pregunta.enunciado.trim(),
        opciones: pregunta.opciones.map((o) => ({ texto: o.texto.trim(), es_correcta: o.correcta })),
      });
      setAviso('Pregunta agregada al examen');
      setPregunta(nuevaPregunta());
      setErroresPregunta([]);
      await cargarExamen(form.id, false, form.titulo);
    } catch (err) { setErrorExamen(err); }
  }

  const marcarOpcion = (i: number, campo: keyof OpcionBorrador, valor: string | boolean) =>
    setPregunta((p) => ({ ...p, opciones: p.opciones.map((o, j) => (j === i ? { ...o, [campo]: valor } : o)) }));

  return (
    <div className="pila">
      <div className="fila entre">
        <h1>Administración de eventos</h1>
        <button className="btn" onClick={() => { setForm({ ...VACIO }); limpiarExamen(); setErrores([]); setAviso(''); setError(null); }}>+ Nuevo evento</button>
      </div>
      {aviso && <div className="alerta ok">{aviso}</div>}
      <Alerta error={error} />

      {form && (
        <>
          <form className="card pila" onSubmit={guardar} noValidate>
            <h2>{form.id ? `Editar ${form.id}` : 'Nuevo evento académico'}</h2>
            <div className="filtros">
              <div style={{ gridColumn: '1 / -1' }}><label htmlFor="a-tit">Título</label><input id="a-tit" value={form.titulo} onChange={set('titulo')} /></div>
              <div><label htmlFor="a-tipo">Tipo</label>
                <select id="a-tipo" value={form.tipo} onChange={set('tipo')}>{Object.entries(ETIQUETA_TIPO).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
              <div><label htmlFor="a-cc">Código de curso</label><input id="a-cc" value={form.curso_codigo} onChange={set('curso_codigo')} /></div>
              <div><label htmlFor="a-cn">Nombre de curso</label><input id="a-cn" value={form.curso_nombre} onChange={set('curso_nombre')} /></div>
              <div><label htmlFor="a-f">Fecha y hora</label><input id="a-f" type="datetime-local" value={form.fecha_inicio} onChange={set('fecha_inicio')} /></div>
              <div><label htmlFor="a-d">Duración (min)</label><input id="a-d" type="number" min={15} value={form.duracion_min} onChange={set('duracion_min')} /></div>
              <div><label htmlFor="a-c">Cupo total</label><input id="a-c" type="number" min={1} value={form.cupo_total} onChange={set('cupo_total')} /></div>
              <div><label htmlFor="a-l">Lugar</label><input id="a-l" value={form.lugar} onChange={set('lugar')} /></div>
              <div style={{ gridColumn: '1 / -1' }}><label htmlFor="a-desc">Descripción</label><textarea id="a-desc" rows={2} value={form.descripcion} onChange={set('descripcion')} /></div>
              <div><label htmlFor="a-pn">Ponente</label><input id="a-pn" value={form.ponente_nombre} onChange={set('ponente_nombre')} /></div>
              <div><label htmlFor="a-pt">Título del ponente</label><input id="a-pt" value={form.ponente_titulo} onChange={set('ponente_titulo')} /></div>
              <div><label htmlFor="a-pc">Correo del ponente</label><input id="a-pc" type="email" value={form.ponente_correo} onChange={set('ponente_correo')} /></div>
              <div style={{ gridColumn: '1 / -1' }}><label htmlFor="a-pb">Semblanza del ponente</label><textarea id="a-pb" rows={2} value={form.ponente_bio} onChange={set('ponente_bio')} /></div>
              <div style={{ gridColumn: '1 / -1' }}><label htmlFor="a-pr">Prerrequisitos (uno por línea)</label><textarea id="a-pr" rows={3} value={form.prerrequisitos} onChange={set('prerrequisitos')} /></div>
              <label className="opcion" style={{ gridColumn: '1 / -1' }}>
                <input type="checkbox" checked={form.tiene_certificacion}
                  onChange={(e) => alternarCertificacion((e.target as HTMLInputElement).checked)} />
                Otorga diploma (examen de certificación)
              </label>
            </div>
            {errores.length > 0 && <div className="alerta error"><ul style={{ margin: 0, paddingLeft: 18 }}>{errores.map((x) => <li key={x}>{x}</li>)}</ul></div>}
            <div className="fila">
              <button className="btn" type="submit">Guardar</button>
              <button className="btn secundario" type="button" onClick={() => { setForm(null); limpiarExamen(); }}>Cancelar</button>
            </div>
          </form>

          {form.tiene_certificacion && (
            <section className="card pila" aria-label="Examen de certificación">
              <h2 style={{ margin: 0 }}>Examen de certificación</h2>

              {!form.id && (
                <p className="pequeno muted">Guarda el evento para poder crear su examen y agregarle las preguntas.</p>
              )}

              {form.id && cargandoExamen && <p className="pequeno muted">Cargando examen…</p>}

              {form.id && !cargandoExamen && (
                <>
                  <Alerta error={errorExamen} />

                  {!examen && !errorExamen && (
                    <div className="fila">
                      <p className="pequeno" style={{ margin: 0 }}>Esta actividad aún no tiene un examen.</p>
                      <button type="button" className="btn secundario chico" onClick={() => cargarExamen(form.id!, true, form.titulo)}>
                        Crear examen
                      </button>
                    </div>
                  )}

                  {examen && (
                    <>
                      <p className="pequeno muted" style={{ margin: 0 }}>
                        {examen.titulo} · nota mínima {examen.puntaje_minimo} · {examen.preguntas.length} pregunta{examen.preguntas.length === 1 ? '' : 's'} · estado {examen.estado}
                      </p>

                      {examen.preguntas.length > 0 && (
                        <ul className="pila" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                          {examen.preguntas.map((p) => (
                            <li key={String(p.id_pregunta)} className="card" style={{ padding: '10px 12px' }}>
                              <div className="pequeno"><strong>{p.enunciado}</strong> · {p.punteo} pts</div>
                              <div className="pequeno">
                                {p.opciones.map((o) => (
                                  <span key={o.id_opcion} className={`chip${o.es_correcta ? ' ok' : ''}`} style={{ marginRight: 6 }}>
                                    {o.es_correcta ? '✓ ' : ''}{o.texto}
                                  </span>
                                ))}
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}

                      <fieldset className="pregunta">
                        <legend>Nueva pregunta ({OPCIONES_BORRADOR} respuestas posibles)</legend>
                        <div className="pila">
                          <input aria-label="Enunciado de la pregunta" placeholder="Enunciado"
                            value={pregunta.enunciado} onChange={(e) => setPregunta((p) => ({ ...p, enunciado: e.target.value }))} />
                          {pregunta.opciones.map((o, i) => (
                            <div className="opcion" key={i}>
                              <input type="checkbox" checked={o.correcta}
                                aria-label={`La opción ${i + 1} es correcta`}
                                onChange={(e) => marcarOpcion(i, 'correcta', (e.target as HTMLInputElement).checked)} />
                              <input aria-label={`Texto de la opción ${i + 1}`} placeholder={`Opción ${i + 1}`}
                                style={{ flex: 1, width: 'auto' }}
                                value={o.texto} onChange={(e) => marcarOpcion(i, 'texto', e.target.value)} />
                            </div>
                          ))}
                        </div>
                      </fieldset>

                      {erroresPregunta.length > 0 && (
                        <div className="alerta error">
                          <ul style={{ margin: 0, paddingLeft: 18 }}>{erroresPregunta.map((x) => <li key={x}>{x}</li>)}</ul>
                        </div>
                      )}

                      <div className="fila">
                        <button type="button" className="btn" onClick={guardarPregunta}>Agregar pregunta</button>
                        <span className="pequeno muted">Se guarda en el examen inmediatamente.</span>
                      </div>
                    </>
                  )}
                </>
              )}
            </section>
          )}
        </>
      )}

      {aEliminar && (
        <div className="card alerta error pila" role="alertdialog">
          <div>¿Eliminar definitivamente «{aEliminar.titulo}»? Esta acción no se puede deshacer.</div>
          <div className="fila">
            <button className="btn peligro chico" onClick={() => eliminar(aEliminar)}>Sí, eliminar</button>
            <button className="btn secundario chico" onClick={() => setAEliminar(null)}>Cancelar</button>
          </div>
        </div>
      )}

      <div className="card scroll-x">
        <table className="tabla">
          <thead><tr><th>Evento</th><th>Curso</th><th>Fecha</th><th style={{ minWidth: 200 }}>Cupo (en vivo)</th><th /></tr></thead>
          <tbody>
            {eventos.map((e) => {
              const c = cupos.get(e.id);
              return (
                <tr key={e.id}>
                  <td><strong>{e.titulo}</strong><div className="pequeno muted">{ETIQUETA_TIPO[e.tipo]} · {e.ponente.nombre}</div></td>
                  <td>{e.curso_codigo}</td>
                  <td className="pequeno">{fechaCorta(e.fecha_inicio)}</td>
                  <td><BarraCupo disponible={c?.cupo_disponible ?? e.cupo_disponible} total={c?.cupo_total ?? e.cupo_total} compacta /></td>
                  <td><div className="fila">
                    <button className="btn secundario chico" onClick={() => editar(e)}>Editar</button>
                    <button className="btn peligro chico" onClick={() => setAEliminar(e)}>Eliminar</button>
                  </div></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function Pagina() {
  return <Requiere rol="ADMINISTRADOR"><Panel /></Requiere>;
}
