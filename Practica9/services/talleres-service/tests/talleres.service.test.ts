// HeinzGomez - Práctica 9: pruebas unitarias del Servicio de Talleres (Jest)
import { TalleresError } from '../src/types/errores';
import { coincideFiltro, validarEvento } from '../src/types/validaciones';
import { EnMemoriaCupoCache } from '../src/repository/en-memoria-cupo.cache';
import { EnMemoriaEventoRepository } from '../src/repository/en-memoria-evento.repository';
import { EVENTOS_SEED } from '../src/repository/seed';
import { TalleresService } from '../src/service/talleres.service';
import { TalleresController } from '../src/controller/talleres.controller';
import { Manejadores, OPERACIONES, Respuesta } from '../src/types/mensajes';

function nuevo() {
  const repo = new EnMemoriaEventoRepository(EVENTOS_SEED);
  const cache = new EnMemoriaCupoCache();
  EVENTOS_SEED.forEach((e) => cache.cupos.set(e.id, e.cupo_total));
  return { repo, cache, svc: new TalleresService(repo, cache) };
}

const base = {
  titulo: 'Nuevo taller de mensajería', tipo: 'TALLER' as const, curso_codigo: '0970', curso_nombre: 'Software Avanzado',
  fecha_inicio: '2026-11-01T15:00:00Z', duracion_min: 60, cupo_total: 30,
  ponente: { nombre: 'Ing. Prueba', titulo: '', bio: '', correo: 'p@x.com' },
};

describe('CDU 2.1 / 2.2 consulta y filtros', () => {
  test('lista ordenado por fecha', async () => {
    const { svc } = nuevo();
    const l = await svc.listar({});
    expect(l).toHaveLength(EVENTOS_SEED.length);
    const fechas = l.map((e) => Date.parse(e.fecha_inicio));
    expect([...fechas].sort((a, b) => a - b)).toEqual(fechas);
  });

  test('filtra por curso, tipo y rango de fechas (hasta inclusivo)', async () => {
    const { svc } = nuevo();
    expect((await svc.listar({ curso_codigo: '0774' })).map((e) => e.id)).toEqual(['evt-sql-03']);
    expect((await svc.listar({ tipo: 'CONFERENCIA' })).length).toBe(2);
    const rango = await svc.listar({ fecha_desde: '2026-10-08', fecha_hasta: '2026-10-12' });
    expect(rango.map((e) => e.id)).toEqual(['evt-mq-02', 'evt-sql-03']);
  });

  test('coincideFiltro con fecha_hasta con hora exacta', () => {
    expect(coincideFiltro(EVENTOS_SEED[0], { fecha_hasta: '2026-10-05T14:59:00Z' })).toBe(false);
    expect(coincideFiltro(EVENTOS_SEED[0], { fecha_hasta: '2026-10-05T15:00:00Z' })).toBe(true);
    expect(coincideFiltro(EVENTOS_SEED[0], { fecha_desde: '2026-12-31' })).toBe(false);
    expect(coincideFiltro(EVENTOS_SEED[0], { curso_codigo: '0000' })).toBe(false);
    expect(coincideFiltro(EVENTOS_SEED[0], { tipo: 'TALLER' })).toBe(true);
    expect(coincideFiltro(EVENTOS_SEED[0], { tipo: 'CERTIFICACION' })).toBe(false);
  });

  test('un filtro sin resultados devuelve lista vacía', async () => {
    const { svc } = nuevo();
    expect(await svc.listar({ curso_codigo: '9999' })).toEqual([]);
    expect(await svc.cupos(['no-existe-1', 'no-existe-2'])).toEqual([]);
  });

  test('validarEvento devuelve los 7 errores con el objeto vacío', () => {
    expect(validarEvento({})).toEqual([
      'El título debe tener al menos 5 caracteres',
      `Tipo inválido (TALLER|CONFERENCIA|LABORATORIO|CERTIFICACION)`,
      'Debe vincularse a un curso de YOUSAC',
      'Fecha de inicio inválida',
      'El cupo total debe ser un entero entre 1 y 5000',
      'Duración mínima de 15 minutos',
      'Debe indicar el ponente',
    ]);
    expect(validarEvento({ ...base, duracion_min: 14, cupo_total: 5001 })).toHaveLength(2);
    expect(validarEvento({ ...base, duracion_min: 60.5 })).toHaveLength(1);
  });
});

