// HeinzGomez - Práctica 9: pruebas del consumidor RPC/de eventos (ACK tras responder, NACK -> DLQ)
import type { Channel, Message } from 'amqplib';
import { Consumidor } from '../src/broker/consumidor';
import { ConexionBroker } from '../src/broker/conexion';
import { Productor } from '../src/broker/productor';
import { exitosa, Entrada, Manejador, Manejadores } from '../src/types/mensajes';

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

let avisos: jest.SpyInstance;
let errores: jest.SpyInstance;
let logs: jest.SpyInstance;

beforeEach(() => {
  avisos = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  errores = jest.spyOn(console, 'error').mockImplementation(() => undefined);
  logs = jest.spyOn(console, 'log').mockImplementation(() => undefined);
});

afterEach(() => {
  avisos.mockRestore();
  errores.mockRestore();
  logs.mockRestore();
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
      '[broker] mensaje descartado (talleres.inexistente): operación no soportada: talleres.inexistente',
    );

    await consumidor.cerrar();
    await promesa;
  });

  test('un cuerpo que no es JSON válido va a la DLQ', async () => {
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
    expect(errores).toHaveBeenCalledWith(
      '[broker] mensaje descartado (talleres.obtener_evento): JSON inválido en el cuerpo del mensaje',
    );

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
    expect(errores).toHaveBeenCalledWith(expect.stringContaining('falta replyTo en talleres.obtener_evento'));

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
    expect(errores).toHaveBeenCalledWith(expect.stringContaining('no tiene productor de respuestas'));

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
