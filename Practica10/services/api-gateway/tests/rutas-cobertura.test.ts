// HeinzGomez - Práctica 9: pruebas de las ramas defensivas de la capa HTTP (cuerpos que no son
// objetos, listas sin la clave esperada y errores del bus en el stream de cupos).
import request from 'supertest';
import http from 'http';
import { AddressInfo } from 'net';
import { createApp } from '../src/app';
import {
  Credenciales, Registro, Servicios, SolicitudCertificado, SolicitudNuevoExamen,
} from '../src/types';

const errorDe = (code: string, mensaje: string) => Object.assign(new Error(mensaje), { code });

const estudiante = {
  id: 'u1', nombre: 'Heinz Gómez', carnet: '202010044',
  correo: 'h@ingenieria.usac.edu.gt', rol: 'ESTUDIANTE' as const,
};
const admin = { ...estudiante, id: 'a1', rol: 'ADMINISTRADOR' as const };

function dobles(): Servicios {
  return ({
    auth: {
      registro: jest.fn(async (r: Registro) => ({ token: 't', usuario: { ...estudiante, correo: r.correo } })),
      login: jest.fn(async (_r: Credenciales) => ({ token: 'tok-est', usuario: estudiante })),
      validarToken: jest.fn(async (r: { token: string }) => (
        r.token === 'tok-admin' ? { valido: true, usuario: admin } : { valido: true, usuario: estudiante }
      )),
    },
    talleres: {
      listarEventos: jest.fn(async () => ({} as any)),
      obtenerEvento: jest.fn(async () => ({
        id: 'evt-1', titulo: 'Taller', descripcion: '', tipo: 'TALLER' as const,
        curso_codigo: '0970', curso_nombre: 'Software Avanzado',
        fecha_inicio: '2026-10-15T10:00:00Z', duracion_min: 60, lugar: 'Lab 3',
        cupo_total: 40, cupo_disponible: 40,
        ponente: { nombre: 'P', titulo: 'T', bio: 'B', correo: 'p@x' },
        prerrequisitos: [], tiene_certificacion: true,
      })),
      obtenerCupos: jest.fn(async () => ({} as any)),
      crearEvento: jest.fn(async (d: any) => ({ id: 'evt-2', ...d })),
      actualizarEvento: jest.fn(async (d: any) => ({ id: 'evt-1', ...d })),
      eliminarEvento: jest.fn(async () => ({ eliminado: true })),
    },
    reservas: {
      solicitarReserva: jest.fn(async () => ({
        id: 'TKT-1', usuario_id: 'u1', evento_id: 'evt-1', estado: 'PENDIENTE' as const,
        motivo: '', tipo: 'ACREDITACION' as const, creado_en: 'x', actualizado_en: 'x',
        cupo_restante: 39,
      })),
      consultarTicket: jest.fn(async (d: { id: string }) => ({
        id: d.id, usuario_id: 'u1', evento_id: 'evt-1', estado: 'PENDIENTE' as const,
        motivo: '', tipo: 'ACREDITACION' as const, creado_en: 'x', actualizado_en: 'x',
        cupo_restante: 39,
      })),
      listarReservasUsuario: jest.fn(async () => ({})),
    },
    certificados: {
      obtenerExamen: jest.fn(async () => ({ evento_id: 'evt-1', nota_minima: 60, preguntas: [] })),
      rendirExamen: jest.fn(async (d: any) => ({
        intento_id: 'i1', aprobado: d.respuestas.length > 0, nota: 0, correctas: 0, total: 0,
      })),
      generarCertificado: jest.fn(async (d: SolicitudCertificado) => ({ id: 'CERT-1', ...d })),
      listarCertificados: jest.fn(async () => ({})),
      verificarCertificado: jest.fn(async () => ({ valido: false, mensaje: 'No', certificado: null })),
      obtenerExamenAdmin: jest.fn(async () => ({
        id_examen: 7, evento_id: 'evt-1', titulo: 'x', puntaje_minimo: 60,
        estado: 'ACTIVO', preguntas: [],
      })),
      crearExamen: jest.fn(async (d: SolicitudNuevoExamen) => ({
        id_examen: 7, evento_id: d.evento_id, titulo: d.titulo, puntaje_minimo: 60,
        estado: 'ACTIVO', preguntas: [],
      })),
      agregarPregunta: jest.fn(async (d: any) => ({ id_pregunta: 1, ...d })),
    },
  } as unknown as Servicios);
}

