// HeinzGomez - Práctica 9: pruebas del transporte RPC sobre RabbitMQ (doble del cliente amqplib).
jest.mock('amqplib', () => ({ connect: jest.fn() }));

import amqp from 'amqplib';
import {
  BusRpc, ColaRespuestas, ConexionBroker, EXCHANGE_RPC, desenvolver,
} from '../src/broker';
import { ErrorRpc } from '../src/types';

const conectar = amqp.connect as unknown as jest.Mock;

const MENSAJE_INTERRUMPIDO = 'Conexión con el bus de mensajes interrumpida';

/** Canal falso que se cuela como un ConfirmChannel real de amqplib. */
type CanalFalso = Record<string, any> & amqp.ConfirmChannel;

function crearCanalFalso(): CanalFalso {
  const canal: any = {
    consumidores: [] as ((mensaje: any) => void)[],
    publicaciones: [] as any[],
    acks: [] as any[],
    eventos: {} as Record<string, () => void>,
    confirmar: true,
    fallarAlPublicar: false,
    tirarAlPublicar: false,
    responder: null as ((corr: string) => void) | null,
    on: jest.fn((evento: string, fn: () => void) => {
      canal.eventos[evento] = fn;
    }),
    assertExchange: jest.fn(async () => undefined),
    assertQueue: jest.fn(async () => ({ queue: 'gw-respuestas' })),
    consume: jest.fn(async (_cola: string, cb: (m: any) => void) => {
      canal.consumidores.push(cb);
    }),
    ack: jest.fn((mensaje: any) => {
      canal.acks.push(mensaje);
    }),
    publish: jest.fn(
      (
        exchange: string,
        routingKey: string,
        cuerpo: Buffer,
        opciones: any,
        confirmar: (err: Error | null) => void
      ) => {
        canal.publicaciones.push({
          exchange,
          routingKey,
          cuerpo: JSON.parse(cuerpo.toString('utf8')),
          opciones,
        });
        if (canal.tirarAlPublicar) throw new Error('publicación inválida');
        if (canal.fallarAlPublicar) {
          confirmar(new Error('sin ruta hacia la cola'));
          return;
        }
        if (!canal.confirmar) return;
        confirmar(null);
        canal.responder?.(opciones.correlationId);
      }
    ),
  };
  return canal as unknown as CanalFalso;
}

function crearConexionFalso(canal: any, opciones: { cortarAlAbrir?: boolean } = {}) {
  const eventos: Record<string, () => void> = {};
  return {
    eventos,
    on: jest.fn((evento: string, fn: () => void) => {
      eventos[evento] = fn;
      if (evento === 'close' && opciones.cortarAlAbrir) queueMicrotask(fn);
    }),
    createConfirmChannel: jest.fn(async () => canal),
    close: jest.fn(async () => undefined),
  };
}

/** Punto de conexión: siempre devuelve el mismo canal y, si se pasa cuerpo, lo entrega al publicar. */
function conectarCon(cuerpo?: unknown): CanalFalso {
  const canal = crearCanalFalso();
  if (cuerpo !== undefined) {
    canal.responder = jest.fn((corr: string) => entregar(canal, corr, cuerpo));
  }
  conectar.mockResolvedValue(crearConexionFalso(canal));
  return canal;
}

function entregar(canal: CanalFalso, correlacion: string, cuerpo: unknown): void {
  canal.consumidores[0]({
    properties: { correlationId: correlacion },
    content: Buffer.from(JSON.stringify(cuerpo), 'utf8'),
  });
}

function lanzar(fn: () => unknown): ErrorRpc | undefined {
  try {
    fn();
    return undefined;
  } catch (e) {
    return e as ErrorRpc;
  }
}

beforeEach(() => {
  conectar.mockReset();
});

