import { Pool } from "pg";
import {
  ActualizarPasswordParams,
  CrearUsuarioParams,
  UsuarioRow,
  CrearUsuarioGoogleData
} from "../types/user.types";

export interface UserRepository {
  crear(params: CrearUsuarioParams): Promise<UsuarioRow>;
  buscarPorCorreo(correo: string): Promise<UsuarioRow | null>;
  buscarPorId(id_usuario: number): Promise<UsuarioRow | null>;

  obtenerPorGoogleId(googleId: string): Promise<UsuarioRow | null>;
  asociarGoogleId(idUsuario: number,googleId: string): Promise<void>;
  crearUsuarioGoogle(data: CrearUsuarioGoogleData): Promise<UsuarioRow>;
  listarTodos(): Promise<UsuarioRow[]>;

  correoExiste(correo: string): Promise<boolean>;
  passwordHash(correo: string): Promise<string | null>;
  passwordHashPorId(id_usuario: number): Promise<string | null>;
  actualizarPassword(params: ActualizarPasswordParams): Promise<void>;
}

export class PostgresUserRepository implements UserRepository {
  constructor(private pool: Pool) {}

  async crear(params: CrearUsuarioParams): Promise<UsuarioRow> {
    const client = await this.pool.connect();
    try {
      await client.query("CALL sp_registrar_usuario($1, $2, $3, $4, $5)", [
        params.nombre,
        params.apellido,
        params.correo,
        params.password_hash,
        params.estado,
      ]);

      const { rows } = await client.query<UsuarioRow>(
        "SELECT id_usuario, nombre, apellido, correo_institucional, estado, fecha_registro FROM usuario WHERE correo_institucional = $1",
        [params.correo.toLowerCase()]
      );

      return rows[0];
    } finally {
      client.release();
    }
  }

  async buscarPorCorreo(correo: string): Promise<UsuarioRow | null> {
    const { rows } = await this.pool.query<UsuarioRow>(
      "SELECT id_usuario, nombre, apellido, correo_institucional,google_id, estado, fecha_registro FROM usuario WHERE correo_institucional = $1",
      [correo.toLowerCase()]
    );
    return rows[0] ?? null;
  }

  async buscarPorId(id_usuario: number): Promise<UsuarioRow | null> {
    const { rows } = await this.pool.query<UsuarioRow>(
      "SELECT id_usuario, nombre, apellido, correo_institucional, estado, fecha_registro FROM usuario WHERE id_usuario = $1",
      [id_usuario]
    );
    return rows[0] ?? null;
  }

  async correoExiste(correo: string): Promise<boolean> {
    const { rows } = await this.pool.query<{ fn_correo_institucional_valido: boolean }>(
      "SELECT fn_correo_institucional_valido($1)",
      [correo]
    );
    return rows[0]?.fn_correo_institucional_valido ?? false;
  }

  async passwordHash(correo: string): Promise<string | null> {
    const { rows } = await this.pool.query<{ password_hash: string }>(
      "SELECT password_hash FROM usuario WHERE correo_institucional = $1",
      [correo.toLowerCase()]
    );
    return rows[0]?.password_hash ?? null;
  }

  async passwordHashPorId(id_usuario: number): Promise<string | null> {
    const { rows } = await this.pool.query<{ password_hash: string }>(
      "SELECT password_hash FROM usuario WHERE id_usuario = $1",
      [id_usuario]
    );
    return rows[0]?.password_hash ?? null;
  }

  async actualizarPassword(params: ActualizarPasswordParams): Promise<void> {
    await this.pool.query("UPDATE usuario SET password_hash = $2 WHERE id_usuario = $1", [
      params.id_usuario,
      params.password_hash,
    ]);
  }

  async obtenerPorGoogleId(googleId: string): Promise<UsuarioRow | null> {

    const result = await this.pool.query<UsuarioRow>(
      `
      SELECT
        id_usuario,
        nombre,
        apellido,
        correo_institucional,
        password_hash,
        google_id,
        estado,
        fecha_registro
      FROM usuario
      WHERE google_id = $1
      `,
      [googleId]
    );

    return result.rows[0] ?? null;
  }

  async asociarGoogleId(idUsuario: number,googleId: string): Promise<void> {

    await this.pool.query(
      `
      UPDATE usuario
      SET google_id = $1
      WHERE id_usuario = $2
      `,
      [googleId, idUsuario]
    );
  }

  async crearUsuarioGoogle( data: CrearUsuarioGoogleData): Promise<UsuarioRow> {

    const client = await this.pool.connect();

    try {
      await client.query(
        `
        CALL sp_registrar_usuario_google($1, $2, $3, $4, $5)
        `,
        [
          data.nombre,
          data.apellido,
          data.correo,
          data.googleId,
          data.estado,
        ]
      );

      const result = await client.query<UsuarioRow>(
        `
        SELECT
          id_usuario,
          nombre,
          apellido,
          correo_institucional,
          password_hash,
          google_id,
          estado,
          fecha_registro
        FROM usuario
        WHERE google_id = $1
        `,
        [data.googleId]
      );

      return result.rows[0];
    } finally {
      client.release();
    }
  }

  async listarTodos(): Promise<UsuarioRow[]> {
    const result = await this.pool.query<UsuarioRow>(
      `
      SELECT
        id_usuario,
        nombre,
        apellido,
        correo_institucional,
        password_hash,
        google_id,
        estado,
        fecha_registro
      FROM usuario
      ORDER BY id_usuario
      `
    );

    return result.rows;
  }

}
