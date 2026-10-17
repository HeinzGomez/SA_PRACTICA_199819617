// HeinzGomez - Práctica 10: pruebas de observabilidad del API Gateway (logs JSON, salud y métricas Prometheus)
jest.mock('amqplib', () => ({ connect: jest.fn() }));

import amqp from 'amqplib';
import request from 'supertest';
import { Writable } from 'node:stream';
import { createApp } from '../src/app';
import { BusRpc } from '../src/broker';
import { crearLogger, crearMetricas } from '../src/observabilidad';
import { Servicios } from '../src/types';

const conectar = amqp.connect as unknown as jest.Mock;

const opciones = { origenesPermitidos: ['*'], cupoStreamMs: 50, limiteReservasPorMinuto: 100 };

const servicios = {
  talleres: { listarEventos: jest.fn(async () => ({ eventos: [{ id: 'evt-1' }] })) },
} as unknown as Servicios;

const esperar = (ms: number) => new Promise((resolver) => setTimeout(resolver, ms));

async function textoDeMetricas(app: ReturnType<typeof createApp>): Promise<string> {
  return (await request(app).get('/metrics')).text;
}

function lineasCon(texto: string, prefijo: string, filtro: string): string[] {
  return texto.split('\n').filter((l) => l.startsWith(prefijo) && l.includes(filtro));
}

function eventos(salida: string[]): Record<string, unknown>[] {
  return salida.join('').split('\n').filter(Boolean).map((l) => JSON.parse(l));
}

describe('Salud del API Gateway', () => {
  test('/health devuelve liveness con uptime y versión', async () => {
    const app = createApp(servicios, opciones, { metricas: crearMetricas() });
    const r = await request(app).get('/health');
    expect(r.status).toBe(200);
    expect(r.body).toMatchObject({ status: 'ok', servicio: 'api-gateway' });
    expect(r.body.uptime_s).toEqual(expect.any(Number));
    expect(r.body.timestamp).toEqual(expect.any(String));
  });

  test('/health/ready responde 200 sin verificador de broker', async () => {
    const app = createApp(servicios, opciones, { metricas: crearMetricas() });
    const r = await request(app).get('/health/ready');
    expect(r.status).toBe(200);
    expect(r.body).toMatchObject({ status: 'ready', broker: 'no-verificado' });
  });

  test('/health/ready devuelve 503 cuando el broker cae', async () => {
    const app = createApp(servicios, opciones, {
      metricas: crearMetricas(),
      verificarBroker: jest.fn(async () => false),
    });
    const r = await request(app).get('/health/ready');
    expect(r.status).toBe(503);
    expect(r.body).toMatchObject({ status: 'not_ready', broker: 'down' });
  });

  test('/health/ready devuelve 200 cuando el broker responde', async () => {
    const app = createApp(servicios, opciones, {
      metricas: crearMetricas(),
      verificarBroker: jest.fn(async () => true),
    });
    const r = await request(app).get('/health/ready');
    expect(r.status).toBe(200);
    expect(r.body).toMatchObject({ status: 'ready', broker: 'ok' });
  });
});

