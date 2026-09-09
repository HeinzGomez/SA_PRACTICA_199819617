import { CursoRepository } from "../repositories/curso_repository";
import { AreaRow, CursoRow } from "../types/curso.types";
import {
  ConsultarCursosInput,
  CrearAreaInput,
  EditarAreaInput,
  CrearCursoInput,
  EditarCursoInput,
} from "../types/curso.service.types";

export interface CursoService {
  crearArea(input: CrearAreaInput): Promise<AreaRow>;
  editarArea(input: EditarAreaInput): Promise<AreaRow>;
  eliminarArea(idArea: number): Promise<boolean>;
  consultarAreas(): Promise<AreaRow[]>;
  crearCurso(input: CrearCursoInput): Promise<CursoRow>;
  editarCurso(input: EditarCursoInput): Promise<CursoRow>;
  eliminarCurso(idCurso: number): Promise<boolean>;
  consultarCursos(input: ConsultarCursosInput): Promise<CursoRow[]>;
}

export class CursoServiceImp implements CursoService {
  constructor(private cursoRepository: CursoRepository) {}

  async crearArea(input: CrearAreaInput): Promise<AreaRow> {
    const codigo = this.normalizarCodigo(input.codigo);
    const nombre = this.normalizarTexto(input.nombre);

    if (!codigo || !nombre) {
      throw new Error("El código y el nombre del área son obligatorios");
    }

    const yaExiste = await this.cursoRepository.buscarAreaPorCodigo(codigo);
    if (yaExiste) {
      throw new Error(`El área con código '${codigo}' ya existe`);
    }

    return this.cursoRepository.crearArea({
      codigo,
      nombre,
      descripcion: input.descripcion?.trim() || null,
    });
  }

  async editarArea(input: EditarAreaInput): Promise<AreaRow> {
    const codigo = this.normalizarCodigo(input.codigo);
    const nombre = this.normalizarTexto(input.nombre);

    if (!input.id_area) {
      throw new Error("El ID del área es obligatorio");
    }

    if (!codigo || !nombre) {
      throw new Error("El código y el nombre del área son obligatorios");
    }

    const existeArea = await this.cursoRepository.buscarAreaPorId(input.id_area);
    if (!existeArea) {
      throw new Error(`El área con id '${input.id_area}' no existe`);
    }

    const areaConCodigo = await this.cursoRepository.buscarAreaPorCodigo(codigo);
    if (areaConCodigo && areaConCodigo.id_area !== input.id_area) {
      throw new Error(`Ya existe otra área con el código '${codigo}'`);
    }

    const actualizada = await this.cursoRepository.editarArea({
      id_area: input.id_area,
      codigo,
      nombre,
      descripcion: input.descripcion?.trim() || null,
    });

    if (!actualizada) {
      throw new Error("No se pudo actualizar el área");
    }

    return actualizada;
  }

  async eliminarArea(idArea: number): Promise<boolean> {
    if (!idArea) {
      throw new Error("El ID del área es obligatorio");
    }

    const existeArea = await this.cursoRepository.buscarAreaPorId(idArea);
    if (!existeArea) {
      throw new Error(`El área con id '${idArea}' no existe`);
    }

    return this.cursoRepository.eliminarArea(idArea);
  }

  async consultarAreas(): Promise<AreaRow[]> {
    return this.cursoRepository.listarAreas();
  }

  async crearCurso(input: CrearCursoInput): Promise<CursoRow> {
    const codigo = this.normalizarCodigo(input.codigo);
    const nombre = this.normalizarTexto(input.nombre);

    if (!codigo || !nombre) {
      throw new Error("El código y el nombre del curso son obligatorios");
    }

    if (!input.id_area) {
      throw new Error("El curso debe pertenecer a un área");
    }

    const area = await this.cursoRepository.buscarAreaPorId(input.id_area);
    if (!area) {
      throw new Error(`El área con id '${input.id_area}' no existe`);
    }

    const yaExiste = await this.cursoRepository.buscarCursoPorCodigo(codigo);
    if (yaExiste) {
      throw new Error(`El curso con código '${codigo}' ya existe`);
    }

    return this.cursoRepository.crearCurso({
      codigo,
      nombre,
      descripcion: input.descripcion?.trim() || null,
      id_area: input.id_area,
    });
  }

  async editarCurso(input: EditarCursoInput): Promise<CursoRow> {
    const codigo = this.normalizarCodigo(input.codigo);
    const nombre = this.normalizarTexto(input.nombre);

    if (!input.id_curso) {
      throw new Error("El ID del curso es obligatorio");
    }

    if (!codigo || !nombre) {
      throw new Error("El código y el nombre del curso son obligatorios");
    }

    if (!input.id_area) {
      throw new Error("El curso debe pertenecer a un área");
    }

    const existeCurso = await this.cursoRepository.buscarCursoPorId(input.id_curso);
    if (!existeCurso) {
      throw new Error(`El curso con id '${input.id_curso}' no existe`);
    }

    const area = await this.cursoRepository.buscarAreaPorId(input.id_area);
    if (!area) {
      throw new Error(`El área con id '${input.id_area}' no existe`);
    }

    const cursoConCodigo = await this.cursoRepository.buscarCursoPorCodigo(codigo);
    if (cursoConCodigo && cursoConCodigo.id_curso !== input.id_curso) {
      throw new Error(`Ya existe otro curso con el código '${codigo}'`);
    }

    const actualizado = await this.cursoRepository.editarCurso({
      id_curso: input.id_curso,
      codigo,
      nombre,
      descripcion: input.descripcion?.trim() || null,
      id_area: input.id_area,
    });

    if (!actualizado) {
      throw new Error("No se pudo actualizar el curso");
    }

    return actualizado;
  }

  async eliminarCurso(idCurso: number): Promise<boolean> {
    if (!idCurso) {
      throw new Error("El ID del curso es obligatorio");
    }

    const existeCurso = await this.cursoRepository.buscarCursoPorId(idCurso);
    if (!existeCurso) {
      throw new Error(`El curso con id '${idCurso}' no existe`);
    }

    return this.cursoRepository.eliminarCurso(idCurso);
  }

  async consultarCursos(input: ConsultarCursosInput): Promise<CursoRow[]> {
    if (!input.id_area) {
      return this.cursoRepository.listarCursos();
    }

    const area = await this.cursoRepository.buscarAreaPorId(input.id_area);
    if (!area) {
      throw new Error(`El área con id '${input.id_area}' no existe`);
    }

    return this.cursoRepository.listarCursos({ idArea: input.id_area });
  }

  private normalizarCodigo(codigo: string): string {
    return codigo?.trim().toUpperCase() || "";
  }

  private normalizarTexto(texto: string): string {
    return texto?.trim() || "";
  }
}
