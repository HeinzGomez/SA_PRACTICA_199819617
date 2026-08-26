import { sendUnaryData, ServerUnaryCall } from "@grpc/grpc-js";
import { AcademicoService } from "../services/academico_service";
import {
  CarreraRow,
  PensumRow,
  PeriodoRow,
  PerfilAcademicoRow,
  PerfilEstudianteRow,
} from "../types/academico.types";
import {
  CambiarPerfilAcademicoRequest,
  CambiarPerfilAcademicoResponse,
  CarreraResponse,
  ConsultarCarrerasRequest,
  ConsultarCarrerasResponse,
  ConsultarPerfilAcademicoRequest,
  ConsultarPerfilAcademicoResponse,
  ConsultarPerfilesEstudianteRequest,
  ConsultarPerfilesEstudianteResponse,
  CrearCarreraRequest,
  CrearCarreraResponse,
  EditarCarreraRequest,
  EditarCarreraResponse,
  EliminarCarreraRequest,
  EliminarCarreraResponse,
  CrearPensumRequest,
  CrearPensumResponse,
  EditarPensumRequest,
  EditarPensumResponse,
  EliminarPensumRequest,
  EliminarPensumResponse,
  ConsultarPensumsRequest,
  ConsultarPensumsResponse,
  CrearPeriodoRequest,
  CrearPeriodoResponse,
  EditarPeriodoRequest,
  EditarPeriodoResponse,
  EliminarPeriodoRequest,
  EliminarPeriodoResponse,
  ConsultarPeriodosRequest,
  ConsultarPeriodosResponse,
  CrearPerfilAcademicoRequest,
  CrearPerfilAcademicoResponse,
  PensumResponse,
  PeriodoResponse,
  PerfilAcademicoResponse,
  PerfilEstudianteResponse,
} from "../types/academico.controller.types";
import { buildError } from "./error_mapper";

export class AcademicoController {
  constructor(private academicoService: AcademicoService) {}

  async crearPensum(
    call: ServerUnaryCall<CrearPensumRequest, CrearPensumResponse>,
    callback: sendUnaryData<CrearPensumResponse>
  ): Promise<void> {
    try {
      const { nombre, descripcion } = call.request;

      const pensum = await this.academicoService.crearPensum({ nombre, descripcion });

      callback(null, {
        exito: true,
        mensaje: "Pensum creado exitosamente",
        pensum: this.mapPensum(pensum),
      });
    } catch (error) {
      callback(buildError(error));
    }
  }

  async editarPensum(
    call: ServerUnaryCall<EditarPensumRequest, EditarPensumResponse>,
    callback: sendUnaryData<EditarPensumResponse>
  ): Promise<void> {
    try {
      const { id_pensum, nombre, descripcion } = call.request;

      const pensum = await this.academicoService.editarPensum({
        id_pensum,
        nombre,
        descripcion,
      });

      callback(null, {
        exito: true,
        mensaje: "Pensum editado exitosamente",
        pensum: this.mapPensum(pensum),
      });
    } catch (error) {
      callback(buildError(error));
    }
  }

  async eliminarPensum(
    call: ServerUnaryCall<EliminarPensumRequest, EliminarPensumResponse>,
    callback: sendUnaryData<EliminarPensumResponse>
  ): Promise<void> {
    try {
      const { id_pensum } = call.request;

      await this.academicoService.eliminarPensum(id_pensum);

      callback(null, {
        exito: true,
        mensaje: "Pensum eliminado exitosamente",
      });
    } catch (error) {
      callback(buildError(error));
    }
  }

  async consultarPensums(
    call: ServerUnaryCall<ConsultarPensumsRequest, ConsultarPensumsResponse>,
    callback: sendUnaryData<ConsultarPensumsResponse>
  ): Promise<void> {
    try {
      const pensums = await this.academicoService.consultarPensums();

      callback(null, {
        exito: true,
        mensaje: "Pensums consultados exitosamente",
        pensums: pensums.map((pensum) => this.mapPensum(pensum)),
      });
    } catch (error) {
      callback(buildError(error));
    }
  }

  async crearCarrera(
    call: ServerUnaryCall<CrearCarreraRequest, CrearCarreraResponse>,
    callback: sendUnaryData<CrearCarreraResponse>
  ): Promise<void> {
    try {
      const { facultad, nombre, descripcion, id_pensum } = call.request;

      const carrera = await this.academicoService.crearCarrera({
        facultad,
        nombre,
        descripcion,
        id_pensum,
      });

      callback(null, {
        exito: true,
        mensaje: "Carrera creada exitosamente",
        carrera: this.mapCarrera(carrera),
      });
    } catch (error) {
      callback(buildError(error));
    }
  }

