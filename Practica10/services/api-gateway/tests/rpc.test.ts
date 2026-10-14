// HeinzGomez - Práctica 9: pruebas de los productores RPC (routing key de cada operación).
import { crearServicios } from '../src/rpc';
import { BusRpc } from '../src/broker';
import { Servicios } from '../src/types';

interface Llamada {
  enviar: jest.Mock;
}

const creaBus = (): { bus: BusRpc; llamadas: Llamada } => {
  const llamadas = {
    enviar: jest.fn(async () => ({ ok: true, datos: 'ok' })),
  };
  return { bus: llamadas as unknown as BusRpc, llamadas };
};

type Caso = [keyof Servicios, string, string, unknown];

const CASOS: Caso[] = [
  ['auth', 'registro', 'auth.register', { correo: 'a@b.c', password: 'x' }],
  ['auth', 'login', 'auth.login', { correo: 'a@b.c', password: 'x' }],
  ['auth', 'validarToken', 'auth.validate_token', { token: 't' }],
  ['talleres', 'listarEventos', 'talleres.listar_eventos', {}],
  ['talleres', 'obtenerEvento', 'talleres.obtener_evento', { id: 'e1' }],
  ['talleres', 'obtenerCupos', 'talleres.obtener_cupos', { evento_ids: ['e1'] }],
  ['talleres', 'crearEvento', 'talleres.crear_evento', { titulo: 'n' }],
  ['talleres', 'actualizarEvento', 'talleres.actualizar_evento', { id: 'e1' }],
  ['talleres', 'eliminarEvento', 'talleres.eliminar_evento', { id: 'e1' }],
  ['reservas', 'solicitarReserva', 'reservas.solicitar', { evento_id: 'e1' }],
  ['reservas', 'consultarTicket', 'reservas.consultar_ticket', { id: 't1' }],
  ['reservas', 'listarReservasUsuario', 'reservas.listar_usuario', { id: 'u1' }],
  ['certificados', 'obtenerExamen', 'certificados.obtener_examen', { evento_id: 'e1', usuario_id: 'u1' }],
  ['certificados', 'rendirExamen', 'certificados.rendir_examen', { usuario_id: 'u1', evento_id: 'e1', respuestas: [] }],
  ['certificados', 'generarCertificado', 'certificados.generar_certificado', { ticket_id: 't1' }],
  ['certificados', 'listarCertificados', 'certificados.listar_certificados', { usuario_id: 'u1' }],
  ['certificados', 'verificarCertificado', 'certificados.verificar_certificado', { codigo: 'c' }],
  ['certificados', 'obtenerExamenAdmin', 'certificados.obtener_examen_admin', { evento_id: 'e1' }],
  ['certificados', 'crearExamen', 'certificados.crear_examen', { evento_id: 'e1' }],
  ['certificados', 'agregarPregunta', 'certificados.agregar_pregunta', { evento_id: 'e1' }],
];

describe('rpc/crearServicios', () => {
  test('expone los cuatro puertos que consume la capa de rutas', () => {
    const { bus } = creaBus();
    const s = crearServicios(bus);
    expect(Object.keys(s).sort()).toEqual([
      'auth',
      'certificados',
      'reservas',
      'talleres',
    ]);
  });

  test.each(CASOS)(
    '%s.%s publica con la routing key %s',
    async (servicio, metodo, routingKey, payload) => {
      const { bus, llamadas } = creaBus();
      const servicios = crearServicios(bus);
      const operacion = (servicios[servicio] as unknown as Record<string, (d: unknown) => Promise<unknown>>)[metodo];
      expect(typeof operacion).toBe('function');

      await operacion(payload);

      expect(llamadas.enviar).toHaveBeenCalledTimes(1);
      expect(llamadas.enviar).toHaveBeenCalledWith(routingKey, payload);
    }
  );

  test('una operación devuelve la promesa del bus tal cual', async () => {
    const { bus, llamadas } = creaBus();
    llamadas.enviar.mockResolvedValueOnce({ tickets: [] });
    const servicios = crearServicios(bus);
    await expect(servicios.reservas.listarReservasUsuario({ id: 'u1' })).resolves.toEqual({ tickets: [] });
  });

  test('un error del bus se propaga sin traducir en los puertos', async () => {
    const { bus, llamadas } = creaBus();
    llamadas.enviar.mockRejectedValueOnce(new Error('bus caído'));
    const servicios = crearServicios(bus);
    await expect(servicios.auth.login({ correo: 'a@b.c', password: 'x' })).rejects.toThrow('bus caído');
  });
});
