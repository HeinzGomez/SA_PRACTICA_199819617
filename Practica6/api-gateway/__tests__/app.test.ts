jest.mock("../grpc/auth.client", () => ({ AuthGrpcClient: jest.fn() }));
jest.mock("../grpc/ins.client", () => ({ InscripcionGrpcClient: jest.fn() }));
jest.mock("../grpc/grab.client", () => ({ GrabacionesGrpcClient: jest.fn() }));
jest.mock("../grpc/his.client", () => ({ HistorialGrpcClient: jest.fn() }));
jest.mock("../grpc/not.client", () => ({ NotificacionesGrpcClient: jest.fn() }));
jest.mock("../grpc/anal.client", () => ({ AnaliticaGrpcClient: jest.fn() }));
jest.mock("../grpc/res.client", () => ({ RecursosGrpcClient: jest.fn() }));
jest.mock("../services/oauth-onboarding.service", () => ({ OAuthOnboardingServiceImp: jest.fn() }));

import { createApp } from "../app";

describe("createApp", () => {
  test("returns an express app", () => {
    const app = createApp();
    expect(app).toBeDefined();
    expect(typeof app.listen).toBe("function");
    expect(typeof app.use).toBe("function");
  });

  test("app has router with middleware stack", () => {
    const app = createApp();
    expect(app._router).toBeDefined();
    expect(app._router.stack).toBeDefined();
    expect(app._router.stack.length).toBeGreaterThan(0);
  });
});
