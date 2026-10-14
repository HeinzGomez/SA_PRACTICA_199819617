// HeinzGomez - Práctica 10: utilidades compartidas de las pruebas (espías del logger único del proceso).
import type { Logger } from 'pino';
import { loggerPorDefecto } from '../src/observabilidad/logger';

export interface EspiasLogger {
  info: jest.SpyInstance;
  warn: jest.SpyInstance;
  error: jest.SpyInstance;
  restaurar: () => void;
}

/** El logger del servicio es un singleton: basta con espía sus métodos para interceptar todos los módulos. */
export function espiarLogger(log: Logger = loggerPorDefecto()): EspiasLogger {
  const info = jest.spyOn(log, 'info').mockImplementation(() => undefined);
  const warn = jest.spyOn(log, 'warn').mockImplementation(() => undefined);
  const error = jest.spyOn(log, 'error').mockImplementation(() => undefined);
  return {
    info,
    warn,
    error,
    restaurar: () => {
      info.mockRestore();
      warn.mockRestore();
      error.mockRestore();
    },
  };
}
