'use client';
// HeinzGomez - Práctica 9: examen de certificación y emisión del diploma (CDU 3.4 - 3.7)
// El examen, la calificación y el diploma provienen del API Gateway (cola `certificados.rpc`).
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useSesion } from '@/components/Sesion';
import { Alerta, Requiere } from '@/components/Ui';
import { ApiError, type Certificado, type Evento, type Examen, type ResultadoExamen } from '@/lib/types';

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
    setOcupado(true); setError(null);
    try {
      setExamen(await api.obtenerExamen(sesion!.token, eventoId));
      setRespuestas({});
      setIniciado(true);
    } catch (e) { setError(e); }
    setOcupado(false);
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

  const preguntas = examen?.preguntas ?? [];
  const sinPreguntas = iniciado && preguntas.length === 0;
  const completas = preguntas.length > 0 && preguntas.every((p) => respuestas[p.id]);
  const notaMinima = examen?.nota_minima ?? 0;
  // 409 del servicio: el estudiante ya aprobó este examen y no puede rendirlo de nuevo.
  const yaAprobado = error instanceof ApiError && error.status === 409 && /ya fue aprobado/i.test(error.message);

  return (
    <div className="pila" style={{ maxWidth: 780 }}>
      <Link href="/reservas" className="pequeno">← Mis reservas</Link>
      <h1>Examen de certificación</h1>
      {evento && <p className="muted">{evento.titulo} · {evento.curso_codigo} {evento.curso_nombre}</p>}
      {yaAprobado && (
        <div className="alerta info">
          Ya aprobaste este examen. <Link href="/certificados">Consulta tu diploma digital →</Link>
        </div>
      )}

      {!iniciado && (
        <section className="card pila">
          <p>El examen se toma en línea con preguntas de opción múltiple y se aprueba con la nota mínima
            de la actividad. Para rendirlo debes tener una reserva <strong>confirmada</strong> en esta actividad.</p>
          <button className="btn" onClick={iniciar} disabled={ocupado}>{ocupado ? 'Cargando…' : 'Iniciar examen'}</button>
          <Alerta error={error} />
        </section>
      )}

      {iniciado && sinPreguntas && (
        <section className="card pila">
          <div className="alerta info">Este examen todavía no tiene preguntas publicadas. Pídele al administrador
            de la actividad que las registre e intenta de nuevo.</div>
          <button className="btn secundario" onClick={iniciar} disabled={ocupado}>Reintentar</button>
        </section>
      )}

      {examen && !resultado && preguntas.length > 0 && (
        <form className="pila" onSubmit={(e) => { e.preventDefault(); enviar(); }}>
          <p className="pequeno muted">
            {preguntas.length} pregunta{preguntas.length === 1 ? '' : 's'} · nota mínima {notaMinima}
          </p>
          {preguntas.map((p, i) => (
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
          {resultado.aprobado && !cert && (
            <button className="btn" onClick={generar} disabled={ocupado}>{ocupado ? 'Firmando…' : 'Generar diploma digital'}</button>
          )}
          {!resultado.aprobado && (
            <button className="btn secundario" onClick={() => { setResultado(null); setRespuestas({}); setError(null); }}>Intentar de nuevo</button>
          )}
          {cert && (
            <div className="alerta ok pila">
              <div>Diploma emitido y firmado digitalmente.</div>
              <div className="mono">ID: {cert.id}{cert.codigo_hash ? <><br />SHA-256: {cert.codigo_hash}</> : null}</div>
              <div className="fila">
                <Link className="btn chico" href={`/certificados/${cert.id}`}>Ver diploma</Link>
                <Link className="btn secundario chico" href={`/verificar?codigo=${encodeURIComponent(cert.codigo_hash || cert.id)}`}>Verificar públicamente</Link>
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
