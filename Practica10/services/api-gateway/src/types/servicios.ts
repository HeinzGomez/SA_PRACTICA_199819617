// HeinzGomez - Práctica 9: puertos (operaciones RPC) que el API Gateway consume del bus.
// Un puerto por servicio: `rpc/<servicio>.ts` es la única implementación de cada uno.
import type {
  Certificado, Examen, ExamenAdmin, FiltroCertificados, PreguntaCreada,
  ResultadoExamen, SolicitudCertificado, SolicitudNuevoExamen, SolicitudNuevaPregunta, Verificacion,
} from './certificado';
import type { Cupo, Evento, FiltroEventos } from './evento';
import type { SolicitudReserva, Ticket } from './reserva';
import type { Credenciales, Registro, Sesion, Validacion } from './usuario';

export interface AuthRpc {
  registro(datos: Registro): Promise<Sesion>;
  login(datos: Credenciales): Promise<Sesion>;
  validarToken(datos: { token: string }): Promise<Validacion>;
}

export interface TalleresRpc {
  listarEventos(datos: FiltroEventos): Promise<{ eventos: Evento[] }>;
  obtenerEvento(datos: { id: string }): Promise<Evento>;
  obtenerCupos(datos: { evento_ids: string[] }): Promise<{ cupos: Cupo[] }>;
  crearEvento(datos: Partial<Evento>): Promise<Evento>;
  actualizarEvento(datos: Partial<Evento>): Promise<Evento>;
  eliminarEvento(datos: { id: string }): Promise<{ eliminado: boolean }>;
}

export interface ReservasRpc {
  solicitarReserva(datos: SolicitudReserva): Promise<Ticket>;
  consultarTicket(datos: { id: string }): Promise<Ticket>;
  listarReservasUsuario(datos: { id: string }): Promise<{ tickets: Ticket[] }>;
}

export interface CertificadosRpc {
  obtenerExamen(datos: { evento_id: string; usuario_id: string }): Promise<Examen>;
  rendirExamen(datos: { usuario_id: string; evento_id: string; respuestas: { pregunta_id: string; opcion_id: string }[] }): Promise<ResultadoExamen>;
  generarCertificado(datos: SolicitudCertificado): Promise<Certificado>;
  listarCertificados(datos: FiltroCertificados): Promise<{ certificados: Certificado[] }>;
  verificarCertificado(datos: { codigo: string }): Promise<Verificacion>;
  /** Consulta del examen con sus respuestas correctas (solo rol administrador). */
  obtenerExamenAdmin(datos: { evento_id: string }): Promise<ExamenAdmin>;
  crearExamen(datos: SolicitudNuevoExamen): Promise<ExamenAdmin>;
  agregarPregunta(datos: SolicitudNuevaPregunta): Promise<PreguntaCreada>;
}

/** Agrupación de los cuatro puertos que consume la capa de rutas. */
export interface Servicios {
  auth: AuthRpc;
  talleres: TalleresRpc;
  reservas: ReservasRpc;
  certificados: CertificadosRpc;
}
