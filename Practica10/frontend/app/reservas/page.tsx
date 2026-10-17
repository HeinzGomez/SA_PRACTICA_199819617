'use client';
// HeinzGomez - Práctica 7: listado de reservas del estudiante
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useSesion } from '@/components/Sesion';
import { Alerta, Requiere } from '@/components/Ui';
import { ETIQUETA_ESTADO, ETIQUETA_MOTIVO, fechaCorta } from '@/lib/formato';
import type { Evento, Ticket } from '@/lib/types';

function Lista() {
  const { api, sesion } = useSesion();
  const [tickets, setTickets] = useState<Ticket[] | null>(null);
  const [eventos, setEventos] = useState<Map<string, Evento>>(new Map());
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    const cargar = () => api.misReservas(sesion!.token).then(setTickets).catch(setError);
    cargar();
    const t = setInterval(cargar, 2000);
    api.listarEventos().then((l) => setEventos(new Map(l.map((e) => [e.id, e])))).catch(() => undefined);
    return () => clearInterval(t);
  }, [api, sesion]);

  return (
    <div className="pila">
      <h1>Mis reservas</h1>
      <Alerta error={error} />
      {tickets === null ? <p className="muted">Cargando…</p> : tickets.length === 0 ? (
        <div className="card vacio">Aún no tienes reservas. <Link href="/">Explora el catálogo</Link>.</div>
      ) : (
        <div className="card scroll-x">
          <table className="tabla">
            <thead><tr><th>Ticket</th><th>Actividad</th><th>Tipo</th><th>Estado</th><th>Solicitado</th><th /></tr></thead>
            <tbody>
              {tickets.map((t) => {
                const ev = eventos.get(t.evento_id);
                return (
                  <tr key={t.id}>
                    <td className="mono">{t.id}</td>
                    <td>{ev?.titulo ?? t.evento_id}</td>
                    <td>{t.tipo === 'EXAMEN_CERTIFICACION' ? 'Examen' : 'Acreditación'}</td>
                    <td>
                      <span className={`chip ${t.estado === 'CONFIRMADA' ? 'ok' : t.estado === 'RECHAZADA' ? 'danger' : 'warn'}`}>{ETIQUETA_ESTADO[t.estado]}</span>
                      {t.motivo && <div className="pequeno muted">{ETIQUETA_MOTIVO[t.motivo] ?? t.motivo}</div>}
                    </td>
                    <td className="pequeno">{fechaCorta(t.creado_en)}</td>
                    <td><div className="fila">
                      <Link href={`/reservas/${t.id}`} className="btn secundario chico">Seguimiento</Link>
                      {t.estado === 'CONFIRMADA' && ev?.tiene_certificacion && <Link href={`/examen/${t.evento_id}`} className="btn chico">Examen</Link>}
                    </div></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function Pagina() {
  return <Requiere rol="ESTUDIANTE"><Lista /></Requiere>;
}
