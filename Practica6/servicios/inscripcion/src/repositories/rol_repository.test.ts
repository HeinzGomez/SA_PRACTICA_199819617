import { Pool, PoolClient } from "pg";
import { PostgresRolRepository } from "./rol_repository";

function mockClient(): PoolClient {
  return { query: jest.fn().mockResolvedValue({ rows: [], rowCount: 0 }), release: jest.fn() } as unknown as PoolClient;
}
function mockPool(client: PoolClient) {
  return { connect: jest.fn().mockResolvedValue(client), query: jest.fn() } as unknown as Pool;
}

describe("PostgresRolRepository", () => {
  let repo: PostgresRolRepository;
  let client: ReturnType<typeof mockClient>;
  let pool: ReturnType<typeof mockPool>;

  beforeEach(() => { client = mockClient(); pool = mockPool(client); repo = new PostgresRolRepository(pool); jest.clearAllMocks(); });

  it("asignarRol - exito", async () => {
    (client.query as jest.Mock).mockImplementation(async (sql: string) => {
      if (sql === "BEGIN" || sql === "COMMIT" || sql.startsWith("SELECT set_config")) return { rows: [] };
      return { rows: [], rowCount: 0 };
    });
    await repo.asignarRol({ id_usuario: 1, id_rol: 1 });
    expect(client.query).toHaveBeenCalledWith("BEGIN");
    expect(client.query).toHaveBeenCalledWith("COMMIT");
    expect(client.release).toHaveBeenCalled();
  });

  it("asignarRol - error ejecuta ROLLBACK", async () => {
    (client.query as jest.Mock).mockImplementation(async (sql: string) => {
      if (sql === "BEGIN") return { rows: [] };
      if (sql.startsWith("SELECT set_config")) return { rows: [] };
      throw new Error("db error");
    });
    await expect(repo.asignarRol({ id_usuario: 1, id_rol: 1 })).rejects.toThrow("db error");
    expect(client.query).toHaveBeenCalledWith("ROLLBACK");
    expect(client.release).toHaveBeenCalled();
  });

  it("tieneRol - true", async () => {
    (pool.query as jest.Mock).mockResolvedValue({ rows: [{ fn_usuario_tiene_rol: true }] });
    expect(await repo.tieneRol({ id_usuario: 1, nombre_rol: "Estudiante" })).toBe(true);
  });

  it("tieneRol - false", async () => {
    (pool.query as jest.Mock).mockResolvedValue({ rows: [{ fn_usuario_tiene_rol: false }] });
    expect(await repo.tieneRol({ id_usuario: 1, nombre_rol: "Fake" })).toBe(false);
  });

  it("tieneRol - sin resultados", async () => {
    (pool.query as jest.Mock).mockResolvedValue({ rows: [] });
    expect(await repo.tieneRol({ id_usuario: 1, nombre_rol: "X" })).toBe(false);
  });

  it("rolesDeUsuario", async () => {
    (pool.query as jest.Mock).mockResolvedValue({ rows: [{ id_usuario: 1, id_rol: 1, rol: "Estudiante", descripcion: null }] });
    const r = await repo.rolesDeUsuario(1);
    expect(r).toHaveLength(1);
  });

  it("buscarRolPorId - encontrado", async () => {
    (pool.query as jest.Mock).mockResolvedValue({ rows: [{ id_rol: 1, nombre: "Estudiante", descripcion: null }] });
    expect(await repo.buscarRolPorId(1)).not.toBeNull();
  });

  it("buscarRolPorId - no encontrado", async () => {
    (pool.query as jest.Mock).mockResolvedValue({ rows: [] });
    expect(await repo.buscarRolPorId(999)).toBeNull();
  });

  it("buscarRolPorNombre", async () => {
    (pool.query as jest.Mock).mockResolvedValue({ rows: [{ id_rol: 1, nombre: "Estudiante", descripcion: null }] });
    expect(await repo.buscarRolPorNombre("Estudiante")).not.toBeNull();
  });

  it("cambiarRol - exito", async () => {
    (client.query as jest.Mock).mockImplementation(async (sql: string) => {
      if (sql === "BEGIN" || sql === "COMMIT" || sql.startsWith("SELECT set_config")) return { rows: [] };
      return { rows: [], rowCount: 1 };
    });
    await repo.cambiarRol({ id_usuario: 1, id_rol_actual: 1, id_rol_nuevo: 2 });
    expect(client.query).toHaveBeenCalledWith("COMMIT");
  });

  it("eliminarRol - exito", async () => {
    (client.query as jest.Mock).mockImplementation(async (sql: string) => {
      if (sql === "BEGIN" || sql === "COMMIT" || sql.startsWith("SELECT set_config")) return { rows: [] };
      if (sql.startsWith("DELETE")) return { rows: [], rowCount: 1 };
      return { rows: [] };
    });
    await repo.eliminarRol({ id_usuario: 1, id_rol: 1 });
    expect(client.query).toHaveBeenCalledWith("COMMIT");
  });

  it("eliminarRol - no tiene rol lanza error", async () => {
    (client.query as jest.Mock).mockImplementation(async (sql: string) => {
      if (sql === "BEGIN" || sql.startsWith("SELECT set_config")) return { rows: [] };
      if (sql.startsWith("DELETE")) return { rows: [], rowCount: 0 };
      return { rows: [] };
    });
    await expect(repo.eliminarRol({ id_usuario: 1, id_rol: 999 })).rejects.toThrow("no tiene asignado el rol");
    expect(client.query).toHaveBeenCalledWith("ROLLBACK");
  });
});
