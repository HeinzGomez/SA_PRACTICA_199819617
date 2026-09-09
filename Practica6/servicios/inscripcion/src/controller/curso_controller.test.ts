import { status } from "@grpc/grpc-js";
import { CursoService } from "../services/curso_services";
import { CursoController } from "./curso_controller";
import { AreaRow, CursoRow } from "../types/curso.types";

function mockCursoService(overrides: Partial<CursoService> = {}): CursoService {
  return { crearArea: jest.fn(), editarArea: jest.fn(), eliminarArea: jest.fn(), consultarAreas: jest.fn(), crearCurso: jest.fn(), editarCurso: jest.fn(), eliminarCurso: jest.fn(), consultarCursos: jest.fn(), ...overrides };
}
function mockCall(req: any) { return { request: req } as any; }
function mockCallback() { return jest.fn(); }

function expectSuccess(cb: jest.Mock) { expect(cb).toHaveBeenCalledTimes(1); expect(cb.mock.calls[0][0]).toBeNull(); }
function expectError(cb: jest.Mock, code: number) { expect(cb).toHaveBeenCalledTimes(1); expect(cb.mock.calls[0][0]).not.toBeNull(); expect(cb.mock.calls[0][0].code).toBe(code); }

const areaBase: AreaRow = { id_area: 1, codigo: "MAT", nombre: "Matematicas", descripcion: null };
const cursoBase: CursoRow = { id_curso: 1, codigo: "MA101", nombre: "Algebra", descripcion: null, id_area: 1, fecha_inscripcion: null };

describe("CursoController", () => {
  let controller: CursoController;
  let svc: CursoService;

  beforeEach(() => { svc = mockCursoService(); controller = new CursoController(svc); jest.clearAllMocks(); });

  it("crearArea - exito", async () => {
    (svc.crearArea as jest.Mock).mockResolvedValue(areaBase);
    const cb = mockCallback();
    await controller.crearArea(mockCall({ codigo: "MAT", nombre: "Matematicas", descripcion: "" }), cb);
    expectSuccess(cb);
  });

  it("editarArea - exito", async () => {
    (svc.editarArea as jest.Mock).mockResolvedValue(areaBase);
    const cb = mockCallback();
    await controller.editarArea(mockCall({ id_area: 1, codigo: "MAT", nombre: "Mat", descripcion: "" }), cb);
    expectSuccess(cb);
  });

  it("eliminarArea - exito", async () => {
    (svc.eliminarArea as jest.Mock).mockResolvedValue(true);
    const cb = mockCallback();
    await controller.eliminarArea(mockCall({ id_area: 1 }), cb);
    expectSuccess(cb);
  });

  it("consultarAreas - exito", async () => {
    (svc.consultarAreas as jest.Mock).mockResolvedValue([areaBase]);
    const cb = mockCallback();
    await controller.consultarAreas(mockCall({}), cb);
    expectSuccess(cb);
    expect(cb.mock.calls[0][1].areas).toHaveLength(1);
  });

  it("crearCurso - exito", async () => {
    (svc.crearCurso as jest.Mock).mockResolvedValue(cursoBase);
    const cb = mockCallback();
    await controller.crearCurso(mockCall({ codigo: "MA101", nombre: "Algebra", descripcion: "", id_area: 1 }), cb);
    expectSuccess(cb);
  });

  it("editarCurso - exito", async () => {
    (svc.editarCurso as jest.Mock).mockResolvedValue(cursoBase);
    const cb = mockCallback();
    await controller.editarCurso(mockCall({ id_curso: 1, codigo: "MA101", nombre: "Algebra", descripcion: "", id_area: 1 }), cb);
    expectSuccess(cb);
  });

  it("eliminarCurso - exito", async () => {
    (svc.eliminarCurso as jest.Mock).mockResolvedValue(true);
    const cb = mockCallback();
    await controller.eliminarCurso(mockCall({ id_curso: 1 }), cb);
    expectSuccess(cb);
  });

  it("consultarCursos - exito", async () => {
    (svc.consultarCursos as jest.Mock).mockResolvedValue([cursoBase]);
    const cb = mockCallback();
    await controller.consultarCursos(mockCall({ id_area: 1 }), cb);
    expectSuccess(cb);
    expect(cb.mock.calls[0][1].cursos).toHaveLength(1);
  });

  it("crearArea - error", async () => {
    (svc.crearArea as jest.Mock).mockRejectedValue(new Error("El area ya existe"));
    const cb = mockCallback();
    await controller.crearArea(mockCall({ codigo: "MAT", nombre: "X", descripcion: "" }), cb);
    expectError(cb, status.ALREADY_EXISTS);
  });
});
