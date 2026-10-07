// HeinzGomez - Práctica 9: pruebas unitarias del API Gateway con dobles de las operaciones RPC (Jest + supertest)
import request from 'supertest';
import http from 'http';
import { AddressInfo } from 'net';
import { createApp } from '../src/app';
import { httpStatus } from '../src/routes';
import {
  Certificado, Credenciales, Evento, FiltroCertificados, FiltroEventos, PreguntaExamen, Registro,
  Servicios, SolicitudCertificado, SolicitudNuevaPregunta, SolicitudNuevoExamen, SolicitudReserva,
  Ticket, UsuarioSesion,
} from '../src/types';

const estudiante: UsuarioSesion = { id: 'u1', nombre: 'Heinz Gómez', carnet: '202010044', correo: 'h@ingenieria.usac.edu.gt', rol: 'ESTUDIANTE' };
const admin: UsuarioSesion = { ...estudiante, id: 'a1', rol: 'ADMINISTRADOR' };

const evento: Evento = {
  id: 'evt-1',
  titulo: 'Taller K8s',
  descripcion: 'Orquestación con Kubernetes',
  tipo: 'TALLER',
  curso_codigo: '0970',
  curso_nombre: 'Software Avanzado',
  fecha_inicio: '2026-10-15T10:00:00Z',
  duracion_min: 120,
  lugar: 'Laboratorio 3',
  cupo_total: 40,
  cupo_disponible: 39,
  ponente: { nombre: 'Dra. Pérez', titulo: 'Ingeniera', bio: 'Especialista en contenedores', correo: 'p@ingenieria.usac.edu.gt' },
  prerrequisitos: ['0970'],
  tiene_certificacion: true,
};

const pregunta: PreguntaExamen = {
  id: 'p1',
  enunciado: '¿Qué es un Pod?',
  opciones: [{ id: 'o1', texto: 'Unidades de despliegue' }],
};

const ticket: Ticket = {
  id: 'TKT-1',
  usuario_id: 'u1',
  evento_id: 'evt-1',
  estado: 'PENDIENTE',
  motivo: '',
  tipo: 'ACREDITACION',
  creado_en: '2026-10-01T00:00:00Z',
  actualizado_en: '2026-10-01T00:00:00Z',
  cupo_restante: 38,
};

const certificado: Certificado = {
  id: 'CERT-1',
  usuario_id: 'u1',
  nombre_estudiante: 'Heinz Gómez',
  evento_id: 'evt-1',
  evento_titulo: 'Taller K8s',
  curso_codigo: '0970',
  curso_nombre: 'Software Avanzado',
  nota: 95,
  emitido_en: '2026-10-20T00:00:00Z',
  codigo_hash: 'abc123',
  firma: 'firma',
};

const errorDe = (code: string, mensaje: string) => Object.assign(new Error(mensaje), { code });

