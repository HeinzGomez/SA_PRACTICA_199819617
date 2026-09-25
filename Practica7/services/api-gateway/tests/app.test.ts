// HeinzGomez - Práctica 7: pruebas unitarias del API Gateway con dobles de los servicios gRPC (Jest + supertest)
import request from 'supertest';
import http from 'http';
import { AddressInfo } from 'net';
import { createApp, httpStatus } from '../src/app';
import { Servicios } from '../src/types';

const estudiante = { id: 'u1', nombre: 'Heinz Gómez', carnet: '202010044', correo: 'h@ingenieria.usac.edu.gt', rol: 'ESTUDIANTE' };
const admin = { ...estudiante, id: 'a1', rol: 'ADMINISTRADOR' };
const evento = { id: 'evt-1', titulo: 'Taller K8s', curso_codigo: '0970', curso_nombre: 'Software Avanzado' };
const grpcError = (code: number, details: string) => Object.assign(new Error(details), { code, details });

function dobles(): Servicios {
  return {
    auth: {
      Register: jest.fn(async (r) => ({ token: 't', usuario: { ...estudiante, correo: r.correo } })),
      Login: jest.fn(async (r) => { if (r.password !== 'ok') throw grpcError(16, 'Credenciales incorrectas'); return { token: 'tok-est' }; }),
      ValidateToken: jest.fn(async ({ token }) => (
        token === 'tok-est' ? { valido: true, usuario: estudiante }
          : token === 'tok-admin' ? { valido: true, usuario: admin } : { valido: false })),
    },
    talleres: {
      ListarEventos: jest.fn(async () => ({ eventos: [evento] })),
      ObtenerEvento: jest.fn(async ({ id }) => { if (id !== 'evt-1') throw grpcError(5, 'Evento no existe'); return evento; }),
      ObtenerCupos: jest.fn(async () => ({ cupos: [{ evento_id: 'evt-1', cupo_total: 40, cupo_disponible: 39 }] })),
      CrearEvento: jest.fn(async (e) => ({ ...e, id: 'evt-2' })),
      ActualizarEvento: jest.fn(async (e) => e),
      EliminarEvento: jest.fn(async () => ({ eliminado: true })),
    },
    reservas: {
      SolicitarReserva: jest.fn(async (r) => ({ id: 'TKT-1', usuario_id: r.usuario_id, evento_id: r.evento_id, estado: 'PENDIENTE' })),
      ConsultarTicket: jest.fn(async ({ id }) => ({ id, usuario_id: id === 'TKT-OTRO' ? 'u9' : 'u1', estado: 'CONFIRMADA' })),
      ListarReservasUsuario: jest.fn(async () => ({ tickets: [{ id: 'TKT-1' }] })),
    },
    certificados: {
      ObtenerExamen: jest.fn(async () => ({ preguntas: [{ id: 'p1' }] })),
      RendirExamen: jest.fn(async (r) => ({ aprobado: r.respuestas.length > 0, nota: 100 })),
      GenerarCertificado: jest.fn(async (r) => ({ id: 'CERT-1', ...r })),
      ListarCertificados: jest.fn(async () => ({ certificados: [{ id: 'CERT-1' }] })),
      VerificarCertificado: jest.fn(async ({ codigo }) => ({ valido: codigo === 'CERT-1' })),
    },
  };
}

const opciones = { origenesPermitidos: ['http://localhost:3000', '*.vercel.app'], cupoStreamMs: 50, limiteReservasPorMinuto: 3 };
let s: Servicios;
let app: ReturnType<typeof createApp>;
beforeEach(() => { s = dobles(); app = createApp(s, opciones); });

