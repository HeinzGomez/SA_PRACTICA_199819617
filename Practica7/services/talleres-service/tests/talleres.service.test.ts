// HeinzGomez - Práctica 7: pruebas unitarias del Servicio de Talleres (Jest)
import * as grpc from '@grpc/grpc-js';
import { coincideFiltro, TalleresError, validarEvento } from '../src/domain';
import { InMemoryCupoCache, InMemoryEventoRepository, TalleresService } from '../src/talleres.service';
import { crearHandlers, toGrpcError } from '../src/grpc-handlers';
import { EVENTOS_SEED } from '../src/seed';

function nuevo() {
  const repo = new InMemoryEventoRepository(EVENTOS_SEED);
  const cache = new InMemoryCupoCache();
  EVENTOS_SEED.forEach((e) => cache.cupos.set(e.id, e.cupo_total));
  return { repo, cache, svc: new TalleresService(repo, cache) };
}

const base = {
  titulo: 'Nuevo taller de gRPC', tipo: 'TALLER' as const, curso_codigo: '0970', curso_nombre: 'Software Avanzado',
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

describe('grpc-handlers', () => {
  const llamar = (h: any, m: string, request: any) =>
    new Promise<{ err: any; res: any }>((resolve) => h[m]({ request }, (err: any, res: any) => resolve({ err, res })));

  test('expone todos los RPC del contrato', async () => {
    const h = crearHandlers(nuevo().svc);
    expect((await llamar(h, 'ListarEventos', { curso_codigo: '0970' })).res.eventos).toHaveLength(3);
    expect((await llamar(h, 'ObtenerEvento', { id: 'evt-k8s-01' })).res.id).toBe('evt-k8s-01');
    expect((await llamar(h, 'ObtenerCupos', { evento_ids: [] })).res.cupos).toHaveLength(EVENTOS_SEED.length);
    const creado = (await llamar(h, 'CrearEvento', base)).res;
    expect((await llamar(h, 'ActualizarEvento', { id: creado.id, cupo_total: 31 })).res.cupo_total).toBe(31);
    expect((await llamar(h, 'EliminarEvento', { id: creado.id })).res.eliminado).toBe(true);
    expect((await llamar(h, 'ObtenerEvento', { id: 'x' })).err.code).toBe(grpc.status.NOT_FOUND);
  });

  test('toGrpcError', () => {
    expect(toGrpcError(new TalleresError('FAILED_PRECONDITION', 'x')).code).toBe(grpc.status.FAILED_PRECONDITION);
    expect(toGrpcError(new Error()).code).toBe(grpc.status.INTERNAL);
  });
});