describe('ConexionBroker', () => {
  test('declara el canal una sola vez y lo reutiliza mientras siga vivo', async () => {
    const canal = crearCanalFalso();
    conectar.mockResolvedValue(crearConexionFalso(canal));
    const broker = new ConexionBroker('amqp://test/');
    expect(await broker.abrir()).toBe(canal);
    expect(await broker.abrir()).toBe(canal);
    expect(conectar).toHaveBeenCalledTimes(1);
    expect(conectar).toHaveBeenCalledWith('amqp://test/');
  });

  test('dos llamadas simultáneas comparten la misma apertura', async () => {
    const canal = crearCanalFalso();
    conectar.mockResolvedValue(crearConexionFalso(canal));
    const broker = new ConexionBroker('amqp://test/');
    const [a, b] = await Promise.all([broker.abrir(), broker.abrir()]);
    expect(a).toBe(canal);
    expect(b).toBe(canal);
    expect(conectar).toHaveBeenCalledTimes(1);
  });

  test('cuando el canal muere se descarta y la siguiente vuelve a conectar', async () => {
    const primerCanal = crearCanalFalso();
    const primeraConexion = crearConexionFalso(primerCanal);
    const segundoCanal = crearCanalFalso();
    conectar
      .mockResolvedValueOnce(primeraConexion)
      .mockResolvedValueOnce(crearConexionFalso(segundoCanal));
    const broker = new ConexionBroker('amqp://test/');

    expect(await broker.abrir()).toBe(primerCanal);

    primerCanal.eventos.close(); // RabbitMQ cierra el canal

    expect(primeraConexion.close).toHaveBeenCalledTimes(1);
    expect(await broker.abrir()).toBe(segundoCanal);
    expect(conectar).toHaveBeenCalledTimes(2);
  });

  test('un fallo al cerrar la conexión vieja no impide reconectar', async () => {
    const primerCanal = crearCanalFalso();
    const primeraConexion = crearConexionFalso(primerCanal);
    primeraConexion.close.mockRejectedValueOnce(new Error('cierre fallido'));
    conectar
      .mockResolvedValueOnce(primeraConexion)
      .mockResolvedValueOnce(crearConexionFalso(crearCanalFalso()));
    const broker = new ConexionBroker('amqp://x');

    await broker.abrir();
    primerCanal.eventos.close();
    await new Promise((r) => setImmediate(r));

    expect(await broker.abrir()).toBeDefined();
    expect(conectar).toHaveBeenCalledTimes(2);
  });

  test('un canal muerto no se descarta dos veces', async () => {
    const canal = crearCanalFalso();
    const conexion = crearConexionFalso(canal);
    conectar.mockResolvedValue(conexion);
    const broker = new ConexionBroker('amqp://test/');
    await broker.abrir();

    canal.eventos.error();
    canal.eventos.close();

    expect(conexion.close).toHaveBeenCalledTimes(1);
    expect(conectar).toHaveBeenCalledTimes(1);
  });

  test('cerrar() cierra la conexión e impide reabrir', async () => {
    const canal = crearCanalFalso();
    const conexion = crearConexionFalso(canal);
    conectar.mockResolvedValue(conexion);
    const broker = new ConexionBroker('amqp://test/');
    await broker.abrir();
    await broker.cerrar();
    expect(conexion.close).toHaveBeenCalledTimes(1);
    await expect(broker.abrir()).rejects.toThrow('broker cerrado');
    await expect(broker.cerrar()).resolves.toBeUndefined();
    expect(conectar).toHaveBeenCalledTimes(1);
  });

  test('cerrar() absorbe un fallo al cerrar la conexión', async () => {
    const conexion = crearConexionFalso(crearCanalFalso());
    conexion.close.mockRejectedValueOnce(new Error('cierre fallido'));
    conectar.mockResolvedValue(conexion);
    const broker = new ConexionBroker('amqp://x');
    await broker.abrir();
    await expect(broker.cerrar()).resolves.toBeUndefined();
  });

  test('cerrar() sin conexión abierta no falla', async () => {
    await expect(new ConexionBroker('amqp://x').cerrar()).resolves.toBeUndefined();
  });

  test('si el canal muere apenas se abre, informa que no hay conexión', async () => {
    const canal = crearCanalFalso();
    conectar.mockResolvedValue(crearConexionFalso(canal, { cortarAlAbrir: true }));
    const broker = new ConexionBroker('amqp://x');
    await expect(broker.abrir()).rejects.toThrow('sin conexión con RabbitMQ');
  });

  test('un error de red al conectar se propaga tal cual', async () => {
    conectar.mockRejectedValue(new Error('ECONNREFUSED 127.0.0.1:5672'));
    const broker = new ConexionBroker('amqp://x');
    await expect(broker.abrir()).rejects.toThrow('ECONNREFUSED 127.0.0.1:5672');
    await expect(broker.abrir()).rejects.toThrow('ECONNREFUSED 127.0.0.1:5672');
    expect(conectar).toHaveBeenCalledTimes(2);
  });

  test('si createConfirmChannel rechaza, abrir() no devuelve canal', async () => {
    conectar.mockResolvedValue({
      on: jest.fn(),
      createConfirmChannel: jest.fn(async () => {
        throw new Error('sin canal');
      }),
      close: jest.fn(async () => undefined),
    });
    await expect(new ConexionBroker('amqp://x').abrir()).rejects.toThrow('sin canal');
  });
});

