import { InscribirServiceImp } from "./inscribir_service";
import { InscribirRepository } from "../repositories/inscribir_repository";
import { CursoRepository } from "../repositories/curso_repository";
import { InscripcionRow, PeriodoRow, EstadoMatriculaRow, CursoEstudianteRow } from "../types/inscripcion.types";
import { CursoRow } from "../types/curso.types";

function mockInscribirRepository(overrides: Partial<InscribirRepository> = {}): InscribirRepository {
  return {
    inscribirEstudiante: jest.fn(),
    actualizarEstadoMatricula: jest.fn(),
    buscarInscripcionPorId: jest.fn(),
    buscarPeriodoPorId: jest.fn(),
    buscarEstadoMatriculaPorId: jest.fn(),
    listarEstadosMatricula: jest.fn(),
    consultarCursosEstudiante: jest.fn(),
    consultarTodasInscripciones: jest.fn(),
    ...overrides,
  };
}

function mockCursoRepository(overrides: Partial<CursoRepository> = {}): CursoRepository {
  return {
    crearArea: jest.fn(), editarArea: jest.fn(), eliminarArea: jest.fn(),
    buscarAreaPorCodigo: jest.fn(), buscarAreaPorId: jest.fn(), listarAreas: jest.fn(),
    crearCurso: jest.fn(), editarCurso: jest.fn(), eliminarCurso: jest.fn(),
    buscarCursoPorCodigo: jest.fn(), buscarCursoPorId: jest.fn(), listarCursos: jest.fn(),
    ...overrides,
  };
}

const cursoBase: CursoRow = { id_curso: 1, codigo: "MA101", nombre: "Algebra", descripcion: null, id_area: 1, fecha_inscripcion: null };
const periodoBase: PeriodoRow = { id_periodo: 1, anio: 2025, num_semestre: 1 };
const estadoBase: EstadoMatriculaRow = { id_estado: 1, codigo: "INS", nombre: "Inscrito", descripcion: null };
const inscripcionBase: InscripcionRow = { id_inscripcion: 1, id_usuario: 1, id_curso: 1, id_periodo: 1, id_estado_matricula: 1, fecha_inscripcion: new Date(), tipo_inscripcion: null };