describe('salud, CORS y errores', () => {
  test('GET /health', async () => {
    expect((await request(app).get('/health')).body.status).toBe('ok');
  });
  test('CORS permite subdominios de vercel.app y bloquea otros', async () => {
    const ok = await request(app).get('/health').set('Origin', 'https://academix-pass.vercel.app');
    expect(ok.headers['access-control-allow-origin']).toBe('https://academix-pass.vercel.app');
    const no = await request(app).get('/health').set('Origin', 'https://malicioso.com');
    expect(no.headers['access-control-allow-origin']).toBeUndefined();
  });
  test('ruta inexistente 404 y mapeo gRPC->HTTP', async () => {
    expect((await request(app).get('/api/nada')).status).toBe(404);
    expect(httpStatus({ code: 9 })).toBe(409);
    expect(httpStatus({ code: 14 })).toBe(503);
    expect(httpStatus({ code: 99 })).toBe(500);
    expect(httpStatus(new Error('x'))).toBe(500);
  });
  test('error interno no filtra detalles', async () => {
    (s.talleres.ListarEventos as jest.Mock).mockRejectedValueOnce(new Error('stack secreto'));
    const r = await request(app).get('/api/eventos');
    expect(r.status).toBe(500);
    expect(r.body.error).toBe('Error interno');
  });
});

describe('CDU 1 autenticación', () => {
  test('registro 201 y login', async () => {
    expect((await request(app).post('/api/auth/register').send({ correo: 'x@ingenieria.usac.edu.gt' })).status).toBe(201);
    expect((await request(app).post('/api/auth/login').send({ correo: 'x', password: 'ok' })).body.token).toBe('tok-est');
  });
  test('credenciales incorrectas -> 401', async () => {
    const r = await request(app).post('/api/auth/login').send({ correo: 'x', password: 'mal' });
    expect(r.status).toBe(401);
    expect(r.body.error).toBe('Credenciales incorrectas');
  });
  test('/me requiere token válido', async () => {
    expect((await request(app).get('/api/auth/me')).status).toBe(401);
    expect((await request(app).get('/api/auth/me').set('Authorization', 'Bearer malo')).status).toBe(401);
    expect((await request(app).get('/api/auth/me').set('Authorization', 'Bearer tok-est')).body.id).toBe('u1');
  });
});

describe('CDU 2 catálogo y administración', () => {
  test('lista con filtros traducidos al contrato gRPC', async () => {
    await request(app).get('/api/eventos?curso=0970&desde=2026-10-01&hasta=2026-10-31&tipo=TALLER');
    expect(s.talleres.ListarEventos).toHaveBeenCalledWith({ curso_codigo: '0970', fecha_desde: '2026-10-01', fecha_hasta: '2026-10-31', tipo: 'TALLER' });
  });
  test('detalle, cupos y 404', async () => {
    expect((await request(app).get('/api/eventos/evt-1')).body.titulo).toBe('Taller K8s');
    expect((await request(app).get('/api/eventos/zzz')).status).toBe(404);
    await request(app).get('/api/eventos/cupos?ids=evt-1,evt-2');
    expect(s.talleres.ObtenerCupos).toHaveBeenCalledWith({ evento_ids: ['evt-1', 'evt-2'] });
  });
  test('CRUD solo para ADMINISTRADOR', async () => {
    expect((await request(app).post('/api/eventos').set('Authorization', 'Bearer tok-est').send({})).status).toBe(403);
    expect((await request(app).post('/api/eventos').set('Authorization', 'Bearer tok-admin').send({ titulo: 't' })).status).toBe(201);
    const put = await request(app).put('/api/eventos/evt-1').set('Authorization', 'Bearer tok-admin').send({ id: 'otro', cupo_total: 50 });
    expect(put.body.id).toBe('evt-1');
    expect((await request(app).delete('/api/eventos/evt-1').set('Authorization', 'Bearer tok-admin')).status).toBe(204);
  });
  test('SSE de cupos en tiempo real', async () => {
    const server = http.createServer(app).listen(0);
    const { port } = server.address() as AddressInfo;
    const datos = await new Promise<string>((resolve) => {
      http.get(`http://127.0.0.1:${port}/api/eventos/cupos/stream`, (res) => {
        expect(res.headers['content-type']).toContain('text/event-stream');
        let buf = '';
        res.on('data', (c) => {
          buf += c;
          if ((buf.match(/event: cupos/g) ?? []).length >= 2) { res.destroy(); resolve(buf); }
        });
      });
    });
    server.close();
    expect(datos).toContain('"cupo_disponible":39');
  });
});

