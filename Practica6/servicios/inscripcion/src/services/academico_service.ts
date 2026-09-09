import { AcademicoRepository } from "../repositories/academico_repository";
import { RolRepository } from "../repositories/rol_repository";
import {
  CarreraRow,
  PensumRow,
  PeriodoRow,
  PerfilAcademicoRow,
  PerfilEstudianteRow,
} from "../types/academico.types";
import {
  CambiarPerfilAcademicoInput,
  CrearCarreraInput,
  EditarCarreraInput,
  CrearPensumInput,
  EditarPensumInput,
  CrearPeriodoInput,
  EditarPeriodoInput,
  CrearPerfilAcademicoInput,
} from "../types/academico.service.types";

const FECHA_NACIMIENTO_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const ROL_ESTUDIANTE = "Estudiante";
const SEMESTRE_MINIMO = 1;
const SEMESTRE_MAXIMO = 2;
const ANIO_MINIMO = 2000;
const ANIO_MAXIMO = 2100;

export interface AcademicoService {
  crearPensum(input: CrearPensumInput): Promise<PensumRow>;
  editarPensum(input: EditarPensumInput): Promise<PensumRow>;
  eliminarPensum(idPensum: number): Promise<boolean>;
  consultarPensums(): Promise<PensumRow[]>;
  crearCarrera(input: CrearCarreraInput): Promise<CarreraRow>;
  editarCarrera(input: EditarCarreraInput): Promise<CarreraRow>;
  eliminarCarrera(idCarrera: number): Promise<boolean>;
  consultarCarreras(): Promise<CarreraRow[]>;
  crearPeriodo(input: CrearPeriodoInput): Promise<PeriodoRow>;
  editarPeriodo(input: EditarPeriodoInput): Promise<PeriodoRow>;
  eliminarPeriodo(idPeriodo: number): Promise<boolean>;
  consultarPeriodos(): Promise<PeriodoRow[]>;
  crearPerfilAcademico(input: CrearPerfilAcademicoInput): Promise<PerfilAcademicoRow>;
  cambiarPerfilAcademico(input: CambiarPerfilAcademicoInput): Promise<PerfilAcademicoRow>;
  consultarPerfilAcademico(idUsuario: number): Promise<PerfilAcademicoRow | null>;
  consultarPerfilesEstudiante(): Promise<PerfilEstudianteRow[]>;
}

export class AcademicoServiceImp implements AcademicoService {
  constructor(
    private academicoRepository: AcademicoRepository,
    private rolRepository: RolRepository
  ) {}

  async crearPensum(input: CrearPensumInput): Promise<PensumRow> {
    const nombre = this.normalizarTexto(input.nombre);

    if (!nombre) {
      throw new Error("El nombre del pensum es obligatorio");
    }

    return this.academicoRepository.crearPensum({
      nombre,
      descripcion: input.descripcion?.trim() || null,
    });
  }

  async editarPensum(input: EditarPensumInput): Promise<PensumRow> {
    const nombre = this.normalizarTexto(input.nombre);

    if (!input.id_pensum) {
      throw new Error("El ID del pensum es obligatorio");
    }

    if (!nombre) {
      throw new Error("El nombre del pensum es obligatorio");
    }

    const pensum = await this.academicoRepository.buscarPensumPorId(input.id_pensum);
    if (!pensum) {
      throw new Error(`El pensum con id '${input.id_pensum}' no existe`);
    }

    const actualizado = await this.academicoRepository.editarPensum({
      id_pensum: input.id_pensum,
      nombre,
      descripcion: input.descripcion?.trim() || null,
    });

    if (!actualizado) {
      throw new Error("No se pudo actualizar el pensum");
    }

    return actualizado;
  }

  async eliminarPensum(idPensum: number): Promise<boolean> {
    if (!idPensum) {
      throw new Error("El ID del pensum es obligatorio");
    }

    const pensum = await this.academicoRepository.buscarPensumPorId(idPensum);
    if (!pensum) {
      throw new Error(`El pensum con id '${idPensum}' no existe`);
    }

    return this.academicoRepository.eliminarPensum(idPensum);
  }

  async consultarPensums(): Promise<PensumRow[]> {
    return this.academicoRepository.listarPensums();
  }

  async crearCarrera(input: CrearCarreraInput): Promise<CarreraRow> {
    const facultad = this.normalizarTexto(input.facultad);
    const nombre = this.normalizarTexto(input.nombre);

    if (!facultad || !nombre) {
      throw new Error("La facultad y el nombre de la carrera son obligatorios");
    }

    if (!input.id_pensum) {
      throw new Error("La carrera debe tener un pensum asociado");
    }

    const pensum = await this.academicoRepository.buscarPensumPorId(input.id_pensum);
    if (!pensum) {
      throw new Error(`El pensum con id '${input.id_pensum}' no existe`);
    }

    return this.academicoRepository.crearCarrera({
      facultad,
      nombre,
      descripcion: input.descripcion?.trim() || null,
      id_pensum: input.id_pensum,
    });
  }