describe('CDU 2.3 / 2.4 detalle y cupo en tiempo real', () => {
  test('el cupo viene del contador de Redis, no del valor persistido', async () => {
    const { svc, cache } = nuevo();
    cache.cupos.set('evt-k8s-01', 3);
    const e = await svc.obtener('evt-k8s-01');
    expect(e.cupo_disponible).toBe(3);
    expect(e.ponente.nombre).toContain('María José');
    expect(e.prerrequisitos.length).toBeGreaterThan(0);
    const c = await svc.cupos(['evt-k8s-01', 'no-existe']);
    expect(c).toEqual([{ evento_id: 'evt-k8s-01', cupo_total: 40, cupo_disponible: 3 }]);
    expect((await svc.cupos([])).length).toBe(EVENTOS_SEED.length);
  });

  test('si Redis falla se degrada al valor persistido', async () => {
    const { repo, cache } = nuevo();
    cache.obtener = async () => { throw new Error('redis caído'); };
    const svc = new TalleresService(repo, cache);
    expect((await svc.obtener('evt-mq-02')).cupo_disponible).toBe(250);
  });

  test('evento inexistente -> NOT_FOUND', async () => {
    const { svc } = nuevo();
    await expect(svc.obtener('x')).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  test('sincronizarCupo (consumidor reserva.confirmada) persiste el valor', async () => {
    const { svc, repo } = nuevo();
    await svc.sincronizarCupo('evt-ci-05', 2);
    await svc.sincronizarCupo('evt-ci-05', -1); // ignorado
    expect((await repo.obtener('evt-ci-05'))!.cupo_disponible).toBe(2);
  });
});

describe('CDU 2.6 / 2.7 / 2.8 administración', () => {
  test('crear inicializa el contador en Redis', async () => {
    const { svc, cache } = nuevo();
    const e = await svc.crear(base);
    expect(e.id).toMatch(/^evt-/);
    expect(e.cupo_disponible).toBe(30);
    expect(cache.cupos.get(e.id)).toBe(30);
  });

  test('crear con datos inválidos', async () => {
    const { svc } = nuevo();
    await expect(svc.crear({ ...base, cupo_total: 0 })).rejects.toMatchObject({ code: 'INVALID_ARGUMENT' });
    expect(validarEvento({})).toHaveLength(7);
  });

  test('editar ajusta el cupo vivo con el delta', async () => {
    const { svc, cache } = nuevo();
    cache.cupos.set('evt-sql-03', 20); // 5 reservas confirmadas
    const e = await svc.actualizar({ id: 'evt-sql-03', cupo_total: 30, titulo: 'Laboratorio de PostgreSQL avanzado' });
    expect(e.cupo_total).toBe(30);
    expect(e.cupo_disponible).toBe(25);
    expect(e.ponente.nombre).toBe('Ing. Luis Fernando Ajú');
    const sinDelta = await svc.actualizar({ id: 'evt-sql-03', lugar: 'S-11' });
    expect(sinDelta.cupo_disponible).toBe(25);
  });

  test('editar no permite cupo menor a las reservas confirmadas', async () => {
    const { svc, cache } = nuevo();
    cache.cupos.set('evt-ci-05', 1); // 4 ocupados
    await expect(svc.actualizar({ id: 'evt-ci-05', cupo_total: 3 })).rejects.toMatchObject({ code: 'FAILED_PRECONDITION' });
    await expect(svc.actualizar({ id: 'nope' })).rejects.toMatchObject({ code: 'NOT_FOUND' });
    await expect(svc.actualizar({ id: 'evt-ci-05', titulo: 'x' })).rejects.toMatchObject({ code: 'INVALID_ARGUMENT' });
  });

  test('eliminar solo sin reservas', async () => {
    const { svc, cache } = nuevo();
    expect(await svc.eliminar('evt-comp-06')).toBe(true);
    expect(cache.cupos.has('evt-comp-06')).toBe(false);
    cache.cupos.set('evt-mq-02', 249);
    await expect(svc.eliminar('evt-mq-02')).rejects.toMatchObject({ code: 'FAILED_PRECONDITION' });
  });
});

describe('controlador RPC del bus de mensajes', () => {
  const crear = () => new TalleresController(nuevo().svc).manejadores();

  const llamar = async (h: Manejadores, operacion: string, cuerpo: unknown): Promise<any> => {
    let respuesta: Respuesta<any> | undefined;
    await h[operacion]({ operacion, cuerpo, replyTo: 'cola-de-prueba', responder: async (r) => { respuesta = r; } });
    return respuesta!;
  };

  test('expone exactamente las operaciones del contrato', () => {
    const h = crear();
    expect(Object.keys(h).sort()).toEqual(Object.values(OPERACIONES).sort());
    expect(h['talleres.operacion_inexistente']).toBeUndefined();
  });

  test('todas las operaciones responden {ok:true,datos}', async () => {
    const h = crear();
    const listar = await llamar(h, OPERACIONES.listarEventos, { curso_codigo: '0970' });
    expect(listar.datos.eventos).toHaveLength(3);

    const detalle = await llamar(h, OPERACIONES.obtenerEvento, { id: 'evt-k8s-01' });
    expect(detalle.datos.id).toBe('evt-k8s-01');

    const cupos = await llamar(h, OPERACIONES.obtenerCupos, { evento_ids: [] });
    expect(cupos.datos.cupos).toHaveLength(EVENTOS_SEED.length);

    const creado = (await llamar(h, OPERACIONES.crearEvento, base)).datos;
    const editado = await llamar(h, OPERACIONES.actualizarEvento, { id: creado.id, cupo_total: 31 });
    expect(editado.datos.cupo_total).toBe(31);
    const borrado = await llamar(h, OPERACIONES.eliminarEvento, { id: creado.id });
    expect(borrado.datos.eliminado).toBe(true);
  });

  test('los errores de negocio viajan como {ok:false,error:{codigo,mensaje}}', async () => {
    const h = crear();
    const noExiste = await llamar(h, OPERACIONES.obtenerEvento, { id: 'x' });
    expect(noExiste).toEqual({ ok: false, error: { codigo: 'NOT_FOUND', mensaje: 'Evento x no existe' } });

    const invalido = await llamar(h, OPERACIONES.crearEvento, {});
    expect(invalido).toMatchObject({ ok: false, error: { codigo: 'INVALID_ARGUMENT' } });

    expect(new TalleresError('FAILED_PRECONDITION', 'x').code).toBe('FAILED_PRECONDITION');
    expect(new Error('boom')).not.toBeInstanceOf(TalleresError);
  });

  test('sin replyTo no intenta responder (el mensaje sería de otra cola)', async () => {
    const h = crear();
    let llamado = 0;
    await h[OPERACIONES.obtenerEvento]({
      operacion: OPERACIONES.obtenerEvento,
      cuerpo: { id: 'evt-k8s-01' },
      responder: async () => { llamado += 1; },
    });
    expect(llamado).toBe(0);
  });

  test('un error inesperado se responde como INTERNAL y se registra', async () => {
    const { repo } = nuevo();
    repo.listar = async () => { throw new Error('se cayó la base'); };
    const h = new TalleresController(new TalleresService(repo, nuevo().cache)).manejadores();
    const errores = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    let respuesta: any;
    await h[OPERACIONES.listarEventos]({
      operacion: OPERACIONES.listarEventos, cuerpo: {}, replyTo: 'cola-de-prueba',
      responder: async (r) => { respuesta = r; },
    });

    expect(respuesta).toEqual({ ok: false, error: { codigo: 'INTERNAL', mensaje: 'Error interno' } });
    expect(errores).toHaveBeenCalledWith('[talleres] error inesperado:', expect.any(Error));
    errores.mockRestore();
  });

  test('obtenerCupos y obtenerEvento normalizan el cuerpo', async () => {
    const h = crear();
    const vacio = await llamar(h, OPERACIONES.obtenerCupos, undefined);
    expect(vacio.datos.cupos).toHaveLength(EVENTOS_SEED.length);

    const sinId = await llamar(h, OPERACIONES.obtenerEvento, null);
    expect(sinId).toMatchObject({ ok: false, error: { codigo: 'NOT_FOUND' } });

    const sinIds = await llamar(h, OPERACIONES.obtenerCupos, { evento_ids: 'no-es-arreglo' });
    expect(sinIds.datos.cupos).toHaveLength(EVENTOS_SEED.length);
  });
});
