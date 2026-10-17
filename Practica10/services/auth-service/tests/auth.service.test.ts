// HeinzGomez - Práctica 9: pruebas unitarias del dominio de autenticación (CDU 1.1, 1.2, 1.3)
import { AuthService, publico } from '../src/service/auth.service';
import { EnMemoriaUsuarioRepository } from '../src/repository/en-memoria-usuario.repository';
import { ConfiguracionAuth, RegistroInput } from '../src/types/auth';
import { UsuarioConHash } from '../src/types/usuario';

const cfg: ConfiguracionAuth = {
  jwtSecret: 'secreto-de-prueba',
  jwtExpiresIn: '1h',
  dominiosPermitidos: ['ingenieria.usac.edu.gt', 'usac.edu.gt'],
  bcryptRounds: 4,
};

const valido: RegistroInput = {
  nombre: 'Heinz Gómez',
  carnet: '202010044',
  correo: 'Heinz@Ingenieria.usac.edu.gt',
  password: 'Segura123',
};

const crear = () => {
  const repo = new EnMemoriaUsuarioRepository();
  return { repo, svc: new AuthService(repo, cfg) };
};

describe('AuthService · registro (CDU 1.2)', () => {
  test('registra, normaliza el correo y jamás devuelve el hash', async () => {
    const { repo, svc } = crear();
    const r = await svc.register(valido);

    expect(r.token).toBeTruthy();
    expect(r.usuario.correo).toBe('heinz@ingenieria.usac.edu.gt');
    expect(r.usuario.rol).toBe('ESTUDIANTE');
    expect(r.usuario).not.toHaveProperty('passwordHash');

    const guardado = await repo.buscarPorCorreo('heinz@ingenieria.usac.edu.gt');
    expect(guardado?.passwordHash).not.toBe(valido.password);
    expect(await repo.buscarPorId(r.usuario.id)).not.toBeNull();
  });

  test('devuelve todos los errores de validación a la vez', () => {
    const { svc } = crear();
    const errores = svc.validarRegistro({ nombre: 'A', carnet: '12', correo: 'x@sin-punto', password: 'corta' });
    expect(errores).toEqual([
      'El nombre debe tener al menos 3 caracteres',
      'El carnet debe tener 9 dígitos',
      'Correo con formato inválido',
      'La contraseña debe tener mínimo 8 caracteres, una mayúscula y un número',
    ]);
  });

  test('rechaza el correo fuera del dominio institucional', () => {
    const { svc } = crear();
    expect(svc.validarRegistro({ ...valido, correo: 'alguien@gmail.com' })).toEqual([
      'Debe usar su correo institucional (ingenieria.usac.edu.gt, usac.edu.gt)',
    ]);
    expect(svc.validarRegistro({ ...valido, correo: 'alguien@otra.usac.edu.gt' })).toHaveLength(1);
    expect(svc.validarRegistro({ ...valido, correo: 'alguien@usac.edu.gt' })).toHaveLength(0);
  });

  test('acepta el segundo dominio permitido', async () => {
    const { svc } = crear();
    const r = await svc.register({ ...valido, correo: 'Otro@Usac.Edu.gt' });
    expect(r.usuario.correo).toBe('otro@usac.edu.gt');
  });

  test('campos ausentes se reportan como argumento inválido', async () => {
    const { svc } = crear();
    expect(svc.validarRegistro({} as RegistroInput)).toHaveLength(4);
    expect(svc.validarRegistro({ nombre: '   ', carnet: '', correo: '', password: '' })).toHaveLength(4);
    await expect(svc.register({ ...valido, correo: 'no-es-correo' }))
      .rejects.toMatchObject({ code: 'INVALID_ARGUMENT' });
    await expect(svc.register({} as RegistroInput)).rejects.toMatchObject({ code: 'INVALID_ARGUMENT' });
  });

  test('correo duplicado devuelve ALREADY_EXISTS', async () => {
    const { svc } = crear();
    await svc.register(valido);
    await expect(svc.register(valido)).rejects.toMatchObject({ code: 'ALREADY_EXISTS' });
  });

  test('el carnet debe ser exactamente 9 dígitos', () => {
    const { svc } = crear();
    expect(svc.validarRegistro({ ...valido, carnet: '20201004' })).toContain('El carnet debe tener 9 dígitos');
    expect(svc.validarRegistro({ ...valido, carnet: '20201004a' })).toContain('El carnet debe tener 9 dígitos');
    expect(svc.validarRegistro({ ...valido, carnet: ' 202010044 ' })).toHaveLength(0);
  });

  test('la contraseña exige largo, mayúscula y número', () => {
    const { svc } = crear();
    expect(svc.validarRegistro({ ...valido, password: 'segura123' })).toHaveLength(1); // sin mayúscula
    expect(svc.validarRegistro({ ...valido, password: 'Seguraaaa' })).toHaveLength(1); // sin número
    expect(svc.validarRegistro({ ...valido, password: 'Segura1' })).toHaveLength(1);   // 7 caracteres
    expect(svc.validarRegistro({ ...valido, password: 'Segura123' })).toHaveLength(0); // cumple las tres
  });
});

