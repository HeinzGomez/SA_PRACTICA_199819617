import { RolServiceImp } from "./rol_service";
import { RolRepository } from "../repositories/rol_repository";
import { RolRow, UsuarioRolRow } from "../types/rol.types";

function mockRolRepository(overrides: Partial<RolRepository> = {}): RolRepository {
  return {
    asignarRol: jest.fn(),
    cambiarRol: jest.fn(),
    eliminarRol: jest.fn(),
    tieneRol: jest.fn(),
    rolesDeUsuario: jest.fn(),
    buscarRolPorId: jest.fn(),
    buscarRolPorNombre: jest.fn(),
    ...overrides,
  };
}

const rolBase: RolRow = { id_rol: 1, nombre: "Estudiante", descripcion: null };
const usuarioRolBase: UsuarioRolRow = { id_usuario: 1, id_rol: 1, rol: "Estudiante", descripcion: null };

describe("RolServiceImp", () => {
  let service: RolServiceImp;
  let repo: RolRepository;

  beforeEach(() => {
    repo = mockRolRepository();
    service = new RolServiceImp(repo);
    jest.clearAllMocks();
  });

  describe("asignarRol", () => {
    it("deberia asignar rol exitosamente", async () => {
      (repo.buscarRolPorId as jest.Mock).mockResolvedValue(rolBase);
      (repo.rolesDeUsuario as jest.Mock).mockResolvedValue([]);
      (repo.asignarRol as jest.Mock).mockResolvedValue(undefined);

      await service.asignarRol({ id_usuario: 1, id_rol: 1 });
      expect(repo.asignarRol).toHaveBeenCalled();
    });

    it("deberia fallar si id_usuario es 0", async () => {
      await expect(service.asignarRol({ id_usuario: 0, id_rol: 1 })).rejects.toThrow("obligatorio");
    });

    it("deberia fallar si el rol no existe", async () => {
      (repo.buscarRolPorId as jest.Mock).mockResolvedValue(null);
      await expect(service.asignarRol({ id_usuario: 1, id_rol: 99 })).rejects.toThrow("no existe");
    });

    it("deberia fallar si el usuario ya tiene el rol", async () => {
      (repo.buscarRolPorId as jest.Mock).mockResolvedValue(rolBase);
      (repo.rolesDeUsuario as jest.Mock).mockResolvedValue([usuarioRolBase]);
      await expect(service.asignarRol({ id_usuario: 1, id_rol: 1 })).rejects.toThrow("ya tiene asignado");
    });
  });

  describe("comprobarRol", () => {
    it("deberia retornar true si tiene el rol", async () => {
      (repo.buscarRolPorNombre as jest.Mock).mockResolvedValue(rolBase);
      (repo.tieneRol as jest.Mock).mockResolvedValue(true);
      const result = await service.comprobarRol({ id_usuario: 1, nombre_rol: "Estudiante" });
      expect(result).toBe(true);
    });

    it("deberia fallar si nombre_rol esta vacio", async () => {
      await expect(service.comprobarRol({ id_usuario: 1, nombre_rol: "" })).rejects.toThrow("obligatorio");
    });

    it("deberia fallar si el rol no existe", async () => {
      (repo.buscarRolPorNombre as jest.Mock).mockResolvedValue(null);
      await expect(service.comprobarRol({ id_usuario: 1, nombre_rol: "Fake" })).rejects.toThrow("no existe");
    });
  });

  describe("rolesDeUsuario", () => {
    it("deberia retornar los roles", async () => {
      (repo.rolesDeUsuario as jest.Mock).mockResolvedValue([usuarioRolBase]);
      const result = await service.rolesDeUsuario(1);
      expect(result).toHaveLength(1);
    });

    it("deberia fallar si id es 0", async () => {
      await expect(service.rolesDeUsuario(0)).rejects.toThrow("obligatorio");
    });
  });

  describe("cambiarRol", () => {
    it("deberia cambiar rol exitosamente", async () => {
      (repo.buscarRolPorId as jest.Mock).mockResolvedValueOnce({ id_rol: 1, nombre: "Estudiante", descripcion: null });
      (repo.buscarRolPorId as jest.Mock).mockResolvedValueOnce({ id_rol: 2, nombre: "Docente", descripcion: null });
      (repo.rolesDeUsuario as jest.Mock).mockResolvedValue([usuarioRolBase]);
      (repo.cambiarRol as jest.Mock).mockResolvedValue(undefined);

      await service.cambiarRol({ id_usuario: 1, id_rol_actual: 1, id_rol_nuevo: 2 });
      expect(repo.cambiarRol).toHaveBeenCalled();
    });

    it("deberia fallar si id_usuario es 0", async () => {
      await expect(service.cambiarRol({ id_usuario: 0, id_rol_actual: 1, id_rol_nuevo: 2 })).rejects.toThrow("obligatorio");
    });

    it("deberia fallar si ambos roles son iguales", async () => {
      await expect(service.cambiarRol({ id_usuario: 1, id_rol_actual: 1, id_rol_nuevo: 1 })).rejects.toThrow("no pueden ser iguales");
    });

    it("deberia fallar si el rol actual no existe", async () => {
      (repo.buscarRolPorId as jest.Mock).mockResolvedValue(null);
      await expect(service.cambiarRol({ id_usuario: 1, id_rol_actual: 99, id_rol_nuevo: 2 })).rejects.toThrow("no existe");
    });

    it("deberia fallar si el usuario no tiene el rol actual", async () => {
      (repo.buscarRolPorId as jest.Mock).mockResolvedValueOnce(rolBase);
      (repo.buscarRolPorId as jest.Mock).mockResolvedValueOnce({ id_rol: 2, nombre: "Docente", descripcion: null });
      (repo.rolesDeUsuario as jest.Mock).mockResolvedValue([]);
      await expect(service.cambiarRol({ id_usuario: 1, id_rol_actual: 1, id_rol_nuevo: 2 })).rejects.toThrow("no tiene asignado");
    });

    it("deberia fallar si ya tiene el rol nuevo", async () => {
      (repo.buscarRolPorId as jest.Mock).mockResolvedValueOnce(rolBase);
      (repo.buscarRolPorId as jest.Mock).mockResolvedValueOnce({ id_rol: 2, nombre: "Docente", descripcion: null });
      (repo.rolesDeUsuario as jest.Mock).mockResolvedValue([usuarioRolBase, { id_usuario: 1, id_rol: 2, rol: "Docente", descripcion: null }]);
      await expect(service.cambiarRol({ id_usuario: 1, id_rol_actual: 1, id_rol_nuevo: 2 })).rejects.toThrow("ya tiene asignado");
    });
  });

  describe("eliminarRol", () => {
    it("deberia eliminar rol exitosamente", async () => {
      (repo.buscarRolPorId as jest.Mock).mockResolvedValue(rolBase);
      (repo.rolesDeUsuario as jest.Mock).mockResolvedValue([usuarioRolBase]);
      (repo.eliminarRol as jest.Mock).mockResolvedValue(undefined);

      await service.eliminarRol({ id_usuario: 1, id_rol: 1 });
      expect(repo.eliminarRol).toHaveBeenCalled();
    });

    it("deberia fallar si id_usuario es 0", async () => {
      await expect(service.eliminarRol({ id_usuario: 0, id_rol: 1 })).rejects.toThrow("obligatorio");
    });

    it("deberia fallar si el rol no existe", async () => {
      (repo.buscarRolPorId as jest.Mock).mockResolvedValue(null);
      await expect(service.eliminarRol({ id_usuario: 1, id_rol: 99 })).rejects.toThrow("no existe");
    });

    it("deberia fallar si el usuario no tiene el rol", async () => {
      (repo.buscarRolPorId as jest.Mock).mockResolvedValue(rolBase);
      (repo.rolesDeUsuario as jest.Mock).mockResolvedValue([]);
      await expect(service.eliminarRol({ id_usuario: 1, id_rol: 1 })).rejects.toThrow("no tiene asignado");
    });
  });
});
