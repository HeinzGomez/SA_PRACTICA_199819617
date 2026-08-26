import { sendUnaryData, ServerUnaryCall } from "@grpc/grpc-js";
import { InscribirService } from "../services/inscribir_service";
import {
  CursoEstudianteRow,
  EstadoMatriculaRow,
  InscripcionRow,
} from "../types/inscripcion.types";
import {
  ActualizarEstadoMatriculaRequest,
  ActualizarEstadoMatriculaResponse,
  ConsultarCursosEstudianteRequest,
  ConsultarCursosEstudianteResponse,
  ConsultarEstadosMatriculaRequest,
  ConsultarEstadosMatriculaResponse,
  ConsultarTodasInscripcionesRequest,
  ConsultarTodasInscripcionesResponse,
  CursoEstudianteResponse,
  EstadoMatriculaResponse,
  InscribirEstudianteRequest,
  InscribirEstudianteResponse,
  InscripcionResponse,
} from "../types/inscribir.controller.types";
import { buildError } from "./error_mapper";

export class InscribirController {
  constructor(private inscribirService: InscribirService) {}

  async inscribirEstudiante(
    call: ServerUnaryCall<InscribirEstudianteRequest, InscribirEstudianteResponse>,
    callback: sendUnaryData<InscribirEstudianteResponse>
  ): Promise<void> {
    try {
      const { id_usuario, id_curso, id_periodo, id_estado_matricula, tipo_inscripcion, usuario_responsable } =
        call.request;

      const inscripcion = await this.inscribirService.inscribirEstudiante({
        id_usuario,
        id_curso,
        id_periodo,
        id_estado_matricula,
        tipo_inscripcion,
        usuario_responsable,
      });

      callback(null, {
        exito: true,
        mensaje: "Estudiante inscrito exitosamente",
        inscripcion: this.mapInscripcion(inscripcion),
      });
    } catch (error) {
      callback(buildError(error));
    }
  }

  async actualizarEstadoMatricula(
    call: ServerUnaryCall<ActualizarEstadoMatriculaRequest, ActualizarEstadoMatriculaResponse>,
    callback: sendUnaryData<ActualizarEstadoMatriculaResponse>
  ): Promise<void> {
    try {
      const { id_inscripcion, nuevo_estado, usuario_responsable } = call.request;

      const inscripcion = await this.inscribirService.actualizarEstadoMatricula({
        id_inscripcion,
        nuevo_estado,
        usuario_responsable,
      });

      callback(null, {
        exito: true,
        mensaje: "Estado de matrícula actualizado exitosamente",
        inscripcion: this.mapInscripcion(inscripcion),
      });
    } catch (error) {
      callback(buildError(error));
    }
  }

  async consultarCursosEstudiante(
    call: ServerUnaryCall<ConsultarCursosEstudianteRequest, ConsultarCursosEstudianteResponse>,
    callback: sendUnaryData<ConsultarCursosEstudianteResponse>
  ): Promise<void> {
    try {
      const { id_usuario, anio, semestre, estado, pagina } = call.request;

      const resultado = await this.inscribirService.consultarCursosEstudiante({
        id_usuario,
        anio,
        semestre,
        estado,
        pagina,
      });

      callback(null, {
        exito: true,
        mensaje: "Cursos consultados exitosamente",
        registros: resultado.registros.map((registro) =>
          this.mapCursoEstudiante(registro)
        ),
        total_paginas: resultado.total_paginas,
      });
    } catch (error) {
      callback(buildError(error));
    }
  }

  async consultarEstadosMatricula(
    call: ServerUnaryCall<
      ConsultarEstadosMatriculaRequest,
      ConsultarEstadosMatriculaResponse
    >,
    callback: sendUnaryData<ConsultarEstadosMatriculaResponse>
  ): Promise<void> {
    try {
      const estados = await this.inscribirService.consultarEstadosMatricula();

      callback(null, {
        exito: true,
        mensaje: "Estados de matrícula consultados exitosamente",
        estados: estados.map((estado) => this.mapEstadoMatricula(estado)),
      });
    } catch (error) {
      callback(buildError(error));
    }
  }

  async consultarTodasInscripciones(
    call: ServerUnaryCall<
      ConsultarTodasInscripcionesRequest,
      ConsultarTodasInscripcionesResponse
    >,
    callback: sendUnaryData<ConsultarTodasInscripcionesResponse>
  ): Promise<void> {
    try {
      const { id_curso, anio, semestre, pagina } = call.request;

      const resultado = await this.inscribirService.consultarTodasInscripciones({
        id_curso,
        anio,
        semestre,
        pagina,
      });

      callback(null, {
        exito: true,
        mensaje: "Inscripciones consultadas exitosamente",
        registros: resultado.registros.map((registro) =>
          this.mapCursoEstudiante(registro)
        ),
        total_paginas: resultado.total_paginas,
      });
    } catch (error) {
      callback(buildError(error));
    }
  }

  private mapInscripcion(inscripcion: InscripcionRow): InscripcionResponse {
    return {
      id_inscripcion: inscripcion.id_inscripcion,
      id_usuario: inscripcion.id_usuario,
      id_curso: inscripcion.id_curso,
      id_periodo: inscripcion.id_periodo,
      id_estado_matricula: inscripcion.id_estado_matricula,
      fecha_inscripcion: inscripcion.fecha_inscripcion.toISOString(),
      tipo_inscripcion: inscripcion.tipo_inscripcion,
    };
  }

  private mapCursoEstudiante(registro: CursoEstudianteRow): CursoEstudianteResponse {
    return {
      id_inscripcion: registro.id_inscripcion,
      id_usuario: registro.id_usuario,
      id_curso: registro.id_curso,
      codigo_curso: registro.codigo_curso,
      curso: registro.curso,
      codigo_area: registro.codigo_area,
      area: registro.area,
      anio: registro.anio,
      semestre: registro.semestre,
      codigo_estado: registro.codigo_estado,
      estado_matricula: registro.estado_matricula,
      tipo_inscripcion: registro.tipo_inscripcion,
      fecha_inscripcion: registro.fecha_inscripcion.toISOString(),
    };
  }

  private mapEstadoMatricula(estado: EstadoMatriculaRow): EstadoMatriculaResponse {
    return {
      id_estado: estado.id_estado,
      codigo: estado.codigo,
      nombre: estado.nombre,
      descripcion: estado.descripcion,
    };
  }
}