  async editarCarrera(
    call: ServerUnaryCall<EditarCarreraRequest, EditarCarreraResponse>,
    callback: sendUnaryData<EditarCarreraResponse>
  ): Promise<void> {
    try {
      const { id_carrera, facultad, nombre, descripcion, id_pensum } = call.request;

      const carrera = await this.academicoService.editarCarrera({
        id_carrera,
        facultad,
        nombre,
        descripcion,
        id_pensum,
      });

      callback(null, {
        exito: true,
        mensaje: "Carrera editada exitosamente",
        carrera: this.mapCarrera(carrera),
      });
    } catch (error) {
      callback(buildError(error));
    }
  }

  async eliminarCarrera(
    call: ServerUnaryCall<EliminarCarreraRequest, EliminarCarreraResponse>,
    callback: sendUnaryData<EliminarCarreraResponse>
  ): Promise<void> {
    try {
      const { id_carrera } = call.request;

      await this.academicoService.eliminarCarrera(id_carrera);

      callback(null, {
        exito: true,
        mensaje: "Carrera eliminada exitosamente",
      });
    } catch (error) {
      callback(buildError(error));
    }
  }

  async consultarCarreras(
    call: ServerUnaryCall<ConsultarCarrerasRequest, ConsultarCarrerasResponse>,
    callback: sendUnaryData<ConsultarCarrerasResponse>
  ): Promise<void> {
    try {
      const carreras = await this.academicoService.consultarCarreras();

      callback(null, {
        exito: true,
        mensaje: "Carreras consultadas exitosamente",
        carreras: carreras.map((carrera) => this.mapCarrera(carrera)),
      });
    } catch (error) {
      callback(buildError(error));
    }
  }

  async crearPeriodo(
    call: ServerUnaryCall<CrearPeriodoRequest, CrearPeriodoResponse>,
    callback: sendUnaryData<CrearPeriodoResponse>
  ): Promise<void> {
    try {
      const { anio, num_semestre } = call.request;

      const periodo = await this.academicoService.crearPeriodo({ anio, num_semestre });

      callback(null, {
        exito: true,
        mensaje: "Período creado exitosamente",
        periodo: this.mapPeriodo(periodo),
      });
    } catch (error) {
      callback(buildError(error));
    }
  }

  async editarPeriodo(
    call: ServerUnaryCall<EditarPeriodoRequest, EditarPeriodoResponse>,
    callback: sendUnaryData<EditarPeriodoResponse>
  ): Promise<void> {
    try {
      const { id_periodo, anio, num_semestre } = call.request;

      const periodo = await this.academicoService.editarPeriodo({
        id_periodo,
        anio,
        num_semestre,
      });

      callback(null, {
        exito: true,
        mensaje: "Período editado exitosamente",
        periodo: this.mapPeriodo(periodo),
      });
    } catch (error) {
      callback(buildError(error));
    }
  }

  async eliminarPeriodo(
    call: ServerUnaryCall<EliminarPeriodoRequest, EliminarPeriodoResponse>,
    callback: sendUnaryData<EliminarPeriodoResponse>
  ): Promise<void> {
    try {
      const { id_periodo } = call.request;

      await this.academicoService.eliminarPeriodo(id_periodo);

      callback(null, {
        exito: true,
        mensaje: "Período eliminado exitosamente",
      });
    } catch (error) {
      callback(buildError(error));
    }
  }

  async consultarPeriodos(
    call: ServerUnaryCall<ConsultarPeriodosRequest, ConsultarPeriodosResponse>,
    callback: sendUnaryData<ConsultarPeriodosResponse>
  ): Promise<void> {
    try {
      const periodos = await this.academicoService.consultarPeriodos();

      callback(null, {
        exito: true,
        mensaje: "Períodos consultados exitosamente",
        periodos: periodos.map((periodo) => this.mapPeriodo(periodo)),
      });
    } catch (error) {
      callback(buildError(error));
    }
  }

