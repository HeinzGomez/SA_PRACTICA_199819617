import { servicesConfig } from "../config/services";

describe("servicesConfig", () => {
  test("auth config tiene valores por defecto", () => {
    expect(servicesConfig.auth.grpcUrl).toBeDefined();
    expect(servicesConfig.auth.httpUrl).toBeDefined();
  });

  test("inscripcion config tiene valores por defecto", () => {
    expect(servicesConfig.inscripcion.grpcUrl).toBeDefined();
    expect(servicesConfig.inscripcion.httpUrl).toBeDefined();
  });

  test("grabaciones config tiene valores por defecto", () => {
    expect(servicesConfig.grabaciones.grpcUrl).toBeDefined();
    expect(servicesConfig.grabaciones.httpUrl).toBeDefined();
  });

  test("analitica config tiene valores por defecto", () => {
    expect(servicesConfig.analitica.grpcUrl).toBeDefined();
    expect(servicesConfig.analitica.httpUrl).toBeDefined();
  });

  test("history config tiene valores por defecto", () => {
    expect(servicesConfig.history.grpcUrl).toBeDefined();
    expect(servicesConfig.history.httpUrl).toBeDefined();
  });

  test("notification config tiene valores por defecto", () => {
    expect(servicesConfig.notification.grpcUrl).toBeDefined();
    expect(servicesConfig.notification.httpUrl).toBeDefined();
  });

  test("resources config tiene valores por defecto", () => {
    expect(servicesConfig.resources.grpcUrl).toBeDefined();
    expect(servicesConfig.resources.httpUrl).toBeDefined();
  });

  test("frontend config tiene valores por defecto", () => {
    expect(servicesConfig.frontend.httpurl).toBeDefined();
    expect(servicesConfig.frontend.produccion).toBeDefined();
  });

  test("auth grpcUrl es localhost:50051 por defecto", () => {
    expect(servicesConfig.auth.grpcUrl).toBe("localhost:50051");
  });

  test("auth httpUrl es http://localhost:3001 por defecto", () => {
    expect(servicesConfig.auth.httpUrl).toBe("http://localhost:3001");
  });

  test("inscripcion grpcUrl es localhost:50052 por defecto", () => {
    expect(servicesConfig.inscripcion.grpcUrl).toBe("localhost:50052");
  });

  test("grabaciones grpcUrl es localhost:50053 por defecto", () => {
    expect(servicesConfig.grabaciones.grpcUrl).toBe("localhost:50053");
  });

  test("analitica grpcUrl es localhost:50054 por defecto", () => {
    expect(servicesConfig.analitica.grpcUrl).toBe("localhost:50054");
  });

  test("history grpcUrl es localhost:50055 por defecto", () => {
    expect(servicesConfig.history.grpcUrl).toBe("localhost:50055");
  });

  test("notification grpcUrl es localhost:50056 por defecto", () => {
    expect(servicesConfig.notification.grpcUrl).toBe("localhost:50056");
  });

  test("resources grpcUrl es localhost:50057 por defecto", () => {
    expect(servicesConfig.resources.grpcUrl).toBe("localhost:50057");
  });
});
