import { AcademicoServiceImp } from "./academico_service";
import { AcademicoRepository } from "../repositories/academico_repository";
import { RolRepository } from "../repositories/rol_repository";
import { PensumRow, CarreraRow, PeriodoRow, PerfilAcademicoRow, PerfilEstudianteRow } from "../types/academico.types";
import { RolRow } from "../types/rol.types";

function mockAcademicoRepository(overrides: Partial<AcademicoRepository> = {}): AcademicoRepository {
  return {
    crearPensum: jest.fn(), editarPensum: jest.fn(), eliminarPensum: jest.fn(),
    buscarPensumPorId: jest.fn(), listarPensums: jest.fn(),
    crearCarrera: jest.fn(), editarCarrera: jest.fn(), eliminarCarrera: jest.fn(),
    buscarCarreraPorId: jest.fn(), listarCarreras: jest.fn(),
    crearPeriodo: jest.fn(), editarPeriodo: jest.fn(), eliminarPeriodo: jest.fn(),
    buscarPeriodoPorId: jest.fn(), listarPeriodos: jest.fn(),
    crearPerfilAcademico: jest.fn(), buscarPerfilPorId: jest.fn(),
    buscarPerfilPorUsuario: jest.fn(), buscarPerfilPorRegistroAcademico: jest.fn(),
    buscarPerfilPorDpi: jest.fn(), cambiarPerfilAcademico: jest.fn(),
    listarPerfilesEstudiante: jest.fn(),
    ...overrides,
  };
}

function mockRolRepository(overrides: Partial<RolRepository> = {}): RolRepository {
  return {
    asignarRol: jest.fn(), cambiarRol: jest.fn(), eliminarRol: jest.fn(),
    tieneRol: jest.fn(), rolesDeUsuario: jest.fn(),
    buscarRolPorId: jest.fn(), buscarRolPorNombre: jest.fn(),
    ...overrides,
  };
}

const pensumBase: PensumRow = { id_pensum: 1, nombre: "Pensum 2020", descripcion: null };
const carreraBase: CarreraRow = { id_carrera: 1, facultad: "Ingenieria", nombre: "Ing. Sistemas", descripcion: null, id_pensum: 1, fecha_creacion: new Date() };
const periodoBase: PeriodoRow = { id_periodo: 1, anio: 2025, num_semestre: 1 };
const perfilBase: PerfilAcademicoRow = { id_perfil: 1, id_usuario: 1, registro_academico: "2020001", dpi: "1234567890", fecha_nacimiento: null, telefono: null, id_carrera: 1, direccion: null };
const rolBase: RolRow = { id_rol: 1, nombre: "Estudiante", descripcion: null };

