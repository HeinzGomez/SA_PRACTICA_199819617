// HeinzGomez - Práctica 7: pruebas unitarias del frontend (lógica del mock, firma, simulador y cliente HTTP)
import { AlmacenMemoria, DEMO, MockApi } from '../lib/mock-api';
import { payloadCanonico, sha256Hex, firmar, verificarFirma } from '../lib/firma';
import { estadoInicial, paso, PARAMETROS_DEFECTO, simularCompleto } from '../lib/simulador';
import { HttpApi, qs } from '../lib/http-api';
import { validarEvento, validarRegistro, coincideFiltro } from '../lib/validaciones';
import { duracion, hashCorto, nivelCupo } from '../lib/formato';
import { calificar, preguntasPara } from '../lib/examenes';
import { EVENTOS_SEED } from '../lib/seed';
import { ApiError } from '../lib/types';

function crear(ahora = { t: Date.parse('2026-09-24T12:00:00Z') }) {
  let semilla = 7;
  const aleatorio = () => { semilla = (semilla * 16807) % 2147483647; return semilla / 2147483647; };
  const api = new MockApi({ almacen: new AlmacenMemoria(), ahora: () => ahora.t, latenciaMs: [1000, 1000], aleatorio });
  return { api, ahora };
}

describe('firma y hash del diploma', () => {
  test('el payload canónico produce el mismo SHA-256 que el Servicio de Certificados (Python)', async () => {
    const c = { id: 'CERT-ABC', usuario_id: 'u1', nombre_estudiante: 'José Pérez', evento_id: 'evt-1', evento_titulo: 'Taller de Ñandú', curso_codigo: '0970', nota: 90, emitido_en: '2026-10-01T00:00:00Z' };
    // valor calculado con app.domain.Firmador.hash(Certificado(...).payload_canonico())
    expect(await sha256Hex(payloadCanonico(c))).toBe('3b0d3d983c58dce5097f6d6fa049f5f30b87b1be5d5389cd4da98054106e540e');
  });
  test('detecta alteraciones', async () => {
    const base = { id: 'C', usuario_id: 'u', nombre_estudiante: 'A', evento_id: 'e', evento_titulo: 't', curso_codigo: 'c', nota: 80, emitido_en: '2026-01-01T00:00:00Z' };
    const cert = { ...base, curso_nombre: '', ...(await firmar(base)) };
    expect(await verificarFirma(cert)).toBe(true);
    expect(await verificarFirma({ ...cert, nota: 100 })).toBe(false);
    expect(await verificarFirma({ ...cert, firma: '%%%' })).toBe(false);
  });
});

describe('MockApi – autenticación (CDU 1)', () => {
  test('login demo y credenciales incorrectas', async () => {
    const { api } = crear();
    const s = await api.login(DEMO.estudiante.correo, DEMO.estudiante.password);
    expect(s.usuario.rol).toBe('ESTUDIANTE');
    expect((s.usuario as any).password).toBeUndefined();
    await expect(api.login(DEMO.estudiante.correo, 'x')).rejects.toMatchObject({ status: 401 });
  });
  test('registro valida datos y duplicados', async () => {
    const { api } = crear();
    await expect(api.register({ nombre: 'A', carnet: '1', correo: 'a@gmail.com', password: 'x' })).rejects.toMatchObject({ status: 400 });
    const s = await api.register({ nombre: 'Heinz Gómez', carnet: '202010044', correo: 'HG@ingenieria.usac.edu.gt', password: 'Segura123' });
    expect(s.usuario.correo).toBe('hg@ingenieria.usac.edu.gt');
    await expect(api.register({ nombre: 'Otro', carnet: '202010045', correo: 'hg@ingenieria.usac.edu.gt', password: 'Segura123' })).rejects.toMatchObject({ status: 409 });
    await expect(api.misReservas('token-falso')).rejects.toBeInstanceOf(ApiError);
  });
});

