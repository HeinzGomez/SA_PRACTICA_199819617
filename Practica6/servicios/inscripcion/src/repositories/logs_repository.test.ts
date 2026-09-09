import { Pool } from "pg";
import { PostgresLogsRepository } from "./logs_repository";

function mockPool() {
  return { query: jest.fn() } as unknown as Pool;
}

describe("PostgresLogsRepository", () => {
  let repo: PostgresLogsRepository;
  let pool: ReturnType<typeof mockPool>;

  beforeEach(() => { pool = mockPool(); repo = new PostgresLogsRepository(pool); jest.clearAllMocks(); });

  it("consultar - exito", async () => {
    (pool.query as jest.Mock).mockResolvedValueOnce({ rows: [{ id_auditoria: 1 }] }).mockResolvedValueOnce({ rows: [{ total: 5 }] });
    const result = await repo.consultar({ pagina: 1, usuarioFiltro: 0, tablaFiltro: "" });
    expect(result.registros).toHaveLength(1);
    expect(result.totalPaginas).toBe(5);
  });

  it("consultar - sin resultados", async () => {
    (pool.query as jest.Mock).mockResolvedValueOnce({ rows: [] }).mockResolvedValueOnce({ rows: [{ total: 0 }] });
    const result = await repo.consultar({ pagina: 1, usuarioFiltro: 1, tablaFiltro: "curso" });
    expect(result.registros).toHaveLength(0);
    expect(result.totalPaginas).toBe(0);
  });

  it("consultar - total null", async () => {
    (pool.query as jest.Mock).mockResolvedValueOnce({ rows: [] }).mockResolvedValueOnce({ rows: [{}] });
    const result = await repo.consultar({ pagina: 1, usuarioFiltro: 0, tablaFiltro: "" });
    expect(result.totalPaginas).toBe(0);
  });
});