describe("AcademicoServiceImp", () => {
  let service: AcademicoServiceImp;
  let acadRepo: AcademicoRepository;
  let rolRepo: RolRepository;

  beforeEach(() => {
    acadRepo = mockAcademicoRepository();
    rolRepo = mockRolRepository();
    service = new AcademicoServiceImp(acadRepo, rolRepo);
    jest.clearAllMocks();
  });

  describe("crearPensum", () => {
    it("deberia crear exitosamente", async () => {
      (acadRepo.crearPensum as jest.Mock).mockResolvedValue(pensumBase);
      const result = await service.crearPensum({ nombre: "Pensum 2020", descripcion: null });
      expect(result.id_pensum).toBe(1);
    });

    it("deberia fallar si nombre vacio", async () => {
      await expect(service.crearPensum({ nombre: "", descripcion: null })).rejects.toThrow("obligatorio");
    });
  });

  describe("editarPensum", () => {
    it("deberia editar exitosamente", async () => {
      (acadRepo.buscarPensumPorId as jest.Mock).mockResolvedValue(pensumBase);
      (acadRepo.editarPensum as jest.Mock).mockResolvedValue(pensumBase);
      const result = await service.editarPensum({ id_pensum: 1, nombre: "Pensum 2020", descripcion: null });
      expect(result.id_pensum).toBe(1);
    });

    it("deberia fallar si id_pensum es 0", async () => {
      await expect(service.editarPensum({ id_pensum: 0, nombre: "X", descripcion: null })).rejects.toThrow("obligatorio");
    });

    it("deberia fallar si no existe", async () => {
      (acadRepo.buscarPensumPorId as jest.Mock).mockResolvedValue(null);
      await expect(service.editarPensum({ id_pensum: 99, nombre: "X", descripcion: null })).rejects.toThrow("no existe");
    });
  });

  describe("eliminarPensum", () => {
    it("deberia eliminar exitosamente", async () => {
      (acadRepo.buscarPensumPorId as jest.Mock).mockResolvedValue(pensumBase);
      (acadRepo.eliminarPensum as jest.Mock).mockResolvedValue(true);
      await expect(service.eliminarPensum(1)).resolves.toBe(true);
    });

    it("deberia fallar si id es 0", async () => {
      await expect(service.eliminarPensum(0)).rejects.toThrow("obligatorio");
    });
  });

  describe("crearCarrera", () => {
    it("deberia crear exitosamente", async () => {
      (acadRepo.buscarPensumPorId as jest.Mock).mockResolvedValue(pensumBase);
      (acadRepo.crearCarrera as jest.Mock).mockResolvedValue(carreraBase);
      const result = await service.crearCarrera({ facultad: "Ing", nombre: "Sistemas", descripcion: null, id_pensum: 1 });
      expect(result.id_carrera).toBe(1);
    });

    it("deberia fallar si falta facultad o nombre", async () => {
      await expect(service.crearCarrera({ facultad: "", nombre: "X", descripcion: null, id_pensum: 1 })).rejects.toThrow("obligatorios");
    });

    it("deberia fallar si id_pensum es 0", async () => {
      await expect(service.crearCarrera({ facultad: "Ing", nombre: "X", descripcion: null, id_pensum: 0 })).rejects.toThrow("pensum");
    });

    it("deberia fallar si el pensum no existe", async () => {
      (acadRepo.buscarPensumPorId as jest.Mock).mockResolvedValue(null);
      await expect(service.crearCarrera({ facultad: "Ing", nombre: "X", descripcion: null, id_pensum: 99 })).rejects.toThrow("no existe");
    });
  });

  describe("editarCarrera", () => {
    it("deberia editar exitosamente", async () => {
      (acadRepo.buscarCarreraPorId as jest.Mock).mockResolvedValue(carreraBase);
      (acadRepo.buscarPensumPorId as jest.Mock).mockResolvedValue(pensumBase);
      (acadRepo.editarCarrera as jest.Mock).mockResolvedValue(carreraBase);
      const result = await service.editarCarrera({ id_carrera: 1, facultad: "Ing", nombre: "Sistemas", descripcion: null, id_pensum: 1 });
      expect(result.id_carrera).toBe(1);
    });

    it("deberia fallar si id_carrera es 0", async () => {
      await expect(service.editarCarrera({ id_carrera: 0, facultad: "Ing", nombre: "X", descripcion: null, id_pensum: 1 })).rejects.toThrow("obligatorio");
    });
  });

  describe("eliminarCarrera", () => {
    it("deberia eliminar exitosamente", async () => {
      (acadRepo.buscarCarreraPorId as jest.Mock).mockResolvedValue(carreraBase);
      (acadRepo.eliminarCarrera as jest.Mock).mockResolvedValue(true);
      await expect(service.eliminarCarrera(1)).resolves.toBe(true);
    });
  });

  describe("crearPeriodo", () => {
    it("deberia crear exitosamente", async () => {
      (acadRepo.crearPeriodo as jest.Mock).mockResolvedValue(periodoBase);
      const result = await service.crearPeriodo({ anio: 2025, num_semestre: 1 });
      expect(result.id_periodo).toBe(1);
    });

    it("deberia fallar si anio es 0", async () => {
      await expect(service.crearPeriodo({ anio: 0, num_semestre: 1 })).rejects.toThrow("obligatorio");
    });

    it("deberia fallar si anio fuera de rango", async () => {
      await expect(service.crearPeriodo({ anio: 1999, num_semestre: 1 })).rejects.toThrow("entre 2000 y 2100");
    });

    it("deberia fallar si semestre fuera de rango", async () => {
      await expect(service.crearPeriodo({ anio: 2025, num_semestre: 3 })).rejects.toThrow("entre 1 y 2");
    });
  });

  describe("editarPeriodo", () => {
    it("deberia editar exitosamente", async () => {
      (acadRepo.buscarPeriodoPorId as jest.Mock).mockResolvedValue(periodoBase);
      (acadRepo.editarPeriodo as jest.Mock).mockResolvedValue(periodoBase);
      const result = await service.editarPeriodo({ id_periodo: 1, anio: 2025, num_semestre: 1 });
      expect(result.id_periodo).toBe(1);
    });

    it("deberia fallar si id_periodo es 0", async () => {
      await expect(service.editarPeriodo({ id_periodo: 0, anio: 2025, num_semestre: 1 })).rejects.toThrow("obligatorio");
    });
  });

  describe("eliminarPeriodo", () => {
    it("deberia eliminar exitosamente", async () => {
      (acadRepo.buscarPeriodoPorId as jest.Mock).mockResolvedValue(periodoBase);
      (acadRepo.eliminarPeriodo as jest.Mock).mockResolvedValue(true);
      await expect(service.eliminarPeriodo(1)).resolves.toBe(true);
    });
  });

  describe("consultarPensums/Carreras/Periodos", () => {
    it("deberia listar pensums", async () => {
      (acadRepo.listarPensums as jest.Mock).mockResolvedValue([pensumBase]);
      const result = await service.consultarPensums();
      expect(result).toHaveLength(1);
    });

    it("deberia listar carreras", async () => {
      (acadRepo.listarCarreras as jest.Mock).mockResolvedValue([carreraBase]);
      const result = await service.consultarCarreras();
      expect(result).toHaveLength(1);
    });

    it("deberia listar periodos", async () => {
      (acadRepo.listarPeriodos as jest.Mock).mockResolvedValue([periodoBase]);
      const result = await service.consultarPeriodos();
      expect(result).toHaveLength(1);
    });
  });

  describe("crearPerfilAcademico", () => {
    it("deberia crear exitosamente", async () => {
      (acadRepo.buscarPerfilPorRegistroAcademico as jest.Mock).mockResolvedValue(null);
      (acadRepo.buscarPerfilPorDpi as jest.Mock).mockResolvedValue(null);
      (acadRepo.buscarCarreraPorId as jest.Mock).mockResolvedValue(carreraBase);
      (acadRepo.crearPerfilAcademico as jest.Mock).mockResolvedValue(perfilBase);
      (rolRepo.buscarRolPorNombre as jest.Mock).mockResolvedValue(rolBase);
      (rolRepo.asignarRol as jest.Mock).mockResolvedValue(undefined);

      const result = await service.crearPerfilAcademico({
        id_usuario: 1, registro_academico: "2020001", dpi: "1234567890", fecha_nacimiento: null, telefono: null, id_carrera: 1, direccion: null,
      });
      expect(result.id_perfil).toBe(1);
    });

    it("deberia fallar si id_usuario es 0", async () => {
      await expect(service.crearPerfilAcademico({
        id_usuario: 0, registro_academico: null, dpi: null, fecha_nacimiento: null, telefono: null, id_carrera: null, direccion: null,
      })).rejects.toThrow("obligatorio");
    });

    it("deberia fallar si la fecha de nacimiento tiene formato invalido", async () => {
      await expect(service.crearPerfilAcademico({
        id_usuario: 1, registro_academico: null, dpi: null, fecha_nacimiento: "invalid", telefono: null, id_carrera: null, direccion: null,
      })).rejects.toThrow("formato YYYY-MM-DD");
    });

    it("deberia fallar si el registro academico ya esta en uso", async () => {
      (acadRepo.buscarPerfilPorRegistroAcademico as jest.Mock).mockResolvedValue(perfilBase);
      await expect(service.crearPerfilAcademico({
        id_usuario: 1, registro_academico: "2020001", dpi: null, fecha_nacimiento: null, telefono: null, id_carrera: null, direccion: null,
      })).rejects.toThrow("ya está en uso");
    });

    it("deberia fallar si el DPI ya esta en uso", async () => {
      (acadRepo.buscarPerfilPorRegistroAcademico as jest.Mock).mockResolvedValue(null);
      (acadRepo.buscarPerfilPorDpi as jest.Mock).mockResolvedValue(perfilBase);
      await expect(service.crearPerfilAcademico({
        id_usuario: 1, registro_academico: null, dpi: "1234567890", fecha_nacimiento: null, telefono: null, id_carrera: null, direccion: null,
      })).rejects.toThrow("ya está en uso");
    });

    it("deberia fallar si la carrera no existe", async () => {
      (acadRepo.buscarPerfilPorRegistroAcademico as jest.Mock).mockResolvedValue(null);
      (acadRepo.buscarPerfilPorDpi as jest.Mock).mockResolvedValue(null);
      (acadRepo.buscarCarreraPorId as jest.Mock).mockResolvedValue(null);
      await expect(service.crearPerfilAcademico({
        id_usuario: 1, registro_academico: null, dpi: null, fecha_nacimiento: null, telefono: null, id_carrera: 99, direccion: null,
      })).rejects.toThrow("no existe");
    });
  });

  describe("cambiarPerfilAcademico", () => {
    it("deberia cambiar exitosamente", async () => {
      (acadRepo.buscarPerfilPorId as jest.Mock).mockResolvedValue(perfilBase);
      (acadRepo.buscarPerfilPorRegistroAcademico as jest.Mock).mockResolvedValue(null);
      (acadRepo.cambiarPerfilAcademico as jest.Mock).mockResolvedValue(perfilBase);

      const result = await service.cambiarPerfilAcademico({ id_perfil: 1, dpi: "9999999999" });
      expect(result.id_perfil).toBe(1);
    });

    it("deberia fallar si id_perfil es 0", async () => {
      await expect(service.cambiarPerfilAcademico({ id_perfil: 0 })).rejects.toThrow("obligatorio");
    });

    it("deberia fallar si el perfil no existe", async () => {
      (acadRepo.buscarPerfilPorId as jest.Mock).mockResolvedValue(null);
      await expect(service.cambiarPerfilAcademico({ id_perfil: 99, dpi: "123" })).rejects.toThrow("no existe");
    });

    it("deberia fallar si no hay campos a actualizar", async () => {
      (acadRepo.buscarPerfilPorId as jest.Mock).mockResolvedValue(perfilBase);
      await expect(service.cambiarPerfilAcademico({ id_perfil: 1 })).rejects.toThrow("Debe enviar al menos un campo");
    });
  });

  describe("consultarPerfilAcademico", () => {
    it("deberia retornar el perfil", async () => {
      (acadRepo.buscarPerfilPorUsuario as jest.Mock).mockResolvedValue(perfilBase);
      const result = await service.consultarPerfilAcademico(1);
      expect(result).toEqual(perfilBase);
    });

    it("deberia fallar si idUsuario es 0", async () => {
      await expect(service.consultarPerfilAcademico(0)).rejects.toThrow("obligatorio");
    });
  });

  describe("consultarPerfilesEstudiante", () => {
    it("deberia retornar los perfiles", async () => {
      (acadRepo.listarPerfilesEstudiante as jest.Mock).mockResolvedValue([]);
      const result = await service.consultarPerfilesEstudiante();
      expect(result).toHaveLength(0);
    });
  });
});
