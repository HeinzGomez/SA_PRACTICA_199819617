'use client';
// HeinzGomez - Práctica 7: consulta de diplomas del estudiante con filtros (CDU 4.1, 4.2)
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useSesion } from '@/components/Sesion';
import { Alerta, Requiere } from '@/components/Ui';
import { fechaCorta, hashCorto } from '@/lib/formato';
import type { Certificado, FiltroCertificados } from '@/lib/types';

function Lista() {
  const { api, sesion } = useSesion();
  const [certs, setCerts] = useState<Certificado[] | null>(null);
  const [cursos, setCursos] = useState<[string, string][]>([]);
  const [filtro, setFiltro] = useState<FiltroCertificados>({});
  const [error, setError] = useState<unknown>(null);
  const [copiado, setCopiado] = useState('');

  useEffect(() => {
    api.listarEventos().then((l) => {
      const m = new Map<string, string>();
      l.forEach((e) => m.set(e.curso_codigo, e.curso_nombre));
      setCursos([...m.entries()]);
    }).catch(() => undefined);
  }, [api]);
  useEffect(() => { api.misCertificados(sesion!.token, filtro).then(setCerts).catch(setError); }, [api, sesion, filtro]);

  const set = (k: keyof FiltroCertificados) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setFiltro((f) => ({ ...f, [k]: e.target.value || undefined }));

  async function copiar(h: string) {
    try { await navigator.clipboard.writeText(h); setCopiado(h); setTimeout(() => setCopiado(''), 1500); } catch { /* */ }
  }

  return (
    <div className="pila">
      <h1>Mis diplomas</h1>
      <section className="card filtros">
        <div><label htmlFor="c-curso">Curso</label>
          <select id="c-curso" value={filtro.curso ?? ''} onChange={set('curso')}>
            <option value="">Todos</option>
            {cursos.map(([c, n]) => <option key={c} value={c}>{c} · {n}</option>)}
          </select></div>
        <div><label htmlFor="c-desde">Emitido desde</label><input id="c-desde" type="date" value={filtro.desde ?? ''} onChange={set('desde')} /></div>
        <div><label htmlFor="c-hasta">Emitido hasta</label><input id="c-hasta" type="date" value={filtro.hasta ?? ''} onChange={set('hasta')} /></div>
        <div><button className="btn secundario" style={{ width: '100%' }} onClick={() => setFiltro({})}>Limpiar</button></div>
      </section>
      <Alerta error={error} />
      {certs === null ? <p className="muted">Cargando…</p> : certs.length === 0 ? (
        <div className="card vacio">No tienes diplomas con esos filtros. Aprueba un examen de certificación para obtener uno.</div>
      ) : (
        <div className="grid">
          {certs.map((c) => (
            <article key={c.id} className="card pila">
              <div className="fila entre"><span className="chip oro">Diploma digital</span><span className="pequeno muted">{fechaCorta(c.emitido_en)}</span></div>
              <h3 style={{ margin: 0 }}>{c.evento_titulo}</h3>
              <p className="pequeno muted" style={{ margin: 0 }}>{c.curso_codigo} · {c.curso_nombre} · Nota {c.nota}</p>
              <div className="mono">{c.id}<br />SHA-256 {hashCorto(c.codigo_hash)}</div>
              <div className="fila">
                <Link href={`/certificados/${c.id}`} className="btn chico">Ver diploma</Link>
                <button className="btn secundario chico" onClick={() => copiar(c.codigo_hash)}>{copiado === c.codigo_hash ? 'Copiado ✓' : 'Copiar hash'}</button>
                <Link href={`/verificar?codigo=${c.id}`} className="btn secundario chico">Verificar</Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Pagina() {
  return <Requiere rol="ESTUDIANTE"><Lista /></Requiere>;
}