describe('MockApi – catálogo y administración (CDU 2)', () => {
  test('filtros y detalle', async () => {
    const { api } = crear();
    expect(await api.listarEventos()).toHaveLength(EVENTOS_SEED.length);
    expect((await api.listarEventos({ curso: '0774' })).map((e) => e.id)).toEqual(['evt-sql-03']);
    expect((await api.obtenerEvento('evt-k8s-01')).ponente.nombre).toContain('María');
    await expect(api.obtenerEvento('x')).rejects.toMatchObject({ status: 404 });
  });
  test('CRUD solo administrador y reglas de cupo', async () => {
    const { api } = crear();
    const est = await api.login(DEMO.estudiante.correo, DEMO.estudiante.password);
    const adm = await api.login(DEMO.admin.correo, DEMO.admin.password);
    const nuevo = { titulo: 'Taller de pruebas', tipo: 'TALLER' as const, curso_codigo: '0970', fecha_inicio: '2026-11-01T15:00:00Z', duracion_min: 60, cupo_total: 10, ponente: { nombre: 'X', titulo: '', bio: '', correo: '' } };
    await expect(api.crearEvento(est.token, nuevo)).rejects.toMatchObject({ status: 403 });
    await expect(api.crearEvento(adm.token, { ...nuevo, cupo_total: 0 })).rejects.toMatchObject({ status: 400 });
    const ev = await api.crearEvento(adm.token, nuevo);
    expect(ev.cupo_disponible).toBe(10);
    const ed = await api.actualizarEvento(adm.token, { id: ev.id, cupo_total: 12 });
    expect(ed.cupo_disponible).toBe(12);
    // evt-k8s-01 ya tiene 1 inscrito (demo)
    await expect(api.eliminarEvento(adm.token, 'evt-k8s-01')).rejects.toMatchObject({ status: 409 });
    await expect(api.actualizarEvento(adm.token, { id: 'evt-k8s-01', cupo_total: 0 })).rejects.toMatchObject({ status: 400 });
    await api.eliminarEvento(adm.token, ev.id);
    await expect(api.obtenerEvento(ev.id)).rejects.toMatchObject({ status: 404 });
  });
});

describe('MockApi – reserva asíncrona (CDU 3.1-3.3)', () => {
  test('el ticket nace PENDIENTE y el consumidor lo confirma tras la latencia', async () => {
    const { api, ahora } = crear();
    const s = await api.register({ nombre: 'Ana López', carnet: '202000001', correo: 'ana@ingenieria.usac.edu.gt', password: 'Segura123' });
    const t = await api.solicitarReserva(s.token, 'evt-ci-05', 'ACREDITACION');
    expect(t.estado).toBe('PENDIENTE');
    expect((await api.consultarTicket(s.token, t.id)).estado).toBe('PENDIENTE');
    ahora.t += 1500;
    const final = await api.consultarTicket(s.token, t.id);
    expect(final.estado).toBe('CONFIRMADA');
    expect(final.cupo_restante).toBe(4);
  });

  test('ráfaga: nunca se confirma más que el cupo, duplicados rechazados', async () => {
    const { api } = crear();
    const tickets = [];
    for (let i = 0; i < 12; i++) {
      const s = await api.register({ nombre: `Estudiante ${i}`, carnet: `20200${String(i).padStart(4, '0')}`, correo: `e${i}@ingenieria.usac.edu.gt`, password: 'Segura123' });
      tickets.push({ s, t: await api.solicitarReserva(s.token, 'evt-ci-05', 'ACREDITACION') });
    }
    const dup = await api.solicitarReserva(tickets[0].s.token, 'evt-ci-05', 'ACREDITACION');
    const procesados = await api.procesarCola(true);
    expect(procesados).toHaveLength(13);
    expect(procesados.filter((t) => t.estado === 'CONFIRMADA')).toHaveLength(5);
    expect(procesados.filter((t) => t.motivo === 'SIN_CUPO')).toHaveLength(7);
    expect(procesados.find((t) => t.id === dup.id)!.motivo).toBe('RESERVA_DUPLICADA');
    expect((await api.cupos()).find((c) => c.evento_id === 'evt-ci-05')!.cupo_disponible).toBe(0);
    expect(await api.procesarCola(true)).toHaveLength(0); // idempotente
  });

  test('ticket ajeno oculto y reglas de rol', async () => {
    const { api } = crear();
    const a = await api.login(DEMO.estudiante.correo, DEMO.estudiante.password);
    const b = await api.register({ nombre: 'Beto Ruiz', carnet: '202000002', correo: 'beto@ingenieria.usac.edu.gt', password: 'Segura123' });
    const adm = await api.login(DEMO.admin.correo, DEMO.admin.password);
    const t = await api.solicitarReserva(a.token, 'evt-mq-02', 'ACREDITACION');
    await expect(api.consultarTicket(b.token, t.id)).rejects.toMatchObject({ status: 404 });
    expect((await api.consultarTicket(adm.token, t.id)).id).toBe(t.id);
    await expect(api.solicitarReserva(adm.token, 'evt-mq-02', 'ACREDITACION')).rejects.toMatchObject({ status: 403 });
    await expect(api.solicitarReserva(a.token, 'nope', 'ACREDITACION')).rejects.toMatchObject({ status: 404 });
    expect((await api.misReservas(a.token)).length).toBe(2);
  });

  test('suscribirCupos entrega cupos y se cancela', async () => {
    const { api } = crear();
    const recibido = await new Promise<number>((resolve) => {
      const cancelar = api.suscribirCupos((c) => { cancelar(); resolve(c.length); }, 10_000);
    });
    expect(recibido).toBe(EVENTOS_SEED.length);
  });
});

