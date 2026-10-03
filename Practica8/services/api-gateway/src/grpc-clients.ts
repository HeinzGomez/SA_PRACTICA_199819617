// HeinzGomez - Práctica 7: clientes gRPC promisificados hacia los servicios SOA
import path from 'path';
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import { Rpc, Servicios } from './types';

const PROTO_DIR = process.env.PROTO_DIR ?? path.resolve(__dirname, '../../../proto');
const OPCIONES = { keepCase: true, longs: String, enums: String, defaults: true, oneofs: true };

function cliente(archivo: string, ruta: string, host: string, metodos: string[]): Record<string, Rpc> {
  const pkg = grpc.loadPackageDefinition(protoLoader.loadSync(path.join(PROTO_DIR, archivo), OPCIONES)) as any;
  const Ctor = ruta.split('.').reduce((o, k) => o[k], pkg);
  const c = new Ctor(host, grpc.credentials.createInsecure());
  const timeoutMs = Number(process.env.GRPC_TIMEOUT_MS ?? 3000);
  return Object.fromEntries(metodos.map((m) => [m, (req: any) => new Promise((resolve, reject) => {
    c[m](req, { deadline: Date.now() + timeoutMs }, (err: grpc.ServiceError | null, res: any) => (err ? reject(err) : resolve(res)));
  })]));
}

export function crearServicios(): Servicios {
  return {
    auth: cliente('auth.proto', 'academix.auth.v1.AuthService', process.env.AUTH_GRPC ?? 'localhost:50051',
      ['Register', 'Login', 'ValidateToken']) as Servicios['auth'],
    talleres: cliente('talleres.proto', 'academix.talleres.v1.TalleresService', process.env.TALLERES_GRPC ?? 'localhost:50052',
      ['ListarEventos', 'ObtenerEvento', 'ObtenerCupos', 'CrearEvento', 'ActualizarEvento', 'EliminarEvento']) as Servicios['talleres'],
    reservas: cliente('reservas.proto', 'academix.reservas.v1.ReservasService', process.env.RESERVAS_GRPC ?? 'localhost:50053',
      ['SolicitarReserva', 'ConsultarTicket', 'ListarReservasUsuario']) as Servicios['reservas'],
    certificados: cliente('certificados.proto', 'academix.certificados.v1.CertificadosService', process.env.CERTIFICADOS_GRPC ?? 'localhost:50054',
      ['ObtenerExamen', 'RendirExamen', 'GenerarCertificado', 'ListarCertificados', 'VerificarCertificado']) as Servicios['certificados'],
  };
}