describe('ColaRespuestas', () => {
  test('preparar declara una cola exclusiva y empieza a consumir', async () => {
    const canal = crearCanalFalso();
    const cola = new ColaRespuestas();
    expect(cola.cola).toBe('');

    await cola.preparar(canal);

    expect(cola.cola).toBe('gw-respuestas');
    expect(canal.assertQueue).toHaveBeenCalledWith('', {
      durable: false,
      exclusive: true,
      autoDelete: true,
    });
    expect(canal.consume).toHaveBeenCalledWith('gw-respuestas', expect.any(Function), {
      noAck: false,
    });

    await cola.preparar(canal); // el mismo canal no vuelve a declarar
    expect(canal.assertQueue).toHaveBeenCalledTimes(1);
    expect(canal.consume).toHaveBeenCalledTimes(1);
  });

  test('preparar con otro canal interrumpe las peticiones en vuelo', async () => {
    const cola = new ColaRespuestas();
    await cola.preparar(crearCanalFalso());
    const enVuelo = cola.esperar('c1', 5000, 'auth.login');

    await cola.preparar(crearCanalFalso());

    await expect(enVuelo).rejects.toThrow(MENSAJE_INTERRUMPIDO);
    expect(cola.cola).toBe('gw-respuestas');
  });

  test('la espera se agota con UNAVAILABLE', async () => {
    const cola = new ColaRespuestas();
    await cola.preparar(crearCanalFalso());
    await expect(cola.esperar('x', 10, 'reservas.solicitar')).rejects.toThrow(
      'Sin respuesta de reservas.solicitar tras 10ms'
    );
  });

  test('cancelar olvida la petición y un id desconocido no hace nada', async () => {
    const cola = new ColaRespuestas();
    await cola.preparar(crearCanalFalso());
    const promesa = cola.esperar('y', 15, 'op');
    cola.cancelar('y');
    cola.cancelar('inexistente');

    let asentada = false;
    promesa.then(
      () => (asentada = true),
      () => (asentada = true)
    );
    await new Promise((r) => setTimeout(r, 40));
    expect(asentada).toBe(false);
  });

  test('una respuesta se resuelve con el cuerpo y se confirma con ACK', async () => {
    const canal = crearCanalFalso();
    const cola = new ColaRespuestas();
    await cola.preparar(canal);
    const promesa = cola.esperar('c-1', 1000, 'op');

    entregar(canal, 'c-1', { ok: true, datos: 7 });

    await expect(promesa).resolves.toEqual({ ok: true, datos: 7 });
    expect(canal.acks).toHaveLength(1);
  });

  test('un mensaje sin correlationId o con una desconocida solo se confirma', async () => {
    const canal = crearCanalFalso();
    const cola = new ColaRespuestas();
    await cola.preparar(canal);

    canal.consumidores[0]({ properties: {}, content: Buffer.from('{}') });
    entregar(canal, 'nadie', { ok: true });

    expect(canal.acks).toHaveLength(2);
  });

  test('una respuesta ilegible se confirma y deja la petición en vuelo', async () => {
    const canal = crearCanalFalso();
    const cola = new ColaRespuestas();
    await cola.preparar(canal);
    cola.esperar('c-2', 5000, 'op');

    expect(() =>
      canal.consumidores[0]({
        properties: { correlationId: 'c-2' },
        content: Buffer.from('esto no es json', 'utf8'),
      })
    ).toThrow('Respuesta ilegible del servicio');

    expect(canal.acks).toHaveLength(1);
    cola.cancelar('c-2');
  });

  test('un mensaje entregado como null se ignora', async () => {
    const canal = crearCanalFalso();
    const cola = new ColaRespuestas();
    await cola.preparar(canal);
    canal.consumidores[0](null);
    expect(canal.acks).toHaveLength(0);
  });
});