describe('Métricas Prometheus', () => {
  test('/metrics expone las métricas del proceso y del gateway', async () => {
    const app = createApp(servicios, opciones, { metricas: crearMetricas() });
    const r = await request(app).get('/metrics');
    expect(r.status).toBe(200);
    expect(r.headers['content-type']).toContain('text/plain');
    expect(r.text).toContain('academix_http_requests_total');
    expect(r.text).toContain('# TYPE academix_http_request_duration_seconds histogram');
    expect(r.text).toContain('academix_broker_connected');
    expect(r.text).toContain('process_cpu_user_seconds_total');
  });

  test('cuenta las peticiones con la ruta normalizada', async () => {
    const app = createApp(servicios, opciones, { metricas: crearMetricas() });
    expect((await request(app).get('/api/eventos')).status).toBe(200);
    await esperar(20);
    const texto = await textoDeMetricas(app);
    const peticion = lineasCon(texto, 'academix_http_requests_total{', 'route="/api/eventos"');
    expect(peticion).toHaveLength(1);
    expect(peticion[0]).toContain('method="GET"');
    expect(peticion[0]).toContain('status="200"');
    expect(texto).toContain('academix_http_request_duration_seconds_bucket{');
  });

  test('las rutas desconocidas se agrupan en no_encontrada', async () => {
    const app = createApp(servicios, opciones, { metricas: crearMetricas() });
    expect((await request(app).get('/api/que-no-existe')).status).toBe(404);
    await esperar(20);
    const texto = await textoDeMetricas(app);
    const perdidas = lineasCon(texto, 'academix_http_requests_total{', 'route="no_encontrada"');
    expect(perdidas).toHaveLength(1);
    expect(perdidas[0]).toContain('status="404"');
  });

  test('las rutas con parámetros se agrupan por patrón, no por identificador', async () => {
    const app = createApp(servicios, opciones, { metricas: crearMetricas() });
    expect((await request(app).get('/api/reservas/TKT-123')).status).toBe(401);
    await esperar(20);
    const texto = await textoDeMetricas(app);
    const ticket = lineasCon(texto, 'academix_http_requests_total{', 'route="/api/reservas/:ticketId"');
    expect(ticket).toHaveLength(1);
    expect(ticket[0]).toContain('status="401"');
    expect(texto).not.toContain('TKT-123');
  });

  test('un error del servicio conserva la ruta del recurso', async () => {
    const caido = {
      talleres: { listarEventos: jest.fn(async () => { throw { code: 'UNAVAILABLE' }; }) },
    } as unknown as Servicios;
    const app = createApp(caido, opciones, { metricas: crearMetricas() });
    expect((await request(app).get('/api/eventos')).status).toBe(503);
    await esperar(20);
    const texto = await textoDeMetricas(app);
    const fallo = lineasCon(texto, 'academix_http_requests_total{', 'route="/api/eventos"');
    expect(fallo).toHaveLength(1);
    expect(fallo[0]).toContain('status="503"');
    expect(lineasCon(texto, 'academix_http_requests_total{', 'route="/"')).toHaveLength(0);
  });

  test('las sondas /health y /metrics no cuentan como tráfico', async () => {
    const app = createApp(servicios, opciones, { metricas: crearMetricas() });
    await request(app).get('/health');
    await request(app).get('/health/ready');
    await request(app).get('/metrics');
    await esperar(20);
    const texto = await textoDeMetricas(app);
    expect(texto).not.toContain('route="/health"');
    expect(texto).not.toContain('route="/health/ready"');
    expect(texto).not.toContain('route="/metrics"');
  });

  test('la telemetría del RPC y del broker llega a /metrics', async () => {
    const metricas = crearMetricas();
    const app = createApp(servicios, opciones, { metricas });
    metricas.telemetria.rpc('reservas.solicitar', 120, 'ok');
    metricas.telemetria.rpc('reservas.solicitar', 3000, 'error');
    metricas.telemetria.broker(true);
    const texto = await textoDeMetricas(app);
    expect(lineasCon(texto, 'academix_rpc_calls_total{', 'operation="reservas.solicitar"').join('\n'))
      .toContain('status="ok"');
    expect(lineasCon(texto, 'academix_rpc_calls_total{', 'status="error"')).toHaveLength(1);
    const estadoBroker = lineasCon(texto, 'academix_broker_connected', '');
    expect(estadoBroker).toHaveLength(1);
    expect(estadoBroker[0]).toMatch(/\} 1$/);
  });
});