describe('AuthService · login y tokens (CDU 1.3)', () => {
  test('login correcto produce un token verificable', async () => {
    const { svc } = crear();
    await svc.register(valido);
    const { token, usuario } = await svc.login('HEINZ@ingenieria.usac.edu.gt', 'Segura123');

    const v = await svc.validateToken(token);
    expect(v.valido).toBe(true);
    expect(v.usuario?.id).toBe(usuario.id);
    expect(v.usuario).not.toHaveProperty('passwordHash');
  });

  test('credenciales incorrectas siempre dan el mismo mensaje genérico', async () => {
    const { svc } = crear();
    await svc.register(valido);
    await expect(svc.login(valido.correo, 'Mala12345')).rejects.toThrow('Credenciales incorrectas');
    await expect(svc.login('nadie@ingenieria.usac.edu.gt', 'x')).rejects.toThrow('Credenciales incorrectas');
  });

  test('entradas sin correo ni contraseña no revientan: devuelven UNAUTHENTICATED', async () => {
    const { svc } = crear();
    await svc.register(valido);
    await expect(svc.login(undefined as unknown as string, 'Segura123'))
      .rejects.toMatchObject({ code: 'UNAUTHENTICATED' });
    await expect(svc.login(valido.correo, undefined as unknown as string))
      .rejects.toMatchObject({ code: 'UNAUTHENTICATED' });
    await expect(svc.login(undefined as unknown as string, undefined as unknown as string))
      .rejects.toMatchObject({ code: 'UNAUTHENTICATED' });
  });

  test('login recorta y normaliza el correo', async () => {
    const { svc } = crear();
    await svc.register(valido);
    const { usuario } = await svc.login('  heinz@ingenieria.usac.edu.gt  ', 'Segura123');
    expect(usuario.correo).toBe('heinz@ingenieria.usac.edu.gt');
  });

  test('validateToken rechaza basura, tokens alterados y tokens de otro servicio', async () => {
    const svc = new AuthService(new EnMemoriaUsuarioRepository(), cfg);
    expect((await svc.validateToken('basura')).valido).toBe(false);
    expect((await svc.validateToken('')).valido).toBe(false);

    const { token } = await svc.register(valido);
    expect((await svc.validateToken(token)).valido).toBe(true);

    // el usuario ya no está en ese repositorio -> el token deja de servir
    const ajeno = new AuthService(new EnMemoriaUsuarioRepository(), cfg);
    expect((await ajeno.validateToken(token)).valido).toBe(false);
  });

  test('token firmado con otro secreto no valida', async () => {
    const { svc } = crear();
    await svc.register(valido);
    const { token } = await svc.register({ ...valido, correo: 'otra@usac.edu.gt' });
    const ajeno = new AuthService(new EnMemoriaUsuarioRepository(), { ...cfg, jwtSecret: 'otro' });
    expect((await ajeno.validateToken(token)).valido).toBe(false);
    expect((await svc.validateToken(token)).valido).toBe(true);
  });
});

describe('publico()', () => {
  test('elimina passwordHash conservando el resto', () => {
    const u: UsuarioConHash = {
      id: '1', nombre: 'n', carnet: 'c', correo: 'e', rol: 'ADMINISTRADOR', passwordHash: 'h',
    };
    expect(publico(u)).toEqual({ id: '1', nombre: 'n', carnet: 'c', correo: 'e', rol: 'ADMINISTRADOR' });
  });
});

describe('EnMemoriaUsuarioRepository', () => {
  test('consultas que no encuentran devuelven null', async () => {
    const repo = new EnMemoriaUsuarioRepository();
    expect(await repo.buscarPorCorreo('nadie@usac.edu.gt')).toBeNull();
    expect(await repo.buscarPorId('no-existe')).toBeNull();
    await repo.crear({ id: 'a', nombre: 'A', carnet: '111111111', correo: 'a@usac.edu.gt', rol: 'ESTUDIANTE', passwordHash: 'h' });
    expect((await repo.buscarPorId('a'))?.nombre).toBe('A');
    expect(await repo.buscarPorId('b')).toBeNull();
  });
});