describe('desenvolver', () => {
  test('extrae los datos de una respuesta exitosa', () => {
    expect(desenvolver<number>({ ok: true, datos: 5 })).toBe(5);
    expect(desenvolver<null>({ ok: true, datos: null })).toBeNull();
    expect(desenvolver<string[]>({ ok: true, datos: ['a'] })).toEqual(['a']);
  });

  test('traduce un error del servicio a ErrorRpc con su código', () => {
    const error = lanzar(() =>
      desenvolver({ ok: false, error: { codigo: 'NOT_FOUND', mensaje: 'no existe' } })
    );
    expect(error).toBeInstanceOf(ErrorRpc);
    expect(error?.code).toBe('NOT_FOUND');
    expect(error?.message).toBe('no existe');
  });

  test('un error con campos vacíos o ausentes usa los valores de respaldo', () => {
    const vacio = lanzar(() =>
      desenvolver({ ok: false, error: { codigo: '', mensaje: '' } })
    );
    expect(vacio?.code).toBe('');
    expect(vacio?.message).toBe('');

    const parcial = lanzar(() => desenvolver({ ok: false, error: {} as never }));
    expect(parcial?.code).toBe('INTERNAL');
    expect(parcial?.message).toBe('Error interno');

    const sinError = lanzar(() => desenvolver({ ok: false } as never));
    expect(sinError?.code).toBe('INTERNAL');
    expect(sinError?.message).toBe('Error interno');

    const errorNulo = lanzar(() =>
      desenvolver({ ok: false, error: undefined as never })
    );
    expect(errorNulo?.code).toBe('INTERNAL');
    expect(errorNulo?.message).toBe('Error interno');
  });

  test('un cuerpo que no sigue el contrato es ilegible', () => {
    for (const cuerpo of [null, undefined, 0, 'texto', {}, { ok: 'si' }]) {
      const error = lanzar(() => desenvolver(cuerpo));
      expect(error).toBeInstanceOf(ErrorRpc);
      expect(error?.code).toBe('INTERNAL');
      expect(error?.message).toBe('Respuesta ilegible del servicio');
    }
  });
});

