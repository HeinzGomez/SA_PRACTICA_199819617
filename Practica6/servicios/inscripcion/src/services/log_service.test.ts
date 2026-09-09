import { LogsServiceImp } from "./log_service";
import { LogsRepository } from "../repositories/logs_repository";

function mockLogsRepository(): LogsRepository {
  return { consultar: jest.fn() };
}

describe("LogsServiceImp", () => {
  let service: LogsServiceImp;
  let repo: LogsRepository;

  beforeEach(() => {
    repo = mockLogsRepository();
    service = new LogsServiceImp(repo);
    jest.clearAllMocks();
  });

  it("deberia consultar con parametros validos", async () => {
    (repo.consultar as jest.Mock).mockResolvedValue({ registros: [], totalPaginas: 0 });
    const result = await service.consultar({ pagina: 1, usuarioFiltro: 0, tablaFiltro: "" });
    expect(result).toEqual({ registros: [], totalPaginas: 0 });
  });

  it("deberia fallar si pagina es 0", async () => {
    await expect(service.consultar({ pagina: 0, usuarioFiltro: 0, tablaFiltro: "" })).rejects.toThrow("La página debe ser un número mayor o igual a 1");
  });

  it("deberia fallar si usuarioFiltro es negativo", async () => {
    await expect(service.consultar({ pagina: 1, usuarioFiltro: -1, tablaFiltro: "" })).rejects.toThrow("El filtro de usuario no puede ser negativo");
  });
});
