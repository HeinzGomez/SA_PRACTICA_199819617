import { Pool } from "pg";
import { CrearSesionParams, SesionRow } from "../types/sesion.types";

export interface SesionRepository {
  crear(params: CrearSesionParams): Promise<SesionRow>;
  cerrar(idSesion: number): Promise<void>;
  validar(idSesion: number): Promise<boolean>;
  buscarPorId(idSesion: number): Promise<SesionRow | null>;
}

export class PostgresSesionRepository implements SesionRepository {
  constructor(private pool: Pool) {}

  async crear(params: CrearSesionParams): Promise<SesionRow> {
    const client = await this.pool.connect();
    try {
      await client.query("CALL sp_crear_sesion($1, $2, $3)", [
        params.id_usuario,
        params.token_hash,
        params.fecha_expiracion,
      ]);

      const { rows } = await client.query<SesionRow>(
        "SELECT id_sesion, id_usuario, token_hash, fecha_creacion, fecha_expiracion, estado FROM sesion WHERE id_usuario = $1 ORDER BY fecha_creacion DESC LIMIT 1",
        [params.id_usuario]
      );

      return rows[0];
    } finally {
      client.release();
    }
  }

  async cerrar(idSesion: number): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query("CALL sp_cerrar_sesion($1)", [idSesion]);
    } finally {
      client.release();
    }
  }

  async validar(idSesion: number): Promise<boolean> {
    const { rows } = await this.pool.query<{ fn_sesion_valida: boolean }>(
      "SELECT fn_sesion_valida($1)",
      [idSesion]
    );
    return rows[0]?.fn_sesion_valida ?? false;
  }

  async buscarPorId(idSesion: number): Promise<SesionRow | null> {
    const { rows } = await this.pool.query<SesionRow>(
      "SELECT id_sesion, id_usuario, token_hash, fecha_creacion, fecha_expiracion, estado FROM sesion WHERE id_sesion = $1",
      [idSesion]
    );
    return rows[0] ?? null;
  }
}