describe('Logs estructurados', () => {
  function capturar(): { salida: string[]; log: ReturnType<typeof crearLogger> } {
    const salida: string[] = [];
    const destino = new Writable({
      write(chunk, _encoding, callback) { salida.push(String(chunk)); callback(); },
    });
    return { salida, log: crearLogger('info', destino) };
  }

  test('emite una línea JSON por petición con método, ruta y duración', async () => {
    const { salida, log } = capturar();
    const app = createApp(servicios, opciones, { log, metricas: crearMetricas() });
    const r = await request(app).get('/api/eventos').set('Authorization', 'Bearer super-secreto');
    expect(r.status).toBe(200);
    await esperar(30);

    const peticion = eventos(salida).find((e) => e.ruta === '/api/eventos');
    expect(peticion).toMatchObject({ metodo: 'GET', estado: 200, servicio: 'api-gateway' });
    expect(peticion?.duracion_ms).toEqual(expect.any(Number));
    expect(peticion?.peticion_id).toEqual(expect.any(String));
    expect(salida.join('')).not.toContain('super-secreto');
  });

  test('registra las respuestas de error con su estado', async () => {
    const { salida, log } = capturar();
    const app = createApp(servicios, opciones, { log, metricas: crearMetricas() });
    await request(app).get('/api/que-no-existe');
    await esperar(30);
    const perdida = eventos(salida).find((e) => e.ruta === 'no_encontrada');
    expect(perdida).toMatchObject({ metodo: 'GET', estado: 404 });
  });

  test('el log de un error sigue mostrando el recurso, no la raíz', async () => {
    const { salida, log } = capturar();
    const caido = {
      talleres: { listarEventos: jest.fn(async () => { throw { code: 'UNAVAILABLE' }; }) },
    } as unknown as Servicios;
    const app = createApp(caido, opciones, { log, metricas: crearMetricas() });
    await request(app).get('/api/eventos');
    await esperar(30);
    const fallo = eventos(salida).find((e) => e.estado === 503);
    expect(fallo).toMatchObject({ metodo: 'GET', ruta: '/api/eventos', estado: 503 });
    expect(fallo?.peticion_id).toEqual(expect.any(String));
  });

  test('omite las sondas de salud y de Prometheus', async () => {
    const { salida, log } = capturar();
    const app = createApp(servicios, opciones, { log, metricas: crearMetricas() });
    await request(app).get('/health');
    await request(app).get('/health/ready');
    await request(app).get('/metrics');
    await esperar(30);
    expect(eventos(salida)).toHaveLength(0);
  });
});

describe('Observabilidad del bus', () => {
  const canalFalso = () => ({
    on: jest.fn(),
    assertExchange: jest.fn(async () => undefined),
    checkExchange: jest.fn(async () => undefined),
  });

  test('probar() devuelve false cuando el broker no acepta conexión', async () => {
    conectar.mockRejectedValueOnce(new Error('ECONNREFUSED'));
    await expect(new BusRpc('amqp://localhost:5672', 50).probar()).resolves.toBe(false);
  });

  test('probar() reutiliza el canal y publica el estado del broker', async () => {
    conectar.mockResolvedValueOnce({
      createConfirmChannel: async () => canalFalso(),
      close: jest.fn(async () => undefined),
      on: jest.fn(),
    });
    const telemetria = { rpc: jest.fn(), broker: jest.fn() };
    const bus = new BusRpc('amqp://localhost:5672', 500, { telemetria });
    await expect(bus.probar()).resolves.toBe(true);
    expect(telemetria.broker).toHaveBeenCalledWith(true);
    await bus.cerrar();
    expect(telemetria.broker).toHaveBeenLastCalledWith(false);
  });

  test('una RPC que no llega al broker se registra como error', async () => {
    conectar.mockRejectedValueOnce(new Error('ECONNREFUSED'));
    const telemetria = { rpc: jest.fn(), broker: jest.fn() };
    const bus = new BusRpc('amqp://localhost:5672', 50, { telemetria });
    await expect(bus.enviar('reservas.solicitar', {})).rejects.toMatchObject({ code: 'UNAVAILABLE' });
    expect(telemetria.rpc).toHaveBeenCalledWith('reservas.solicitar', expect.any(Number), 'error');
  });
});
