// HeinzGomez - Práctica 9: pruebas de la configuración leída del entorno.
import { leerEntorno } from '../src/config';

describe('config/entorno', () => {
  test('usa el valor por defecto cuando ninguna variable está definida', () => {
    const e = leerEntorno({});
    expect(e).toEqual({
      puerto: 8080,
      rabbitmqUrl: 'amqp://guest:guest@localhost:5672/',
      rpcTimeoutMs: 3000,
      origenesPermitidos: ['http://localhost:3000', '*.vercel.app'],
      cupoStreamMs: 2000,
      limiteReservasPorMinuto: 20,
    });
  });

  test('lee cada variable del entorno con su tipo correcto', () => {
    const e = leerEntorno({
      PORT: '9090',
      RABBITMQ_URL: 'amqp://cola:5672/vhost',
      RPC_TIMEOUT_MS: '750',
      CUPO_STREAM_MS: '400',
      RESERVAS_POR_MINUTO: '5',
      CORS_ORIGINS: 'https://a.example.com',
    });
    expect(e.puerto).toBe(9090);
    expect(e.rabbitmqUrl).toBe('amqp://cola:5672/vhost');
    expect(e.rpcTimeoutMs).toBe(750);
    expect(e.cupoStreamMs).toBe(400);
    expect(e.limiteReservasPorMinuto).toBe(5);
    expect(e.origenesPermitidos).toEqual(['https://a.example.com']);
  });

  test('parte la lista de orígenes, recorta espacios y descarta los vacíos', () => {
    const e = leerEntorno({
      CORS_ORIGINS: ' https://a.example.com ,  ,http://localhost:5173 ,,',
    });
    expect(e.origenesPermitidos).toEqual([
      'https://a.example.com',
      'http://localhost:5173',
    ]);
  });

  test('una lista vacía deja orígenes permitidos sin elementos', () => {
    expect(leerEntorno({ CORS_ORIGINS: '' }).origenesPermitidos).toEqual([]);
    expect(
      leerEntorno({ CORS_ORIGINS: '   ,   ' }).origenesPermitidos
    ).toEqual([]);
  });

  test('un valor no numérico se convierte en NaN en lugar de romper el proceso', () => {
    expect(leerEntorno({ PORT: 'no-numero' }).puerto).toBeNaN();
    expect(leerEntorno({ RPC_TIMEOUT_MS: '' }).rpcTimeoutMs).toBe(0);
    expect(
      leerEntorno({ RESERVAS_POR_MINUTO: '-1' }).limiteReservasPorMinuto
    ).toBe(-1);
  });

  test('sin argumentos lee process.env', () => {
    const previo = { ...process.env };
    process.env.PORT = '4444';
    process.env.CORS_ORIGINS = 'http://uno.test,http://dos.test';
    try {
      const e = leerEntorno();
      expect(e.puerto).toBe(4444);
      expect(e.origenesPermitidos).toEqual([
        'http://uno.test',
        'http://dos.test',
      ]);
    } finally {
      process.env.PORT = previo.PORT;
      if (previo.CORS_ORIGINS === undefined) delete process.env.CORS_ORIGINS;
      else process.env.CORS_ORIGINS = previo.CORS_ORIGINS;
    }
  });
});
