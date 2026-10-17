'use client';
// HeinzGomez - Práctica 10: simulador de inscripción en ráfaga REAL (solo administradores).
// Prepara un evento de pruebas (o reutiliza uno existente) y dispara N solicitudes de reserva
// reales contra el API Gateway dentro de una ventana de tiempo: el Gateway responde 202 al
// instante (ticket PENDIENTE), la cola absorbe el pico y los workers del Servicio de Reservas
// la drenan descontando el cupo de forma atómica en Redis. La profundidad de cola y el ritmo
// de los workers se observan en el dashboard de Grafana (jobs rabbitmq y reservas-service).
// Modo "usuarios de prueba" (dos fases): la fase A crea N cuentas ESTUDIANTE reales en paralelo
// (registro vía /api/auth/register) y la fase B dispara una reserva por usuario con su propio
// JWT: cada solicitud ocupa cupo de verdad y supera el chequeo de duplicados de Redis (que
// impedía que una sola cuenta confirmara más de un lugar en el mismo evento).
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSesion } from '@/components/Sesion';
import { Alerta, Requiere, useCupos } from '@/components/Ui';
import type { Evento } from '@/lib/types';
import { fechaCorta } from '@/lib/formato';

const DT_DISPARO = 40;          // cada cuántos ms se revisa cuántas solicitudes toca disparar
const INTERVALO_SONDEO = 400;   // cada cuántos ms se consultan los tickets PENDIENTES
const CONCURRENCIA_SONDEO = 8;  // consultas de ticket en paralelo
const CONCURRENCIA_REGISTRO = 8; // cuentas de prueba creadas en paralelo (fase A)
const PASSWORD_RAFAGA = 'RafagaDemo2026';
const DOMINIO_RAFAGA = 'ingenieria.usac.edu.gt';
const WORKERS_ESTIMADO = 4;     // WORKERS del servicio de Reservas en docker-compose

interface Params {
  solicitudes: number;
  ventanaLlegadaMs: number;
  msPorMensaje: number;
  usuariosFalsos: boolean; // fase A: crear N estudiantes de prueba antes de la ráfaga
}

const PARAMETROS: Params = { solicitudes: 300, ventanaLlegadaMs: 2000, msPorMensaje: 12, usuariosFalsos: true };

type EstadoRafaga = 'inactivo' | 'poblando' | 'disparando' | 'drenando' | 'terminado';

interface Vista {
  estado: EstadoRafaga;
  enviadas: number;
  aceptadas: number;      // 202 con ticket PENDIENTE encolado
  httpRechazadas: number; // 429 u otros errores del gateway
  confirmadas: number;
  rechazadas: number;     // sin cupo
  pendientes: number;
  inicioMs: number;
  finMs: number | null;
  cupoRestante: number | null; // último cupo_restante visto en un ticket
  registrados: number;         // usuarios de prueba creados (fase A)
  registroFallidos: number;
}

const VISTA_INICIAL: Vista = {
  estado: 'inactivo', enviadas: 0, aceptadas: 0, httpRechazadas: 0,
  confirmadas: 0, rechazadas: 0, pendientes: 0, inicioMs: 0, finMs: null, cupoRestante: null,
  registrados: 0, registroFallidos: 0,
};

