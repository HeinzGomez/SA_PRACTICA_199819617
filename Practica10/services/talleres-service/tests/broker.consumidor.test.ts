// HeinzGomez - Práctica 10: pruebas del consumidor (ACK tras responder, NACK -> DLQ, ciclo del worker)
import type { Channel, Message } from 'amqplib';
import { Consumidor } from '../src/broker/consumidor';
import { ConexionBroker } from '../src/broker/conexion';
import { Productor } from '../src/broker/productor';
import type { Telemetria } from '../src/observabilidad/metricas';
import { exitosa, Entrada, Manejador, Manejadores } from '../src/types/mensajes';
import { espiarLogger } from './pistas';

type CanalFalso = { canal: Channel; entregar: (m: unknown) => void; consumos: number };

const crearCanalFalso = (): CanalFalso => {
  let llamada: ((m: unknown) => void) | null = null;
  const handlers: Record<string, Array<() => void>> = {};
  const estado = { consumos: 0 };
  const canal = {
    on: jest.fn((evento: string, cb: () => void) => {
      (handlers[evento] ??= []).push(cb);
    }),
    prefetch: jest.fn(async () => undefined),
    consume: jest.fn(async (_cola: string, cb: (m: unknown) => void) => {
      llamada = cb;
      estado.consumos += 1;
    }),
    ack: jest.fn(),
    nack: jest.fn(),
    close: jest.fn(async () => { (handlers.close ?? []).forEach((f) => f()); }),
    disparar: (evento: string) => (handlers[evento] ?? []).forEach((f) => f()),
  };
  return {
    canal: canal as unknown as Channel,
    entregar: (mensaje) => llamada?.(mensaje),
    get consumos() { return estado.consumos; },
  };
};

/** Cada argumento es lo que devolverá `canal()`: un canal o un Error (rechazo). */
const conexionFalsa = (...intenciones: unknown[]) => {
  const fn = jest.fn();
  for (const intencion of intenciones) {
    if (intencion instanceof Error) fn.mockRejectedValueOnce(intencion);
    else fn.mockResolvedValueOnce(intencion);
  }
  return { canal: fn } as unknown as ConexionBroker;
};

const cuerpo = (obj: unknown) => JSON.stringify(obj);

const mensaje = (
  routingKey: string,
  contenido: string,
  propiedades: { replyTo?: string; correlationId?: string } = {},
) => ({
  content: Buffer.from(contenido, 'utf8'),
  fields: { routingKey },
  properties: propiedades,
});

const dormir = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

const responde: Manejador = async (entrada: Entrada) => {
  await entrada.responder(exitosa({ recibido: entrada.cuerpo }));
};

/** Grabadora de Telemetria (doble de prueba de la interfaz, sin prom-client). */
const grabadora = () => {
  const eventos: Array<{ cola: string; estado: string; ms?: number }> = [];
  const rpc: Array<[string, number, string]> = [];
  const telemetria: Telemetria = {
    worker: (cola, estado, ms) => eventos.push({ cola, estado, ms }),
    rpc: (operacion, ms, estado) => rpc.push([operacion, ms, estado]),
    broker: () => undefined,
    cupoSincronizado: () => undefined,
  };
  return { eventos, rpc, telemetria };
};

let avisos: jest.SpyInstance;
let errores: jest.SpyInstance;
let logs: jest.SpyInstance;