  async editarCarrera(input: EditarCarreraInput): Promise<CarreraRow> {
    const facultad = this.normalizarTexto(input.facultad);
    const nombre = this.normalizarTexto(input.nombre);

    if (!input.id_carrera) {
      throw new Error("El ID de la carrera es obligatorio");
    }

    if (!facultad || !nombre) {
      throw new Error("La facultad y el nombre de la carrera son obligatorios");
    }

    if (!input.id_pensum) {
      throw new Error("La carrera debe tener un pensum asociado");
    }

    const carrera = await this.academicoRepository.buscarCarreraPorId(input.id_carrera);
    if (!carrera) {
      throw new Error(`La carrera con id '${input.id_carrera}' no existe`);
    }

    const pensum = await this.academicoRepository.buscarPensumPorId(input.id_pensum);
    if (!pensum) {
      throw new Error(`El pensum con id '${input.id_pensum}' no existe`);
    }

    const actualizado = await this.academicoRepository.editarCarrera({
      id_carrera: input.id_carrera,
      facultad,
      nombre,
      descripcion: input.descripcion?.trim() || null,
      id_pensum: input.id_pensum,
    });

    if (!actualizado) {
      throw new Error("No se pudo actualizar la carrera");
    }

    return actualizado;
  }

  async eliminarCarrera(idCarrera: number): Promise<boolean> {
    if (!idCarrera) {
      throw new Error("El ID de la carrera es obligatorio");
    }

    const carrera = await this.academicoRepository.buscarCarreraPorId(idCarrera);
    if (!carrera) {
      throw new Error(`La carrera con id '${idCarrera}' no existe`);
    }

    return this.academicoRepository.eliminarCarrera(idCarrera);
  }

  async consultarCarreras(): Promise<CarreraRow[]> {
    return this.academicoRepository.listarCarreras();
  }

  async crearPeriodo(input: CrearPeriodoInput): Promise<PeriodoRow> {
    const { anio, num_semestre } = this.validarPeriodo(input.anio, input.num_semestre);

    return this.academicoRepository.crearPeriodo({ anio, num_semestre });
  }

  async editarPeriodo(input: EditarPeriodoInput): Promise<PeriodoRow> {
    if (!input.id_periodo) {
      throw new Error("El ID del período es obligatorio");
    }

    const { anio, num_semestre } = this.validarPeriodo(input.anio, input.num_semestre);

    const periodo = await this.academicoRepository.buscarPeriodoPorId(input.id_periodo);
    if (!periodo) {
      throw new Error(`El período con id '${input.id_periodo}' no existe`);
    }

    const actualizado = await this.academicoRepository.editarPeriodo({
      id_periodo: input.id_periodo,
      anio,
      num_semestre,
    });

    if (!actualizado) {
      throw new Error("No se pudo actualizar el período");
    }

    return actualizado;
  }

  async eliminarPeriodo(idPeriodo: number): Promise<boolean> {
    if (!idPeriodo) {
      throw new Error("El ID del período es obligatorio");
    }

    const periodo = await this.academicoRepository.buscarPeriodoPorId(idPeriodo);
    if (!periodo) {
      throw new Error(`El período con id '${idPeriodo}' no existe`);
    }

    return this.academicoRepository.eliminarPeriodo(idPeriodo);
  }

  async consultarPeriodos(): Promise<PeriodoRow[]> {
    return this.academicoRepository.listarPeriodos();
  }

  private validarPeriodo(anio: number, numSemestre: number): { anio: number; num_semestre: number } {
    if (!anio) {
      throw new Error("El año del período es obligatorio");
    }

    if (anio < ANIO_MINIMO || anio > ANIO_MAXIMO) {
      throw new Error(`El año debe estar entre ${ANIO_MINIMO} y ${ANIO_MAXIMO}`);
    }

    if (!numSemestre) {
      throw new Error("El número de semestre es obligatorio");
    }

    if (numSemestre < SEMESTRE_MINIMO || numSemestre > SEMESTRE_MAXIMO) {
      throw new Error(`El número de semestre debe estar entre ${SEMESTRE_MINIMO} y ${SEMESTRE_MAXIMO}`);
    }

    return { anio, num_semestre: numSemestre };
  }