describe('CDU 3 reserva asíncrona', () => {
  const post = (body: any, token = 'tok-est') => request(app).post('/api/reservas').set('Authorization', `Bearer ${token}`).send(body);

  test('responde 202 con ticket PENDIENTE y cabecera Location', async () => {
    const r = await post({ evento_id: 'evt-1' });
    expect(r.status).toBe(202);
    expect(r.body.estado).toBe('PENDIENTE');
    expect(r.headers.location).toBe('/api/reservas/TKT-1');
    expect(s.reservas.SolicitarReserva).toHaveBeenCalledWith({ usuario_id: 'u1', evento_id: 'evt-1', tipo: 'ACREDITACION' });
  });
  test('validaciones: body, evento inexistente, rol', async () => {
    expect((await post({})).status).toBe(400);
    expect((await post({ evento_id: 'evt-1', tipo: 'OTRO' })).status).toBe(400);
    expect((await post({ evento_id: 'nope' })).status).toBe(404);
    expect((await post({ evento_id: 'evt-1' }, 'tok-admin')).status).toBe(403);
  });
  test('broker caído -> 503', async () => {
    (s.reservas.SolicitarReserva as jest.Mock).mockRejectedValueOnce(grpcError(14, 'broker de mensajería no disponible'));
    expect((await post({ evento_id: 'evt-1' })).status).toBe(503);
  });
  test('rate limit por usuario -> 429', async () => {
    for (let i = 0; i < 3; i++) await post({ evento_id: 'evt-1' });
    expect((await post({ evento_id: 'evt-1' })).status).toBe(429);
  });
  test('consultar ticket propio, ajeno oculto y listar', async () => {
    const auth = { Authorization: 'Bearer tok-est' };
    expect((await request(app).get('/api/reservas/TKT-1').set(auth)).body.estado).toBe('CONFIRMADA');
    expect((await request(app).get('/api/reservas/TKT-OTRO').set(auth)).status).toBe(404);
    expect((await request(app).get('/api/reservas/TKT-OTRO').set('Authorization', 'Bearer tok-admin')).status).toBe(200);
    expect((await request(app).get('/api/reservas').set(auth)).body).toHaveLength(1);
  });
});

describe('CDU 3.4-3.7 y 4 certificación', () => {
  const auth = { Authorization: 'Bearer tok-est' };
  test('examen: obtener y rendir con respuestas transformadas', async () => {
    expect((await request(app).get('/api/examenes/evt-1').set(auth)).body.preguntas).toHaveLength(1);
    const r = await request(app).post('/api/examenes/evt-1').set(auth).send({ respuestas: { p1: 'a', p2: 'b' } });
    expect(r.body.aprobado).toBe(true);
    expect(s.certificados.RendirExamen).toHaveBeenCalledWith({
      usuario_id: 'u1', evento_id: 'evt-1', respuestas: [{ pregunta_id: 'p1', opcion_id: 'a' }, { pregunta_id: 'p2', opcion_id: 'b' }],
    });
  });
  test('generar diploma enriquece con datos del evento y del usuario', async () => {
    expect((await request(app).post('/api/certificados').set(auth).send({})).status).toBe(400);
    const r = await request(app).post('/api/certificados').set(auth).send({ evento_id: 'evt-1' });
    expect(r.status).toBe(201);
    expect(r.body).toMatchObject({ nombre_estudiante: 'Heinz Gómez', evento_titulo: 'Taller K8s', curso_codigo: '0970' });
  });
  test('precondición no cumplida -> 409', async () => {
    (s.certificados.GenerarCertificado as jest.Mock).mockRejectedValueOnce(grpcError(9, 'No tiene aprobado el examen'));
    const r = await request(app).post('/api/certificados').set(auth).send({ evento_id: 'evt-1' });
    expect(r.status).toBe(409);
    expect(r.body.error).toContain('No tiene aprobado');
  });
  test('listar con filtros y verificación pública sin token', async () => {
    await request(app).get('/api/certificados?curso=0970&desde=2026-01-01').set(auth);
    expect(s.certificados.ListarCertificados).toHaveBeenCalledWith({ usuario_id: 'u1', curso_codigo: '0970', fecha_desde: '2026-01-01', fecha_hasta: '' });
    expect((await request(app).get('/api/certificados/verificar/CERT-1')).body.valido).toBe(true);
    expect((await request(app).get('/api/certificados/verificar/falso')).body.valido).toBe(false);
  });
});
