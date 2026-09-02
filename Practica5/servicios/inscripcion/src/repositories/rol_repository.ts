import { Pool } from "pg";
import { AsignarRolParams, CambiarRolParams, ComprobarRolParams, EliminarRolParams, RolRow, UsuarioRolRow } from "../types/rol.types";

export interface RolRepository {
  asignarRol(params: AsignarRolParams): Promise<void>;
  cambiarRol(params: CambiarRolParams): Promise<void>;
  eliminarRol(params: EliminarRolParams): Promise<void>;
  tieneRol(params: ComprobarRolParams): Promise<boolean>;
  rolesDeUsuario(idUsuario: number): Promise<UsuarioRolRow[]>;
  buscarRolPorId(idRol: number): Promise<RolRow | null>;
  buscarRolPorNombre(nombre: string): Promise<RolRow | null>;
}

export class PostgresRolRepository implements RolRepository {
  constructor(private pool: Pool) { }

  async asignarRol(params: AsignarRolParams): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      await client.query("SELECT set_config('app.usuario_id', $1, true)", [
        String(params.id_usuario),
      ]);
      await client.query(
        "INSERT INTO usuario_rol (id_rol, id_usuario) VALUES ($1, $2) ON CONFLICT DO NOTHING",
        [params.id_rol, params.id_usuario]
      );
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async tieneRol(params: ComprobarRolParams): Promise<boolean> {
    const { rows } = await this.pool.query<{ fn_usuario_tiene_rol: boolean }>(
      "SELECT fn_usuario_tiene_rol($1, $2)",
      [params.id_usuario, params.nombre_rol]
    );
    return rows[0]?.fn_usuario_tiene_rol ?? false;
  }

  async rolesDeUsuario(idUsuario: number): Promise<UsuarioRolRow[]> {
    const { rows } = await this.pool.query<UsuarioRolRow>(
      "SELECT id_usuario, id_rol, rol, descripcion FROM vw_usuarios_roles WHERE id_usuario = $1 ORDER BY id_rol",
      [idUsuario]
    );
    return rows;
  }

  async buscarRolPorId(idRol: number): Promise<RolRow | null> {
    const { rows } = await this.pool.query<RolRow>(
      "SELECT id_rol, nombre, descripcion FROM rol WHERE id_rol = $1",
      [idRol]
    );
    return rows[0] ?? null;
  }

  async buscarRolPorNombre(nombre: string): Promise<RolRow | null> {
    const { rows } = await this.pool.query<RolRow>(
      "SELECT id_rol, nombre, descripcion FROM rol WHERE LOWER(nombre) = LOWER($1)",
      [nombre]
    );
    return rows[0] ?? null;
  }

  async cambiarRol(params: CambiarRolParams): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      await client.query("SELECT set_config('app.usuario_id', $1, true)", [
        String(params.id_usuario),
      ]);
      await client.query(
        "DELETE FROM usuario_rol WHERE id_rol = $1 AND id_usuario = $2",
        [params.id_rol_actual, params.id_usuario]
      );
      await client.query(
        "INSERT INTO usuario_rol (id_rol, id_usuario) VALUES ($1, $2) ON CONFLICT DO NOTHING",
        [params.id_rol_nuevo, params.id_usuario]
      );
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async eliminarRol(params: EliminarRolParams): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      await client.query("SELECT set_config('app.usuario_id', $1, true)", [
        String(params.id_usuario),
      ]);
      const result = await client.query(
        "DELETE FROM usuario_rol WHERE id_rol = $1 AND id_usuario = $2",
        [params.id_rol, params.id_usuario]
      );
      if (result.rowCount === 0) {
        throw new Error("El usuario no tiene asignado el rol indicado");
      }
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
}
