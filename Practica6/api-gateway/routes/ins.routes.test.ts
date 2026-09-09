import { InscripcionClient } from "../grpc/ins.client";
import { AuthMiddleware } from "../middleware/auth.middleware";
import { RoleMiddleware } from "../middleware/role.middleware";
import { InsRoutes } from "./ins.routes";
import { mockRes, mockReq, gs } from "../__mocks__/test.helpers";

const mc: jest.Mocked<InscripcionClient> = {
  crearArea: jest.fn(), editarArea: jest.fn(), eliminarArea: jest.fn(), consultarAreas: jest.fn(),
  crearCurso: jest.fn(), editarCurso: jest.fn(), eliminarCurso: jest.fn(), consultarCursos: jest.fn(),
  crearPensum: jest.fn(), editarPensum: jest.fn(), eliminarPensum: jest.fn(), consultarPensums: jest.fn(),
  crearCarrera: jest.fn(), editarCarrera: jest.fn(), eliminarCarrera: jest.fn(), consultarCarreras: jest.fn(),
  crearPeriodo: jest.fn(), editarPeriodo: jest.fn(), eliminarPeriodo: jest.fn(), consultarPeriodos: jest.fn(),
  crearPerfilAcademico: jest.fn(), cambiarPerfilAcademico: jest.fn(),
  consultarPerfilAcademico: jest.fn(), consultarPerfilesEstudiante: jest.fn(),
  asignarRolUsuario: jest.fn(), cambiarRolUsuario: jest.fn(), eliminarRolUsuario: jest.fn(),
  comprobarRolUsuario: jest.fn(), consultarRolesUsuario: jest.fn(),
  inscribirEstudiante: jest.fn(), actualizarEstadoMatricula: jest.fn(),
  consultarCursosEstudiante: jest.fn(), consultarTodasInscripciones: jest.fn(),
  consultarEstadosMatricula: jest.fn(), consultarAuditLogs: jest.fn(),
};
const amw: AuthMiddleware = { validarSesion: jest.fn() };
const rmw: RoleMiddleware = { requerirRol: jest.fn(() => (req: any, res: any, next: Function) => next()) };
const R = (o: Record<string, unknown> = {}) => mockReq(o);
const OK = { exito: true, mensaje: "ok" };
const U = { id_usuario: 1, nombre: "A", apellido: "B", correo_institucional: "a@b.com", estado: "", fecha_registro: "" };

