// HeinzGomez - Práctica 9: pruebas de los repositorios de usuarios (puerto de persistencia)
import { Pool } from 'pg';
import { PgUsuarioRepository } from '../src/repository/pg-usuario.repository';
import { EnMemoriaUsuarioRepository } from '../src/repository/en-memoria-usuario.repository';
import { UsuarioConHash } from '../src/types/usuario';

type Resultado = { rows: unknown[] };

const usuario: UsuarioConHash = {
  id: '11111111-2222-3333-4444-555555555555',
  nombre: 'Heinz Gómez',
  carnet: '202010044',
  correo: 'heinz@ingenieria.usac.edu.gt',
  rol: 'ESTUDIANTE',
  passwordHash: '$2a$04$abcdefghijklmnopqrstuv',
};

const fila = (u: UsuarioConHash) => ({
  id: u.id, nombre: u.nombre, carnet: u.carnet, correo: u.correo, rol: u.rol, password_hash: u.passwordHash,
});

/** Pool falso: solo registra las sentencias y devuelve lo que se programe. */
const poolFalso = () => {
  const query = jest.fn(async (_sql?: string, _params?: unknown[]): Promise<Resultado> => ({ rows: [] }));
  return { pool: { query } as unknown as Pool, query };
};

describe('EnMemoriaUsuarioRepository', () => {
  test('almacena y recupera por correo e id', async () => {
    const repo = new EnMemoriaUsuarioRepository();
    await repo.crear(usuario);
    expect(await repo.buscarPorCorreo(usuario.correo)).toEqual(usuario);
    expect(await repo.buscarPorId(usuario.id)).toEqual(usuario);
  });

  test('no encuentra lo que no existe', async () => {
    const repo = new EnMemoriaUsuarioRepository();
    expect(await repo.buscarPorCorreo('nada@usac.edu.gt')).toBeNull();
    expect(await repo.buscarPorId('ninguno')).toBeNull();
  });

  test('sobrescribe si el id se repite', async () => {
    const repo = new EnMemoriaUsuarioRepository();
    await repo.crear(usuario);
    await repo.crear({ ...usuario, nombre: 'Otro Nombre' });
    expect((await repo.buscarPorId(usuario.id))?.nombre).toBe('Otro Nombre');
  });
});

describe('PgUsuarioRepository', () => {
  test('buscarPorCorreo mapea la fila del esquema relacional', async () => {
    const { pool, query } = poolFalso();
    query.mockResolvedValueOnce({ rows: [fila(usuario)] });

    expect(await new PgUsuarioRepository(pool).buscarPorCorreo(usuario.correo)).toEqual(usuario);
    expect(query).toHaveBeenCalledWith('SELECT * FROM usuario WHERE correo=$1', [usuario.correo]);
  });

  test('buscarPorCorreo devuelve null cuando no hay fila', async () => {
    const { pool, query } = poolFalso();
    query.mockResolvedValueOnce({ rows: [] });
    expect(await new PgUsuarioRepository(pool).buscarPorCorreo('nadie@usac.edu.gt')).toBeNull();
  });

  test('buscarPorId consulta por id en texto', async () => {
    const { pool, query } = poolFalso();
    const repo = new PgUsuarioRepository(pool);

    query.mockResolvedValueOnce({ rows: [fila(usuario)] });
    expect(await repo.buscarPorId(usuario.id)).toEqual(usuario);
    expect(query).toHaveBeenCalledWith('SELECT * FROM usuario WHERE id::text=$1', [usuario.id]);

    query.mockResolvedValueOnce({ rows: [] });
    expect(await repo.buscarPorId('falso')).toBeNull();
  });

  test('crear inserta los seis campos en el orden del esquema', async () => {
    const { pool, query } = poolFalso();
    await new PgUsuarioRepository(pool).crear(usuario);

    expect(query).toHaveBeenCalledWith(
      'INSERT INTO usuario (id,nombre,carnet,correo,rol,password_hash) VALUES ($1,$2,$3,$4,$5,$6)',
      [usuario.id, usuario.nombre, usuario.carnet, usuario.correo, usuario.rol, usuario.passwordHash],
    );
  });

  test('migrar crea el esquema y siembra el administrador cuando falta', async () => {
    const { pool, query } = poolFalso();
    query
      .mockResolvedValueOnce({ rows: [] }) // CREATE TABLE
      .mockResolvedValueOnce({ rows: [] }); // SELECT del admin
    query.mockImplementationOnce(async () => ({ rows: [] })); // INSERT del admin

    await new PgUsuarioRepository(pool).migrar('admin@ingenieria.usac.edu.gt', 'Admin12345');

    expect(query).toHaveBeenCalledTimes(3);
    expect(query.mock.calls[0][0]).toContain('CREATE TABLE IF NOT EXISTS usuario');

    const argumentos = query.mock.calls[2][1] as unknown[];
    expect(query.mock.calls[2][0]).toContain('INSERT INTO usuario');
    expect(argumentos[3]).toBe('admin@ingenieria.usac.edu.gt');
    expect(argumentos[4]).toBe('ADMINISTRADOR');
    expect(typeof argumentos[5]).toBe('string');
    expect(argumentos[5]).not.toBe('Admin12345');
  });

  test('migrar no duplica el administrador si ya existe', async () => {
    const { pool, query } = poolFalso();
    query
      .mockResolvedValueOnce({ rows: [] }) // CREATE TABLE
      .mockResolvedValueOnce({ rows: [fila({ ...usuario, rol: 'ADMINISTRADOR' })] }); // el admin ya está

    await new PgUsuarioRepository(pool).migrar('admin@ingenieria.usac.edu.gt', 'Admin12345');
    expect(query).toHaveBeenCalledTimes(2);
  });
});
