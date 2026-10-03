'use client';
// HeinzGomez - Práctica 7: administración de eventos académicos (CDU 2.5 - 2.8)
import { useCallback, useEffect, useState } from 'react';
import { useSesion } from '@/components/Sesion';
import { Alerta, BarraCupo, Requiere, useCupos } from '@/components/Ui';
import { ETIQUETA_TIPO, fechaCorta } from '@/lib/formato';
import type { Evento, TipoEvento } from '@/lib/types';
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

  const cargar = useCallback(() => api.listarEventos().then(setEventos).catch(setError), [api]);
  useEffect(() => { cargar(); }, [cargar]);

  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => f && ({ ...f, [k]: e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value }));

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    const ev = aEvento(form);
    const v = validarEvento(ev);
    setErrores(v);
    if (v.length) return;
    setError(null);
    try {
      if (form.id) await api.actualizarEvento(sesion!.token, ev as Evento);
      else await api.crearEvento(sesion!.token, ev);
      setAviso(form.id ? 'Evento actualizado' : 'Evento creado');
      setForm(null);
      cargar();
    } catch (err) { setError(err); }
  }

  async function eliminar(ev: Evento) {
    setError(null);
    try { await api.eliminarEvento(sesion!.token, ev.id); setAviso('Evento eliminado'); cargar(); } catch (err) { setError(err); }
    setAEliminar(null);
  }

  return (
    <div className="pila">
      <div className="fila entre">
        <h1>Administración de eventos</h1>
        <button className="btn" onClick={() => { setForm({ ...VACIO }); setErrores([]); setAviso(''); }}>+ Nuevo evento</button>
      </div>
      {aviso && <div className="alerta ok">{aviso}</div>}
      <Alerta error={error} />

      {form && (
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
            <label className="opcion" style={{ gridColumn: '1 / -1' }}><input type="checkbox" checked={form.tiene_certificacion} onChange={set('tiene_certificacion')} /> Otorga diploma (examen de certificación)</label>
          </div>
          {errores.length > 0 && <div className="alerta error"><ul style={{ margin: 0, paddingLeft: 18 }}>{errores.map((x) => <li key={x}>{x}</li>)}</ul></div>}
          <div className="fila">
            <button className="btn" type="submit">Guardar</button>
            <button className="btn secundario" type="button" onClick={() => setForm(null)}>Cancelar</button>
          </div>
        </form>
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
                    <button className="btn secundario chico" onClick={() => { setForm(aForm({ ...e, cupo_disponible: c?.cupo_disponible ?? e.cupo_disponible })); setErrores([]); setAviso(''); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>Editar</button>
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
