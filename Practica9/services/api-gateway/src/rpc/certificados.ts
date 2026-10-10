// HeinzGomez - Práctica 9: productor RPC hacia certificados-service (cola `certificados.rpc`).
import { BusRpc } from '../broker';
import { CertificadosRpc } from '../types';

const OPERACIONES = {
  obtenerExamen: 'certificados.obtener_examen',
  rendirExamen: 'certificados.rendir_examen',
  generarCertificado: 'certificados.generar_certificado',
  listarCertificados: 'certificados.listar_certificados',
  verificarCertificado: 'certificados.verificar_certificado',
  obtenerExamenAdmin: 'certificados.obtener_examen_admin',
  crearExamen: 'certificados.crear_examen',
  agregarPregunta: 'certificados.agregar_pregunta',
} as const;

export const crearCertificadosRpc = (bus: BusRpc): CertificadosRpc => ({
  obtenerExamen: (datos) => bus.enviar(OPERACIONES.obtenerExamen, datos),
  rendirExamen: (datos) => bus.enviar(OPERACIONES.rendirExamen, datos),
  generarCertificado: (datos) => bus.enviar(OPERACIONES.generarCertificado, datos),
  listarCertificados: (datos) => bus.enviar(OPERACIONES.listarCertificados, datos),
  verificarCertificado: (datos) => bus.enviar(OPERACIONES.verificarCertificado, datos),
  obtenerExamenAdmin: (datos) => bus.enviar(OPERACIONES.obtenerExamenAdmin, datos),
  crearExamen: (datos) => bus.enviar(OPERACIONES.crearExamen, datos),
  agregarPregunta: (datos) => bus.enviar(OPERACIONES.agregarPregunta, datos),
});
