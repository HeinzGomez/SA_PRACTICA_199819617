// HeinzGomez - Práctica 9: pruebas del consumidor de eventos de dominio (`reserva.confirmada`)
import { EventosController } from '../src/controller/eventos.controller';
import { TalleresService } from '../src/service/talleres.service';
import { EnMemoriaCupoCache } from '../src/repository/en-memoria-cupo.cache';
import { EnMemoriaEventoRepository } from '../src/repository/en-memoria-evento.repository';
import { EVENTOS_SEED } from '../src/repository/seed';
import { Entrada } from '../src/types/mensajes';
import { RK_RESERVA_CONFIRMADA } from '../src/types/reserva';

const construir = () => {
  const repo = new EnMemoriaEventoRepository(EVENTOS_SEED);
  const cache = new EnMemoriaCupoCache();
  EVENTOS_SEED.forEach((e) => cache.cupos.set(e.id, e.cupo_total));
  const sincronizar = jest.fn();
  const servicio = new TalleresService(repo, cache);
  servicio.sincronizarCupo = sincronizar;
  return { sincronizar, manejadores: new EventosController(servicio).manejadores() };
};

const entrada = (cuerpo: unknown): Entrada => ({
  operacion: RK_RESERVA_CONFIRMADA,
  cuerpo,
  responder: jest.fn(async () => undefined),
});

describe('EventosController · reserva.confirmada', () => {
  test('expone exactamente la routing key de reservas', () => {
    expect(Object.keys(construir().manejadores)).toEqual([RK_RESERVA_CONFIRMADA]);
    expect(RK_RESERVA_CONFIRMADA).toBe('reserva.confirmada');
  });

  test('persiste el cupo restante que descuenta Reservas', async () => {
    const { manejadores, sincronizar } = construir();
    await manejadores[RK_RESERVA_CONFIRMADA](entrada({
      ticketId: 't-1', usuarioId: 'u-1', eventoId: 'evt-k8s-01', tipo: 'TALLER',
      estado: 'CONFIRMADA', cupoRestante: 12, timestamp: '2026-10-05T15:00:00Z',
    }));
    expect(sincronizar).toHaveBeenCalledWith('evt-k8s-01', 12);
  });

  test('acepta cupoRestante como texto numérico (JSON de Go)', async () => {
    const { manejadores, sincronizar } = construir();
    await manejadores[RK_RESERVA_CONFIRMADA](entrada({ eventoId: 'evt-k8s-01', cupoRestante: '9' }));
    expect(sincronizar).toHaveBeenCalledWith('evt-k8s-01', 9);
  });

  test('un mensaje incompleto lanza (NACK -> DLQ)', async () => {
    const { manejadores, sincronizar } = construir();

    await expect(manejadores[RK_RESERVA_CONFIRMADA](entrada({ cupoRestante: 1 })))
      .rejects.toThrow('reserva.confirmada inválido');
    await expect(manejadores[RK_RESERVA_CONFIRMADA](entrada({ eventoId: 'e' })))
      .rejects.toThrow('reserva.confirmada inválido');
    await expect(manejadores[RK_RESERVA_CONFIRMADA](entrada(undefined)))
      .rejects.toThrow('reserva.confirmada inválido');
    expect(sincronizar).not.toHaveBeenCalled();
  });

  test('si el servicio lanza, el error sube para que el consumidor haga NACK', async () => {
    const { manejadores, sincronizar } = construir();
    sincronizar.mockRejectedValueOnce(new Error('postgres caído'));
    await expect(manejadores[RK_RESERVA_CONFIRMADA](entrada({ eventoId: 'e', cupoRestante: 1 })))
      .rejects.toThrow('postgres caído');
  });
});
