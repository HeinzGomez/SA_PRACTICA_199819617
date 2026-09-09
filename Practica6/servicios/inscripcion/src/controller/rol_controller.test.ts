import { status } from "@grpc/grpc-js";
import { RolService } from "../services/rol_service";
import { RolController } from "./rol_controller";
import { UsuarioRolRow } from "../types/rol.types";

function mockRolService(overrides: Partial<RolService> = {}): RolService {
  return { asignarRol: jest.fn(), cambiarRol: jest.fn(), eliminarRol: jest.fn(), comprobarRol: jest.fn(), rolesDeUsuario: jest.fn(), ...overrides };
}
function mockCall(req: any) { return { request: req } as any; }
function mockCallback() { return jest.fn(); }

function expectSuccess(cb: jest.Mock) { expect(cb).toHaveBeenCalledTimes(1); expect(cb.mock.calls[0][0]).toBeNull(); }
function expectError(cb: jest.Mock, code: number) { expect(cb).toHaveBeenCalledTimes(1); expect(cb.mock.calls[0][0]).not.toBeNull(); expect(cb.mock.calls[0][0].code).toBe(code); }

describe("RolController", () => {
  let controller: RolController;
  let svc: RolService;

  beforeEach(() => { svc = mockRolService(); controller = new RolController(svc); jest.clearAllMocks(); });

  it("asignarRol - exito", async () => {
    (svc.asignarRol as jest.Mock).mockResolvedValue(undefined);
    const cb = mockCallback();
    await controller.asignarRol(mockCall({ id_usuario: 1, id_rol: 1 }), cb);
    expectSuccess(cb);
  });

  it("asignarRol - error", async () => {
    (svc.asignarRol as jest.Mock).mockRejectedValue(new Error("no existe"));
    const cb = mockCallback();
    await controller.asignarRol(mockCall({ id_usuario: 1, id_rol: 99 }), cb);
    expectError(cb, status.INVALID_ARGUMENT);
  });

  it("comprobarRol - exito", async () => {
    (svc.comprobarRol as jest.Mock).mockResolvedValue(true);
    const cb = mockCallback();
    await controller.comprobarRol(mockCall({ id_usuario: 1, nombre_rol: "Estudiante" }), cb);
    expectSuccess(cb);
    expect(cb.mock.calls[0][1].tiene_rol).toBe(true);
  });

  it("comprobarRol - error", async () => {
    (svc.comprobarRol as jest.Mock).mockRejectedValue(new Error("no existe"));
    const cb = mockCallback();
    await controller.comprobarRol(mockCall({ id_usuario: 1, nombre_rol: "Fake" }), cb);
    expectError(cb, status.INVALID_ARGUMENT);
  });

  it("consultarRolesUsuario - exito", async () => {
    const roles: UsuarioRolRow[] = [{ id_usuario: 1, id_rol: 1, rol: "Estudiante", descripcion: null }];
    (svc.rolesDeUsuario as jest.Mock).mockResolvedValue(roles);
    const cb = mockCallback();
    await controller.consultarRolesUsuario(mockCall({ id_usuario: 1 }), cb);
    expectSuccess(cb);
    expect(cb.mock.calls[0][1].roles).toHaveLength(1);
  });

  it("cambiarRol - exito", async () => {
    (svc.cambiarRol as jest.Mock).mockResolvedValue(undefined);
    const cb = mockCallback();
    await controller.cambiarRol(mockCall({ id_usuario: 1, id_rol_actual: 1, id_rol_nuevo: 2 }), cb);
    expectSuccess(cb);
  });

  it("eliminarRol - exito", async () => {
    (svc.eliminarRol as jest.Mock).mockResolvedValue(undefined);
    const cb = mockCallback();
    await controller.eliminarRol(mockCall({ id_usuario: 1, id_rol: 1 }), cb);
    expectSuccess(cb);
  });
});