describe("InscribirServiceImp", () => {
  let service: InscribirServiceImp;
  let insRepo: InscribirRepository;
  let cursoRepo: CursoRepository;

  beforeEach(() => {
    insRepo = mockInscribirRepository();
    cursoRepo = mockCursoRepository();
    service = new InscribirServiceImp(insRepo, cursoRepo);
    jest.clearAllMocks();
  });

  describe("inscribirEstudiante", () => {
    it("deberia inscribir exitosamente", async () => {
      (cursoRepo.buscarCursoPorId as jest.Mock).mockResolvedValue(cursoBase);
      (insRepo.buscarPeriodoPorId as jest.Mock).mockResolvedValue(periodoBase);
      (insRepo.buscarEstadoMatriculaPorId as jest.Mock).mockResolvedValue(estadoBase);
      (insRepo.inscribirEstudiante as jest.Mock).mockResolvedValue(inscripcionBase);

      const result = await service.inscribirEstudiante({
        id_usuario: 1, id_curso: 1, id_periodo: 1, id_estado_matricula: 1, tipo_inscripcion: null, usuario_responsable: 1,
      });
      expect(result.id_inscripcion).toBe(1);
    });

    it("deberia fallar si id_usuario no es entero positivo", async () => {
      await expect(service.inscribirEstudiante({
        id_usuario: 0, id_curso: 1, id_periodo: 1, id_estado_matricula: 1, tipo_inscripcion: null, usuario_responsable: 1,
      })).rejects.toThrow("obligatorio");
    });

    it("deberia fallar si el curso no existe", async () => {
      (cursoRepo.buscarCursoPorId as jest.Mock).mockResolvedValue(null);
      await expect(service.inscribirEstudiante({
        id_usuario: 1, id_curso: 99, id_periodo: 1, id_estado_matricula: 1, tipo_inscripcion: null, usuario_responsable: 1,
      })).rejects.toThrow("no existe");
    });

    it("deberia fallar si el periodo no existe", async () => {
      (cursoRepo.buscarCursoPorId as jest.Mock).mockResolvedValue(cursoBase);
      (insRepo.buscarPeriodoPorId as jest.Mock).mockResolvedValue(null);
      await expect(service.inscribirEstudiante({
        id_usuario: 1, id_curso: 1, id_periodo: 99, id_estado_matricula: 1, tipo_inscripcion: null, usuario_responsable: 1,
      })).rejects.toThrow("no existe");
    });

    it("deberia fallar si el estado no existe", async () => {
      (cursoRepo.buscarCursoPorId as jest.Mock).mockResolvedValue(cursoBase);
      (insRepo.buscarPeriodoPorId as jest.Mock).mockResolvedValue(periodoBase);
      (insRepo.buscarEstadoMatriculaPorId as jest.Mock).mockResolvedValue(null);
      await expect(service.inscribirEstudiante({
        id_usuario: 1, id_curso: 1, id_periodo: 1, id_estado_matricula: 99, tipo_inscripcion: null, usuario_responsable: 1,
      })).rejects.toThrow("no existe");
    });
  });

  describe("actualizarEstadoMatricula", () => {
    it("deberia actualizar exitosamente", async () => {
      (insRepo.buscarInscripcionPorId as jest.Mock).mockResolvedValue(inscripcionBase);
      (insRepo.buscarEstadoMatriculaPorId as jest.Mock).mockResolvedValue(estadoBase);
      (insRepo.actualizarEstadoMatricula as jest.Mock).mockResolvedValue(inscripcionBase);

      const result = await service.actualizarEstadoMatricula({ id_inscripcion: 1, nuevo_estado: 1, usuario_responsable: 1 });
      expect(result.id_inscripcion).toBe(1);
    });

    it("deberia fallar si id_inscripcion no es entero positivo", async () => {
      await expect(service.actualizarEstadoMatricula({ id_inscripcion: 0, nuevo_estado: 1, usuario_responsable: 1 })).rejects.toThrow("obligatorio");
    });

    it("deberia fallar si la inscripcion no existe", async () => {
      (insRepo.buscarInscripcionPorId as jest.Mock).mockResolvedValue(null);
      await expect(service.actualizarEstadoMatricula({ id_inscripcion: 99, nuevo_estado: 1, usuario_responsable: 1 })).rejects.toThrow("no existe");
    });
  });

  describe("consultarCursosEstudiante", () => {
    it("deberia consultar exitosamente", async () => {
      (insRepo.consultarCursosEstudiante as jest.Mock).mockResolvedValue({ registros: [], total_paginas: 0 });
      const result = await service.consultarCursosEstudiante({ id_usuario: 1, anio: 2025, semestre: 1, estado: "", pagina: 1 });
      expect(result.total_paginas).toBe(0);
    });

    it("deberia fallar si id_usuario no es entero positivo", async () => {
      await expect(service.consultarCursosEstudiante({ id_usuario: 0, anio: 2025, semestre: 1, estado: "", pagina: 1 })).rejects.toThrow("obligatorio");
    });
  });

  describe("consultarEstadosMatricula", () => {
    it("deberia retornar los estados", async () => {
      (insRepo.listarEstadosMatricula as jest.Mock).mockResolvedValue([estadoBase]);
      const result = await service.consultarEstadosMatricula();
      expect(result).toHaveLength(1);
    });
  });

  describe("consultarTodasInscripciones", () => {
    it("deberia consultar exitosamente", async () => {
      (insRepo.consultarTodasInscripciones as jest.Mock).mockResolvedValue({ registros: [], total_paginas: 0 });
      const result = await service.consultarTodasInscripciones({ id_curso: 1, anio: 2025, semestre: 1, pagina: 1 });
      expect(result.total_paginas).toBe(0);
    });

    it("deberia fallar si semestre es mayor a 2", async () => {
      await expect(service.consultarTodasInscripciones({ id_curso: 1, anio: 2025, semestre: 3, pagina: 1 })).rejects.toThrow("El semestre debe ser 1 o 2");
    });
  });
});