function dobles(): Servicios {
  return {
    auth: {
      registro: jest.fn(async (r: Registro) => ({ token: 't', usuario: { ...estudiante, correo: r.correo } })),
      login: jest.fn(async (r: Credenciales) => {
        if (r.password !== 'ok') throw errorDe('UNAUTHENTICATED', 'Credenciales incorrectas');
        return { token: 'tok-est', usuario: estudiante };
      }),
      validarToken: jest.fn(async (r: { token: string }) => (
        r.token === 'tok-est' ? { valido: true, usuario: estudiante }
          : r.token === 'tok-admin' ? { valido: true, usuario: admin } : { valido: false }
      )),
    },
    talleres: {
      listarEventos: jest.fn(async (_d: FiltroEventos) => ({ eventos: [evento] })),
      obtenerEvento: jest.fn(async (d: { id: string }) => {
        if (d.id !== 'evt-1') throw errorDe('NOT_FOUND', 'Evento no existe');
        return evento;
      }),
      obtenerCupos: jest.fn(async (_d: { evento_ids: string[] }) => ({ cupos: [{ evento_id: 'evt-1', cupo_total: 40, cupo_disponible: 39 }] })),
      crearEvento: jest.fn(async (d: Partial<Evento>) => ({ ...evento, ...d, id: 'evt-2' })),
      actualizarEvento: jest.fn(async (d: Partial<Evento>) => ({ ...evento, ...d })),
      eliminarEvento: jest.fn(async (_d: { id: string }) => ({ eliminado: true })),
    },
    reservas: {
      solicitarReserva: jest.fn(async (d: SolicitudReserva) => ({ ...ticket, id: 'TKT-1', usuario_id: d.usuario_id, evento_id: d.evento_id, tipo: d.tipo })),
      consultarTicket: jest.fn(async (d: { id: string }) => ({ ...ticket, id: d.id, usuario_id: d.id === 'TKT-OTRO' ? 'u9' : 'u1', estado: 'CONFIRMADA' })),
      listarReservasUsuario: jest.fn(async (_d: { id: string }) => ({ tickets: [ticket] })),
    },
    certificados: {
      obtenerExamen: jest.fn(async (_d: { evento_id: string; usuario_id: string }) => ({ evento_id: 'evt-1', nota_minima: 60, preguntas: [pregunta] })),
      rendirExamen: jest.fn(async (d: { usuario_id: string; evento_id: string; respuestas: { pregunta_id: string; opcion_id: string }[] }) => ({
        intento_id: 'i1',
        aprobado: d.respuestas.length > 0,
        nota: 100,
        correctas: 3,
        total: 3,
      })),
      generarCertificado: jest.fn(async (d: SolicitudCertificado) => ({ ...certificado, ...d })),
      listarCertificados: jest.fn(async (_d: FiltroCertificados) => ({ certificados: [certificado] })),
      verificarCertificado: jest.fn(async (d: { codigo: string }) => ({
        valido: d.codigo === 'CERT-1',
        mensaje: d.codigo === 'CERT-1' ? 'Vigente' : 'No encontrado',
        certificado: d.codigo === 'CERT-1' ? certificado : null,
      })),
      obtenerExamenAdmin: jest.fn(async (d: { evento_id: string }) => ({
        id_examen: 7, evento_id: d.evento_id, titulo: 'Examen de certificación', puntaje_minimo: 60,
        estado: 'ACTIVO', preguntas: [{ id_pregunta: 1, id_examen: 7, enunciado: '¿Cuál?', punteo: 20, opciones: [] }],
      })),
      crearExamen: jest.fn(async (d: SolicitudNuevoExamen) => ({
        id_examen: 7,
        evento_id: d.evento_id,
        titulo: d.titulo,
        puntaje_minimo: d.puntaje_minimo ?? 60,
        estado: d.estado ?? 'ACTIVO',
        preguntas: [],
      })),
      agregarPregunta: jest.fn(async (d: SolicitudNuevaPregunta) => ({
        id_pregunta: 12,
        id_examen: d.id_examen,
        enunciado: d.enunciado,
        punteo: d.punteo ?? 10,
        opciones: [],
      })),
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
  test('ruta inexistente 404 y mapeo de códigos del bus a HTTP', async () => {
    expect((await request(app).get('/api/nada')).status).toBe(404);
    expect(httpStatus({ code: 'FAILED_PRECONDITION' })).toBe(409);
    expect(httpStatus({ code: 'INVALID_ARGUMENT' })).toBe(400);
    expect(httpStatus({ code: 'NOT_FOUND' })).toBe(404);
    expect(httpStatus({ code: 'UNAUTHENTICATED' })).toBe(401);
    expect(httpStatus({ code: 'RESOURCE_EXHAUSTED' })).toBe(429);
    expect(httpStatus({ code: 'UNAVAILABLE' })).toBe(503);
    expect(httpStatus({ code: 'DESERCONOCIDO' })).toBe(500);
    expect(httpStatus(new Error('x'))).toBe(500);
  });
  test('error interno no filtra detalles', async () => {
    (s.talleres.listarEventos as jest.Mock).mockRejectedValueOnce(new Error('stack secreto'));
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
  test('lista con filtros traducidos al contrato RPC', async () => {
    await request(app).get('/api/eventos?curso=0970&desde=2026-10-01&hasta=2026-10-31&tipo=TALLER');
    expect(s.talleres.listarEventos).toHaveBeenCalledWith({ curso_codigo: '0970', fecha_desde: '2026-10-01', fecha_hasta: '2026-10-31', tipo: 'TALLER' });
  });
  test('detalle, cupos y 404', async () => {
    expect((await request(app).get('/api/eventos/evt-1')).body.titulo).toBe('Taller K8s');
    expect((await request(app).get('/api/eventos/zzz')).status).toBe(404);
    await request(app).get('/api/eventos/cupos?ids=evt-1,evt-2');
    expect(s.talleres.obtenerCupos).toHaveBeenCalledWith({ evento_ids: ['evt-1', 'evt-2'] });
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
    expect(s.reservas.solicitarReserva).toHaveBeenCalledWith({ usuario_id: 'u1', evento_id: 'evt-1', tipo: 'ACREDITACION' });
  });
  test('validaciones: body, evento inexistente, rol', async () => {
    expect((await post({})).status).toBe(400);
    expect((await post({ evento_id: 'evt-1', tipo: 'OTRO' })).status).toBe(400);
    expect((await post({ evento_id: 'nope' })).status).toBe(404);
    expect((await post({ evento_id: 'evt-1' }, 'tok-admin')).status).toBe(403);
  });
  test('broker caído -> 503', async () => {
    (s.reservas.solicitarReserva as jest.Mock).mockRejectedValueOnce(errorDe('UNAVAILABLE', 'broker de mensajería no disponible'));
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
    expect(s.certificados.rendirExamen).toHaveBeenCalledWith({
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
    (s.certificados.generarCertificado as jest.Mock).mockRejectedValueOnce(errorDe('FAILED_PRECONDITION', 'No tiene aprobado el examen'));
    const r = await request(app).post('/api/certificados').set(auth).send({ evento_id: 'evt-1' });
    expect(r.status).toBe(409);
    expect(r.body.error).toContain('No tiene aprobado');
  });
  test('listar con filtros y verificación pública sin token', async () => {
    await request(app).get('/api/certificados?curso=0970&desde=2026-01-01').set(auth);
    expect(s.certificados.listarCertificados).toHaveBeenCalledWith({ usuario_id: 'u1', curso_codigo: '0970', fecha_desde: '2026-01-01', fecha_hasta: '' });
    expect((await request(app).get('/api/certificados/verificar/CERT-1')).body.valido).toBe(true);
    expect((await request(app).get('/api/certificados/verificar/falso')).body.valido).toBe(false);
  });
});

describe('administración de exámenes (solo ADMINISTRADOR, por el broker)', () => {
  const est = { Authorization: 'Bearer tok-est' };
  const adm = { Authorization: 'Bearer tok-admin' };

  test('crear examen exige rol ADMIN y campos obligatorios', async () => {
    expect((await request(app).post('/api/examenes').set(est).send({ evento_id: 'evt-1', titulo: 'x' })).status).toBe(403);
    expect((await request(app).post('/api/examenes').set(adm).send({})).status).toBe(400);
    expect((await request(app).post('/api/examenes').set(adm).send({ evento_id: 'evt-1' })).status).toBe(400);
    const r = await request(app).post('/api/examenes').set(adm).send({ evento_id: 'evt-1', titulo: 'Examen K8s', puntaje_minimo: 60 });
    expect(r.status).toBe(201);
    expect(r.body).toMatchObject({ id_examen: 7, estado: 'ACTIVO' });
    expect(s.certificados.crearExamen).toHaveBeenCalledWith({ evento_id: 'evt-1', titulo: 'Examen K8s', puntaje_minimo: 60 });
  });

  test('agregar pregunta: id de examen numérico, enunciado y opciones', async () => {
    expect((await request(app).post('/api/examenes/7/preguntas').set(est).send({})).status).toBe(403);
    expect((await request(app).post('/api/examenes/abc/preguntas').set(adm).send({})).status).toBe(400);
    expect((await request(app).post('/api/examenes/7/preguntas').set(adm).send({ enunciado: '?' })).status).toBe(400);
    const r = await request(app).post('/api/examenes/7/preguntas').set(adm).send({
      enunciado: '¿Dos más dos?',
      opciones: [{ texto: '4', es_correcta: true }, { texto: '5', es_correcta: false }],
    });
    expect(r.status).toBe(201);
    expect(s.certificados.agregarPregunta).toHaveBeenCalledWith({
      id_examen: 7,
      enunciado: '¿Dos más dos?',
      opciones: [{ texto: '4', es_correcta: true }, { texto: '5', es_correcta: false }],
    });
  });

  test('el examen para administrador exige rol y no secuestra la ruta del estudiante', async () => {
    expect((await request(app).get('/api/examenes/evt-1/admin').set(est)).status).toBe(403);
    const r = await request(app).get('/api/examenes/evt-1/admin').set(adm);
    expect(r.status).toBe(200);
    expect(r.body).toMatchObject({ id_examen: 7, evento_id: 'evt-1' });
    expect(s.certificados.obtenerExamenAdmin).toHaveBeenCalledWith({ evento_id: 'evt-1' });
    expect(s.certificados.obtenerExamen).not.toHaveBeenCalled();

    (s.certificados.obtenerExamenAdmin as jest.Mock)
      .mockRejectedValueOnce(errorDe('NOT_FOUND', 'La actividad aún no tiene un examen configurado'));
    const faltante = await request(app).get('/api/examenes/sin-examen/admin').set(adm);
    expect(faltante.status).toBe(404);
    expect(faltante.body.error).toBe('La actividad aún no tiene un examen configurado');
  });

  test('rendir examen sigue siendo de estudiante y no chuta con la ruta admin', async () => {
    const r = await request(app).post('/api/examenes/evt-1').set(est).send({ respuestas: {} });
    expect(r.status).toBe(200);
    expect(s.certificados.rendirExamen).toHaveBeenCalled();
    expect(s.certificados.crearExamen).not.toHaveBeenCalled();
  });

  test('error del bus mapeado a HTTP en las rutas admin', async () => {
    (s.certificados.crearExamen as jest.Mock).mockRejectedValueOnce(errorDe('ALREADY_EXISTS', 'La actividad ya tiene examen'));
    const r = await request(app).post('/api/examenes').set(adm).send({ evento_id: 'evt-1', titulo: 'x' });
    expect(r.status).toBe(409);
    expect(r.body.error).toBe('La actividad ya tiene examen');
  });
});
