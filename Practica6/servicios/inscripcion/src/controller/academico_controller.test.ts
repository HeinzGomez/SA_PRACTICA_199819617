import { status } from "@grpc/grpc-js";
import { AcademicoService } from "../services/academico_service";
import { AcademicoController } from "./academico_controller";
import { PensumRow, CarreraRow, PeriodoRow, PerfilAcademicoRow, PerfilEstudianteRow } from "../types/academico.types";

function mockAcademicoService(overrides: Partial<AcademicoService> = {}): AcademicoService {
  return {
    crearPensum: jest.fn(), editarPensum: jest.fn(), eliminarPensum: jest.fn(), consultarPensums: jest.fn(),
    crearCarrera: jest.fn(), editarCarrera: jest.fn(), eliminarCarrera: jest.fn(), consultarCarreras: jest.fn(),
    crearPeriodo: jest.fn(), editarPeriodo: jest.fn(), eliminarPeriodo: jest.fn(), consultarPeriodos: jest.fn(),
    crearPerfilAcademico: jest.fn(), cambiarPerfilAcademico: jest.fn(), consultarPerfilAcademico: jest.fn(), consultarPerfilesEstudiante: jest.fn(),
    ...overrides,
  };
}
function mockCall(req: any) { return { request: req } as any; }
function mockCallback() { return jest.fn(); }

function expectSuccess(cb: jest.Mock) { expect(cb).toHaveBeenCalledTimes(1); expect(cb.mock.calls[0][0]).toBeNull(); }
function expectError(cb: jest.Mock, code: number) { expect(cb).toHaveBeenCalledTimes(1); expect(cb.mock.calls[0][0]).not.toBeNull(); expect(cb.mock.calls[0][0].code).toBe(code); }

const pensumBase: PensumRow = { id_pensum: 1, nombre: "Pensum 2020", descripcion: null };
const carreraBase: CarreraRow = { id_carrera: 1, facultad: "Ing", nombre: "Sistemas", descripcion: null, id_pensum: 1, fecha_creacion: new Date() };
const periodoBase: PeriodoRow = { id_periodo: 1, anio: 2025, num_semestre: 1 };
const perfilBase: PerfilAcademicoRow = { id_perfil: 1, id_usuario: 1, registro_academico: "2020001", dpi: "123", fecha_nacimiento: null, telefono: null, id_carrera: 1, direccion: null };

