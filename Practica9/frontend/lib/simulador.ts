// HeinzGomez - Práctica 7: simulación didáctica de la ráfaga de inscripciones.
// Con Message Broker el API responde 202 al instante, la cola absorbe el pico de llegadas y
// N consumidores la drenan a ritmo constante sin sobre-vender el cupo.
export interface ParametrosRafaga {
  solicitudes: number;       // estudiantes que presionan "Reservar" casi al mismo tiempo
  cupo: number;
  consumidores: number;      // réplicas del worker de Reservas
  msPorMensaje: number;      // tiempo de procesamiento de un mensaje por consumidor
  ventanaLlegadaMs: number;  // en cuánto tiempo llegan todas las solicitudes
}

export interface EstadoRafaga {
  t: number;
  llegadas: number;
  enCola: number;
  procesados: number;
  confirmadas: number;
  rechazadasSinCupo: number;
  cupoRestante: number;
  maxCola: number;
  terminado: boolean;
}

export const PARAMETROS_DEFECTO: ParametrosRafaga = {
  solicitudes: 5000, cupo: 250, consumidores: 8, msPorMensaje: 12, ventanaLlegadaMs: 2000,
};

export function estadoInicial(p: ParametrosRafaga): EstadoRafaga {
  return { t: 0, llegadas: 0, enCola: 0, procesados: 0, confirmadas: 0, rechazadasSinCupo: 0, cupoRestante: p.cupo, maxCola: 0, terminado: false };
}

/** Avanza la simulación dt milisegundos (determinista). */
export function paso(p: ParametrosRafaga, s: EstadoRafaga, dt: number): EstadoRafaga {
  const t = s.t + dt;
  const llegadasTotales = Math.min(p.solicitudes, Math.floor((p.solicitudes * t) / p.ventanaLlegadaMs));
  const nuevas = llegadasTotales - s.llegadas;
  let enCola = s.enCola + nuevas;
  const capacidad = Math.floor((p.consumidores * t) / p.msPorMensaje) - Math.floor((p.consumidores * s.t) / p.msPorMensaje);
  const drenados = Math.min(enCola, capacidad);
  enCola -= drenados;
  const confirmar = Math.min(drenados, s.cupoRestante);
  const r: EstadoRafaga = {
    t,
    llegadas: llegadasTotales,
    enCola,
    procesados: s.procesados + drenados,
    confirmadas: s.confirmadas + confirmar,
    rechazadasSinCupo: s.rechazadasSinCupo + (drenados - confirmar),
    cupoRestante: s.cupoRestante - confirmar,
    maxCola: Math.max(s.maxCola, enCola),
    terminado: false,
  };
  r.terminado = r.llegadas === p.solicitudes && r.enCola === 0;
  return r;
}

export function simularCompleto(p: ParametrosRafaga, dt = 50): EstadoRafaga {
  let s = estadoInicial(p);
  for (let i = 0; i < 100_000 && !s.terminado; i++) s = paso(p, s, dt);
  return s;
}
