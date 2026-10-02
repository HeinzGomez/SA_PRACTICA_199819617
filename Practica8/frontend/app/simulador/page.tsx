'use client';
// HeinzGomez - Práctica 7: simulador visual de la inscripción en ráfaga con Message Broker
import { useEffect, useRef, useState } from 'react';
import { estadoInicial, paso, PARAMETROS_DEFECTO, type EstadoRafaga, type ParametrosRafaga } from '@/lib/simulador';

const DT = 50;

export default function Simulador() {
  const [p, setP] = useState<ParametrosRafaga>(PARAMETROS_DEFECTO);
  const [s, setS] = useState<EstadoRafaga>(estadoInicial(PARAMETROS_DEFECTO));
  const [serie, setSerie] = useState<number[]>([]);
  const [corriendo, setCorriendo] = useState(false);
  const ref = useRef({ p, s });
  ref.current = { p, s };

  useEffect(() => {
    if (!corriendo) return;
    const t = setInterval(() => {
      const nuevo = paso(ref.current.p, ref.current.s, DT);
      setS(nuevo);
      setSerie((x) => [...x, nuevo.enCola]);
      if (nuevo.terminado) setCorriendo(false);
    }, 40);
    return () => clearInterval(t);
  }, [corriendo]);

  const reiniciar = (np = p) => { setCorriendo(false); setS(estadoInicial(np)); setSerie([]); };
  const num = (k: keyof ParametrosRafaga) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const np = { ...p, [k]: Math.max(1, Number(e.target.value)) };
    setP(np); reiniciar(np);
  };

  const maxY = Math.max(1, ...serie);
  const W = 600, H = 140;
  const puntos = serie.map((v, i) => `${(i / Math.max(serie.length - 1, 1)) * W},${H - (v / maxY) * (H - 10)}`).join(' ');

  return (
    <div className="pila">
      <h1>Simulador de inscripción en ráfaga</h1>
      <p className="muted">Miles de estudiantes presionan «Reservar» al abrir las inscripciones. El API Gateway responde 202 al instante,
        la cola <span className="mono">reservas.solicitudes</span> de RabbitMQ absorbe el pico y los consumidores del Servicio de Reservas
        la drenan a ritmo constante, descontando el cupo de forma atómica en Redis. Nunca se asignan más lugares que el cupo.</p>

      <section className="card filtros">
        <div><label htmlFor="s-sol">Solicitudes</label><input id="s-sol" type="number" value={p.solicitudes} onChange={num('solicitudes')} /></div>
        <div><label htmlFor="s-cupo">Cupo del evento</label><input id="s-cupo" type="number" value={p.cupo} onChange={num('cupo')} /></div>
        <div><label htmlFor="s-cons">Consumidores (workers)</label><input id="s-cons" type="number" value={p.consumidores} onChange={num('consumidores')} /></div>
        <div><label htmlFor="s-ms">ms por mensaje</label><input id="s-ms" type="number" value={p.msPorMensaje} onChange={num('msPorMensaje')} /></div>
        <div><label htmlFor="s-ven">Ventana de llegada (ms)</label><input id="s-ven" type="number" value={p.ventanaLlegadaMs} onChange={num('ventanaLlegadaMs')} /></div>
        <div className="fila">
          <button className="btn" onClick={() => { if (s.terminado) reiniciar(); setCorriendo((c) => !c); }}>{corriendo ? 'Pausar' : s.t ? 'Continuar' : 'Iniciar ráfaga'}</button>
          <button className="btn secundario" onClick={() => reiniciar()}>Reiniciar</button>
        </div>
      </section>

      <section className="card flujo" aria-label="Flujo productor-cola-consumidor">
        <div className="caja"><strong>Productor</strong><div className="pequeno muted">API Gateway → Reservas (gRPC)</div><div>{s.llegadas} solicitudes · 202</div></div>
        <div className="flecha">→</div>
        <div className="caja"><strong>RabbitMQ</strong><div className="pequeno muted">reservas.solicitudes</div><div>{s.enCola} en cola</div></div>
        <div className="flecha">→</div>
        <div className="caja"><strong>{p.consumidores} consumidores</strong><div className="pequeno muted">Lua atómico en Redis</div><div>{s.procesados} procesados</div></div>
      </section>

      <section className="metricas">
        <div className="metrica"><div className="valor">{(s.t / 1000).toFixed(2)} s</div><div className="etq">Tiempo simulado</div></div>
        <div className="metrica"><div className="valor">{s.confirmadas}</div><div className="etq">Confirmadas</div></div>
        <div className="metrica"><div className="valor">{s.rechazadasSinCupo}</div><div className="etq">Rechazadas (sin cupo)</div></div>
        <div className="metrica"><div className="valor">{s.cupoRestante}</div><div className="etq">Cupo restante</div></div>
        <div className="metrica"><div className="valor">{s.maxCola}</div><div className="etq">Profundidad máx. de cola</div></div>
      </section>

      <section className="card">
        <h2>Profundidad de la cola en el tiempo</h2>
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none" role="img" aria-label="Mensajes en cola por instante">
          <line x1="0" y1={H - 0.5} x2={W} y2={H - 0.5} stroke="var(--border)" />
          {serie.length > 1 && <polyline points={puntos} fill="none" stroke="var(--primary)" strokeWidth="2" vectorEffect="non-scaling-stroke" />}
        </svg>
        <p className="pequeno muted">
          {s.terminado
            ? `La cola se drenó por completo en ${(s.t / 1000).toFixed(2)} s: ${s.confirmadas} reservas confirmadas y ${s.rechazadasSinCupo} rechazadas, sin sobreventa.`
            : 'La curva sube mientras llegan solicitudes más rápido de lo que se procesan y baja cuando los consumidores la drenan.'}
        </p>
      </section>
    </div>
  );
}
