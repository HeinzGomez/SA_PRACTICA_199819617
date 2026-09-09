import { CursoRepository } from "../repositories/curso_repository";
import { InscribirRepository } from "../repositories/inscribir_repository";
import {
  ConsultarCursosResult,
  ConsultarTodasInscripcionesResult,
  CursoEstudianteRow,
  EstadoMatriculaRow,
  InscripcionRow,
} from "../types/inscripcion.types";
import {
  ActualizarEstadoMatriculaInput,
  ConsultarCursosInput,
  ConsultarTodasInscripcionesInput,
  InscribirEstudianteInput,
} from "../types/inscribir.service.types";

export interface InscribirService {
  inscribirEstudiante(input: InscribirEstudianteInput): Promise<InscripcionRow>;
  actualizarEstadoMatricula(input: ActualizarEstadoMatriculaInput): Promise<InscripcionRow>;
  consultarCursosEstudiante(input: ConsultarCursosInput): Promise<ConsultarCursosResult>;
  consultarTodasInscripciones(
    input: ConsultarTodasInscripcionesInput
  ): Promise<ConsultarTodasInscripcionesResult>;
  consultarEstadosMatricula(): Promise<EstadoMatriculaRow[]>;
}

export class InscribirServiceImp implements InscribirService {
  constructor(
    private inscribirRepository: InscribirRepository,
    private cursoRepository: CursoRepository
  ) {}

  async inscribirEstudiante(input: InscribirEstudianteInput): Promise<InscripcionRow> {
    this.validarEnteroPositivo(input.id_usuario, "El id del usuario es obligatorio");
    this.validarEnteroPositivo(input.id_curso, "El id del curso es obligatorio");
    this.validarEnteroPositivo(input.id_periodo, "El id del período es obligatorio");
    this.validarEnteroPositivo(
      input.id_estado_matricula,
      "El id del estado de matrícula es obligatorio"
    );

    const curso = await this.cursoRepository.buscarCursoPorId(input.id_curso);
    if (!curso) {
      throw new Error(`El curso con id '${input.id_curso}' no existe`);
    }

    const periodo = await this.inscribirRepository.buscarPeriodoPorId(input.id_periodo);
    if (!periodo) {
      throw new Error(`El período con id '${input.id_periodo}' no existe`);
    }

    const estado = await this.inscribirRepository.buscarEstadoMatriculaPorId(
      input.id_estado_matricula
    );
    if (!estado) {
      throw new Error(`El estado de matrícula con id '${input.id_estado_matricula}' no existe`);
    }

    return this.inscribirRepository.inscribirEstudiante({
      id_usuario: input.id_usuario,
      id_curso: input.id_curso,
      id_periodo: input.id_periodo,
      id_estado_matricula: input.id_estado_matricula,
      tipo_inscripcion: input.tipo_inscripcion?.trim() || null,
      usuario_responsable: input.usuario_responsable,
    });
  }

  async actualizarEstadoMatricula(
    input: ActualizarEstadoMatriculaInput
  ): Promise<InscripcionRow> {
    this.validarEnteroPositivo(input.id_inscripcion, "El id de la inscripción es obligatorio");
    this.validarEnteroPositivo(input.nuevo_estado, "El nuevo estado es obligatorio");

    const inscripcion = await this.inscribirRepository.buscarInscripcionPorId(
      input.id_inscripcion
    );
    if (!inscripcion) {
      throw new Error(`La inscripción con id '${input.id_inscripcion}' no existe`);
    }

    const estado = await this.inscribirRepository.buscarEstadoMatriculaPorId(input.nuevo_estado);
    if (!estado) {
      throw new Error(`El estado de matrícula con id '${input.nuevo_estado}' no existe`);
    }

    return this.inscribirRepository.actualizarEstadoMatricula({
      id_inscripcion: input.id_inscripcion,
      nuevo_estado: input.nuevo_estado,
      usuario_responsable: input.usuario_responsable,
    });
  }

  async consultarCursosEstudiante(input: ConsultarCursosInput): Promise<ConsultarCursosResult> {
    this.validarEnteroPositivo(input.id_usuario, "El id del usuario es obligatorio");

    return this.inscribirRepository.consultarCursosEstudiante({
      id_usuario: input.id_usuario,
      anio: input.anio < 0 ? 0 : input.anio,
      semestre: input.semestre < 0 ? 0 : input.semestre,
      estado: input.estado?.trim() || "",
      pagina: input.pagina > 0 ? input.pagina : 1,
    });
  }

  async consultarEstadosMatricula(): Promise<EstadoMatriculaRow[]> {
    return this.inscribirRepository.listarEstadosMatricula();
  }

  async consultarTodasInscripciones(
    input: ConsultarTodasInscripcionesInput
  ): Promise<ConsultarTodasInscripcionesResult> {
    if (input.semestre < 0 || input.semestre > 2) {
      throw new Error("El semestre debe ser 1 o 2 (0 para todos)");
    }

    return this.inscribirRepository.consultarTodasInscripciones({
      id_curso: input.id_curso < 0 ? 0 : input.id_curso,
      anio: input.anio < 0 ? 0 : input.anio,
      semestre: input.semestre < 0 ? 0 : input.semestre,
      pagina: input.pagina > 0 ? input.pagina : 1,
    });
  }

  private validarEnteroPositivo(valor: number, mensaje: string): void {
    if (!Number.isInteger(valor) || valor <= 0) {
      throw new Error(mensaje);
    }
  }
}
