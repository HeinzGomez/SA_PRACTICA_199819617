// HeinzGomez - Práctica 10: pruebas del paquete de observabilidad (logger JSON, métricas, sondas y healthcheck)
import type { Logger } from 'pino';
import { Writable } from 'node:stream';
import { codigoDeSalida, verificarSalud } from '../src/observabilidad';
import { crearLogger, loggerPorDefecto, nivelPorDefecto } from '../src/observabilidad/logger';
import { crearMetricas, metricasPorDefecto } from '../src/observabilidad/metricas';
import { ServidorSondas } from '../src/observabilidad/servidor';

/** Colecciona lo que el logger escribe para poder parsearlo como JSON. */
const memoria = () => {
  let texto = '';
  const flujo = new Writable({
    write(_fragmento, _codificacion, listo) {
      texto += _fragmento.toString('utf8');
      listo();
    },
  });
  return { flujo, lineas: () => texto.trim().split('\n').filter(Boolean).map((l) => JSON.parse(l)) };
};

const sondasVivas = () => ({
  brokerListo: () => true,
  baseDatosLista: async () => true,
  redisLista: async () => true,
});

describe('logger JSON (pino)', () => {
  test('escribe una línea JSON con servicio, versión, nivel y mensaje', () => {
    const { flujo, lineas } = memoria();
    const log: Logger = crearLogger('info', flujo);

    log.info({ operacion: 'talleres.obtener_evento' }, 'worker atendiendo petición');

    expect(lineas()).toHaveLength(1);
    expect(lineas()[0]).toMatchObject({
      level: 30,
      servicio: 'talleres-service',
      msg: 'worker atendiendo petición',
      operacion: 'talleres.obtener_evento',
    });
    expect(lineas()[0].time).toEqual(expect.any(String));
  });

  test('redacta credenciales antes de escribirlas', () => {
    const { flujo, lineas } = memoria();
    const log = crearLogger('info', flujo);

    log.warn({ password: 'Segura123', token: 'jwt-basura' }, 'aviso');

    expect(lineas()[0]).toMatchObject({ password: '[REDACTADO]', token: '[REDACTADO]' });
  });

  test('el nivel por defecto es info y bajo Jest queda silencioso', () => {
    expect(nivelPorDefecto()).toBe('silent'); // las pruebas corren con JEST_WORKER_ID
    expect(crearLogger().level).toBe('silent');
  });

  test('loggerPorDefecto devuelve siempre la misma instancia', () => {
    expect(loggerPorDefecto()).toBe(loggerPorDefecto());
  });
});

describe('métricas Prometheus', () => {
  test('expone worker, RPC, broker y cupos bajo el prefijo academix_', async () => {
    const { registro, telemetria } = crearMetricas('talleres-service');
    telemetria.worker('talleres.rpc', 'recibido');
    telemetria.worker('talleres.rpc', 'procesado', 12);
    telemetria.worker('talleres.cupos', 'recibido');
    telemetria.worker('talleres.cupos', 'invalido', 3);
    telemetria.rpc('talleres.obtener_evento', 12, 'ok');
    telemetria.rpc('talleres.crear_evento', 5, 'error');
    telemetria.broker(true);
    telemetria.cupoSincronizado('sincronizado');
    telemetria.cupoSincronizado('sincronizado');
    telemetria.cupoSincronizado('invalido');

    const texto = await registro.metrics();
    expect(texto).toContain('academix_worker_messages_total{queue="talleres.rpc",status="recibido",servicio="talleres-service"} 1');
    expect(texto).toContain('academix_worker_messages_total{queue="talleres.rpc",status="procesado",servicio="talleres-service"} 1');
    expect(texto).toContain('academix_worker_messages_total{queue="talleres.cupos",status="invalido",servicio="talleres-service"} 1');
    expect(texto).toContain('academix_worker_processing_duration_seconds_bucket{le="+Inf",servicio="talleres-service",queue="talleres.rpc"} 1');
    expect(texto).toContain('academix_rpc_calls_total{operation="talleres.obtener_evento",status="ok",servicio="talleres-service"} 1');
    expect(texto).toContain('academix_rpc_calls_total{operation="talleres.crear_evento",status="error",servicio="talleres-service"} 1');
    expect(texto).toContain('academix_rpc_duration_seconds_bucket{le="+Inf",servicio="talleres-service",operation="talleres.obtener_evento"} 1');
    expect(texto).toContain('academix_broker_connected{servicio="talleres-service"} 1');
    expect(texto).toContain('academix_talleres_cupos_sincronizados_total{resultado="sincronizado",servicio="talleres-service"} 2');
    expect(texto).toContain('academix_talleres_cupos_sincronizados_total{resultado="invalido",servicio="talleres-service"} 1');
    expect(registro.contentType).toContain('text/plain');
  });

  test('el gauge del broker nace en 0 y el de en vuelo se equilibra', async () => {
    const { registro, telemetria } = crearMetricas('talleres-service');
    expect(await registro.metrics()).toContain('academix_broker_connected{servicio="talleres-service"} 0');

    telemetria.worker('talleres.rpc', 'recibido');
    telemetria.worker('talleres.rpc', 'recibido');
    telemetria.worker('talleres.rpc', 'procesado', 1);
    expect(await registro.metrics()).toContain('academix_worker_in_flight{servicio="talleres-service"} 1');
  });

  test('metricasPorDefecto devuelve siempre la misma instancia', () => {
    expect(metricasPorDefecto()).toBe(metricasPorDefecto());
  });
});