const opciones = {
  origenesPermitidos: ['http://localhost:3000'],
  cupoStreamMs: 40,
  limiteReservasPorMinuto: 50,
};

let s: Servicios;
let app: ReturnType<typeof createApp>;
beforeEach(() => {
  s = dobles();
  app = createApp(s, opciones);
});

/** Envía un cuerpo JSON que no es objeto: las rutas deben seguir respondiendo sin romper. */
const jsonLista = (url: string, token?: string) => {
  const p = request(app).post(url).set('Content-Type', 'application/json').send('[]');
  return token ? p.set('Authorization', `Bearer ${token}`) : p;
};

describe('cuerpos JSON que no son objetos', () => {
  test('registro y login no fallan con un cuerpo que no aporta campos', async () => {
    const registro = await jsonLista('/api/auth/register');
    expect(registro.status).toBe(201);
    expect(s.auth.registro).toHaveBeenCalledWith([]);

    const login = await jsonLista('/api/auth/login');
    expect(login.status).toBe(200);
    expect(s.auth.login).toHaveBeenCalledWith([]);
  });

  test('solicitar reserva sin evento_id responde 400 sin tocar el bus', async () => {
    const r = await jsonLista('/api/reservas', 'tok-est');
    expect(r.status).toBe(400);
    expect(s.reservas.solicitarReserva).not.toHaveBeenCalled();
  });

  test('rendir el examen sin respuestas manda la lista vacía', async () => {
    const r = await jsonLista('/api/examenes/evt-1', 'tok-est');
    expect(r.status).toBe(200);
    expect(s.certificados.rendirExamen).toHaveBeenCalledWith({
      usuario_id: 'u1',
      evento_id: 'evt-1',
      respuestas: [],
    });
    expect(r.body.aprobado).toBe(false);
  });

  test('crear examen de administrador sin campos responde 400', async () => {
    expect((await jsonLista('/api/examenes', 'tok-admin')).status).toBe(400);
    expect(s.certificados.crearExamen).not.toHaveBeenCalled();
  });

  test('agregar pregunta sin campos responde 400', async () => {
    expect((await jsonLista('/api/examenes/7/preguntas', 'tok-admin')).status).toBe(400);
    expect(s.certificados.agregarPregunta).not.toHaveBeenCalled();
  });

  test('generar diploma sin evento_id responde 400', async () => {
    expect((await jsonLista('/api/certificados', 'tok-est')).status).toBe(400);
    expect(s.certificados.generarCertificado).not.toHaveBeenCalled();
  });
});

describe('respuestas del bus sin la clave esperada', () => {
  test('listar reservas sin `tickets` responde un arreglo vacío', async () => {
    const r = await request(app).get('/api/reservas').set('Authorization', 'Bearer tok-est');
    expect(r.status).toBe(200);
    expect(r.body).toEqual([]);
  });

  test('listar certificados sin `certificados` responde un arreglo vacío', async () => {
    const r = await request(app).get('/api/certificados').set('Authorization', 'Bearer tok-est');
    expect(r.status).toBe(200);
    expect(r.body).toEqual([]);
  });

  test('listar eventos sin `eventos` responde un arreglo vacío', async () => {
    const r = await request(app).get('/api/eventos');
    expect(r.status).toBe(200);
    expect(r.body).toEqual([]);
  });
});

describe('stream de cupos', () => {
  test('si el bus falla, el stream emite el evento de error y se cierra', async () => {
    (s.talleres.obtenerCupos as jest.Mock).mockRejectedValue(errorDe('UNAVAILABLE', 'broker caído'));
    const server = http.createServer(app).listen(0);
    const { port } = server.address() as AddressInfo;
    try {
      const datos = await new Promise<string>((resolve, reject) => {
        const limite = setTimeout(() => reject(new Error('sin evento de error')), 3000);
        http.get(`http://127.0.0.1:${port}/api/eventos/cupos/stream`, (res) => {
          let buf = '';
          res.on('data', (c) => {
            buf += String(c);
            if (buf.includes('event: error')) {
              clearTimeout(limite);
              res.destroy();
              resolve(buf);
            }
          });
        }).on('error', reject);
      });
      expect(datos).toContain('event: error');
    } finally {
      server.close();
    }
  });
});
