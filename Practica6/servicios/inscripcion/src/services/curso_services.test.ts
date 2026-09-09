import { CursoServiceImp } from "./curso_services";
import { CursoRepository } from "../repositories/curso_repository";
import { AreaRow, CursoRow } from "../types/curso.types";

function mockCursoRepository(overrides: Partial<CursoRepository> = {}): CursoRepository {
  return {
    crearArea: jest.fn(),
    editarArea: jest.fn(),
    eliminarArea: jest.fn(),
    buscarAreaPorCodigo: jest.fn(),
    buscarAreaPorId: jest.fn(),
    listarAreas: jest.fn(),
    crearCurso: jest.fn(),
    editarCurso: jest.fn(),
    eliminarCurso: jest.fn(),
    buscarCursoPorCodigo: jest.fn(),
    buscarCursoPorId: jest.fn(),
    listarCursos: jest.fn(),
    ...overrides,
  };
}

const areaBase: AreaRow = { id_area: 1, codigo: "MAT", nombre: "Matematicas", descripcion: null };
const cursoBase: CursoRow = { id_curso: 1, codigo: "MA101", nombre: "Algebra", descripcion: null, id_area: 1, fecha_inscripcion: null };

describe("CursoServiceImp", () => {
  let service: CursoServiceImp;
  let repo: CursoRepository;

  beforeEach(() => {
    repo = mockCursoRepository();
    service = new CursoServiceImp(repo);
    jest.clearAllMocks();
  });

  describe("crearArea", () => {
    it("deberia crear area exitosamente", async () => {
      (repo.buscarAreaPorCodigo as jest.Mock).mockResolvedValue(null);
      (repo.crearArea as jest.Mock).mockResolvedValue(areaBase);

      const result = await service.crearArea({ codigo: "MAT", nombre: "Matematicas", descripcion: null });
      expect(result.id_area).toBe(1);
    });

    it("deberia fallar si codigo o nombre vacio", async () => {
      await expect(service.crearArea({ codigo: "", nombre: "X", descripcion: null })).rejects.toThrow("obligatorios");
    });

    it("deberia fallar si el codigo ya existe", async () => {
      (repo.buscarAreaPorCodigo as jest.Mock).mockResolvedValue(areaBase);
      await expect(service.crearArea({ codigo: "MAT", nombre: "X", descripcion: null })).rejects.toThrow("ya existe");
    });
  });

  describe("editarArea", () => {
    it("deberia editar area exitosamente", async () => {
      (repo.buscarAreaPorId as jest.Mock).mockResolvedValue(areaBase);
      (repo.buscarAreaPorCodigo as jest.Mock).mockResolvedValue(areaBase);
      (repo.editarArea as jest.Mock).mockResolvedValue(areaBase);

      const result = await service.editarArea({ id_area: 1, codigo: "MAT", nombre: "Mat", descripcion: null });
      expect(result.id_area).toBe(1);
    });

    it("deberia fallar si id_area es 0", async () => {
      await expect(service.editarArea({ id_area: 0, codigo: "X", nombre: "Y", descripcion: null })).rejects.toThrow("obligatorio");
    });

    it("deberia fallar si el area no existe", async () => {
      (repo.buscarAreaPorId as jest.Mock).mockResolvedValue(null);
      await expect(service.editarArea({ id_area: 99, codigo: "X", nombre: "Y", descripcion: null })).rejects.toThrow("no existe");
    });

    it("deberia fallar si otro area ya tiene el codigo", async () => {
      (repo.buscarAreaPorId as jest.Mock).mockResolvedValue(areaBase);
      (repo.buscarAreaPorCodigo as jest.Mock).mockResolvedValue({ ...areaBase, id_area: 2 });
      await expect(service.editarArea({ id_area: 1, codigo: "OTRO", nombre: "Y", descripcion: null })).rejects.toThrow("área");
    });
  });

  describe("eliminarArea", () => {
    it("deberia eliminar area", async () => {
      (repo.buscarAreaPorId as jest.Mock).mockResolvedValue(areaBase);
      (repo.eliminarArea as jest.Mock).mockResolvedValue(true);
      await expect(service.eliminarArea(1)).resolves.toBe(true);
    });

    it("deberia fallar si id es 0", async () => {
      await expect(service.eliminarArea(0)).rejects.toThrow("obligatorio");
    });

    it("deberia fallar si no existe", async () => {
      (repo.buscarAreaPorId as jest.Mock).mockResolvedValue(null);
      await expect(service.eliminarArea(99)).rejects.toThrow("no existe");
    });
  });

  describe("crearCurso", () => {
    it("deberia crear curso exitosamente", async () => {
      (repo.buscarAreaPorId as jest.Mock).mockResolvedValue(areaBase);
      (repo.buscarCursoPorCodigo as jest.Mock).mockResolvedValue(null);
      (repo.crearCurso as jest.Mock).mockResolvedValue(cursoBase);

      const result = await service.crearCurso({ codigo: "MA101", nombre: "Algebra", descripcion: null, id_area: 1 });
      expect(result.id_curso).toBe(1);
    });

    it("deberia fallar si id_area es 0", async () => {
      await expect(service.crearCurso({ codigo: "X", nombre: "Y", descripcion: null, id_area: 0 })).rejects.toThrow("área");
    });

    it("deberia fallar si el area no existe", async () => {
      (repo.buscarAreaPorId as jest.Mock).mockResolvedValue(null);
      await expect(service.crearCurso({ codigo: "X", nombre: "Y", descripcion: null, id_area: 99 })).rejects.toThrow("no existe");
    });

    it("deberia fallar si el codigo del curso ya existe", async () => {
      (repo.buscarAreaPorId as jest.Mock).mockResolvedValue(areaBase);
      (repo.buscarCursoPorCodigo as jest.Mock).mockResolvedValue(cursoBase);
      await expect(service.crearCurso({ codigo: "MA101", nombre: "Y", descripcion: null, id_area: 1 })).rejects.toThrow("ya existe");
    });
  });

  describe("editarCurso", () => {
    it("deberia editar curso exitosamente", async () => {
      (repo.buscarCursoPorId as jest.Mock).mockResolvedValue(cursoBase);
      (repo.buscarAreaPorId as jest.Mock).mockResolvedValue(areaBase);
      (repo.buscarCursoPorCodigo as jest.Mock).mockResolvedValue(cursoBase);
      (repo.editarCurso as jest.Mock).mockResolvedValue(cursoBase);

      const result = await service.editarCurso({ id_curso: 1, codigo: "MA101", nombre: "Algebra", descripcion: null, id_area: 1 });
      expect(result.id_curso).toBe(1);
    });

    it("deberia fallar si id_curso es 0", async () => {
      await expect(service.editarCurso({ id_curso: 0, codigo: "X", nombre: "Y", descripcion: null, id_area: 1 })).rejects.toThrow("obligatorio");
    });

    it("deberia fallar si el curso no existe", async () => {
      (repo.buscarCursoPorId as jest.Mock).mockResolvedValue(null);
      await expect(service.editarCurso({ id_curso: 99, codigo: "X", nombre: "Y", descripcion: null, id_area: 1 })).rejects.toThrow("no existe");
    });

    it("deberia fallar si otro curso tiene el codigo", async () => {
      (repo.buscarCursoPorId as jest.Mock).mockResolvedValue(cursoBase);
      (repo.buscarAreaPorId as jest.Mock).mockResolvedValue(areaBase);
      (repo.buscarCursoPorCodigo as jest.Mock).mockResolvedValue({ ...cursoBase, id_curso: 2 });
      await expect(service.editarCurso({ id_curso: 1, codigo: "OTRO", nombre: "Y", descripcion: null, id_area: 1 })).rejects.toThrow("Ya existe otro curso");
    });
  });

  describe("eliminarCurso", () => {
    it("deberia eliminar curso", async () => {
      (repo.buscarCursoPorId as jest.Mock).mockResolvedValue(cursoBase);
      (repo.eliminarCurso as jest.Mock).mockResolvedValue(true);
      await expect(service.eliminarCurso(1)).resolves.toBe(true);
    });

    it("deberia fallar si id es 0", async () => {
      await expect(service.eliminarCurso(0)).rejects.toThrow("obligatorio");
    });
  });

  describe("consultarCursos", () => {
    it("deberia listar todos si no hay id_area", async () => {
      (repo.listarCursos as jest.Mock).mockResolvedValue([cursoBase]);
      const result = await service.consultarCursos({});
      expect(result).toHaveLength(1);
    });

    it("deberia filtrar por area", async () => {
      (repo.buscarAreaPorId as jest.Mock).mockResolvedValue(areaBase);
      (repo.listarCursos as jest.Mock).mockResolvedValue([cursoBase]);
      const result = await service.consultarCursos({ id_area: 1 });
      expect(result).toHaveLength(1);
    });

    it("deberia fallar si el area no existe", async () => {
      (repo.buscarAreaPorId as jest.Mock).mockResolvedValue(null);
      await expect(service.consultarCursos({ id_area: 99 })).rejects.toThrow("no existe");
    });
  });
});
