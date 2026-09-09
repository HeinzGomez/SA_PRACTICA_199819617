import { status } from "@grpc/grpc-js";
import { LogsController } from "./logs_controller";
import { LogsService } from "../services/logs_service";
import { ConsultarResult } from "../types/logs.types";

function mockLogsService(overrides: Partial<LogsService> = {}): LogsService {
  return {
    consultar: jest.fn(),
    ...overrides,
  };
}

function createMockCall(request: any) {
  return { request } as any;
}

function createMockCallback() {
  return jest.fn();
}

describe("LogsController", () => {
  let controller: LogsController;
  let logsService: LogsService;

  beforeEach(() => {
    logsService = mockLogsService();
    controller = new LogsController(logsService);
    jest.clearAllMocks();
  });

  function expectError(callback: jest.Mock, expectedCode: number) {
    expect(callback).toHaveBeenCalledTimes(1);
    const err = callback.mock.calls[0][0];
    expect(err).not.toBeNull();
    expect(err.code).toBe(expectedCode);
  }

  function expectSuccess(callback: jest.Mock, expectedData?: any) {
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback.mock.calls[0][0]).toBeNull();
    if (expectedData) {
      expect(callback.mock.calls[0][1]).toMatchObject(expectedData);
    }
  }

  describe("consultarAuditLogs", () => {
    it("deberia retornar los logs paginados", async () => {
      const resultado: ConsultarResult = {
        registros: [
          {
            id_auditoria: 1,
            usuario_responsable: 1,
            operacion: "INSERT",
            tabla_afectada: "usuario",
            fecha_evento: new Date("2025-01-01"),
            estado_anterior: null,
            estado_nuevo: '{"nombre":"Juan"}',
          },
        ],
        totalPaginas: 5,
      };
      (logsService.consultar as jest.Mock).mockResolvedValue(resultado);
      const callback = createMockCallback();

      await controller.consultarAuditLogs(
        createMockCall({ pagina: 1, usuario_filtro: 0, tabla_filtro: "" }),
        callback
      );

      expectSuccess(callback, {
        exito: true,
        total_paginas: 5,
      });
      const reg = callback.mock.calls[0][1].registros[0];
      expect(reg.id_auditoria).toBe(1);
      expect(reg.estado_anterior).toBe("");
      expect(reg.estado_nuevo).toBe('{"nombre":"Juan"}');
    });

    it("deberia mapear estado_anterior null a string vacio", async () => {
      const resultado: ConsultarResult = {
        registros: [
          {
            id_auditoria: 1,
            usuario_responsable: 1,
            operacion: "DELETE",
            tabla_afectada: "sesion",
            fecha_evento: new Date("2025-01-01"),
            estado_anterior: null,
            estado_nuevo: null,
          },
        ],
        totalPaginas: 1,
      };
      (logsService.consultar as jest.Mock).mockResolvedValue(resultado);
      const callback = createMockCallback();

      await controller.consultarAuditLogs(
        createMockCall({ pagina: 1, usuario_filtro: 0, tabla_filtro: "" }),
        callback
      );

      const response = callback.mock.calls[0][1];
      expect(response.registros[0].estado_anterior).toBe("");
      expect(response.registros[0].estado_nuevo).toBe("");
    });

    it("deberia mapear estado como objeto a JSON string", async () => {
      const resultado: ConsultarResult = {
        registros: [
          {
            id_auditoria: 1,
            usuario_responsable: 1,
            operacion: "UPDATE",
            tabla_afectada: "usuario",
            fecha_evento: new Date("2025-01-01"),
            estado_anterior: { nombre: "old" } as any,
            estado_nuevo: { nombre: "new" } as any,
          },
        ],
        totalPaginas: 1,
      };
      (logsService.consultar as jest.Mock).mockResolvedValue(resultado);
      const callback = createMockCallback();

      await controller.consultarAuditLogs(
        createMockCall({ pagina: 1, usuario_filtro: 0, tabla_filtro: "" }),
        callback
      );

      const response = callback.mock.calls[0][1];
      expect(response.registros[0].estado_anterior).toBe('{"nombre":"old"}');
      expect(response.registros[0].estado_nuevo).toBe('{"nombre":"new"}');
    });

    it("deberia manejar errores del service", async () => {
      (logsService.consultar as jest.Mock).mockRejectedValue(new Error("Pagina invalida"));
      const callback = createMockCallback();

      await controller.consultarAuditLogs(
        createMockCall({ pagina: 0, usuario_filtro: 0, tabla_filtro: "" }),
        callback
      );

      expectError(callback, status.INVALID_ARGUMENT);
    });

    it("deberia manejar errores no-Error", async () => {
      (logsService.consultar as jest.Mock).mockRejectedValue("string error");
      const callback = createMockCallback();

      await controller.consultarAuditLogs(
        createMockCall({ pagina: 1, usuario_filtro: 0, tabla_filtro: "" }),
        callback
      );

      expectError(callback, status.INVALID_ARGUMENT);
    });

    it("deberia manejar registros vacios", async () => {
      (logsService.consultar as jest.Mock).mockResolvedValue({ registros: [], totalPaginas: 0 });
      const callback = createMockCallback();

      await controller.consultarAuditLogs(
        createMockCall({ pagina: 1, usuario_filtro: 0, tabla_filtro: "" }),
        callback
      );

      expectSuccess(callback, {
        exito: true,
        registros: [],
        total_paginas: 0,
      });
    });
  });
});
