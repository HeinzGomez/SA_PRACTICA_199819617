import { Pool, PoolClient } from "pg";
import { PostgresInscribirRepository } from "./inscribir_repository";

function mockClient(): PoolClient {
  return { query: jest.fn().mockResolvedValue({ rows: [], rowCount: 0 }), release: jest.fn() } as unknown as PoolClient;
}
function mockPool(client: PoolClient) {
  return { connect: jest.fn().mockResolvedValue(client), query: jest.fn() } as unknown as Pool;
}

describe("PostgresInscribirRepository", () => {
  let repo: PostgresInscribirRepository;
  let client: ReturnType<typeof mockClient>;
  let pool: ReturnType<typeof mockPool>;

  beforeEach(() => { client = mockClient(); pool = mockPool(client); repo = new PostgresInscribirRepository(pool); jest.clearAllMocks(); });

  it("inscribirEstudiante - exito", async () => {
    (client.query as jest.Mock).mockImplementation(async (sql: string) => {
      if (sql === "BEGIN" || sql === "COMMIT" || sql.startsWith("SELECT set_config") || sql.startsWith("CALL")) return { rows: [] };
      if (sql.includes("id_usuario = $1 AND id_curso = $2")) return { rows: [{ id_inscripcion: 1, id_usuario: 1, id_curso: 1 }] };
      return { rows: [] };
    });
    const r = await repo.inscribirEstudiante({ id_usuario: 1, id_curso: 1, id_periodo: 1, id_estado_matricula: 1, tipo_inscripcion: "", usuario_responsable: 1 });
    expect(r.id_inscripcion).toBe(1);
    expect(client.release).toHaveBeenCalled();
  });

  it("inscribirEstudiante - error ROLLBACK", async () => {
    (client.query as jest.Mock).mockImplementation(async (sql: string) => {
      if (sql === "BEGIN") return { rows: [] };
      throw new Error("sp error");
    });
    await expect(repo.inscribirEstudiante({ id_usuario: 1, id_curso: 1, id_periodo: 1, id_estado_matricula: 1, tipo_inscripcion: "", usuario_responsable: 1 })).rejects.toThrow();
    expect(client.query).toHaveBeenCalledWith("ROLLBACK");
    expect(client.release).toHaveBeenCalled();
  });

  it("actualizarEstadoMatricula - exito", async () => {
    (client.query as jest.Mock).mockImplementation(async (sql: string) => {
      if (sql === "BEGIN" || sql === "COMMIT" || sql.startsWith("SELECT set_config") || sql.startsWith("CALL")) return { rows: [] };
      if (sql.includes("id_inscripcion = $1")) return { rows: [{ id_inscripcion: 1, id_estado_matricula: 2 }] };
      return { rows: [] };
    });
    const r = await repo.actualizarEstadoMatricula({ id_inscripcion: 1, nuevo_estado: 2, usuario_responsable: 1 });
    expect(r.id_estado_matricula).toBe(2);
  });

  it("buscarInscripcionPorId - encontrado", async () => {
    (pool.query as jest.Mock).mockResolvedValue({ rows: [{ id_inscripcion: 1 }] });
    expect(await repo.buscarInscripcionPorId(1)).not.toBeNull();
  });

  it("buscarInscripcionPorId - no encontrado", async () => {
    (pool.query as jest.Mock).mockResolvedValue({ rows: [] });
    expect(await repo.buscarInscripcionPorId(999)).toBeNull();
  });

  it("buscarPeriodoPorId", async () => {
    (pool.query as jest.Mock).mockResolvedValue({ rows: [{ id_periodo: 1, anio: 2025, num_semestre: 1 }] });
    expect(await repo.buscarPeriodoPorId(1)).not.toBeNull();
  });

  it("buscarEstadoMatriculaPorId", async () => {
    (pool.query as jest.Mock).mockResolvedValue({ rows: [{ id_estado: 1, codigo: "INS", nombre: "Inscrito", descripcion: null }] });
    expect(await repo.buscarEstadoMatriculaPorId(1)).not.toBeNull();
  });

  it("listarEstadosMatricula", async () => {
    (pool.query as jest.Mock).mockResolvedValue({ rows: [{ id_estado: 1 }, { id_estado: 2 }] });
    expect(await repo.listarEstadosMatricula()).toHaveLength(2);
  });

  it("consultarCursosEstudiante", async () => {
    (pool.query as jest.Mock)
      .mockResolvedValueOnce({ rows: [{ total: "1" }] })
      .mockResolvedValueOnce({ rows: [{ id_inscripcion: 1, id_usuario: 1 }] });
    const r = await repo.consultarCursosEstudiante({ id_usuario: 1, anio: 0, semestre: 0, estado: "", pagina: 1 });
    expect(r.registros).toHaveLength(1);
    expect(r.total_paginas).toBe(1);
  });

  it("consultarCursosEstudiante - pagina fuera de rango", async () => {
    (pool.query as jest.Mock)
      .mockResolvedValueOnce({ rows: [{ total: "0" }] })
      .mockResolvedValueOnce({ rows: [] });
    const r = await repo.consultarCursosEstudiante({ id_usuario: 1, anio: 0, semestre: 0, estado: "", pagina: 100 });
    expect(r.total_paginas).toBe(1);
  });

  it("consultarTodasInscripciones", async () => {
    (pool.query as jest.Mock)
      .mockResolvedValueOnce({ rows: [{ total: "1" }] })
      .mockResolvedValueOnce({ rows: [{ id_inscripcion: 1 }] });
    const r = await repo.consultarTodasInscripciones({ id_curso: 0, anio: 0, semestre: 0, pagina: 1 });
    expect(r.registros).toHaveLength(1);
  });
});
