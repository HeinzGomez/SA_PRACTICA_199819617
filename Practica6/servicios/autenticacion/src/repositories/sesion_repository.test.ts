import { Pool, PoolClient } from "pg";
import { PostgresSesionRepository } from "./sesion_repository";

function mockPool() {
  return {
    query: jest.fn(),
    connect: jest.fn(),
  } as unknown as Pool;
}

function mockClient() {
  return {
    query: jest.fn(),
    release: jest.fn(),
  } as unknown as PoolClient;
}

describe("PostgresSesionRepository", () => {
  let repo: PostgresSesionRepository;
  let pool: ReturnType<typeof mockPool>;

  beforeEach(() => {
    pool = mockPool();
    repo = new PostgresSesionRepository(pool);
    jest.clearAllMocks();
  });

  describe("crear", () => {
    it("deberia crear una sesion y retornarla", async () => {
      const client = mockClient();
      (pool.connect as jest.Mock).mockResolvedValue(client);
      const now = new Date();
      (client.query as jest.Mock)
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({
          rows: [{
            id_sesion: 1,
            id_usuario: 1,
            token_hash: "abc",
            fecha_creacion: now,
            fecha_expiracion: now,
            estado: "ACTIVA",
          }],
        });

      const result = await repo.crear({
        id_usuario: 1,
        token_hash: "abc",
        fecha_expiracion: now,
      });

      expect(result.id_sesion).toBe(1);
      expect(client.release).toHaveBeenCalled();
    });

    it("deberia liberar el client aunque falle", async () => {
      const client = mockClient();
      (pool.connect as jest.Mock).mockResolvedValue(client);
      (client.query as jest.Mock).mockRejectedValue(new Error("DB error"));

      await expect(
        repo.crear({ id_usuario: 1, token_hash: "h", fecha_expiracion: new Date() })
      ).rejects.toThrow("DB error");

      expect(client.release).toHaveBeenCalled();
    });
  });

  describe("cerrar", () => {
    it("deberia cerrar la sesion", async () => {
      const client = mockClient();
      (pool.connect as jest.Mock).mockResolvedValue(client);
      (client.query as jest.Mock).mockResolvedValue({});

      await repo.cerrar(1);

      expect(client.query).toHaveBeenCalledWith("CALL sp_cerrar_sesion($1)", [1]);
      expect(client.release).toHaveBeenCalled();
    });

    it("deberia liberar el client aunque falle", async () => {
      const client = mockClient();
      (pool.connect as jest.Mock).mockResolvedValue(client);
      (client.query as jest.Mock).mockRejectedValue(new Error("fail"));

      await expect(repo.cerrar(1)).rejects.toThrow("fail");
      expect(client.release).toHaveBeenCalled();
    });
  });

  describe("validar", () => {
    it("deberia retornar true si la sesion es valida", async () => {
      (pool.query as jest.Mock).mockResolvedValue({
        rows: [{ fn_sesion_valida: true }],
      });

      const result = await repo.validar(1);
      expect(result).toBe(true);
    });

    it("deberia retornar false si la sesion no es valida", async () => {
      (pool.query as jest.Mock).mockResolvedValue({
        rows: [{ fn_sesion_valida: false }],
      });

      const result = await repo.validar(1);
      expect(result).toBe(false);
    });

    it("deberia retornar false si no hay filas", async () => {
      (pool.query as jest.Mock).mockResolvedValue({ rows: [] });

      const result = await repo.validar(1);
      expect(result).toBe(false);
    });
  });

  describe("buscarPorId", () => {
    it("deberia retornar la sesion", async () => {
      (pool.query as jest.Mock).mockResolvedValue({
        rows: [{ id_sesion: 1, estado: "ACTIVA" }],
      });

      const result = await repo.buscarPorId(1);
      expect(result).toEqual({ id_sesion: 1, estado: "ACTIVA" });
    });

    it("deberia retornar null si no existe", async () => {
      (pool.query as jest.Mock).mockResolvedValue({ rows: [] });

      const result = await repo.buscarPorId(999);
      expect(result).toBeNull();
    });
  });
});
