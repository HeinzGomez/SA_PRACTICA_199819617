// HeinzGomez - Práctica 9: pruebas de las utilidades puras (validaciones, formato, simulador)
import { estadoInicial, paso, PARAMETROS_DEFECTO, simularCompleto } from '../lib/simulador';
import { validarEvento, validarRegistro, coincideFiltro } from '../lib/validaciones';
import { duracion, fechaCorta, fechaLarga, hashCorto, nivelCupo } from '../lib/formato';
import type { Evento } from '../lib/types';

const evento: Evento = {
  id: 'evt-k8s-01', titulo: 'Taller de Kubernetes', descripcion: '', tipo: 'TALLER',
  curso_codigo: '0970', curso_nombre: 'Software Avanzado', fecha_inicio: '2026-10-05T15:00:00.000Z',
  duracion_min: 180, lugar: 'Lab T-3', cupo_total: 40, cupo_disponible: 40,
  ponente: { nombre: 'María Pérez', titulo: 'Architect', bio: '', correo: 'mp@usac.edu.gt' },
  prerrequisitos: [], tiene_certificacion: true,
};

describe('simulador de ráfaga', () => {
  test('conserva la cantidad de solicitudes y nunca sobre-vende', () => {
    const r = simularCompleto(PARAMETROS_DEFECTO);
    expect(r.terminado).toBe(true);
    expect(r.confirmadas).toBe(PARAMETROS_DEFECTO.cupo);
    expect(r.confirmadas + r.rechazadasSinCupo).toBe(PARAMETROS_DEFECTO.solicitudes);
    expect(r.maxCola).toBeGreaterThan(0);
  });
  test('más consumidores drenan la cola antes', () => {
    const pocos = simularCompleto({ ...PARAMETROS_DEFECTO, consumidores: 2 });
    const muchos = simularCompleto({ ...PARAMETROS_DEFECTO, consumidores: 16 });
    expect(muchos.t).toBeLessThan(pocos.t);
    const s1 = paso(PARAMETROS_DEFECTO, estadoInicial(PARAMETROS_DEFECTO), 50);
    expect(s1.llegadas).toBeGreaterThan(0);
  });
});

describe('validaciones y filtros', () => {
  test('registro', () => {
    expect(validarRegistro({ nombre: 'Heinz', carnet: '202010044', correo: 'h@usac.edu.gt', password: 'Segura123' })).toEqual([]);
    expect(validarRegistro({ nombre: 'A', carnet: '1', correo: 'x@gmail.com', password: 'x' }).length).toBeGreaterThan(3);
  });
  test('evento', () => {
    expect(validarEvento({})).toHaveLength(7);
    expect(validarEvento({ ...evento, cupo_total: 0 })).toContain('El cupo total debe ser un entero entre 1 y 5000');
  });
  test('coincideFiltro', () => {
    expect(coincideFiltro(evento, { hasta: '2026-10-05' })).toBe(true);
    expect(coincideFiltro(evento, { tipo: 'CONFERENCIA' })).toBe(false);
    expect(coincideFiltro(evento, { curso: '0774' })).toBe(false);
  });
});

describe('formato', () => {
  test('cupos, duración y hash', () => {
    expect(nivelCupo(0, 10)).toBe('agotado');
    expect(nivelCupo(1, 10)).toBe('bajo');
    expect(nivelCupo(4, 10)).toBe('medio');
    expect(nivelCupo(9, 10)).toBe('alto');
    expect(duracion(150)).toBe('2 h 30 min');
    expect(duracion(0)).toBe('0 min');
    expect(hashCorto('a'.repeat(64))).toHaveLength(19);
    expect(hashCorto('')).toBe('—');
  });
  test('fechas inválidas no revientan la interfaz', () => {
    expect(fechaCorta('')).toBe('—');
    expect(fechaCorta('no-es-fecha')).toBe('—');
    expect(fechaLarga(undefined as unknown as string)).toBe('—');
    expect(fechaCorta(evento.fecha_inicio)).not.toBe('—');
  });
});
