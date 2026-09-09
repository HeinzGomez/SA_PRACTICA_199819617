import { LogsServiceImp } from "./logs_service";
import { LogsRepository } from "../repositories/logs_repository";
import { ConsultarResult } from "../types/logs.types";

function mockLogsRepository(overrides: Partial<LogsRepository> = {}): LogsRepository {
  return {
    consultar: jest.fn(),
    ...overrides,
  };
}

describe("LogsServiceImp", () => {
  let service: LogsServiceImp;
  let repo: LogsRepository;

  beforeEach(() => {
    repo = mockLogsRepository();
    service = new LogsServiceImp(repo);
    jest.clearAllMocks();
  });

  describe("consultar", () => {
    it("deberia retornar resultados con pagina valida", async () => {
      const resultado: ConsultarResult = {
        registros: [],
        totalPaginas: 0,
      };
      (repo.consultar as jest.Mock).mockResolvedValue(resultado);

      const result = await service.consultar({
        pagina: 1,
        usuarioFiltro: 0,
        tablaFiltro: "",
      });

      expect(result).toEqual(resultado);
      expect(repo.consultar).toHaveBeenCalledWith({
        pagina: 1,
        usuarioFiltro: 0,
        tablaFiltro: "",
      });
    });

    it("deberia fallar si la pagina es 0", async () => {
      await expect(
        service.consultar({ pagina: 0, usuarioFiltro: 0, tablaFiltro: "" })
      ).rejects.toThrow("La página debe ser un número mayor o igual a 1");
    });

    it("deberia fallar si la pagina es negativa", async () => {
      await expect(
        service.consultar({ pagina: -1, usuarioFiltro: 0, tablaFiltro: "" })
      ).rejects.toThrow("La página debe ser un número mayor o igual a 1");
    });

    it("deberia fallar si el filtro de usuario es negativo", async () => {
      await expect(
        service.consultar({ pagina: 1, usuarioFiltro: -1, tablaFiltro: "" })
      ).rejects.toThrow("El filtro de usuario no puede ser negativo");
    });

    it("deberia permitir usuarioFiltro = 0 (sin filtro)", async () => {
      (repo.consultar as jest.Mock).mockResolvedValue({ registros: [], totalPaginas: 0 });

      await expect(
        service.consultar({ pagina: 1, usuarioFiltro: 0, tablaFiltro: "" })
      ).resolves.toBeDefined();
    });
  });
});