beforeEach(() => {
  const espia = espiarLogger();
  avisos = espia.warn;
  errores = espia.error;
  logs = espia.info;
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('Consumidor · cola RPC talleres.rpc', () => {
  test('se suscribe con prefetch y declara la topología antes de consumir', async () => {
    const c = crearCanalFalso();
    const declarar = jest.fn(async () => undefined);
    const consumidor = new Consumidor(conexionFalsa(c.canal), {
      cola: 'talleres.rpc', prefetch: 7, manejadores: {}, declarar, esperaReintentoMs: 1,
    });
    const promesa = consumidor.iniciar();
    await dormir(5);

    expect(declarar).toHaveBeenCalledWith(c.canal);
    expect(c.canal.prefetch).toHaveBeenCalledWith(7);
    expect(c.canal.consume).toHaveBeenCalledWith('talleres.rpc', expect.any(Function));
    expect(logs).toHaveBeenCalledWith('[broker] consumiendo talleres.rpc (prefetch 7)');

    await consumidor.cerrar();
    await promesa;
  });

  test('un mensaje bien formado se procesa y se hace ACK', async () => {
    const c = crearCanalFalso();
    const productor = { responder: jest.fn(async () => undefined) } as unknown as Productor;
    const consumidor = new Consumidor(conexionFalsa(c.canal), {
      cola: 'talleres.rpc', prefetch: 1,
      manejadores: { 'talleres.obtener_evento': responde },
      productor, esperaReintentoMs: 1,
    });
    const promesa = consumidor.iniciar();
    await dormir(5);

    c.entregar(mensaje('talleres.obtener_evento', cuerpo({ id: 'evt-k8s-01' }), {
      replyTo: 'gateway.reply', correlationId: 'c-1',
    }));
    await dormir(5);

    expect(productor.responder).toHaveBeenCalledWith(
      { cola: 'gateway.reply', correlationId: 'c-1' },
      { ok: true, datos: { recibido: { id: 'evt-k8s-01' } } },
    );
    expect(c.canal.ack).toHaveBeenCalledTimes(1);
    expect(c.canal.nack).not.toHaveBeenCalled();

    await consumidor.cerrar();
    await promesa;
  });

  test('routing key desconocida hace NACK sin reencolar (va a la DLQ)', async () => {
    const c = crearCanalFalso();
    const consumidor = new Consumidor(conexionFalsa(c.canal), {
      cola: 'talleres.rpc', prefetch: 1, manejadores: {}, esperaReintentoMs: 1,
    });
    const promesa = consumidor.iniciar();
    await dormir(5);

    c.entregar(mensaje('talleres.inexistente', cuerpo({})));
    await dormir(5);

    expect(c.canal.nack).toHaveBeenCalledWith(expect.anything(), false, false);
    expect(c.canal.ack).not.toHaveBeenCalled();
    expect(errores).toHaveBeenCalledWith(
      expect.objectContaining({ operacion: 'talleres.inexistente', resultado: 'nack-dlq' }),
      'worker falló la petición',
    );

    await consumidor.cerrar();
    await promesa;
  });

  test('un cuerpo que no es JSON válido va a la DLQ como descartado', async () => {
    const c = crearCanalFalso();
    const consumidor = new Consumidor(conexionFalsa(c.canal), {
      cola: 'talleres.rpc', prefetch: 1,
      manejadores: { 'talleres.obtener_evento': responde }, esperaReintentoMs: 1,
    });
    const promesa = consumidor.iniciar();
    await dormir(5);

    c.entregar(mensaje('talleres.obtener_evento', 'esto { no es json'));
    await dormir(5);

    expect(c.canal.nack).toHaveBeenCalledWith(expect.anything(), false, false);
    expect(avisos).toHaveBeenCalledWith(
      expect.objectContaining({ motivo: 'json inválido', error: 'JSON inválido en el cuerpo del mensaje' }),
      'worker descartó petición',
    );
    expect(errores).not.toHaveBeenCalled();

    await consumidor.cerrar();
    await promesa;
  });

  test('si el manejador lanza, el mensaje no se confirma', async () => {
    const c = crearCanalFalso();
    const consumidor = new Consumidor(conexionFalsa(c.canal), {
      cola: 'talleres.rpc', prefetch: 1,
      manejadores: { 'talleres.obtener_evento': async () => { throw new Error('explosión'); } },
      esperaReintentoMs: 1,
    });
    const promesa = consumidor.iniciar();
    await dormir(5);

    c.entregar(mensaje('talleres.obtener_evento', cuerpo({})));
    await dormir(5);

    expect(c.canal.nack).toHaveBeenCalledWith(expect.anything(), false, false);
    expect(c.canal.ack).not.toHaveBeenCalled();

    await consumidor.cerrar();
    await promesa;
  });

  test('sin replyTo no hay dónde responder: NACK', async () => {
    const c = crearCanalFalso();
    const consumidor = new Consumidor(conexionFalsa(c.canal), {
      cola: 'talleres.rpc', prefetch: 1,
      manejadores: { 'talleres.obtener_evento': responde }, esperaReintentoMs: 1,
    });
    const promesa = consumidor.iniciar();
    await dormir(5);

    c.entregar(mensaje('talleres.obtener_evento', cuerpo({})));
    await dormir(5);

    expect(c.canal.nack).toHaveBeenCalledWith(expect.anything(), false, false);
    expect(errores).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.stringContaining('falta replyTo en talleres.obtener_evento') }),
      'worker falló la petición',
    );

    await consumidor.cerrar();
    await promesa;
  });

  test('con replyTo pero sin productor tampoco se confirma', async () => {
    const c = crearCanalFalso();
    const consumidor = new Consumidor(conexionFalsa(c.canal), {
      cola: 'talleres.rpc', prefetch: 1,
      manejadores: { 'talleres.obtener_evento': responde }, esperaReintentoMs: 1,
    });
    const promesa = consumidor.iniciar();
    await dormir(5);

    c.entregar(mensaje('talleres.obtener_evento', cuerpo({}), { replyTo: 'otra.cola' }));
    await dormir(5);

    expect(c.canal.nack).toHaveBeenCalledWith(expect.anything(), false, false);
    expect(errores).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.stringContaining('no tiene productor de respuestas') }),
      'worker falló la petición',
    );

    await consumidor.cerrar();
    await promesa;
  });

  test('si el canal muere vuelve a suscribirse solo', async () => {
    const c = crearCanalFalso();
    const productor = { responder: jest.fn(async () => undefined) } as unknown as Productor;
    const conexion = conexionFalsa(new Error('canal caído'), c.canal);
    const consumidor = new Consumidor(conexion, {
      cola: 'talleres.rpc', prefetch: 1,
      manejadores: { 'talleres.obtener_evento': responde },
      productor, esperaReintentoMs: 1,
    });
    const promesa = consumidor.iniciar();
    await dormir(30);

    expect(c.consumos).toBe(1);
    expect(avisos).toHaveBeenCalledWith(expect.stringContaining('consumo interrumpido (canal caído); reintentando…'));

    c.entregar(mensaje('talleres.obtener_evento', cuerpo({}), { replyTo: 'r', correlationId: 'c' }));
    await dormir(5);
    expect(c.canal.ack).toHaveBeenCalledTimes(1);

    await consumidor.cerrar();
    await promesa;
  });

  test('si el canal se cierra solo, se re-suscribe', async () => {
    const c = crearCanalFalso();
    const consumidor = new Consumidor(conexionFalsa(c.canal), {
      cola: 'talleres.rpc', prefetch: 1, manejadores: {}, esperaReintentoMs: 1,
    });
    const promesa = consumidor.iniciar();
    await dormir(5);

    await consumidor.cerrar(); // dispara el 'close' del canal falso
    await promesa;
    expect(c.canal.close).toHaveBeenCalledTimes(1);
  });

  test('cerrar sin canal activo no falla', async () => {
    const consumidor = new Consumidor(conexionFalsa(), {
      cola: 'talleres.rpc', prefetch: 1, manejadores: {}, esperaReintentoMs: 1,
    });
    await expect(consumidor.cerrar()).resolves.toBeUndefined();
  });

  test('iniciar termina al pedir cerrar', async () => {
    const c = crearCanalFalso();
    const consumidor = new Consumidor(conexionFalsa(c.canal), {
      cola: 'talleres.rpc', prefetch: 1, manejadores: {}, esperaReintentoMs: 1,
    });
    const promesa = consumidor.iniciar();
    await dormir(5);
    await consumidor.cerrar();
    await expect(promesa).resolves.toBeUndefined();
  });

  test('un error de canal también levanta la suscripción', async () => {
    const c = crearCanalFalso();
    const consumidor = new Consumidor(conexionFalsa(c.canal), {
      cola: 'talleres.rpc', prefetch: 1, manejadores: {}, esperaReintentoMs: 1,
    });
    const promesa = consumidor.iniciar();
    await dormir(5);

    (c.canal as unknown as { disparar: (e: string) => void }).disparar('error');
    await dormir(5);
    expect(avisos).toHaveBeenCalledWith(expect.stringContaining('reintentando…'));

    await consumidor.cerrar();
    await promesa;
  });
});

