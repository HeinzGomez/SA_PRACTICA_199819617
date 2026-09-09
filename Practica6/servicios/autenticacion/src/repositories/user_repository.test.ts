import { Pool, PoolClient } from "pg";
import { PostgresUserRepository } from "./user_repository";

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

describe("PostgresUserRepository", () => {
  let repo: PostgresUserRepository;
  let pool: ReturnType<typeof mockPool>;

  beforeEach(() => {
    pool = mockPool();
    repo = new PostgresUserRepository(pool);
    jest.clearAllMocks();
  });

  // ─── crear ─────────────────────────────────────────────

  describe("crear", () => {
    it("deberia crear un usuario y retornarlo", async () => {
      const client = mockClient();
      (pool.connect as jest.Mock).mockResolvedValue(client);
      (client.query as jest.Mock)
        .mockResolvedValueOnce({}) // CALL
        .mockResolvedValueOnce({
          rows: [{
            id_usuario: 1,
            nombre: "Juan",
            apellido: "Perez",
            correo_institucional: "juan@ingenieria.usac.edu.gt",
            estado: "ACTIVO",
            fecha_registro: new Date(),
          }],
        });

      const result = await repo.crear({
        nombre: "Juan",
        apellido: "Perez",
        correo: "juan@ingenieria.usac.edu.gt",
        password_hash: "$2b$10$hash",
        estado: "ACTIVO",
      });

      expect(result.id_usuario).toBe(1);
      expect(client.release).toHaveBeenCalled();
    });

    it("deberia liberar el client aunque falle", async () => {
      const client = mockClient();
      (pool.connect as jest.Mock).mockResolvedValue(client);
      (client.query as jest.Mock).mockRejectedValue(new Error("DB error"));

      await expect(
        repo.crear({ nombre: "Juan", apellido: "P", correo: "j@x.com", password_hash: "h", estado: "A" })
      ).rejects.toThrow("DB error");

      expect(client.release).toHaveBeenCalled();
    });
  });

  // ─── buscarPorCorreo ───────────────────────────────────

  describe("buscarPorCorreo", () => {
    it("deberia retornar el usuario si existe", async () => {
      (pool.query as jest.Mock).mockResolvedValue({
        rows: [{ id_usuario: 1, nombre: "Juan" }],
      });

      const result = await repo.buscarPorCorreo("juan@ingenieria.usac.edu.gt");
      expect(result).toEqual({ id_usuario: 1, nombre: "Juan" });
    });

    it("deberia retornar null si no existe", async () => {
      (pool.query as jest.Mock).mockResolvedValue({ rows: [] });

      const result = await repo.buscarPorCorreo("noexiste@ingenieria.usac.edu.gt");
      expect(result).toBeNull();
    });
  });

  // ─── buscarPorId ───────────────────────────────────────

  describe("buscarPorId", () => {
    it("deberia retornar el usuario", async () => {
      (pool.query as jest.Mock).mockResolvedValue({
        rows: [{ id_usuario: 1 }],
      });

      const result = await repo.buscarPorId(1);
      expect(result).toEqual({ id_usuario: 1 });
    });

    it("deberia retornar null si no existe", async () => {
      (pool.query as jest.Mock).mockResolvedValue({ rows: [] });

      const result = await repo.buscarPorId(999);
      expect(result).toBeNull();
    });
  });

  // ─── correoExiste ──────────────────────────────────────

  describe("correoExiste", () => {
    it("deberia retornar true si existe", async () => {
      (pool.query as jest.Mock).mockResolvedValue({
        rows: [{ fn_correo_institucional_valido: true }],
      });

      const result = await repo.correoExiste("juan@ingenieria.usac.edu.gt");
      expect(result).toBe(true);
    });

    it("deberia retornar false si no existe", async () => {
      (pool.query as jest.Mock).mockResolvedValue({
        rows: [{ fn_correo_institucional_valido: false }],
      });

      const result = await repo.correoExiste("bad@x.com");
      expect(result).toBe(false);
    });

    it("deberia retornar false si no hay filas", async () => {
      (pool.query as jest.Mock).mockResolvedValue({ rows: [] });

      const result = await repo.correoExiste("x@x.com");
      expect(result).toBe(false);
    });
  });

  // ─── passwordHash ──────────────────────────────────────

  describe("passwordHash", () => {
    it("deberia retornar el hash", async () => {
      (pool.query as jest.Mock).mockResolvedValue({
        rows: [{ password_hash: "$2b$10$hash" }],
      });

      const result = await repo.passwordHash("juan@ingenieria.usac.edu.gt");
      expect(result).toBe("$2b$10$hash");
    });

    it("deberia retornar null si no existe", async () => {
      (pool.query as jest.Mock).mockResolvedValue({ rows: [] });

      const result = await repo.passwordHash("no@x.com");
      expect(result).toBeNull();
    });
  });

  // ─── passwordHashPorId ─────────────────────────────────

  describe("passwordHashPorId", () => {
    it("deberia retornar el hash por id", async () => {
      (pool.query as jest.Mock).mockResolvedValue({
        rows: [{ password_hash: "$2b$10$hash" }],
      });

      const result = await repo.passwordHashPorId(1);
      expect(result).toBe("$2b$10$hash");
    });

    it("deberia retornar null si no existe", async () => {
      (pool.query as jest.Mock).mockResolvedValue({ rows: [] });

      const result = await repo.passwordHashPorId(999);
      expect(result).toBeNull();
    });
  });

  // ─── actualizarPassword ────────────────────────────────

  describe("actualizarPassword", () => {
    it("deberia ejecutar el UPDATE", async () => {
      (pool.query as jest.Mock).mockResolvedValue({});

      await repo.actualizarPassword({ id_usuario: 1, password_hash: "$2b$10$new" });

      expect(pool.query).toHaveBeenCalledWith(
        "UPDATE usuario SET password_hash = $2 WHERE id_usuario = $1",
        [1, "$2b$10$new"]
      );
    });
  });

  // ─── obtenerPorGoogleId ────────────────────────────────

  describe("obtenerPorGoogleId", () => {
    it("deberia retornar el usuario", async () => {
      (pool.query as jest.Mock).mockResolvedValue({
        rows: [{ id_usuario: 1, google_id: "g123" }],
      });

      const result = await repo.obtenerPorGoogleId("g123");
      expect(result).toEqual({ id_usuario: 1, google_id: "g123" });
    });

    it("deberia retornar null si no existe", async () => {
      (pool.query as jest.Mock).mockResolvedValue({ rows: [] });

      const result = await repo.obtenerPorGoogleId("nope");
      expect(result).toBeNull();
    });
  });

  // ─── asociarGoogleId ───────────────────────────────────

  describe("asociarGoogleId", () => {
    it("deberia ejecutar el UPDATE", async () => {
      (pool.query as jest.Mock).mockResolvedValue({});

      await repo.asociarGoogleId(1, "g123");

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE"),
        ["g123", 1]
      );
    });
  });

  // ─── crearUsuarioGoogle ────────────────────────────────

  describe("crearUsuarioGoogle", () => {
    it("deberia crear el usuario y retornarlo", async () => {
      const client = mockClient();
      (pool.connect as jest.Mock).mockResolvedValue(client);
      (client.query as jest.Mock)
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({
          rows: [{ id_usuario: 1, google_id: "g123" }],
        });

      const result = await repo.crearUsuarioGoogle({
        nombre: "Juan",
        apellido: "Perez",
        correo: "juan@ingenieria.usac.edu.gt",
        googleId: "g123",
        estado: "ACTIVO",
      });

      expect(result.google_id).toBe("g123");
      expect(client.release).toHaveBeenCalled();
    });

    it("deberia liberar el client aunque falle", async () => {
      const client = mockClient();
      (pool.connect as jest.Mock).mockResolvedValue(client);
      (client.query as jest.Mock).mockRejectedValue(new Error("DB error"));

      await expect(
        repo.crearUsuarioGoogle({ nombre: "J", apellido: "P", correo: "j@x.com", googleId: "g", estado: "A" })
      ).rejects.toThrow("DB error");

      expect(client.release).toHaveBeenCalled();
    });
  });

  // ─── listarTodos ───────────────────────────────────────

  describe("listarTodos", () => {
    it("deberia retornar todos los usuarios", async () => {
      (pool.query as jest.Mock).mockResolvedValue({
        rows: [{ id_usuario: 1 }, { id_usuario: 2 }],
      });

      const result = await repo.listarTodos();
      expect(result).toHaveLength(2);
    });

    it("deberia retornar array vacio si no hay usuarios", async () => {
      (pool.query as jest.Mock).mockResolvedValue({ rows: [] });

      const result = await repo.listarTodos();
      expect(result).toHaveLength(0);
    });
  });
});
