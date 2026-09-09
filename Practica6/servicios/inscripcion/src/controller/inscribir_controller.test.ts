import { status } from "@grpc/grpc-js";
import { InscribirService } from "../services/inscribir_service";
import { InscribirController } from "./inscribir_controller";
import { InscripcionRow, CursoEstudianteRow, EstadoMatriculaRow } from "../types/inscripcion.types";

function mockInscribirService(overrides: Partial<InscribirService> = {}): InscribirService {
  return { inscribirEstudiante: jest.fn(), actualizarEstadoMatricula: jest.fn(), consultarCursosEstudiante: jest.fn(), consultarTodasInscripciones: jest.fn(), consultarEstadosMatricula: jest.fn(), ...overrides };
}
function mockCall(req: any) { return { request: req } as any; }
function mockCallback() { return jest.fn(); }

function expectSuccess(cb: jest.Mock) { expect(cb).toHaveBeenCalledTimes(1); expect(cb.mock.calls[0][0]).toBeNull(); }
function expectError(cb: jest.Mock, code: number) { expect(cb).toHaveBeenCalledTimes(1); expect(cb.mock.calls[0][0]).not.toBeNull(); expect(cb.mock.calls[0][0].code).toBe(code); }

const inscripcionBase: InscripcionRow = { id_inscripcion: 1, id_usuario: 1, id_curso: 1, id_periodo: 1, id_estado_matricula: 1, fecha_inscripcion: new Date(), tipo_inscripcion: null };
const cursoEstBase: CursoEstudianteRow = { id_inscripcion: 1, id_usuario: 1, id_curso: 1, codigo_curso: "MA101", curso: "Algebra", codigo_area: "MAT", area: "Matematicas", anio: 2025, semestre: 1, codigo_estado: "INS", estado_matricula: "Inscrito", tipo_inscripcion: null, fecha_inscripcion: new Date() };
const estadoBase: EstadoMatriculaRow = { id_estado: 1, codigo: "INS", nombre: "Inscrito", descripcion: null };

describe("InscribirController", () => {
  let controller: InscribirController;
  let svc: InscribirService;

  beforeEach(() => { svc = mockInscribirService(); controller = new InscribirController(svc); jest.clearAllMocks(); });

  it("inscribirEstudiante - exito", async () => {
    (svc.inscribirEstudiante as jest.Mock).mockResolvedValue(inscripcionBase);
    const cb = mockCallback();
    await controller.inscribirEstudiante(mockCall({ id_usuario: 1, id_curso: 1, id_periodo: 1, id_estado_matricula: 1, tipo_inscripcion: "", usuario_responsable: 1 }), cb);
    expectSuccess(cb);
  });

  it("inscribirEstudiante - error", async () => {
    (svc.inscribirEstudiante as jest.Mock).mockRejectedValue(new Error("no existe"));
    const cb = mockCallback();
    await controller.inscribirEstudiante(mockCall({ id_usuario: 1, id_curso: 99, id_periodo: 1, id_estado_matricula: 1, tipo_inscripcion: "", usuario_responsable: 1 }), cb);
    expectError(cb, status.INVALID_ARGUMENT);
  });

  it("actualizarEstadoMatricula - exito", async () => {
    (svc.actualizarEstadoMatricula as jest.Mock).mockResolvedValue(inscripcionBase);
    const cb = mockCallback();
    await controller.actualizarEstadoMatricula(mockCall({ id_inscripcion: 1, nuevo_estado: 1, usuario_responsable: 1 }), cb);
    expectSuccess(cb);
  });

  it("consultarCursosEstudiante - exito", async () => {
    (svc.consultarCursosEstudiante as jest.Mock).mockResolvedValue({ registros: [cursoEstBase], total_paginas: 1 });
    const cb = mockCallback();
    await controller.consultarCursosEstudiante(mockCall({ id_usuario: 1, anio: 2025, semestre: 1, estado: "", pagina: 1 }), cb);
    expectSuccess(cb);
    expect(cb.mock.calls[0][1].registros).toHaveLength(1);
  });

  it("consultarEstadosMatricula - exito", async () => {
    (svc.consultarEstadosMatricula as jest.Mock).mockResolvedValue([estadoBase]);
    const cb = mockCallback();
    await controller.consultarEstadosMatricula(mockCall({}), cb);
    expectSuccess(cb);
    expect(cb.mock.calls[0][1].estados).toHaveLength(1);
  });

  it("consultarTodasInscripciones - exito", async () => {
    (svc.consultarTodasInscripciones as jest.Mock).mockResolvedValue({ registros: [cursoEstBase], total_paginas: 1 });
    const cb = mockCallback();
    await controller.consultarTodasInscripciones(mockCall({ id_curso: 1, anio: 2025, semestre: 1, pagina: 1 }), cb);
    expectSuccess(cb);
  });
});