function testHandler(name: string, method: string, fn: (r: InsRoutes) => (req: any, res: any) => Promise<void>, reqOpts: Record<string, unknown>, status = 200) {
  test(`${name} exito`, async () => {
    const r = new InsRoutes(mc, amw, rmw);
    (mc[method as keyof InscripcionClient] as any).mockResolvedValue(OK);
    const res = mockRes(); await fn(r)(R(reqOpts) as any, res);
    expect(res.status).toHaveBeenCalledWith(status);
  });
  test(`${name} error`, async () => {
    const r = new InsRoutes(mc, amw, rmw);
    (mc[method as keyof InscripcionClient] as any).mockRejectedValue(gs);
    const res = mockRes(); await fn(r)(R(reqOpts) as any, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
}

describe("InsRoutes", () => {
  beforeEach(() => jest.clearAllMocks());

  testHandler("crearArea", "crearArea", r => r.crearArea.bind(r), { body: { codigo: "A", nombre: "Area" } }, 201);
  testHandler("editarArea", "editarArea", r => r.editarArea.bind(r), { body: { id_area: 1, codigo: "A", nombre: "Area" } });
  testHandler("eliminarArea", "eliminarArea", r => r.eliminarArea.bind(r), { params: { id: "1" } });
  testHandler("consultarAreas", "consultarAreas", r => r.consultarAreas.bind(r), {});
  testHandler("crearCurso", "crearCurso", r => r.crearCurso.bind(r), { body: { codigo: "C", nombre: "Curso", id_area: 1 } }, 201);
  testHandler("editarCurso", "editarCurso", r => r.editarCurso.bind(r), { body: { id_curso: 1, codigo: "C", nombre: "Curso", id_area: 1 } });
  testHandler("eliminarCurso", "eliminarCurso", r => r.eliminarCurso.bind(r), { params: { id: "1" } });
  testHandler("consultarCursos", "consultarCursos", r => r.consultarCursos.bind(r), { query: { id_area: "1" } });
  testHandler("crearPensum", "crearPensum", r => r.crearPensum.bind(r), { body: { nombre: "P" } }, 201);
  testHandler("editarPensum", "editarPensum", r => r.editarPensum.bind(r), { body: { id_pensum: 1, nombre: "P" } });
  testHandler("eliminarPensum", "eliminarPensum", r => r.eliminarPensum.bind(r), { params: { id: "1" } });
  testHandler("consultarPensums", "consultarPensums", r => r.consultarPensums.bind(r), {});
  testHandler("crearCarrera", "crearCarrera", r => r.crearCarrera.bind(r), { body: { facultad: "F", nombre: "C", id_pensum: 1 } }, 201);
  testHandler("editarCarrera", "editarCarrera", r => r.editarCarrera.bind(r), { body: { id_carrera: 1, facultad: "F", nombre: "C", id_pensum: 1 } });
  testHandler("eliminarCarrera", "eliminarCarrera", r => r.eliminarCarrera.bind(r), { params: { id: "1" } });
  testHandler("consultarCarreras", "consultarCarreras", r => r.consultarCarreras.bind(r), {});
  testHandler("crearPeriodo", "crearPeriodo", r => r.crearPeriodo.bind(r), { body: { anio: 2025, num_semestre: 1 } }, 201);
  testHandler("editarPeriodo", "editarPeriodo", r => r.editarPeriodo.bind(r), { body: { id_periodo: 1, anio: 2025, num_semestre: 1 } });
  testHandler("eliminarPeriodo", "eliminarPeriodo", r => r.eliminarPeriodo.bind(r), { params: { id: "1" } });
  testHandler("consultarPeriodos", "consultarPeriodos", r => r.consultarPeriodos.bind(r), {});
  testHandler("crearPerfil", "crearPerfilAcademico", r => r.crearPerfil.bind(r), { body: { id_usuario: 1, registro_academico: "", dpi: "", id_carrera: 1 } }, 201);
  testHandler("consultarPerfil", "consultarPerfilAcademico", r => r.consultarPerfil.bind(r), { query: { id_usuario: "1" } });
  testHandler("consultarPerfilesEstudiante", "consultarPerfilesEstudiante", r => r.consultarPerfilesEstudiante.bind(r), {});
  testHandler("cambiarPerfil", "cambiarPerfilAcademico", r => r.cambiarPerfil.bind(r), { body: { id_perfil: 1 } });
  testHandler("asignarRol", "asignarRolUsuario", r => r.asignarRol.bind(r), { body: { id_usuario: 1, id_rol: 1 } });
  testHandler("comprobarRol", "comprobarRolUsuario", r => r.comprobarRol.bind(r), { query: { id_usuario: "1", nombre_rol: "Admin" } });
  testHandler("cambiarRol", "cambiarRolUsuario", r => r.cambiarRol.bind(r), { body: { id_usuario: 1, id_rol_actual: 1, id_rol_nuevo: 2 } });
  testHandler("eliminarRol", "eliminarRolUsuario", r => r.eliminarRol.bind(r), { body: { id_usuario: 1, id_rol: 1 } });
  testHandler("inscribirEstudiante", "inscribirEstudiante", r => r.inscribirEstudiante.bind(r), { body: { id_usuario: 1, id_curso: 1, id_periodo: 1, id_estado_matricula: 1 }, usuario: U }, 201);
  testHandler("actualizarEstadoMatricula", "actualizarEstadoMatricula", r => r.actualizarEstadoMatricula.bind(r), { body: { id_inscripcion: 1, nuevo_estado: "A" }, usuario: U });
  testHandler("cursosEstudiante", "consultarCursosEstudiante", r => r.cursosEstudiante.bind(r), { query: { id_usuario: "1", pagina: "1" } });
  testHandler("consultarTodasInscripciones", "consultarTodasInscripciones", r => r.consultarTodasInscripciones.bind(r), { query: { pagina: "1" } });
  testHandler("estadosMatricula", "consultarEstadosMatricula", r => r.estadosMatricula.bind(r), {});
  testHandler("consultarAudit", "consultarAuditLogs", r => r.consultarAudit.bind(r), { query: { pagina: "1" } });

  test("rolesDeUsuario propio", async () => {
    const r = new InsRoutes(mc, amw, rmw);
    mc.consultarRolesUsuario.mockResolvedValue({ exito: true, mensaje: "ok", roles: [] });
    const res = mockRes(); await r.rolesDeUsuario(R({ query: {}, usuario: U }) as any, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });
  test("rolesDeUsuario otro usuario no admin", async () => {
    const r = new InsRoutes(mc, amw, rmw);
    mc.consultarRolesUsuario.mockResolvedValue({ exito: true, mensaje: "ok", roles: [{ id_usuario: 1, id_rol: 1, rol: "Estudiante", descripcion: "" }] });
    const res = mockRes(); await r.rolesDeUsuario(R({ query: { id_usuario: "2" }, usuario: U }) as any, res);
    expect(res.status).toHaveBeenCalledWith(403);
  });
  test("rolesDeUsuario otro usuario admin", async () => {
    const r = new InsRoutes(mc, amw, rmw);
    mc.consultarRolesUsuario.mockResolvedValue({ exito: true, mensaje: "ok", roles: [{ id_usuario: 1, id_rol: 1, rol: "Administrador", descripcion: "" }] });
    const res = mockRes(); await r.rolesDeUsuario(R({ query: { id_usuario: "2" }, usuario: U }) as any, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });
  test("rolesDeUsuario error", async () => {
    const r = new InsRoutes(mc, amw, rmw);
    mc.consultarRolesUsuario.mockRejectedValue(gs);
    const res = mockRes(); await r.rolesDeUsuario(R({ query: {}, usuario: U }) as any, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
