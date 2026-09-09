import { Pool } from "pg";
import { PostgresCursoRepository } from "./curso_repository";

function mockPool() { return { query: jest.fn() } as unknown as Pool; }

describe("PostgresCursoRepository", () => {
  let repo: PostgresCursoRepository;
  let pool: ReturnType<typeof mockPool>;

  beforeEach(() => { pool = mockPool(); repo = new PostgresCursoRepository(pool); jest.clearAllMocks(); });

  it("crearArea", async () => {
    (pool.query as jest.Mock).mockResolvedValue({ rows: [{ id_area: 1, codigo: "MAT", nombre: "Mat", descripcion: null }] });
    const r = await repo.crearArea({ codigo: "MAT", nombre: "Mat", descripcion: null });
    expect(r.id_area).toBe(1);
  });

  it("editarArea", async () => {
    (pool.query as jest.Mock).mockResolvedValue({ rows: [{ id_area: 1, codigo: "MAT", nombre: "X", descripcion: null }] });
    const r = await repo.editarArea({ id_area: 1, codigo: "MAT", nombre: "X", descripcion: null });
    expect(r).not.toBeNull();
  });

  it("editarArea - no existe", async () => {
    (pool.query as jest.Mock).mockResolvedValue({ rows: [] });
    const r = await repo.editarArea({ id_area: 999, codigo: "MAT", nombre: "X", descripcion: null });
    expect(r).toBeNull();
  });

  it("eliminarArea - existente", async () => {
    (pool.query as jest.Mock).mockResolvedValue({ rowCount: 1 });
    expect(await repo.eliminarArea(1)).toBe(true);
  });

  it("eliminarArea - inexistente", async () => {
    (pool.query as jest.Mock).mockResolvedValue({ rowCount: 0 });
    expect(await repo.eliminarArea(999)).toBe(false);
  });

  it("buscarAreaPorCodigo - encontrado", async () => {
    (pool.query as jest.Mock).mockResolvedValue({ rows: [{ id_area: 1, codigo: "MAT", nombre: "Mat", descripcion: null }] });
    const r = await repo.buscarAreaPorCodigo("MAT");
    expect(r).not.toBeNull();
  });

  it("buscarAreaPorCodigo - no encontrado", async () => {
    (pool.query as jest.Mock).mockResolvedValue({ rows: [] });
    expect(await repo.buscarAreaPorCodigo("XXX")).toBeNull();
  });

  it("buscarAreaPorId", async () => {
    (pool.query as jest.Mock).mockResolvedValue({ rows: [{ id_area: 1 }] });
    expect(await repo.buscarAreaPorId(1)).not.toBeNull();
  });

  it("listarAreas", async () => {
    (pool.query as jest.Mock).mockResolvedValue({ rows: [{ id_area: 1 }, { id_area: 2 }] });
    const r = await repo.listarAreas();
    expect(r).toHaveLength(2);
  });

  it("crearCurso", async () => {
    (pool.query as jest.Mock).mockResolvedValue({ rows: [{ id_curso: 1, codigo: "MA101", nombre: "Algebra", descripcion: null, id_area: 1, fecha_inscripcion: null }] });
    const r = await repo.crearCurso({ codigo: "MA101", nombre: "Algebra", descripcion: null, id_area: 1 });
    expect(r.id_curso).toBe(1);
  });

  it("editarCurso", async () => {
    (pool.query as jest.Mock).mockResolvedValue({ rows: [{ id_curso: 1 }] });
    expect(await repo.editarCurso({ id_curso: 1, codigo: "MA101", nombre: "Algebra", descripcion: null, id_area: 1 })).not.toBeNull();
  });

  it("editarCurso - no existe", async () => {
    (pool.query as jest.Mock).mockResolvedValue({ rows: [] });
    expect(await repo.editarCurso({ id_curso: 999, codigo: "X", nombre: "X", descripcion: null, id_area: 1 })).toBeNull();
  });

  it("eliminarCurso - existente", async () => {
    (pool.query as jest.Mock).mockResolvedValue({ rowCount: 1 });
    expect(await repo.eliminarCurso(1)).toBe(true);
  });

  it("eliminarCurso - inexistente", async () => {
    (pool.query as jest.Mock).mockResolvedValue({ rowCount: 0 });
    expect(await repo.eliminarCurso(999)).toBe(false);
  });

  it("buscarCursoPorCodigo", async () => {
    (pool.query as jest.Mock).mockResolvedValue({ rows: [{ id_curso: 1 }] });
    expect(await repo.buscarCursoPorCodigo("MA101")).not.toBeNull();
  });

  it("buscarCursoPorId", async () => {
    (pool.query as jest.Mock).mockResolvedValue({ rows: [{ id_curso: 1 }] });
    expect(await repo.buscarCursoPorId(1)).not.toBeNull();
  });

  it("listarCursos sin filtro", async () => {
    (pool.query as jest.Mock).mockResolvedValue({ rows: [{ id_curso: 1 }] });
    const r = await repo.listarCursos();
    expect(r).toHaveLength(1);
    expect(pool.query).toHaveBeenCalledWith(expect.stringContaining("ORDER BY nombre"), []);
  });

  it("listarCursos con filtro", async () => {
    (pool.query as jest.Mock).mockResolvedValue({ rows: [{ id_curso: 1 }] });
    const r = await repo.listarCursos({ idArea: 1 });
    expect(r).toHaveLength(1);
    expect(pool.query).toHaveBeenCalledWith(expect.stringContaining("id_area = $1"), [1]);
  });
});
