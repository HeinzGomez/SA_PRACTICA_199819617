// HeinzGomez - Práctica 9: tipos del contrato REST del API Gateway (docs/contrato-api.md)
export type Rol = 'ESTUDIANTE' | 'ADMINISTRADOR';
export type TipoEvento = 'TALLER' | 'CONFERENCIA' | 'LABORATORIO' | 'CERTIFICACION';
export type EstadoTicket = 'PENDIENTE' | 'CONFIRMADA' | 'RECHAZADA';
export type TipoReserva = 'ACREDITACION' | 'EXAMEN_CERTIFICACION';

export interface Usuario {
  id: string;
  nombre: string;
  carnet: string;
  correo: string;
  rol: Rol;
}

export interface Sesion {
  token: string;
  usuario: Usuario;
}

export interface Ponente {
  nombre: string;
  titulo: string;
  bio: string;
  correo: string;
}

export interface Evento {
  id: string;
  titulo: string;
  descripcion: string;
  tipo: TipoEvento;
  curso_codigo: string;
  curso_nombre: string;
  fecha_inicio: string;
  duracion_min: number;
  lugar: string;
  cupo_total: number;
  cupo_disponible: number;
  ponente: Ponente;
  prerrequisitos: string[];
  tiene_certificacion: boolean;
}

export interface FiltroEventos {
  curso?: string;
  tipo?: string;
  desde?: string;
  hasta?: string;
}

export interface Cupo {
  evento_id: string;
  cupo_total: number;
  cupo_disponible: number;
}

export interface Ticket {
  id: string;
  usuario_id: string;
  evento_id: string;
  estado: EstadoTicket;
  motivo: string;
  tipo: TipoReserva;
  creado_en: string;
  actualizado_en: string;
  cupo_restante: number;
}

export interface Opcion { id: string; texto: string }
export interface Pregunta { id: string; enunciado: string; opciones: Opcion[] }
export interface Examen { evento_id: string; preguntas: Pregunta[]; nota_minima: number }
export interface ResultadoExamen { intento_id: string; aprobado: boolean; nota: number; correctas: number; total: number }

// --- administración de exámenes (solo ADMINISTRADOR, por el broker)
export interface OpcionNueva { texto: string; es_correcta?: boolean }
export interface SolicitudExamen { evento_id: string; titulo: string; puntaje_minimo?: number; estado?: string }
export interface PreguntaCreada {
  id_pregunta: string | number;
  id_examen: number;
  enunciado: string;
  punteo: number;
  opciones: { id_opcion: string; texto: string; es_correcta: boolean }[];
}
export interface ExamenAdmin {
  id_examen: number;
  evento_id: string;
  titulo: string;
  puntaje_minimo: number;
  estado: string;
  preguntas: PreguntaCreada[];
}
export interface SolicitudPregunta {
  id_examen: number;
  enunciado: string;
  opciones: OpcionNueva[];
  punteo?: number;
}

export interface Certificado {
  id: string;
  codigo_hash: string;
  firma: string;
  usuario_id: string;
  nombre_estudiante: string;
  evento_id: string;
  evento_titulo: string;
  curso_codigo: string;
  curso_nombre: string;
  nota: number;
  emitido_en: string;
}

export interface FiltroCertificados { curso?: string; desde?: string; hasta?: string }

export interface Verificacion {
  valido: boolean;
  mensaje: string;
  certificado: Certificado | null;
}

export interface RegistroInput {
  nombre: string;
  carnet: string;
  correo: string;
  password: string;
}

export class ApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface Api {
  login(correo: string, password: string): Promise<Sesion>;
  register(input: RegistroInput): Promise<Sesion>;
  listarEventos(f?: FiltroEventos): Promise<Evento[]>;
  obtenerEvento(id: string): Promise<Evento>;
  cupos(): Promise<Cupo[]>;
  suscribirCupos(cb: (c: Cupo[]) => void): () => void;
  crearEvento(token: string, e: Partial<Evento>): Promise<Evento>;
  actualizarEvento(token: string, e: Partial<Evento> & { id: string }): Promise<Evento>;
  eliminarEvento(token: string, id: string): Promise<void>;
  solicitarReserva(token: string, eventoId: string, tipo: TipoReserva): Promise<Ticket>;
  consultarTicket(token: string, id: string): Promise<Ticket>;
  misReservas(token: string): Promise<Ticket[]>;
  obtenerExamen(token: string, eventoId: string): Promise<Examen>;
  rendirExamen(token: string, eventoId: string, respuestas: Record<string, string>): Promise<ResultadoExamen>;
  /** Examen de la actividad con sus respuestas correctas (solo ADMINISTRADOR; 404 si no existe). */
  obtenerExamenAdmin(token: string, eventoId: string): Promise<ExamenAdmin>;
  crearExamen(token: string, e: SolicitudExamen): Promise<ExamenAdmin>;
  agregarPregunta(token: string, e: SolicitudPregunta): Promise<PreguntaCreada>;
  generarCertificado(token: string, eventoId: string): Promise<Certificado>;
  misCertificados(token: string, f?: FiltroCertificados): Promise<Certificado[]>;
  verificar(codigo: string): Promise<Verificacion>;
}
