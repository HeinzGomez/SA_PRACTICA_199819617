import { sendUnaryData, ServerUnaryCall } from "@grpc/grpc-js";
import { CursoService } from "../services/curso_services";
import { AreaRow, CursoRow } from "../types/curso.types";
import {
  AreaResponse,
  ConsultarAreasRequest,
  ConsultarAreasResponse,
  ConsultarCursosRequest,
  ConsultarCursosResponse,
  CrearAreaRequest,
  CrearAreaResponse,
  EditarAreaRequest,
  EditarAreaResponse,
  EliminarAreaRequest,
  EliminarAreaResponse,
  CrearCursoRequest,
  CrearCursoResponse,
  EditarCursoRequest,
  EditarCursoResponse,
  EliminarCursoRequest,
  EliminarCursoResponse,
  CursoResponse,
} from "../types/curso.controller.types";
import { buildError } from "./error_mapper";

export class CursoController {
  constructor(private cursoService: CursoService) {}

  async crearArea(
    call: ServerUnaryCall<CrearAreaRequest, CrearAreaResponse>,
    callback: sendUnaryData<CrearAreaResponse>
  ): Promise<void> {
    try {
      const { codigo, nombre, descripcion } = call.request;

      const area = await this.cursoService.crearArea({ codigo, nombre, descripcion });

      callback(null, {
        exito: true,
        mensaje: "Área creada exitosamente",
        area: this.mapArea(area),
      });
    } catch (error) {
      callback(buildError(error));
    }
  }

  async editarArea(
    call: ServerUnaryCall<EditarAreaRequest, EditarAreaResponse>,
    callback: sendUnaryData<EditarAreaResponse>
  ): Promise<void> {
    try {
      const { id_area, codigo, nombre, descripcion } = call.request;

      const area = await this.cursoService.editarArea({ id_area, codigo, nombre, descripcion });

      callback(null, {
        exito: true,
        mensaje: "Área editada exitosamente",
        area: this.mapArea(area),
      });
    } catch (error) {
      callback(buildError(error));
    }
  }

  async eliminarArea(
    call: ServerUnaryCall<EliminarAreaRequest, EliminarAreaResponse>,
    callback: sendUnaryData<EliminarAreaResponse>
  ): Promise<void> {
    try {
      const { id_area } = call.request;

      await this.cursoService.eliminarArea(id_area);

      callback(null, {
        exito: true,
        mensaje: "Área eliminada exitosamente",
      });
    } catch (error) {
      callback(buildError(error));
    }
  }

  async consultarAreas(
    call: ServerUnaryCall<ConsultarAreasRequest, ConsultarAreasResponse>,
    callback: sendUnaryData<ConsultarAreasResponse>
  ): Promise<void> {
    try {
      const areas = await this.cursoService.consultarAreas();

      callback(null, {
        exito: true,
        mensaje: "Áreas consultadas exitosamente",
        areas: areas.map((area) => this.mapArea(area)),
      });
    } catch (error) {
      callback(buildError(error));
    }
  }

  async crearCurso(
    call: ServerUnaryCall<CrearCursoRequest, CrearCursoResponse>,
    callback: sendUnaryData<CrearCursoResponse>
  ): Promise<void> {
    try {
      const { codigo, nombre, descripcion, id_area } = call.request;

      const curso = await this.cursoService.crearCurso({
        codigo,
        nombre,
        descripcion,
        id_area,
      });

      callback(null, {
        exito: true,
        mensaje: "Curso creado exitosamente",
        curso: this.mapCurso(curso),
      });
    } catch (error) {
      callback(buildError(error));
    }
  }

  async editarCurso(
    call: ServerUnaryCall<EditarCursoRequest, EditarCursoResponse>,
    callback: sendUnaryData<EditarCursoResponse>
  ): Promise<void> {
    try {
      const { id_curso, codigo, nombre, descripcion, id_area } = call.request;

      const curso = await this.cursoService.editarCurso({
        id_curso,
        codigo,
        nombre,
        descripcion,
        id_area,
      });

      callback(null, {
        exito: true,
        mensaje: "Curso editado exitosamente",
        curso: this.mapCurso(curso),
      });
    } catch (error) {
      callback(buildError(error));
    }
  }

  async eliminarCurso(
    call: ServerUnaryCall<EliminarCursoRequest, EliminarCursoResponse>,
    callback: sendUnaryData<EliminarCursoResponse>
  ): Promise<void> {
    try {
      const { id_curso } = call.request;

      await this.cursoService.eliminarCurso(id_curso);

      callback(null, {
        exito: true,
        mensaje: "Curso eliminado exitosamente",
      });
    } catch (error) {
      callback(buildError(error));
    }
  }

  async consultarCursos(
    call: ServerUnaryCall<ConsultarCursosRequest, ConsultarCursosResponse>,
    callback: sendUnaryData<ConsultarCursosResponse>
  ): Promise<void> {
    try {
      const { id_area } = call.request;

      const cursos = await this.cursoService.consultarCursos({
        id_area: id_area || undefined,
      });

      callback(null, {
        exito: true,
        mensaje: "Cursos consultados exitosamente",
        cursos: cursos.map((curso) => this.mapCurso(curso)),
      });
    } catch (error) {
      callback(buildError(error));
    }
  }

  private mapArea(area: AreaRow): AreaResponse {
    return {
      id_area: area.id_area,
      codigo: area.codigo,
      nombre: area.nombre,
      descripcion: area.descripcion,
    };
  }

  private mapCurso(curso: CursoRow): CursoResponse {
    return {
      id_curso: curso.id_curso,
      codigo: curso.codigo,
      nombre: curso.nombre,
      descripcion: curso.descripcion,
      id_area: curso.id_area,
      fecha_inscripcion: curso.fecha_inscripcion?.toISOString() ?? null,
    };
  }
}