describe('BusRpc', () => {
  test('publica en academix.rpc con la operación como routing key', async () => {
    const canal = conectarCon({ ok: true, datos: { id: 's1' } });
    const bus = new BusRpc('amqp://test/', 1000);

    const respuesta = await bus.enviar<{ id: string }>('auth.login', {
      correo: 'a@b.c',
    });

    expect(respuesta).toEqual({ id: 's1' });
    expect(canal.assertExchange).toHaveBeenCalledWith(EXCHANGE_RPC, 'direct', {
      durable: true,
    });
    expect(canal.publicaciones).toHaveLength(1);
    const { exchange, routingKey, cuerpo, opciones } = canal.publicaciones[0];
    expect(exchange).toBe('academix.rpc');
    expect(routingKey).toBe('auth.login');
    expect(cuerpo).toEqual({ correo: 'a@b.c' });
    expect(opciones).toMatchObject({
      contentType: 'application/json',
      replyTo: 'gw-respuestas',
      persistent: true,
    });
    expect(opciones.correlationId).toEqual(expect.any(String));
    expect(canal.acks).toHaveLength(1);
  });

  test('un payload nulo se publica como objeto vacío', async () => {
    const canal = conectarCon({ ok: true, datos: true });
    await new BusRpc('amqp://x', 500).enviar('op', undefined);
    expect(canal.publicaciones[0].cuerpo).toEqual({});
  });

  test('un error del servicio se propaga con su código y su mensaje', async () => {
    conectarCon({
      ok: false,
      error: { codigo: 'FAILED_PRECONDITION', mensaje: 'sin cupo' },
    });
    await expect(new BusRpc('amqp://x', 500).enviar('reservas.solicitar', {}))
      .rejects.toMatchObject({ code: 'FAILED_PRECONDITION', message: 'sin cupo' });
  });

  test('una respuesta que nunca llega termina en UNAVAILABLE', async () => {
    conectarCon(); // el servicio nunca contesta
    await expect(new BusRpc('amqp://x', 20).enviar('auth.login', {})).rejects.toMatchObject({
      code: 'UNAVAILABLE',
      message: 'Sin respuesta de auth.login tras 20ms',
    });
  });

  test('si no se puede abrir el canal, la operación responde UNAVAILABLE', async () => {
    conectar.mockRejectedValue(new Error('ECONNREFUSED'));
    await expect(new BusRpc('amqp://x', 500).enviar('op', {})).rejects.toMatchObject({
      code: 'UNAVAILABLE',
      message: 'Servicio temporalmente no disponible, intente de nuevo',
    });
  });

  test('si el exchange no se puede declarar, también responde UNAVAILABLE', async () => {
    const canal = conectarCon({ ok: true });
    (canal.assertExchange as jest.Mock).mockRejectedValueOnce(new Error('no hay permisos'));
    await expect(new BusRpc('amqp://x', 500).enviar('op', {})).rejects.toMatchObject({
      code: 'UNAVAILABLE',
      message: 'Servicio temporalmente no disponible, intente de nuevo',
    });
  });

  test('si el broker no confirma la publicación, se responde UNAVAILABLE', async () => {
    jest.useFakeTimers();
    try {
      const canal = conectarCon({ ok: true });
      canal.confirmar = false;
      const bus = new BusRpc('amqp://x', 60000);
      const promesa = expect(bus.enviar('op', {})).rejects.toMatchObject({
        code: 'UNAVAILABLE',
        message: 'No se pudo publicar la petición en el bus de mensajes',
      });
      await jest.advanceTimersByTimeAsync(5000);
      await promesa;
      expect(canal.acks).toHaveLength(0);
      expect(canal.responder).not.toHaveBeenCalled();
    } finally {
      jest.useRealTimers();
    }
  });

  test('si el broker rechaza la publicación, se responde UNAVAILABLE', async () => {
    const canal = conectarCon({ ok: true });
    canal.fallarAlPublicar = true;
    await expect(new BusRpc('amqp://x', 500).enviar('op', {})).rejects.toMatchObject({
      code: 'UNAVAILABLE',
      message: 'No se pudo publicar la petición en el bus de mensajes',
    });
  });

  test('si publish lanza de forma síncrona, se responde UNAVAILABLE', async () => {
    const canal = conectarCon({ ok: true });
    canal.tirarAlPublicar = true;
    await expect(new BusRpc('amqp://x', 500).enviar('op', {})).rejects.toMatchObject({
      code: 'UNAVAILABLE',
      message: 'No se pudo publicar la petición en el bus de mensajes',
    });
  });

  test('cerrar() cierra la conexión subyacente', async () => {
    const conexion = crearConexionFalso(crearCanalFalso());
    conectar.mockResolvedValue(conexion);
    const bus = new BusRpc('amqp://x', 500);
    await bus.enviar('op', {}).catch(() => undefined);
    await bus.cerrar();
    expect(conexion.close).toHaveBeenCalled();
  });
});