describe("AcademicoController", () => {
  let controller: AcademicoController;
  let svc: AcademicoService;

  beforeEach(() => { svc = mockAcademicoService(); controller = new AcademicoController(svc); jest.clearAllMocks(); });

  it("crearPensum - exito", async () => {
    (svc.crearPensum as jest.Mock).mockResolvedValue(pensumBase);
    const cb = mockCallback();
    await controller.crearPensum(mockCall({ nombre: "Pensum", descripcion: "" }), cb);
    expectSuccess(cb);
  });

  it("editarPensum - exito", async () => {
    (svc.editarPensum as jest.Mock).mockResolvedValue(pensumBase);
    const cb = mockCallback();
    await controller.editarPensum(mockCall({ id_pensum: 1, nombre: "Pensum", descripcion: "" }), cb);
    expectSuccess(cb);
  });

  it("eliminarPensum - exito", async () => {
    (svc.eliminarPensum as jest.Mock).mockResolvedValue(true);
    const cb = mockCallback();
    await controller.eliminarPensum(mockCall({ id_pensum: 1 }), cb);
    expectSuccess(cb);
  });

  it("consultarPensums - exito", async () => {
    (svc.consultarPensums as jest.Mock).mockResolvedValue([pensumBase]);
    const cb = mockCallback();
    await controller.consultarPensums(mockCall({}), cb);
    expectSuccess(cb);
    expect(cb.mock.calls[0][1].pensums).toHaveLength(1);
  });

  it("crearCarrera - exito", async () => {
    (svc.crearCarrera as jest.Mock).mockResolvedValue(carreraBase);
    const cb = mockCallback();
    await controller.crearCarrera(mockCall({ facultad: "Ing", nombre: "Sistemas", descripcion: "", id_pensum: 1 }), cb);
    expectSuccess(cb);
  });

  it("editarCarrera - exito", async () => {
    (svc.editarCarrera as jest.Mock).mockResolvedValue(carreraBase);
    const cb = mockCallback();
    await controller.editarCarrera(mockCall({ id_carrera: 1, facultad: "Ing", nombre: "Sistemas", descripcion: "", id_pensum: 1 }), cb);
    expectSuccess(cb);
  });

  it("eliminarCarrera - exito", async () => {
    (svc.eliminarCarrera as jest.Mock).mockResolvedValue(true);
    const cb = mockCallback();
    await controller.eliminarCarrera(mockCall({ id_carrera: 1 }), cb);
    expectSuccess(cb);
  });

  it("consultarCarreras - exito", async () => {
    (svc.consultarCarreras as jest.Mock).mockResolvedValue([carreraBase]);
    const cb = mockCallback();
    await controller.consultarCarreras(mockCall({}), cb);
    expectSuccess(cb);
  });

  it("crearPeriodo - exito", async () => {
    (svc.crearPeriodo as jest.Mock).mockResolvedValue(periodoBase);
    const cb = mockCallback();
    await controller.crearPeriodo(mockCall({ anio: 2025, num_semestre: 1 }), cb);
    expectSuccess(cb);
  });

  it("editarPeriodo - exito", async () => {
    (svc.editarPeriodo as jest.Mock).mockResolvedValue(periodoBase);
    const cb = mockCallback();
    await controller.editarPeriodo(mockCall({ id_periodo: 1, anio: 2025, num_semestre: 1 }), cb);
    expectSuccess(cb);
  });

  it("eliminarPeriodo - exito", async () => {
    (svc.eliminarPeriodo as jest.Mock).mockResolvedValue(true);
    const cb = mockCallback();
    await controller.eliminarPeriodo(mockCall({ id_periodo: 1 }), cb);
    expectSuccess(cb);
  });

  it("consultarPeriodos - exito", async () => {
    (svc.consultarPeriodos as jest.Mock).mockResolvedValue([periodoBase]);
    const cb = mockCallback();
    await controller.consultarPeriodos(mockCall({}), cb);
    expectSuccess(cb);
  });

  it("crearPerfilAcademico - exito", async () => {
    (svc.crearPerfilAcademico as jest.Mock).mockResolvedValue(perfilBase);
    const cb = mockCallback();
    await controller.crearPerfilAcademico(mockCall({ id_usuario: 1, registro_academico: "2020001", dpi: "123", fecha_nacimiento: "", telefono: "", id_carrera: 1, direccion: "" }), cb);
    expectSuccess(cb);
  });

  it("cambiarPerfilAcademico - exito", async () => {
    (svc.cambiarPerfilAcademico as jest.Mock).mockResolvedValue(perfilBase);
    const cb = mockCallback();
    await controller.cambiarPerfilAcademico(mockCall({ id_perfil: 1, dpi: "123" }), cb);
    expectSuccess(cb);
  });

  it("consultarPerfilAcademico - exito", async () => {
    (svc.consultarPerfilAcademico as jest.Mock).mockResolvedValue(perfilBase);
    const cb = mockCallback();
    await controller.consultarPerfilAcademico(mockCall({ id_usuario: 1 }), cb);
    expectSuccess(cb);
  });

  it("consultarPerfilAcademico - no encontrado", async () => {
    (svc.consultarPerfilAcademico as jest.Mock).mockResolvedValue(null);
    const cb = mockCallback();
    await controller.consultarPerfilAcademico(mockCall({ id_usuario: 999 }), cb);
    expect(cb).toHaveBeenCalledTimes(1);
    expect(cb.mock.calls[0][0]).toBeNull();
    expect(cb.mock.calls[0][1].exito).toBe(false);
  });

  it("consultarPerfilesEstudiante - exito", async () => {
    (svc.consultarPerfilesEstudiante as jest.Mock).mockResolvedValue([]);
    const cb = mockCallback();
    await controller.consultarPerfilesEstudiante(mockCall({}), cb);
    expectSuccess(cb);
  });

  it("crearPensum - error", async () => {
    (svc.crearPensum as jest.Mock).mockRejectedValue(new Error("El area ya existe"));
    const cb = mockCallback();
    await controller.crearPensum(mockCall({ nombre: "", descripcion: "" }), cb);
    expectError(cb, status.ALREADY_EXISTS);
  });
});