describe('Consumidor · ciclo del worker (logs)', () => {
  test('recibe, atiende y responde dejando constancia del recorrido', async () => {
    const c = crearCanalFalso();
    const productor = { responder: jest.fn(async () => undefined) } as unknown as Productor;
    const consumidor = new Consumidor(conexionFalsa(c.canal), {
      cola: 'talleres.rpc', prefetch: 1, productor,
      manejadores: { 'talleres.obtener_evento': responde }, esperaReintentoMs: 1,
    });
    const promesa = consumidor.iniciar();
    await dormir(5);

    c.entregar(mensaje('talleres.obtener_evento', cuerpo({ id: 'evt-1' }), {
      replyTo: 'gateway.reply', correlationId: 'ciclo-1',
    }));
    await dormir(5);

    expect(logs).toHaveBeenCalledWith(
      expect.objectContaining({ cola: 'talleres.rpc', operacion: 'talleres.obtener_evento', correlation_id: 'ciclo-1' }),
      'worker atendiendo petición',
    );
    expect(logs).toHaveBeenCalledWith(
      expect.objectContaining({ resultado: 'ack', duracion_ms: expect.any(Number), correlation_id: 'ciclo-1' }),
      'worker respondió petición',
    );

    await consumidor.cerrar();
    await promesa;
  });

  test('un fallo del handler se registra como petición fallida (NACK)', async () => {
    const c = crearCanalFalso();
    const consumidor = new Consumidor(conexionFalsa(c.canal), {
      cola: 'talleres.rpc', prefetch: 1,
      manejadores: { 'talleres.obtener_evento': async () => { throw new Error('explosión'); } },
      esperaReintentoMs: 1,
    });
    const promesa = consumidor.iniciar();
    await dormir(5);

    c.entregar(mensaje('talleres.obtener_evento', cuerpo({})));
    await dormir(5);

    expect(errores).toHaveBeenCalledWith(
      expect.objectContaining({ resultado: 'nack-dlq', error: 'explosión', duracion_ms: expect.any(Number) }),
      'worker falló la petición',
    );
    expect(logs).not.toHaveBeenCalledWith(expect.anything(), 'worker respondió petición');

    await consumidor.cerrar();
    await promesa;
  });
});

