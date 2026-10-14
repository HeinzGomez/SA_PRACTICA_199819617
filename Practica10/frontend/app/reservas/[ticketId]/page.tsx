'use client';
// HeinzGomez - Práctica 7: seguimiento del ticket asíncrono (productor -> cola -> consumidor), CDU 3.1 / 3.3
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useSesion } from '@/components/Sesion';
import { Alerta, Requiere } from '@/components/Ui';
import { ETIQUETA_MOTIVO, fechaCorta } from '@/lib/formato';
import type { Evento, Ticket } from '@/lib/types';

function Seguimiento() {
  const { ticketId } = useParams<{ ticketId: string }>();
  const { api, sesion } = useSesion();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [evento, setEvento] = useState<Evento | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [consultas, setConsultas] = useState(0);

  useEffect(() => {
    let vivo = true;
    let t: ReturnType<typeof setTimeout>;
    const consultar = async () => {
      try {
        const tk = await api.consultarTicket(sesion!.token, ticketId);
        if (!vivo) return;
        setTicket(tk);
        setConsultas((n) => n + 1);
        if (tk.estado === 'PENDIENTE') t = setTimeout(consultar, 700);
      } catch (e) { if (vivo) setError(e); }
    };
    consultar();
    return () => { vivo = false; clearTimeout(t); };
  }, [api, sesion, ticketId]);

  useEffect(() => {
    if (ticket) api.obtenerEvento(ticket.evento_id).then(setEvento).catch(() => undefined);
  }, [api, ticket?.evento_id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (error) return <Alerta error={error} />;
  if (!ticket) return <p className="muted">Consultando ticket…</p>;

  const final = ticket.estado !== 'PENDIENTE';
  const ok = ticket.estado === 'CONFIRMADA';
  const pasos = [
    { t: 'Solicitud recibida (HTTP 202)', d: `Ticket ${ticket.id} emitido el ${fechaCorta(ticket.creado_en)}`, s: 'hecho' },
    { t: 'Publicada en la cola reservas.solicitudes', d: 'El API Gateway no espera la transacción: el mensaje queda persistido en RabbitMQ.', s: 'hecho' },
    { t: 'Consumidor validando cupo', d: 'Un worker del Servicio de Reservas descuenta el cupo con una operación atómica en Redis.', s: final ? 'hecho' : 'actual' },
    {
      t: final ? (ok ? 'Reserva confirmada' : 'Reserva rechazada') : 'Resultado',
      d: final ? (ok ? `Quedan ${ticket.cupo_restante} cupos en la actividad.` : ETIQUETA_MOTIVO[ticket.motivo] ?? ticket.motivo) : 'Esperando al consumidor…',
      s: final ? (ok ? 'hecho' : 'error') : '',
    },
  ];

  return (
    <div className="pila" style={{ maxWidth: 720 }}>
      <Link href="/reservas" className="pequeno">← Mis reservas</Link>
      <h1>Ticket de reserva</h1>
      {evento && <p className="muted">{evento.titulo}</p>}
      <section className="card">
        <div className="fila entre" style={{ marginBottom: 8 }}>
          <span className="mono">{ticket.id}</span>
          <span className={`chip ${ok ? 'ok' : final ? 'danger' : 'warn'}`}>{ok ? 'Confirmada' : final ? 'Rechazada' : 'En cola'}</span>
        </div>
        <ol className="pasos">
          {pasos.map((p, i) => (
            <li key={p.t} className={p.s}>
              <span className="punto">{p.s === 'hecho' ? '✓' : p.s === 'error' ? '✕' : i + 1}</span>
              <div><div className="titulo">{p.t}</div><div className="pequeno muted">{p.d}</div></div>
            </li>
          ))}
        </ol>
        <p className="pequeno muted" style={{ marginTop: 8 }}>
          Tipo: {ticket.tipo === 'EXAMEN_CERTIFICACION' ? 'Examen de certificación' : 'Acreditación'} · Consultas de estado: {consultas}
        </p>
      </section>
      {ok && evento?.tiene_certificacion && (
        <div className="alerta ok">
          Ya puedes rendir el examen de certificación de esta actividad. <Link href={`/examen/${evento.id}`}>Ir al examen →</Link>
        </div>
      )}
      {final && !ok && <Link href="/" className="btn secundario">Buscar otra actividad</Link>}
    </div>
  );
}

export default function Pagina() {
  return <Requiere><Seguimiento /></Requiere>;
}
