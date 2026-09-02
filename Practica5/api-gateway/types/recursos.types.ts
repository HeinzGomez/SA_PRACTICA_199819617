// ─── Base ─────────────────────────────────────────────────

export interface GrpcResponse {
  exito: boolean;
  mensaje: string;
}

// ─── Repositorio ──────────────────────────────────────────

export interface ArchivoRepositorio {
  id_archivo: number;
  nombre: string;
}

export interface VersionArchivo {
  id_version: number;
  id_archivo: number;
  link: string;
  tag: string;
  fecha_creacion: string;
  hash: string;
  latest: boolean;
}

export interface RepositorioInfo {
  id_repositorio: number;
  id_clase: number;
  nombre: string;
  archivos: ArchivoRepositorio[];
}

export interface CrearRepositorioRequest {
  id_clase: number;
  nombre: string;
}

export interface CrearRepositorioResponse extends GrpcResponse {
  id_repositorio: number;
}

export interface AgregarArchivoRequest {
  id_repositorio: number;
  nombre: string;
  link: string;
  tag: string;
  hash: string;
}

export interface AgregarArchivoResponse extends GrpcResponse {
  id_archivo: number;
}

export interface ActualizarVersionArchivoRequest {
  id_archivo: number;
  link: string;
  tag: string;
  hash: string;
}

export type ActualizarVersionArchivoResponse = GrpcResponse;

export interface EliminarArchivoRequest {
  id_archivo: number;
}

export type EliminarArchivoResponse = GrpcResponse;

export interface ConsultarRepositorioRequest {
  id_clase: number;
}

export interface ConsultarRepositorioResponse extends GrpcResponse {
  repositorio?: RepositorioInfo;
}

export interface ConsultarVersionesArchivoRequest {
  id_archivo: number;
}

export interface ConsultarVersionesArchivoResponse extends GrpcResponse {
  versiones: VersionArchivo[];
}

export interface ConsultarVersionArchivoRequest {
  id_archivo: number;
  id_version: number;
}

export interface ConsultarVersionArchivoResponse extends GrpcResponse {
  version?: VersionArchivo;
}

export interface ActualizarTagRequest {
  id_version: number;
  tag: string;
}

export type ActualizarTagResponse = GrpcResponse;

// ─── Apuntes ──────────────────────────────────────────────

export interface MarcadorTiempo {
  id_marcador: number;
  segundo: number;
  texto: string;
}

export interface ApunteInfo {
  id_apunte: number;
  id_clase: number;
  id_usuario: number;
  titulo: string;
  contenido_markdown: string;
  fecha_creacion: string;
  fecha_actualizacion: string;
  marcadores: MarcadorTiempo[];
}

export interface ConsultarApunteRequest {
  id_clase: number;
  id_usuario: number;
}

export interface ConsultarApunteResponse extends GrpcResponse {
  apunte?: ApunteInfo;
}

export interface CrearApunteRequest {
  id_clase: number;
  id_usuario: number;
  titulo: string;
  contenido_markdown: string;
}

export interface CrearApunteResponse extends GrpcResponse {
  id_apunte: number;
}

export interface ActualizarApunteRequest {
  id_apunte: number;
  titulo: string;
  contenido_markdown: string;
}

export type ActualizarApunteResponse = GrpcResponse;

export interface AgregarMarcadorTiempoRequest {
  id_apunte: number;
  segundo: number;
  texto: string;
}

export interface AgregarMarcadorTiempoResponse extends GrpcResponse {
  id_marcador: number;
}

export interface EliminarMarcadorTiempoRequest {
  id_marcador: number;
}

export type EliminarMarcadorTiempoResponse = GrpcResponse;
