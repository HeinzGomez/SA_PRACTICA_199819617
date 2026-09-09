import { LogsService } from "../services/log_service";
import { LogsController } from "./logs_controller";
import { ConsultarResult } from "../types/logs.types";

function mockLogsService(): LogsService { return { consultar: jest.fn() }; }
function mockCall(req: any) { return { request: req } as any; }
function mockCallback() { return jest.fn(); }

describe("LogsController", () => {
  let controller: LogsController;
  let svc: LogsService;

  beforeEach(() => { svc = mockLogsService(); controller = new LogsController(svc); jest.clearAllMocks(); });

  function expectSuccess(cb: jest.Mock) {
    expect(cb).toHaveBeenCalledTimes(1);
    expect(cb.mock.calls[0][0]).toBeNull();
  }

  function expectError(cb: jest.Mock, code: number) {
    expect(cb).toHaveBeenCalledTimes(1);
    expect(cb.mock.calls[0][0]).not.toBeNull();
    expect(cb.mock.calls[0][0].code).toBe(code);
  }

  it("deberia consultar logs exitosamente", async () => {
    (svc.consultar as jest.Mock).mockResolvedValue({ registros: [], totalPaginas: 0 });
    const cb = mockCallback();
    await controller.consultarAuditLogs(mockCall({ pagina: 1, usuario_filtro: 0, tabla_filtro: "" }), cb);
    expectSuccess(cb);
    expect(cb.mock.calls[0][1].exito).toBe(true);
  });

  it("deberia mapear estado_anterior null a string vacio", async () => {
    const data: ConsultarResult = {
      registros: [{ id_auditoria: 1, usuario_responsable: 1, operacion: "INSERT", tabla_afectada: "x", fecha_evento: new Date(), estado_anterior: null, estado_nuevo: null }],
      totalPaginas: 1,
    };
    (svc.consultar as jest.Mock).mockResolvedValue(data);
    const cb = mockCallback();
    await controller.consultarAuditLogs(mockCall({ pagina: 1, usuario_filtro: 0, tabla_filtro: "" }), cb);
    expectSuccess(cb);
    expect(cb.mock.calls[0][1].registros[0].estado_anterior).toBe("");
  });

  it("deberia manejar errores", async () => {
    (svc.consultar as jest.Mock).mockRejectedValue(new Error("fail"));
    const cb = mockCallback();
    await controller.consultarAuditLogs(mockCall({ pagina: 0, usuario_filtro: 0, tabla_filtro: "" }), cb);
    expectError(cb, 3);
  });
});