describe('ServidorSondas', () => {
  let servidor: ServidorSondas;
  let puerto: number;

  const arrancar = async (
    brokerListo = () => true,
    baseDatosLista = async () => true,
    redisLista = async () => true,
  ) => {
    servidor = new ServidorSondas(0, crearMetricas('talleres-service'), { brokerListo, baseDatosLista, redisLista });
    puerto = await servidor.iniciar();
    return puerto;
  };

  afterEach(async () => { await servidor?.detener(); });

  test('/health responde 200 aunque las dependencias estén caídas', async () => {
    await arrancar(() => false, async () => { throw new Error('base caída'); }, async () => false);
    const r = await fetch(`http://127.0.0.1:${puerto}/health`);
    const cuerpo = await r.json();

    expect(r.status).toBe(200);
    expect(cuerpo).toMatchObject({ status: 'ok', servicio: 'talleres-service' });
  });

  test('/health/ready solo responde 200 si broker, base de datos y redis están ok', async () => {
    await arrancar();
    const listo = await fetch(`http://127.0.0.1:${puerto}/health/ready`);
    expect(listo.status).toBe(200);
    expect(await listo.json()).toMatchObject({
      status: 'ready', broker: 'ok', base_datos: 'ok', redis: 'ok',
    });

    await servidor.detener();
    await arrancar(() => false, async () => true, async () => true);
    const sinBroker = await fetch(`http://127.0.0.1:${puerto}/health/ready`);
    expect(sinBroker.status).toBe(503);
    expect(await sinBroker.json()).toMatchObject({ status: 'not_ready', broker: 'down', base_datos: 'ok', redis: 'ok' });

    await servidor.detener();
    await arrancar(() => true, async () => true, async () => false);
    const sinRedis = await fetch(`http://127.0.0.1:${puerto}/health/ready`);
    expect(sinRedis.status).toBe(503);
    expect(await sinRedis.json()).toMatchObject({ status: 'not_ready', broker: 'ok', base_datos: 'ok', redis: 'down' });
  });

  test('/health/ready tolera sondas que lanzan excepción', async () => {
    await arrancar(
      () => { throw new Error('broker roto'); },
      async () => { throw new Error('base rota'); },
      async () => { throw new Error('redis roto'); },
    );
    const r = await fetch(`http://127.0.0.1:${puerto}/health/ready`);
    expect(r.status).toBe(503);
    expect(await r.json()).toMatchObject({ broker: 'down', base_datos: 'down', redis: 'down' });
  });

  test('/metrics expone el registro Prometheus con su content-type', async () => {
    await arrancar();
    const r = await fetch(`http://127.0.0.1:${puerto}/metrics`);
    const texto = await r.text();

    expect(r.status).toBe(200);
    expect(r.headers.get('content-type')).toContain('text/plain');
    expect(texto).toContain('academix_broker_connected');
    expect(texto).toContain('academix_worker_messages_total');
  });

  test('las rutas desconocidas devuelven 404', async () => {
    await arrancar();
    const r = await fetch(`http://127.0.0.1:${puerto}/nada`);
    expect(r.status).toBe(404);
  });

  test('iniciar es idempotente y detener también', async () => {
    await arrancar();
    expect(await servidor.iniciar()).toBe(puerto);
    await servidor.detener();
    await servidor.detener();
  });
});

describe('verificarSalud (healthcheck del contenedor)', () => {
  test('devuelve true contra un proceso vivo y false si nadie escucha', async () => {
    const servidor = new ServidorSondas(0, crearMetricas('talleres-service'), sondasVivas());
    const puerto = await servidor.iniciar();

    await expect(verificarSalud(puerto)).resolves.toBe(true);
    await servidor.detener();
    await expect(verificarSalud(puerto)).resolves.toBe(false);
  });

  test('el código de salida del healthcheck es 0 si responde y 1 si no', async () => {
    const servidor = new ServidorSondas(0, crearMetricas('talleres-service'), sondasVivas());
    const puerto = await servidor.iniciar();

    await expect(codigoDeSalida(puerto)).resolves.toBe(0);
    await servidor.detener();
    await expect(codigoDeSalida(puerto)).resolves.toBe(1);
    await expect(codigoDeSalida(9)).resolves.toBe(1); // puerto de discard: nadie escucha
  });
});