  async crearPerfilAcademico(
    call: ServerUnaryCall<CrearPerfilAcademicoRequest, CrearPerfilAcademicoResponse>,
    callback: sendUnaryData<CrearPerfilAcademicoResponse>
  ): Promise<void> {    try {
      const {
        id_usuario,
        registro_academico,
        dpi,
        fecha_nacimiento,
        telefono,
        id_carrera,
        direccion,
      } = call.request;

      const perfil = await this.academicoService.crearPerfilAcademico({
        id_usuario,
        registro_academico,
        dpi,
        fecha_nacimiento,
        telefono,
        id_carrera,
        direccion,
      });

      callback(null, {
        exito: true,
        mensaje: "Perfil académico creado exitosamente",
        perfil: this.mapPerfil(perfil),
      });
    } catch (error) {
      callback(buildError(error));
    }
  }

  async cambiarPerfilAcademico(
    call: ServerUnaryCall<CambiarPerfilAcademicoRequest, CambiarPerfilAcademicoResponse>,
    callback: sendUnaryData<CambiarPerfilAcademicoResponse>
  ): Promise<void> {
    try {
      const { id_perfil, dpi, fecha_nacimiento, telefono, direccion, registro_academico } = call.request;

      const perfil = await this.academicoService.cambiarPerfilAcademico({
        id_perfil,
        dpi,
        fecha_nacimiento,
        telefono,
        direccion,
        registro_academico,
      });

      callback(null, {
        exito: true,
        mensaje: "Perfil académico actualizado exitosamente",
        perfil: this.mapPerfil(perfil),
      });
    } catch (error) {
      callback(buildError(error));
    }
  }

  async consultarPerfilAcademico(
    call: ServerUnaryCall<ConsultarPerfilAcademicoRequest, ConsultarPerfilAcademicoResponse>,
    callback: sendUnaryData<ConsultarPerfilAcademicoResponse>
  ): Promise<void> {
    try {
      const { id_usuario } = call.request;

      const perfil = await this.academicoService.consultarPerfilAcademico(id_usuario);

      if (!perfil) {
        callback(null, {
          exito: false,
          mensaje: "No se encontró un perfil académico para este usuario",
        });
        return;
      }

      callback(null, {
        exito: true,
        mensaje: "Perfil académico consultado exitosamente",
        perfil: this.mapPerfil(perfil),
      });
    } catch (error) {
      callback(buildError(error));
    }
  }

  async consultarPerfilesEstudiante(
    call: ServerUnaryCall<
      ConsultarPerfilesEstudianteRequest,
      ConsultarPerfilesEstudianteResponse
    >,
    callback: sendUnaryData<ConsultarPerfilesEstudianteResponse>
  ): Promise<void> {
    try {
      const perfiles = await this.academicoService.consultarPerfilesEstudiante();

      callback(null, {
        exito: true,
        mensaje: "Perfiles de estudiantes consultados exitosamente",
        perfiles: perfiles.map((perfil) => this.mapPerfilEstudiante(perfil)),
      });
    } catch (error) {
      callback(buildError(error));
    }
  }

  private mapPensum(pensum: PensumRow): PensumResponse {
    return {
      id_pensum: pensum.id_pensum,
      nombre: pensum.nombre,
      descripcion: pensum.descripcion,
    };
  }

  private mapPeriodo(periodo: PeriodoRow): PeriodoResponse {
    return {
      id_periodo: periodo.id_periodo,
      anio: periodo.anio,
      num_semestre: periodo.num_semestre,
    };
  }

  private mapCarrera(carrera: CarreraRow): CarreraResponse {
    return {
      id_carrera: carrera.id_carrera,
      facultad: carrera.facultad,
      nombre: carrera.nombre,
      descripcion: carrera.descripcion,
      id_pensum: carrera.id_pensum,
      fecha_creacion: carrera.fecha_creacion.toISOString(),
    };
  }

  private mapPerfil(perfil: PerfilAcademicoRow): PerfilAcademicoResponse {
    return {
      id_perfil: perfil.id_perfil,
      id_usuario: perfil.id_usuario,
      registro_academico: perfil.registro_academico,
      dpi: perfil.dpi,
      fecha_nacimiento: perfil.fecha_nacimiento?.toISOString() ?? null,
      telefono: perfil.telefono,
      id_carrera: perfil.id_carrera,
      direccion: perfil.direccion,
    };
  }

  private mapPerfilEstudiante(perfil: PerfilEstudianteRow): PerfilEstudianteResponse {
    return {
      id_perfil: perfil.id_perfil,
      id_usuario: perfil.id_usuario,
      registro_academico: perfil.registro_academico,
      id_carrera: perfil.id_carrera,
      carrera: perfil.carrera,
      facultad: perfil.facultad,
    };
  }
}