describe('Consumidor · telemetría del worker', () => {
  test('mensaje OK: recibido + procesado y rpc ok (solo si hay productor)', async () => {
    const c = crearCanalFalso();
    const { eventos, rpc, telemetria } = grabadora();
    const productor = { responder: jest.fn(async () => undefined) } as unknown as Productor;
    const consumidor = new Consumidor(conexionFalsa(c.canal), {
      cola: 'talleres.rpc', prefetch: 1, productor, telemetria,
      manejadores: { 'talleres.obtener_evento': responde }, esperaReintentoMs: 1,
    });
    const promesa = consumidor.iniciar();
    await dormir(5);

    c.entregar(mensaje('talleres.obtener_evento', cuerpo({}), { replyTo: 'r', correlationId: 'c' }));
    await dormir(5);

    expect(eventos).toEqual([
      { cola: 'talleres.rpc', estado: 'recibido', ms: undefined },
      { cola: 'talleres.rpc', estado: 'procesado', ms: expect.any(Number) },
    ]);
    expect(rpc).toHaveLength(1);
    expect(rpc[0][0]).toBe('talleres.obtener_evento');
    expect(rpc[0][2]).toBe('ok');

    await consumidor.cerrar();
    await promesa;
  });

  test('JSON inválido: recibido + invalido y sin rpc', async () => {
    const c = crearCanalFalso();
    const { eventos, rpc, telemetria } = grabadora();
    const productor = { responder: jest.fn(async () => undefined) } as unknown as Productor;
    const consumidor = new Consumidor(conexionFalsa(c.canal), {
      cola: 'talleres.rpc', prefetch: 1, productor, telemetria,
      manejadores: { 'talleres.obtener_evento': responde }, esperaReintentoMs: 1,
    });
    const promesa = consumidor.iniciar();
    await dormir(5);

    c.entregar(mensaje('talleres.obtener_evento', 'esto { no es json'));
    await dormir(5);

    expect(eventos).toEqual([
      { cola: 'talleres.rpc', estado: 'recibido', ms: undefined },
      { cola: 'talleres.rpc', estado: 'invalido', ms: expect.any(Number) },
    ]);
    // el cuerpo ni siquiera llegó al handler: no es un fallo de la operación RPC
    expect(rpc).toHaveLength(0);

    await consumidor.cerrar();
    await promesa;
  });

  test('operación no soportada: recibido + error y rpc error', async () => {
    const c = crearCanalFalso();
    const { eventos, rpc, telemetria } = grabadora();
    const productor = { responder: jest.fn(async () => undefined) } as unknown as Productor;
    const consumidor = new Consumidor(conexionFalsa(c.canal), {
      cola: 'talleres.rpc', prefetch: 1, productor, telemetria,
      manejadores: {}, esperaReintentoMs: 1,
    });
    const promesa = consumidor.iniciar();
    await dormir(5);

    c.entregar(mensaje('talleres.nada', cuerpo({})));
    await dormir(5);

    expect(eventos).toEqual([
      { cola: 'talleres.rpc', estado: 'recibido', ms: undefined },
      { cola: 'talleres.rpc', estado: 'error', ms: expect.any(Number) },
    ]);
    expect(rpc).toHaveLength(1);
    expect(rpc[0]).toEqual(['talleres.nada', expect.any(Number), 'error']);

    await consumidor.cerrar();
    await promesa;
  });

  test('cola sin productor (cupos): el worker cuenta pero no hay rpc', async () => {
    const c = crearCanalFalso();
    const { eventos, rpc, telemetria } = grabadora();
    const consumidor = new Consumidor(conexionFalsa(c.canal), {
      cola: 'talleres.cupos', prefetch: 1, telemetria,
      manejadores: { 'reserva.confirmada': async () => undefined }, esperaReintentoMs: 1,
    });
    const promesa = consumidor.iniciar();
    await dormir(5);

    c.entregar(mensaje('reserva.confirmada', cuerpo({ eventoId: 'evt-1', cupoRestante: 4 })));
    await dormir(5);

    expect(eventos).toEqual([
      { cola: 'talleres.cupos', estado: 'recibido', ms: undefined },
      { cola: 'talleres.cupos', estado: 'procesado', ms: expect.any(Number) },
    ]);
    expect(rpc).toHaveLength(0);

    await consumidor.cerrar();
    await promesa;
  });

  test('sin telemetria el consumo sigue funcionando', async () => {
    const c = crearCanalFalso();
    const productor = { responder: jest.fn(async () => undefined) } as unknown as Productor;
    const consumidor = new Consumidor(conexionFalsa(c.canal), {
      cola: 'talleres.rpc', prefetch: 1, productor,
      manejadores: { 'talleres.obtener_evento': responde }, esperaReintentoMs: 1,
    });
    const promesa = consumidor.iniciar();
    await dormir(5);

    c.entregar(mensaje('talleres.obtener_evento', cuerpo({}), { replyTo: 'r', correlationId: 'c' }));
    await dormir(5);

    expect(c.canal.ack).toHaveBeenCalledTimes(1);

    await consumidor.cerrar();
    await promesa;
  });
});
