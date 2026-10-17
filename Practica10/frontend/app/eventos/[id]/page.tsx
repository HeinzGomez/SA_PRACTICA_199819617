'use client';
// HeinzGomez - Práctica 7: detalle del evento y reserva de cupo (CDU 2.3, 2.4, 3.1, 3.2)
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useSesion } from '@/components/Sesion';
import { Alerta, BarraCupo, useCupos } from '@/components/Ui';
import { duracion, ETIQUETA_TIPO, fechaLarga } from '@/lib/formato';
import type { Evento, TipoReserva } from '@/lib/types';

export default function DetalleEvento() {
  const { id } = useParams<{ id: string }>();
  const { api, sesion } = useSesion();
  const router = useRouter();
  const cupos = useCupos();
  const [evento, setEvento] = useState<Evento | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [enviando, setEnviando] = useState<TipoReserva | null>(null);
  const [acepto, setAcepto] = useState(false);

  useEffect(() => { api.obtenerEvento(id).then(setEvento).catch(setError); }, [api, id]);

  if (error && !evento) return <Alerta error={error} />;
  if (!evento) return <p className="muted">Cargando…</p>;

  const c = cupos.get(evento.id);
  const disponible = c?.cupo_disponible ?? evento.cupo_disponible;
  const total = c?.cupo_total ?? evento.cupo_total;

  async function reservar(tipo: TipoReserva) {
    if (!sesion) { router.push(`/login?siguiente=/eventos/${id}`); return; }
    setEnviando(tipo);
    setError(null);
    try {
      const t = await api.solicitarReserva(sesion.token, evento!.id, tipo);
      router.push(`/reservas/${t.id}`);
    } catch (e) {
      setError(e);
      setEnviando(null);
    }
  }

  const esEstudiante = sesion?.usuario.rol === 'ESTUDIANTE';

  return (
    <div className="pila">
      <Link href="/" className="pequeno">← Volver al catálogo</Link>
      <div className="fila">
        <span className="chip primario">{ETIQUETA_TIPO[evento.tipo]}</span>
        {evento.tiene_certificacion && <span className="chip oro">Otorga diploma digital</span>}
        <span className="chip">{evento.curso_codigo} · {evento.curso_nombre}</span>
      </div>
      <h1>{evento.titulo}</h1>
      <p>{evento.descripcion}</p>

      <div className="grid">
        <section className="card pila">
          <h2>Información</h2>
          <p><strong>Fecha:</strong> {fechaLarga(evento.fecha_inicio)}<br />
            <strong>Duración:</strong> {duracion(evento.duracion_min)}<br />
            <strong>Lugar:</strong> {evento.lugar}</p>
          <div className="fila entre"><h3 style={{ margin: 0 }}>Cupo</h3><span className="en-vivo">En vivo</span></div>
          <BarraCupo disponible={disponible} total={total} />
        </section>

        <section className="card pila">
          <h2>Ponente</h2>
          <p><strong>{evento.ponente.nombre}</strong><br /><span className="muted">{evento.ponente.titulo}</span></p>
          <p className="pequeno">{evento.ponente.bio}</p>
          {evento.ponente.correo && <p className="pequeno"><a href={`mailto:${evento.ponente.correo}`}>{evento.ponente.correo}</a></p>}
        </section>

        <section className="card pila">
          <h2>Prerrequisitos</h2>
          {evento.prerrequisitos.length ? (
            <ul style={{ margin: 0, paddingLeft: 18 }}>{evento.prerrequisitos.map((p) => <li key={p}>{p}</li>)}</ul>
          ) : <p className="muted">Esta actividad no tiene prerrequisitos.</p>}
        </section>
      </div>

      <section className="card pila">
        <h2>Reservar cupo</h2>
        <p className="muted pequeno">
          Tu solicitud se encola y se procesa en orden de llegada. Recibirás un ticket de inmediato y podrás ver cómo pasa de
          «En cola» a «Confirmada» o «Rechazada» sin tener que recargar la página.
        </p>
        {!sesion && <div className="alerta info">Debes <Link href={`/login?siguiente=/eventos/${id}`}>ingresar</Link> con tu cuenta de estudiante para reservar.</div>}
        {sesion && !esEstudiante && <div className="alerta info">Las reservas solo están disponibles para estudiantes.</div>}
        {esEstudiante && (
          <>
            {evento.prerrequisitos.length > 0 && (
              <label className="opcion">
                <input type="checkbox" checked={acepto} onChange={(e) => setAcepto(e.target.checked)} />
                Confirmo que cumplo los prerrequisitos de la actividad
              </label>
            )}
            <div className="fila">
              <button className="btn" disabled={!!enviando || disponible <= 0 || (evento.prerrequisitos.length > 0 && !acepto)} onClick={() => reservar('ACREDITACION')}>
                {enviando === 'ACREDITACION' ? 'Enviando…' : 'Reservar cupo de acreditación'}
              </button>
              {evento.tiene_certificacion && (
                <button className="btn secundario" disabled={!!enviando || disponible <= 0 || (evento.prerrequisitos.length > 0 && !acepto)} onClick={() => reservar('EXAMEN_CERTIFICACION')}>
                  {enviando === 'EXAMEN_CERTIFICACION' ? 'Enviando…' : 'Reservar examen de certificación'}
                </button>
              )}
            </div>
            {disponible <= 0 && <p className="pequeno muted">No quedan cupos disponibles para esta actividad.</p>}
          </>
        )}
        <Alerta error={error} />
      </section>
    </div>
  );
}
