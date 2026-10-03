'use client';
// HeinzGomez - Práctica 7: examen de certificación y emisión del diploma (CDU 3.4 - 3.7)
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useSesion } from '@/components/Sesion';
import { Alerta, Requiere } from '@/components/Ui';
import type { Certificado, Evento, Examen, ResultadoExamen } from '@/lib/types';

function PaginaExamen() {
  const { eventoId } = useParams<{ eventoId: string }>();
  const { api, sesion } = useSesion();
  const [evento, setEvento] = useState<Evento | null>(null);
  const [examen, setExamen] = useState<Examen | null>(null);
  const [respuestas, setRespuestas] = useState<Record<string, string>>({});
  const [resultado, setResultado] = useState<ResultadoExamen | null>(null);
  const [cert, setCert] = useState<Certificado | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [ocupado, setOcupado] = useState(false);
  const [iniciado, setIniciado] = useState(false);

  useEffect(() => { api.obtenerEvento(eventoId).then(setEvento).catch(setError); }, [api, eventoId]);

  async function iniciar() {
    setError(null);
    try { setExamen(await api.obtenerExamen(sesion!.token, eventoId)); setIniciado(true); } catch (e) { setError(e); }
  }

  async function enviar() {
    setOcupado(true); setError(null);
    try { setResultado(await api.rendirExamen(sesion!.token, eventoId, respuestas)); } catch (e) { setError(e); }
    setOcupado(false);
  }

  async function generar() {
    setOcupado(true); setError(null);
    try { setCert(await api.generarCertificado(sesion!.token, eventoId)); } catch (e) { setError(e); }
    setOcupado(false);
  }

  const completas = examen && examen.preguntas.every((p) => respuestas[p.id]);

  return (
    <div className="pila" style={{ maxWidth: 780 }}>
      <Link href="/reservas" className="pequeno">← Mis reservas</Link>
      <h1>Examen de certificación</h1>
      {evento && <p className="muted">{evento.titulo} · {evento.curso_codigo} {evento.curso_nombre}</p>}

      {!iniciado && (
        <section className="card pila">
          <p>El examen tiene 5 preguntas de opción múltiple. Se aprueba con nota mínima de 70 y se permiten hasta 3 intentos.
            Para rendirlo debes tener una reserva <strong>confirmada</strong> en esta actividad.</p>
          <button className="btn" onClick={iniciar}>Iniciar examen</button>
          <Alerta error={error} />
        </section>
      )}

      {examen && !resultado && (
        <form className="pila" onSubmit={(e) => { e.preventDefault(); enviar(); }}>
          {examen.preguntas.map((p, i) => (
            <fieldset key={p.id} className="pregunta">
              <legend className="titulo" style={{ fontWeight: 600 }}>{i + 1}. {p.enunciado}</legend>
              {p.opciones.map((o) => (
                <label key={o.id} className="opcion">
                  <input type="radio" name={p.id} value={o.id} checked={respuestas[p.id] === o.id}
                    onChange={() => setRespuestas((r) => ({ ...r, [p.id]: o.id }))} />
                  {o.texto}
                </label>
              ))}
            </fieldset>
          ))}
          <Alerta error={error} />
          <button className="btn" type="submit" disabled={!completas || ocupado}>{ocupado ? 'Calificando…' : 'Enviar respuestas'}</button>
        </form>
      )}

      {resultado && (
        <section className="card pila">
          <div className={`alerta ${resultado.aprobado ? 'ok' : 'error'}`}>
            {resultado.aprobado ? '¡Aprobaste!' : 'No alcanzaste la nota mínima.'} Nota: <strong>{resultado.nota}</strong> ({resultado.correctas}/{resultado.total} correctas)
          </div>
          {resultado.aprobado && !cert && <button className="btn" onClick={generar} disabled={ocupado}>{ocupado ? 'Firmando…' : 'Generar diploma digital'}</button>}
          {!resultado.aprobado && (
            <button className="btn secundario" onClick={() => { setResultado(null); setRespuestas({}); }}>Intentar de nuevo</button>
          )}
          {cert && (
            <div className="alerta ok pila">
              <div>Diploma emitido y firmado digitalmente.</div>
              <div className="mono">ID: {cert.id}<br />SHA-256: {cert.codigo_hash}</div>
              <div className="fila">
                <Link className="btn chico" href={`/certificados/${cert.id}`}>Ver diploma</Link>
                <Link className="btn secundario chico" href={`/verificar?codigo=${cert.codigo_hash}`}>Verificar públicamente</Link>
              </div>
            </div>
          )}
          <Alerta error={error} />
        </section>
      )}
    </div>
  );
}

export default function Pagina() {
  return <Requiere rol="ESTUDIANTE"><PaginaExamen /></Requiere>;
}