describe('MockApi – examen, diploma y verificación (CDU 3.4-3.7, 4)', () => {
  test('flujo completo: reserva -> examen -> diploma -> verificación pública', async () => {
    const { api, ahora } = crear();
    const s = await api.register({ nombre: 'Carla Méndez', carnet: '202000003', correo: 'carla@ingenieria.usac.edu.gt', password: 'Segura123' });
    await expect(api.obtenerExamen(s.token, 'evt-sec-04')).rejects.toMatchObject({ status: 409 });
    await api.solicitarReserva(s.token, 'evt-sec-04', 'EXAMEN_CERTIFICACION');
    await api.procesarCola(true);
    const ex = await api.obtenerExamen(s.token, 'evt-sec-04');
    expect(ex.preguntas).toHaveLength(5);
    expect(JSON.stringify(ex)).not.toContain('correcta');
    await expect(api.generarCertificado(s.token, 'evt-sec-04')).rejects.toMatchObject({ status: 409 });
    const malo = await api.rendirExamen(s.token, 'evt-sec-04', {});
    expect(malo.aprobado).toBe(false);
    const correctas = Object.fromEntries(preguntasPara('evt-sec-04').map((p) => [p.id, p.correcta]));
    expect((await api.rendirExamen(s.token, 'evt-sec-04', correctas)).nota).toBe(100);
    await expect(api.rendirExamen(s.token, 'evt-sec-04', correctas)).rejects.toMatchObject({ status: 409 });
    ahora.t = Date.parse('2026-10-15T18:00:00Z');
    const cert = await api.generarCertificado(s.token, 'evt-sec-04');
    expect(cert.codigo_hash).toMatch(/^[0-9a-f]{64}$/);
    expect((await api.generarCertificado(s.token, 'evt-sec-04')).id).toBe(cert.id);
    expect(await api.misCertificados(s.token, { curso: '0785' })).toHaveLength(1);
    expect(await api.misCertificados(s.token, { hasta: '2026-10-14' })).toHaveLength(0);
    expect(await api.misCertificados(s.token, { desde: '2026-10-15' })).toHaveLength(1);
    expect((await api.verificar(cert.codigo_hash.toUpperCase())).valido).toBe(true);
    expect((await api.verificar(cert.id.toLowerCase())).valido).toBe(true);
    expect((await api.verificar('CERT-NOEXISTE')).valido).toBe(false);
    await expect(api.verificar('  ')).rejects.toMatchObject({ status: 400 });
  });

  test('límite de intentos', async () => {
    const { api } = crear();
    const s = await api.register({ nombre: 'Dora Paz', carnet: '202000004', correo: 'dora@ingenieria.usac.edu.gt', password: 'Segura123' });
    await api.solicitarReserva(s.token, 'evt-mq-02', 'ACREDITACION');
    await api.procesarCola(true);
    for (let i = 0; i < 3; i++) await api.rendirExamen(s.token, 'evt-mq-02', {});
    await expect(api.rendirExamen(s.token, 'evt-mq-02', {})).rejects.toMatchObject({ status: 429 });
  });

  test('diploma demo verificable y alteración detectada', async () => {
    const { api } = crear();
    expect((await api.verificar(DEMO.certificado)).valido).toBe(true);
    const e = await api._estado();
    e.certificados[0].nombre_estudiante = 'Impostor';
    api._guardar(e);
    const r = await api.verificar(DEMO.certificado);
    expect(r.valido).toBe(false);
    expect(r.mensaje).toContain('alterado');
  });

  test('reiniciar restaura los datos semilla', async () => {
    const { api } = crear();
    await api.register({ nombre: 'Eva Soto', carnet: '202000005', correo: 'eva@ingenieria.usac.edu.gt', password: 'Segura123' });
    await api.reiniciar();
    await expect(api.login('eva@ingenieria.usac.edu.gt', 'Segura123')).rejects.toMatchObject({ status: 401 });
  });
});

