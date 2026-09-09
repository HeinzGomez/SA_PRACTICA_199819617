import { Pool } from "pg";
import { PostgresLogsRepository } from "./logs_repository";

function mockPool() {
  return {
    query: jest.fn(),
  } as unknown as Pool;
}

describe("PostgresLogsRepository", () => {
  let repo: PostgresLogsRepository;
  let pool: ReturnType<typeof mockPool>;

  beforeEach(() => {
    pool = mockPool();
    repo = new PostgresLogsRepository(pool);
    jest.clearAllMocks();
  });

  describe("consultar", () => {
    it("deberia retornar registros y total de paginas", async () => {
      (pool.query as jest.Mock)
        .mockResolvedValueOnce({
          rows: [
            {
              id_auditoria: 1,
              usuario_responsable: 1,
              operacion: "INSERT",
              tabla_afectada: "usuario",
              fecha_evento: new Date(),
              estado_anterior: null,
              estado_nuevo: '{"x":1}',
            },
          ],
        })
        .mockResolvedValueOnce({
          rows: [{ total: 10 }],
        });

      const result = await repo.consultar({
        pagina: 1,
        usuarioFiltro: 0,
        tablaFiltro: "",
      });

      expect(result.registros).toHaveLength(1);
      expect(result.totalPaginas).toBe(10);
      expect(pool.query).toHaveBeenCalledTimes(2);
    });

    it("deberia retornar vacio si no hay registros", async () => {
      (pool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ total: 0 }] });

      const result = await repo.consultar({
        pagina: 1,
        usuarioFiltro: 0,
        tablaFiltro: "",
      });

      expect(result.registros).toHaveLength(0);
      expect(result.totalPaginas).toBe(0);
    });

    it("deberia retornar 0 totalPaginas si no hay filas de total", async () => {
      (pool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] });

      const result = await repo.consultar({
        pagina: 1,
        usuarioFiltro: 0,
        tablaFiltro: "",
      });

      expect(result.totalPaginas).toBe(0);
    });

    it("deberia pasar los filtros a la consulta", async () => {
      (pool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ total: 0 }] });

      await repo.consultar({
        pagina: 2,
        usuarioFiltro: 5,
        tablaFiltro: "usuario",
      });

      const firstCall = (pool.query as jest.Mock).mock.calls[0];
      expect(firstCall[1]).toEqual([2, 5, "usuario"]);
    });
  });
});
