import { Pool } from "pg";
import { PostgresAcademicoRepository } from "./academico_repository";

function mockPool() { return { query: jest.fn() } as unknown as Pool; }

describe("PostgresAcademicoRepository", () => {
  let repo: PostgresAcademicoRepository;
  let pool: ReturnType<typeof mockPool>;

  beforeEach(() => { pool = mockPool(); repo = new PostgresAcademicoRepository(pool); jest.clearAllMocks(); });

  it("crearPensum", async () => {
    (pool.query as jest.Mock).mockResolvedValue({ rows: [{ id_pensum: 1, nombre: "Pensum", descripcion: null }] });
    const r = await repo.crearPensum({ nombre: "Pensum", descripcion: null });
    expect(r.id_pensum).toBe(1);
  });

  it("editarPensum - exito", async () => {
    (pool.query as jest.Mock).mockResolvedValue({ rows: [{ id_pensum: 1, nombre: "X", descripcion: null }] });
    expect(await repo.editarPensum({ id_pensum: 1, nombre: "X", descripcion: null })).not.toBeNull();
  });

  it("editarPensum - no existe", async () => {
    (pool.query as jest.Mock).mockResolvedValue({ rows: [] });
    expect(await repo.editarPensum({ id_pensum: 999, nombre: "X", descripcion: null })).toBeNull();
  });

  it("eliminarPensum - existente", async () => {
    (pool.query as jest.Mock).mockResolvedValue({ rowCount: 1 });
    expect(await repo.eliminarPensum(1)).toBe(true);
  });

  it("eliminarPensum - inexistente", async () => {
    (pool.query as jest.Mock).mockResolvedValue({ rowCount: 0 });
    expect(await repo.eliminarPensum(999)).toBe(false);
  });

  it("buscarPensumPorId", async () => {
    (pool.query as jest.Mock).mockResolvedValue({ rows: [{ id_pensum: 1 }] });
    expect(await repo.buscarPensumPorId(1)).not.toBeNull();
  });

  it("buscarPensumPorId - no existe", async () => {
    (pool.query as jest.Mock).mockResolvedValue({ rows: [] });
    expect(await repo.buscarPensumPorId(999)).toBeNull();
  });

  it("listarPensums", async () => {
    (pool.query as jest.Mock).mockResolvedValue({ rows: [{ id_pensum: 1 }] });
    expect(await repo.listarPensums()).toHaveLength(1);
  });

  it("crearCarrera", async () => {
    (pool.query as jest.Mock).mockResolvedValue({ rows: [{ id_carrera: 1, facultad: "Ing", nombre: "Sistemas", descripcion: null, id_pensum: 1, fecha_creacion: new Date() }] });
    const r = await repo.crearCarrera({ facultad: "Ing", nombre: "Sistemas", descripcion: null, id_pensum: 1 });
    expect(r.id_carrera).toBe(1);
  });

  it("editarCarrera", async () => {
    (pool.query as jest.Mock).mockResolvedValue({ rows: [{ id_carrera: 1 }] });
    expect(await repo.editarCarrera({ id_carrera: 1, facultad: "Ing", nombre: "X", descripcion: null, id_pensum: 1 })).not.toBeNull();
  });

  it("eliminarCarrera", async () => {
    (pool.query as jest.Mock).mockResolvedValue({ rowCount: 1 });
    expect(await repo.eliminarCarrera(1)).toBe(true);
  });

  it("buscarCarreraPorId", async () => {
    (pool.query as jest.Mock).mockResolvedValue({ rows: [{ id_carrera: 1 }] });
    expect(await repo.buscarCarreraPorId(1)).not.toBeNull();
  });

  it("listarCarreras", async () => {
    (pool.query as jest.Mock).mockResolvedValue({ rows: [{ id_carrera: 1 }] });
    expect(await repo.listarCarreras()).toHaveLength(1);
  });

  it("crearPeriodo", async () => {
    (pool.query as jest.Mock).mockResolvedValue({ rows: [{ id_periodo: 1, anio: 2025, num_semestre: 1 }] });
    const r = await repo.crearPeriodo({ anio: 2025, num_semestre: 1 });
    expect(r.id_periodo).toBe(1);
  });

  it("editarPeriodo", async () => {
    (pool.query as jest.Mock).mockResolvedValue({ rows: [{ id_periodo: 1 }] });
    expect(await repo.editarPeriodo({ id_periodo: 1, anio: 2025, num_semestre: 1 })).not.toBeNull();
  });

  it("eliminarPeriodo", async () => {
    (pool.query as jest.Mock).mockResolvedValue({ rowCount: 1 });
    expect(await repo.eliminarPeriodo(1)).toBe(true);
  });

  it("buscarPeriodoPorId", async () => {
    (pool.query as jest.Mock).mockResolvedValue({ rows: [{ id_periodo: 1 }] });
    expect(await repo.buscarPeriodoPorId(1)).not.toBeNull();
  });

  it("listarPeriodos", async () => {
    (pool.query as jest.Mock).mockResolvedValue({ rows: [{ id_periodo: 1 }] });
    expect(await repo.listarPeriodos()).toHaveLength(1);
  });

  it("crearPerfilAcademico", async () => {
    (pool.query as jest.Mock).mockResolvedValue({ rows: [{ id_perfil: 1, id_usuario: 1, registro_academico: "2020001", dpi: "123", fecha_nacimiento: null, telefono: null, id_carrera: 1, direccion: null }] });
    const r = await repo.crearPerfilAcademico({ id_usuario: 1, registro_academico: "2020001", dpi: "123", fecha_nacimiento: null, telefono: null, id_carrera: 1, direccion: null });
    expect(r.id_perfil).toBe(1);
  });

  it("buscarPerfilPorId", async () => {
    (pool.query as jest.Mock).mockResolvedValue({ rows: [{ id_perfil: 1 }] });
    expect(await repo.buscarPerfilPorId(1)).not.toBeNull();
  });

  it("buscarPerfilPorUsuario", async () => {
    (pool.query as jest.Mock).mockResolvedValue({ rows: [{ id_perfil: 1 }] });
    expect(await repo.buscarPerfilPorUsuario(1)).not.toBeNull();
  });

  it("buscarPerfilPorRegistroAcademico", async () => {
    (pool.query as jest.Mock).mockResolvedValue({ rows: [{ id_perfil: 1 }] });
    expect(await repo.buscarPerfilPorRegistroAcademico("2020001")).not.toBeNull();
  });

  it("buscarPerfilPorDpi", async () => {
    (pool.query as jest.Mock).mockResolvedValue({ rows: [{ id_perfil: 1 }] });
    expect(await repo.buscarPerfilPorDpi("123")).not.toBeNull();
  });

  it("cambiarPerfilAcademico", async () => {
    (pool.query as jest.Mock).mockResolvedValue({ rows: [{ id_perfil: 1, dpi: "456" }] });
    expect(await repo.cambiarPerfilAcademico({ id_perfil: 1, dpi: "456", fecha_nacimiento: null, telefono: null, direccion: null, registro_academico: null })).not.toBeNull();
  });

  it("listarPerfilesEstudiante", async () => {
    (pool.query as jest.Mock).mockResolvedValue({ rows: [{ id_perfil: 1, id_usuario: 1, registro_academico: "2020001", id_carrera: 1, carrera: "Sistemas", facultad: "Ing" }] });
    const r = await repo.listarPerfilesEstudiante();
    expect(r).toHaveLength(1);
  });
});