  async crearPerfilAcademico(input: CrearPerfilAcademicoInput): Promise<PerfilAcademicoRow> {
    if (!input.id_usuario) {
      throw new Error("El usuario del perfil es obligatorio");
    }

    if (input.fecha_nacimiento && !FECHA_NACIMIENTO_REGEX.test(input.fecha_nacimiento)) {
      throw new Error("La fecha de nacimiento debe tener el formato YYYY-MM-DD");
    }

    const registro = this.normalizarTextoOpcional(input.registro_academico);
    if (registro) {
      const porRegistro = await this.academicoRepository.buscarPerfilPorRegistroAcademico(registro);
      if (porRegistro) {
        throw new Error(`El registro académico '${registro}' ya está en uso`);
      }
    }

    const dpi = this.normalizarTextoOpcional(input.dpi);
    if (dpi) {
      const porDpi = await this.academicoRepository.buscarPerfilPorDpi(dpi);
      if (porDpi) {
        throw new Error(`El DPI '${dpi}' ya está en uso`);
      }
    }

    const idCarrera = input.id_carrera || null;
    if (idCarrera) {
      const carrera = await this.academicoRepository.buscarCarreraPorId(idCarrera);
      if (!carrera) {
        throw new Error(`La carrera con id '${idCarrera}' no existe`);
      }
    }

    const perfil = await this.academicoRepository.crearPerfilAcademico({
      id_usuario: input.id_usuario,
      registro_academico: registro,
      dpi,
      fecha_nacimiento: this.normalizarTextoOpcional(input.fecha_nacimiento),
      telefono: this.normalizarTextoOpcional(input.telefono),
      id_carrera: idCarrera,
      direccion: this.normalizarTextoOpcional(input.direccion),
    });

    const rolEstudiante = await this.rolRepository.buscarRolPorNombre(ROL_ESTUDIANTE);
    if (rolEstudiante) {
      await this.rolRepository.asignarRol({
        id_usuario: input.id_usuario,
        id_rol: rolEstudiante.id_rol,
      });
    }

    return perfil;
  }

  async cambiarPerfilAcademico(input: CambiarPerfilAcademicoInput): Promise<PerfilAcademicoRow> {
    if (!input.id_perfil) {
      throw new Error("El id del perfil es obligatorio");
    }

    const perfil = await this.academicoRepository.buscarPerfilPorId(input.id_perfil);
    if (!perfil) {
      throw new Error(`El perfil con id '${input.id_perfil}' no existe`);
    }

    const dpi = this.normalizarTextoOpcional(input.dpi);
    const fechaNacimiento = this.normalizarTextoOpcional(input.fecha_nacimiento);
    const telefono = this.normalizarTextoOpcional(input.telefono);
    const direccion = this.normalizarTextoOpcional(input.direccion);
    const registroAcademico = this.normalizarTextoOpcional(input.registro_academico);

    if (
      dpi === null &&
      fechaNacimiento === null &&
      telefono === null &&
      direccion === null &&
      registroAcademico === null
    ) {
      throw new Error("Debe enviar al menos un campo a actualizar (DPI, fecha de nacimiento, teléfono, dirección o registro académico)");
    }

    if (registroAcademico !== null) {
      await this.validarRegistroAcademicoDisponible(registroAcademico, input.id_perfil);
    }

    const actualizado = await this.academicoRepository.cambiarPerfilAcademico({
      id_perfil: input.id_perfil,
      dpi,
      fecha_nacimiento: fechaNacimiento,
      telefono,
      direccion,
      registro_academico: registroAcademico,
    });

    if (!actualizado) {
      throw new Error("No se pudo actualizar el perfil académico");
    }

    return actualizado;
  }

  private async validarRegistroAcademicoDisponible(
    registroAcademico: string,
    idPerfilExcluido: number
  ): Promise<void> {
    const porRegistro = await this.academicoRepository.buscarPerfilPorRegistroAcademico(registroAcademico);
    if (porRegistro && porRegistro.id_perfil !== idPerfilExcluido) {
      throw new Error(`El registro académico '${registroAcademico}' ya está en uso`);
    }
  }

  async consultarPerfilAcademico(idUsuario: number): Promise<PerfilAcademicoRow | null> {
    if (!idUsuario) {
      throw new Error("El id del usuario es obligatorio");
    }

    return this.academicoRepository.buscarPerfilPorUsuario(idUsuario);
  }

  async consultarPerfilesEstudiante(): Promise<PerfilEstudianteRow[]> {
    return this.academicoRepository.listarPerfilesEstudiante();
  }

  private normalizarTexto(texto: string): string {
    return texto?.trim() || "";
  }

  private normalizarTextoOpcional(texto: string | null | undefined): string | null {
    const normalizado = texto?.trim() || "";
    return normalizado || null;
  }
}