function Simulador() {
  const { api, sesion } = useSesion();
  const cupos = useCupos();
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [eventoId, setEventoId] = useState('');
  const [p, setP] = useState<Params>(PARAMETROS);
  const [vista, setVista] = useState<Vista>(VISTA_INICIAL);
  const [crearTitulo, setCrearTitulo] = useState('Ráfaga de pruebas');
  const [crearCupo, setCrearCupo] = useState('250');
  const [error, setError] = useState<unknown>(null);
  const cancelarRef = useRef<(() => void) | null>(null);
  const corriendo = vista.estado === 'poblando' || vista.estado === 'disparando' || vista.estado === 'drenando';

  const refrescar = useCallback(async () => {
    try { setEventos(await api.listarEventos()); } catch (e) { setError(e); }
  }, [api]);
  useEffect(() => { void refrescar(); }, [refrescar]);
  useEffect(() => () => cancelarRef.current?.(), []);

  const evento = eventos.find((e) => e.id === eventoId) ?? null;
  const cupoVivo = cupos.get(eventoId)?.cupo_disponible ?? evento?.cupo_disponible ?? 0;
  const cupoRestante = vista.estado === 'inactivo' ? cupoVivo : (vista.cupoRestante ?? cupoVivo);

  const crearEventoPruebas = async () => {
    if (!sesion) return;
    try {
      const e = await api.crearEvento(sesion.token, {
        titulo: crearTitulo.trim() || 'Ráfaga de pruebas',
        descripcion: 'Evento de pruebas para la demostración de la ráfaga de inscripciones.',
        tipo: 'TALLER',
        curso_codigo: '0970',
        curso_nombre: 'Software Avanzado',
        fecha_inicio: new Date(Date.now() + 3_600_000).toISOString(),
        duracion_min: 90,
        lugar: 'Laboratorio de pruebas',
        cupo_total: Math.min(5000, Math.max(1, Math.round(Number(crearCupo)) || 250)),
        tiene_certificacion: false,
        ponente: { nombre: 'Equipo Academix', titulo: '', bio: '', correo: '' },
        prerrequisitos: [],
      });
      await refrescar();
      setEventoId(e.id);
      setVista(VISTA_INICIAL);
    } catch (err) { setError(err); }
  };

  const iniciar = () => {
    if (!evento || !sesion || corriendo) return;
    setError(null);
    const tokenAdmin = sesion.token;
    const destino = evento.id;
    const total = Math.max(1, Math.round(p.solicitudes));
    const ventana = Math.max(200, p.ventanaLlegadaMs);
    const conUsuarios = p.usuariosFalsos;

    // Estado mutable de la ráfaga, vivo en el cierre de los intervalos.
    let cancelado = false;
    let disparadas = 0, aceptadas = 0, httpRechazadas = 0, confirmadas = 0, rechazadas = 0;
    let enviando = 0, sondeando = false;
    let registrados = 0, registroFallidos = 0;
    let cupoRestanteTk: number | null = null;
    const pendientes = new Set<string>();
    const tokens: string[] = []; // tokens[i] = JWT del estudiante i (o el del admin sin usuarios de prueba)
    const inicioMs = Date.now();
    let finMs: number | null = null;
    let idDisparo = 0, idSondeo = 0;

    const pintar = (estado: EstadoRafaga) => setVista({
      estado, enviadas: disparadas, aceptadas, httpRechazadas, confirmadas, rechazadas,
      pendientes: pendientes.size, inicioMs, finMs, cupoRestante: cupoRestanteTk,
      registrados, registroFallidos,
    });

    const detener = () => {
      clearInterval(idDisparo);
      clearInterval(idSondeo);
      cancelarRef.current = null;
    };

    const terminar = () => {
      if (finMs !== null) return;
      finMs = Date.now();
      detener();
      pintar('terminado');
    };

    const fallar = (err: unknown) => {
      if (cancelado) return;
      cancelado = true;
      finMs = Date.now();
      detener();
      setError(err);
      pintar('terminado');
    };

    const revisarFin = () => {
      if (disparadas >= total && pendientes.size === 0 && enviando === 0 && !sondeando) terminar();
    };

    const enviarUna = async (tokenEnvio: string) => {
      enviando += 1;
      try {
        const tk = await api.solicitarReserva(tokenEnvio, destino, 'ACREDITACION');
        aceptadas += 1;
        if (tk.estado === 'PENDIENTE') pendientes.add(tk.id);
        else if (tk.estado === 'CONFIRMADA') { confirmadas += 1; if (tk.cupo_restante >= 0) cupoRestanteTk = tk.cupo_restante; }
        else { rechazadas += 1; if (tk.cupo_restante >= 0) cupoRestanteTk = tk.cupo_restante; }
      } catch {
        httpRechazadas += 1; // p. ej. 429 u otros errores del gateway
      } finally {
        enviando -= 1;
        revisarFin();
      }
    };

    const estadoActual = (): EstadoRafaga => {
      if (finMs !== null) return 'terminado';
      return disparadas >= total ? 'drenando' : 'disparando';
    };

    // Fase A: crea N cuentas ESTUDIANTE en paralelo; cada una tendrá su propio JWT.
    const poblar = () => new Promise<void>((listo) => {
      const sello = Date.now();
      let siguiente = 0, enVuelo = 0;
      const arrancar = () => {
        while (!cancelado && enVuelo < CONCURRENCIA_REGISTRO && siguiente < total) {
          const i = siguiente++;
          enVuelo += 1;
          api.register({
            nombre: `Ráfaga Demo ${i + 1}`,
            carnet: String(900_000_000 + (i % 99_999_999)),
            correo: `rafaga-${sello}-${i}@${DOMINIO_RAFAGA}`,
            password: PASSWORD_RAFAGA,
          }).then((s) => {
            tokens[i] = s.token;
            registrados += 1;
          }).catch((e) => {
            registroFallidos += 1;
            fallar(e);
          }).finally(() => {
            enVuelo -= 1;
            if (registrados > 0 && registrados % 25 === 0) pintar('poblando');
            if (cancelado || (siguiente >= total && enVuelo === 0)) listo();
            else arrancar();
          });
        }
        if (siguiente >= total && enVuelo === 0) listo();
      };
      arrancar();
    });

    // Fase B: el escalonado usa t0 (inicio del disparo), no el inicio de la población.
    const disparar = () => {
      const t0 = Date.now();
      idDisparo = window.setInterval(() => {
        const transcurrido = Date.now() - t0;
        const deberian = Math.min(total, Math.floor((total * transcurrido) / ventana));
        while (disparadas < deberian) {
          const i = disparadas;
          disparadas += 1;
          void enviarUna(tokens[i] ?? tokenAdmin);
        }
        pintar(estadoActual());
        revisarFin();
      }, DT_DISPARO);

      idSondeo = window.setInterval(() => {
        if (pendientes.size === 0 || sondeando) { revisarFin(); return; }
        sondeando = true;
        const lote = [...pendientes].slice(0, CONCURRENCIA_SONDEO);
        void Promise.all(lote.map(async (id) => {
          try {
            const tk = await api.consultarTicket(tokenAdmin, id);
            if (tk.estado !== 'PENDIENTE') {
              pendientes.delete(id);
              if (tk.estado === 'CONFIRMADA') confirmadas += 1; else rechazadas += 1;
              if (tk.cupo_restante >= 0) cupoRestanteTk = tk.cupo_restante;
            }
          } catch { /* el próximo sondeo reintenta */ }
        })).then(() => {
          sondeando = false;
          pintar(estadoActual());
          revisarFin();
        });
      }, INTERVALO_SONDEO);
    };

    cancelarRef.current = () => { cancelado = true; detener(); };

    if (!conUsuarios) {
      for (let i = 0; i < total; i++) tokens[i] = tokenAdmin;
      pintar('disparando');
      disparar();
      return;
    }

    pintar('poblando');
    void poblar().then(() => {
      if (cancelado || registroFallidos > 0 || registrados < total) return; // fallar() ya manejó el error
      disparar();
    });
  };

  const reiniciar = () => {
    cancelarRef.current?.();
    cancelarRef.current = null;
    setVista(VISTA_INICIAL);
  };

  const num = (k: keyof Params, min: number, max: number) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const np = { ...p, [k]: Math.min(max, Math.max(min, Number(e.target.value) || min)) };
      setP(np);
    };

  const segundos = vista.estado === 'inactivo'
    ? 0
    : ((vista.finMs ?? Date.now()) - vista.inicioMs) / 1000;
  const msgPorSegundo = WORKERS_ESTIMADO * Math.round(1000 / Math.max(1, p.msPorMensaje));

  return (
    <div className="pila">
      <h1>Simulador de inscripción en ráfaga</h1>
      <p className="muted">Dispara solicitudes de reserva <strong>reales</strong> contra el API Gateway.
        El Gateway responde 202 al instante con un ticket PENDIENTE, la cola de RabbitMQ absorbe el pico
        y los workers del Servicio de Reservas la drenan descontando el cupo de forma atómica en Redis:
        nunca se asignan más lugares que el cupo. La profundidad de cola y el ritmo de los workers
        se visualizan en el dashboard de Grafana.</p>

      <section className="card">
        <h2>Paso 1 — Evento de pruebas</h2>
        <div className="fila abajo">
          <div className="sim-campo">
            <label htmlFor="ev-sel">Evento existente</label>
            <select id="ev-sel" value={eventoId} onChange={(e) => { setEventoId(e.target.value); reiniciar(); }}>
              <option value="">— Selecciona un evento —</option>
              {eventos.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.titulo} · cupo {cupos.get(ev.id)?.cupo_disponible ?? ev.cupo_disponible}/{ev.cupo_total}
                </option>
              ))}
            </select>
          </div>
          <button className="btn secundario" onClick={() => void refrescar()}>Actualizar</button>
        </div>
        {evento && (
          <p className="pequeno muted">
            Seleccionado: <strong>{evento.titulo}</strong> · {fechaCorta(evento.fecha_inicio)} ·
            cupo {cupoVivo}/{evento.cupo_total}
          </p>
        )}

        <div className="fila abajo">
          <div className="sim-campo">
            <label htmlFor="ev-tit">Título del evento de pruebas</label>
            <input id="ev-tit" value={crearTitulo} onChange={(e) => setCrearTitulo(e.target.value)} />
          </div>
          <div className="sim-campo" style={{ flex: '0 0 120px' }}>
            <label htmlFor="ev-cupo">Cupo</label>
            <input id="ev-cupo" type="number" min={1} max={5000} value={crearCupo}
              onChange={(e) => setCrearCupo(e.target.value)} />
          </div>
          <button className="btn secundario" onClick={() => void crearEventoPruebas()}>Crear y seleccionar</button>
        </div>
        <p className="pequeno muted">Se crea un TALLER de 0970 con fecha en una hora; el cupo inicializa también su contador en Redis.</p>
      </section>

      <section className="card">
        <h2>Paso 2 — Ráfaga</h2>
        <div className="casilla">
          <input id="s-falsos" type="checkbox" checked={p.usuariosFalsos} disabled={corriendo}
            onChange={(e) => setP({ ...p, usuariosFalsos: e.target.checked })} />
          <label htmlFor="s-falsos">Crear {p.solicitudes} usuarios de prueba (una reserva por estudiante)</label>
        </div>
        <p className="pequeno muted">
          Con usuarios de prueba cada solicitud ocupa cupo de verdad; sin ellos, solo la primera de tu cuenta de admin confirma.
        </p>
        <div className="fila abajo">
          <div className="sim-campo">
            <label htmlFor="s-sol">Solicitudes</label>
            <input id="s-sol" type="number" min={1} value={p.solicitudes}
              disabled={corriendo} onChange={num('solicitudes', 1, 1_000_000)} />
          </div>
          <div className="sim-campo">
            <label htmlFor="s-ven">Ventana de llegada (ms)</label>
            <input id="s-ven" type="number" min={200} max={60000} value={p.ventanaLlegadaMs}
              disabled={corriendo} onChange={num('ventanaLlegadaMs', 200, 60000)} />
          </div>
          <div className="sim-campo">
            <label htmlFor="s-ms">ms por mensaje (est. workers)</label>
            <input id="s-ms" type="number" min={1} max={1000} value={p.msPorMensaje}
              disabled={corriendo} onChange={num('msPorMensaje', 1, 1000)} />
          </div>
        </div>
        <p className="pequeno muted">Ritmo estimado de los workers: ≈ {msgPorSegundo} msg/s ({WORKERS_ESTIMADO} workers × {p.msPorMensaje} ms).</p>
        <div className="fila">
          <button className="btn" disabled={!evento || corriendo} onClick={iniciar}>
            {corriendo ? (vista.estado === 'poblando' ? 'Creando usuarios…' : 'Ráfaga en curso…') : 'Iniciar ráfaga'}
          </button>
          <button className="btn secundario" disabled={!corriendo && vista.estado === 'inactivo'} onClick={reiniciar}>
            Reiniciar
          </button>
        </div>
      </section>

      <section className="metricas">
        <div className="metrica"><div className="valor">{segundos.toFixed(2)} s</div><div className="etq">Tiempo</div></div>
        <div className="metrica"><div className="valor">{p.solicitudes}</div><div className="etq">Total de solicitudes</div></div>
        <div className="metrica"><div className="valor">{vista.confirmadas}</div><div className="etq">Confirmadas</div></div>
        <div className="metrica"><div className="valor">{vista.rechazadas}</div><div className="etq">Rechazadas</div></div>
        <div className="metrica"><div className="valor">{cupoRestante}</div><div className="etq">Cupo restante</div></div>
      </section>

      {vista.estado !== 'inactivo' && (
        <section className="card">
          <p>
            Enviadas <strong>{vista.enviadas}/{p.solicitudes}</strong> ·
            Aceptadas (202) <strong>{vista.aceptadas}</strong> ·
            Rechazadas HTTP <strong>{vista.httpRechazadas}</strong> ·
            Tickets por resolver <strong>{vista.pendientes}</strong>
            {vista.registrados > 0 && (
              <> · Usuarios creados <strong>{vista.registrados}{vista.registroFallidos > 0 ? ` (${vista.registroFallidos} fallos)` : ''}</strong></>
            )}
          </p>
          <p className="pequeno muted">
            {vista.estado === 'poblando' && `Fase A — creando usuarios de prueba: ${vista.registrados}/${p.solicitudes} (bcrypt en auth-service, unos segundos)…`}
            {vista.estado === 'disparando' && 'Fase B — disparando solicitudes contra el API Gateway…'}
            {vista.estado === 'drenando' && 'Solicitudes disparadas: los workers están drenando la cola (sigue el progreso en Grafana).'}
            {vista.estado === 'terminado' &&
              `Ráfaga completa en ${segundos.toFixed(2)} s: ${vista.confirmadas} confirmadas y ${vista.rechazadas} rechazadas, sin sobreventa${vista.registrados > 0 ? ` (con ${vista.registrados} estudiantes distintos)` : ''}.`}
          </p>
        </section>
      )}

      <Alerta error={error} />
    </div>
  );
}

export default function SimuladorPagina() {
  return <Requiere rol="ADMINISTRADOR"><Simulador /></Requiere>;
}