describe('simulador de ráfaga', () => {
  test('conserva la cantidad de solicitudes y nunca sobre-vende', () => {
    const r = simularCompleto(PARAMETROS_DEFECTO);
    expect(r.terminado).toBe(true);
    expect(r.confirmadas).toBe(PARAMETROS_DEFECTO.cupo);
    expect(r.confirmadas + r.rechazadasSinCupo).toBe(PARAMETROS_DEFECTO.solicitudes);
    expect(r.maxCola).toBeGreaterThan(0);
  });
  test('más consumidores drenan la cola antes', () => {
    const pocos = simularCompleto({ ...PARAMETROS_DEFECTO, consumidores: 2 });
    const muchos = simularCompleto({ ...PARAMETROS_DEFECTO, consumidores: 16 });
    expect(muchos.t).toBeLessThan(pocos.t);
    const s1 = paso(PARAMETROS_DEFECTO, estadoInicial(PARAMETROS_DEFECTO), 50);
    expect(s1.llegadas).toBeGreaterThan(0);
  });
});

describe('cliente HTTP del API Gateway', () => {
  const respuesta = (status: number, body?: unknown) => Promise.resolve({ status, ok: status < 400, json: () => (body === undefined ? Promise.reject(new Error()) : Promise.resolve(body)) } as Response);

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
    const api = new HttpApi('http://x', (() => respuesta(409, { error: 'No tiene aprobado el examen' })) as unknown as typeof fetch);
    await expect(api.generarCertificado('t', 'e')).rejects.toMatchObject({ status: 409, message: 'No tiene aprobado el examen' });
    const caido = new HttpApi('http://x', (() => Promise.reject(new Error('net'))) as unknown as typeof fetch);
    await expect(caido.cupos()).rejects.toMatchObject({ status: 0 });
    const sinCuerpo = new HttpApi('http://x', (() => respuesta(500)) as unknown as typeof fetch);
    await expect(sinCuerpo.cupos()).rejects.toMatchObject({ status: 500 });
    const vacio = new HttpApi('http://x', (() => respuesta(204)) as unknown as typeof fetch);
    await expect(vacio.eliminarEvento('t', 'e')).resolves.toBeUndefined();
  });
  test('qs omite parámetros vacíos', () => {
    expect(qs({ curso: '0970', tipo: undefined, desde: '' })).toBe('?curso=0970');
    expect(qs({})).toBe('');
  });
});

describe('utilidades', () => {
  test('validaciones, filtros y formato', () => {
    expect(validarRegistro({ nombre: 'Heinz', carnet: '202010044', correo: 'h@usac.edu.gt', password: 'Segura123' })).toEqual([]);
    expect(validarEvento({})).toHaveLength(7);
    expect(coincideFiltro(EVENTOS_SEED[0], { hasta: '2026-10-05' })).toBe(true);
    expect(coincideFiltro(EVENTOS_SEED[0], { tipo: 'CONFERENCIA' })).toBe(false);
    expect(nivelCupo(0, 10)).toBe('agotado');
    expect(nivelCupo(1, 10)).toBe('bajo');
    expect(nivelCupo(4, 10)).toBe('medio');
    expect(nivelCupo(9, 10)).toBe('alto');
    expect(duracion(150)).toBe('2 h 30 min');
    expect(duracion(0)).toBe('0 min');
    expect(hashCorto('a'.repeat(64))).toHaveLength(19);
    expect(calificar('otro', {}).total).toBe(5);
  });
});
