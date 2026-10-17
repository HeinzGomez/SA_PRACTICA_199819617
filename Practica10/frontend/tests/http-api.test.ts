// HeinzGomez - Práctica 9: pruebas del cliente HTTP del API Gateway (normalización y errores)
import { HttpApi, qs } from '../lib/http-api';
import { ApiError } from '../lib/types';

const respuesta = (status: number, body?: unknown) =>
  Promise.resolve({ status, ok: status < 400, json: () => (body === undefined ? Promise.reject(new Error('sin cuerpo')) : Promise.resolve(body)) } as Response);

const conFetch = (f: jest.Mock) => new HttpApi('http://x', f as unknown as typeof fetch);

describe('cliente HTTP del API Gateway', () => {
  test('construye URL, cabecera Bearer y cuerpo', async () => {
    const f = jest.fn(() => respuesta(202, { id: 'TKT-1', estado: 'PENDIENTE' }));
    const api = new HttpApi('https://gw.example.com/', f as unknown as typeof fetch);
    const t = await api.solicitarReserva('tok', 'evt-1', 'ACREDITACION');
    expect(t.estado).toBe('PENDIENTE');
    const [url, init] = (f.mock.calls[0] as unknown) as [string, RequestInit];
    expect(url).toBe('https://gw.example.com/api/reservas');
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer tok');
    expect(JSON.parse(init.body as string)).toEqual({ evento_id: 'evt-1', tipo: 'ACREDITACION' });
  });

  test('propaga errores del gateway y de red', async () => {
    const api = conFetch(jest.fn(() => respuesta(409, { error: 'No tiene aprobado el examen' })));
    await expect(api.generarCertificado('t', 'e')).rejects.toMatchObject({ status: 409, message: 'No tiene aprobado el examen' });
    const caido = conFetch(jest.fn(() => Promise.reject(new Error('net'))));
    await expect(caido.cupos()).rejects.toMatchObject({ status: 0 });
    const sinCuerpo = conFetch(jest.fn(() => respuesta(500)));
    await expect(sinCuerpo.cupos()).rejects.toMatchObject({ status: 500 });
    const vacio = conFetch(jest.fn(() => respuesta(204)));
    await expect(vacio.eliminarEvento('t', 'e')).resolves.toBeUndefined();
    const error = conFetch(jest.fn(() => respuesta(401, {})));
    await expect(error.misReservas('t')).rejects.toBeInstanceOf(ApiError);
  });

  test('qs omite parámetros vacíos', () => {
    expect(qs({ curso: '0970', tipo: undefined, desde: '' })).toBe('?curso=0970');
    expect(qs({})).toBe('');
  });
});

describe('normalización de respuestas (checks por si no viene nada)', () => {
  test('las listas vuelven vacías cuando el cuerpo no es un arreglo', async () => {
    const api = conFetch(jest.fn(() => respuesta(200, { algo: 'x' })));
    await expect(api.listarEventos()).resolves.toEqual([]);
    await expect(api.misReservas('t')).resolves.toEqual([]);
    await expect(api.misCertificados('t')).resolves.toEqual([]);
    await expect(api.cupos()).resolves.toEqual([]);
    const nulo = conFetch(jest.fn(() => respuesta(200, null)));
    await expect(nulo.listarEventos()).resolves.toEqual([]);
  });

  test('un examen sin preguntas se devuelve completo y con nota mínima por defecto', async () => {
    const api = conFetch(jest.fn(() => respuesta(200, {})));
    await expect(api.obtenerExamen('t', 'evt-1')).resolves.toEqual({ evento_id: 'evt-1', nota_minima: 70, preguntas: [] });
  });

  test('descarta preguntas u opciones mal formadas', async () => {
    const api = conFetch(jest.fn(() => respuesta(200, {
      evento_id: 'evt-2',
      nota_minima: '80',
      preguntas: [
        null,
        { id: '', enunciado: 'sin id', opciones: [{ id: '1', texto: 'a' }] },
        { id: 'p1', enunciado: 'ok', opciones: [] },
        { id: 'p2', enunciado: 'ok 2', opciones: [{ id: 'o1', texto: 'a' }, { id: 'o2', texto: 'b' }] },
      ],
    })));
    const ex = await api.obtenerExamen('t', 'evt-2');
    expect(ex.nota_minima).toBe(80);
    expect(ex.preguntas).toHaveLength(1);
    expect(ex.preguntas[0].id).toBe('p2');
    expect(ex.preguntas[0].opciones).toHaveLength(2);
  });

  test('un diploma incompleto se rellena y la verificación sin certificado da null', async () => {
    const lista = conFetch(jest.fn(() => respuesta(200, [{ id: 'CERT-1' }])));
    const [c] = await lista.misCertificados('t');
    expect(c).toMatchObject({ id: 'CERT-1', codigo_hash: '', firma: '', nota: 0, emitido_en: '' });

    const ver = conFetch(jest.fn(() => respuesta(200, { valido: true, certificado: { id: 'CERT-2' } })));
    const r = await ver.verificar('CERT-2');
    expect(r.valido).toBe(true);
    expect(r.certificado?.id).toBe('CERT-2');

    const sin = conFetch(jest.fn(() => respuesta(200, {})));
    const r2 = await sin.verificar('x');
    expect(r2).toEqual({ valido: false, mensaje: '', certificado: null });
  });

  test('el diploma emitido también se normaliza', async () => {
    const api = conFetch(jest.fn(() => respuesta(201, { id: 'CERT-3' })));
    await expect(api.generarCertificado('t', 'evt-1')).resolves.toMatchObject({ id: 'CERT-3', nombre_estudiante: '' });
  });

  test('los flujos de administración de exámenes usan las rutas del gateway', async () => {
    const f = jest.fn(() => respuesta(201, { id_examen: 7, estado: 'ACTIVO' }));
    const api = conFetch(f);
    await api.crearExamen('tok', { evento_id: 'evt-1', titulo: 'Examen' });
    expect((f.mock.calls[0] as unknown as [string, RequestInit])[0]).toBe('http://x/api/examenes');

    await api.agregarPregunta('tok', { id_examen: 7, enunciado: '¿Dos más dos?', opciones: [{ texto: '4', es_correcta: true }] });
    const [url, init] = (f.mock.calls[1] as unknown) as [string, RequestInit];
    expect(url).toBe('http://x/api/examenes/7/preguntas');
    expect(JSON.parse(init.body as string)).toEqual({
      enunciado: '¿Dos más dos?', opciones: [{ texto: '4', es_correcta: true }],
    });
  });
});
