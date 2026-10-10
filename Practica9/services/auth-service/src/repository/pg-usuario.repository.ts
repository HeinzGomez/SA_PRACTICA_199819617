// HeinzGomez - Práctica 9: repositorio PostgreSQL (auth_db) del Servicio de Autenticación
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { UsuarioConHash } from '../types/usuario';
import { UsuarioRepository } from './usuario.repository';

const MIGRACION = `
CREATE TABLE IF NOT EXISTS usuario (
  id            UUID PRIMARY KEY,
  nombre        VARCHAR(120) NOT NULL,
  carnet        CHAR(9) NOT NULL,
  correo        VARCHAR(150) NOT NULL UNIQUE,
  rol           VARCHAR(15) NOT NULL CHECK (rol IN ('ESTUDIANTE','ADMINISTRADOR')),
  password_hash VARCHAR(100) NOT NULL,
  creado_en     TIMESTAMPTZ NOT NULL DEFAULT now()
);`;

type Fila = { id: string; nombre: string; carnet: string; correo: string; rol: 'ESTUDIANTE' | 'ADMINISTRADOR'; password_hash: string };

const mapear = (r: Fila): UsuarioConHash => ({
  id: r.id, nombre: r.nombre, carnet: r.carnet, correo: r.correo, rol: r.rol, passwordHash: r.password_hash,
});

export class PgUsuarioRepository implements UsuarioRepository {
  constructor(private readonly pool: Pool) {}

  /** No forma parte del puerto: solo lo usa el arranque para asegurar el esquema y el admin semilla. */
  async migrar(adminCorreo: string, adminPassword: string): Promise<void> {
    await this.pool.query(MIGRACION);
    if (!(await this.buscarPorCorreo(adminCorreo))) {
      await this.crear({
        id: randomUUID(), nombre: 'Administrador Academix', carnet: '000000000', correo: adminCorreo,
        rol: 'ADMINISTRADOR', passwordHash: await bcrypt.hash(adminPassword, 10),
      });
    }
  }

  async buscarPorCorreo(correo: string) {
    const r = await this.pool.query<Fila>('SELECT * FROM usuario WHERE correo=$1', [correo]);
    return r.rows[0] ? mapear(r.rows[0]) : null;
  }

  async buscarPorId(id: string) {
    const r = await this.pool.query<Fila>('SELECT * FROM usuario WHERE id::text=$1', [id]);
    return r.rows[0] ? mapear(r.rows[0]) : null;
  }

  async crear(u: UsuarioConHash) {
    await this.pool.query(
      'INSERT INTO usuario (id,nombre,carnet,correo,rol,password_hash) VALUES ($1,$2,$3,$4,$5,$6)',
      [u.id, u.nombre, u.carnet, u.correo, u.rol, u.passwordHash],
    );
  }
}
