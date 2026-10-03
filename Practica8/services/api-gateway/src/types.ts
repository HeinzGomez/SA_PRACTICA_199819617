// HeinzGomez - Práctica 7: puertos (clientes gRPC promisificados) que consume el API Gateway
export type Rpc = (req: any) => Promise<any>;

export interface Servicios {
  auth: { Register: Rpc; Login: Rpc; ValidateToken: Rpc };
  talleres: {
    ListarEventos: Rpc; ObtenerEvento: Rpc; ObtenerCupos: Rpc;
    CrearEvento: Rpc; ActualizarEvento: Rpc; EliminarEvento: Rpc;
  };
  reservas: { SolicitarReserva: Rpc; ConsultarTicket: Rpc; ListarReservasUsuario: Rpc };
  certificados: {
    ObtenerExamen: Rpc; RendirExamen: Rpc; GenerarCertificado: Rpc;
    ListarCertificados: Rpc; VerificarCertificado: Rpc;
  };
}

export interface UsuarioSesion {
  id: string;
  nombre: string;
  carnet: string;
  correo: string;
  rol: 'ESTUDIANTE' | 'ADMINISTRADOR';
}

export interface OpcionesApp {
  origenesPermitidos: string[];
  cupoStreamMs: number;
  limiteReservasPorMinuto: number;
}
