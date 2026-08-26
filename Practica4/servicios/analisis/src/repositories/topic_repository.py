from abc import ABC, abstractmethod
from typing import Optional

from psycopg2.pool import ThreadedConnectionPool

from config.database import get_database
from models.topic import (
    ConsultarTemasParams,
    ConsultarTemasResult,
    ConsultarUnidadesParams,
    ConsultarUnidadesResult,
    EditarTemaParams,
    EditarUnidadParams,
    RegistrarTemaParams,
    RegistrarUnidadParams,
    Tema,
    Unidad,
)

PAGE_SIZE = 10


def _scan_unidad(row: tuple) -> Unidad:
    return Unidad(
        id_unidad=row[0],
        nombre=row[1],
        descripcion=row[2],
    )


def _scan_tema(row: tuple) -> Tema:
    return Tema(
        id_tema=row[0],
        id_unidad=row[1],
        nombre=row[2],
        descripcion=row[3],
    )


class TopicRepository(ABC):
    @abstractmethod
    def crear_unidad(self, params: RegistrarUnidadParams) -> Unidad:
        """Crea una nueva unidad."""

    @abstractmethod
    def editar_unidad(self, params: EditarUnidadParams) -> Unidad:
        """Actualiza los datos de una unidad."""

    @abstractmethod
    def eliminar_unidad(self, id_unidad: int) -> None:
        """Elimina una unidad."""

    @abstractmethod
    def consultar_unidades(
        self, params: ConsultarUnidadesParams
    ) -> ConsultarUnidadesResult:
        """Consulta el listado paginado de unidades."""

    @abstractmethod
    def crear_tema(self, params: RegistrarTemaParams) -> Tema:
        """Crea un nuevo tema."""

    @abstractmethod
    def editar_tema(self, params: EditarTemaParams) -> Tema:
        """Actualiza los datos de un tema."""

    @abstractmethod
    def eliminar_tema(self, id_tema: int) -> None:
        """Elimina un tema."""

    @abstractmethod
    def consultar_temas(
        self, params: ConsultarTemasParams
    ) -> ConsultarTemasResult:
        """Consulta el listado paginado de temas, opcionalmente por unidad."""


class PostgresTopicRepository(TopicRepository):
    def __init__(self, pool: Optional[ThreadedConnectionPool] = None):
        self.pool = pool if pool is not None else get_database()

    def crear_unidad(self, params: RegistrarUnidadParams) -> Unidad:
        conn = self.pool.getconn()
        try:
            with conn.cursor() as cur:
                cur.execute(
                    """INSERT INTO unidad(nombre, descripcion)
                       VALUES(%s, %s)
                       RETURNING id_unidad, nombre, descripcion""",
                    (params.nombre, params.descripcion),
                )
                row = cur.fetchone()
            conn.commit()
            return _scan_unidad(row)
        finally:
            self.pool.putconn(conn)

    def editar_unidad(self, params: EditarUnidadParams) -> Unidad:
        conn = self.pool.getconn()
        try:
            with conn.cursor() as cur:
                cur.execute(
                    """UPDATE unidad
                        SET nombre = %s, descripcion = %s
                      WHERE id_unidad = %s
                      RETURNING id_unidad, nombre, descripcion""",
                    (params.nombre, params.descripcion, params.id_unidad),
                )
                row = cur.fetchone()
            conn.commit()
            if row is None:
                raise ValueError(f"No se encontró la unidad {params.id_unidad}")
            return _scan_unidad(row)
        finally:
            self.pool.putconn(conn)

    def eliminar_unidad(self, id_unidad: int) -> None:
        conn = self.pool.getconn()
        try:
            with conn.cursor() as cur:
                cur.execute(
                    "DELETE FROM unidad WHERE id_unidad = %s",
                    (id_unidad,),
                )
                if cur.rowcount == 0:
                    raise ValueError(f"No se encontró la unidad {id_unidad}")
            conn.commit()
        finally:
            self.pool.putconn(conn)

    def consultar_unidades(
        self, params: ConsultarUnidadesParams
    ) -> ConsultarUnidadesResult:
        offset = (params.pagina - 1) * PAGE_SIZE
        conn = self.pool.getconn()
        try:
            with conn.cursor() as cur:
                cur.execute(
                    """SELECT id_unidad, nombre, descripcion
                         FROM unidad
                         ORDER BY id_unidad
                         LIMIT %s OFFSET %s""",
                    (PAGE_SIZE, offset),
                )
                registros = [_scan_unidad(row) for row in cur.fetchall()]

            with conn.cursor() as cur:
                cur.execute(
                    """SELECT CEIL(COUNT(*)::numeric / %s)::int
                         FROM unidad""",
                    (PAGE_SIZE,),
                )
                total_paginas = cur.fetchone()[0]

            return ConsultarUnidadesResult(
                registros=registros,
                total_paginas=total_paginas,
            )
        finally:
            self.pool.putconn(conn)

    def crear_tema(self, params: RegistrarTemaParams) -> Tema:
        conn = self.pool.getconn()
        try:
            with conn.cursor() as cur:
                cur.execute(
                    """INSERT INTO tema(id_unidad, nombre, descripcion)
                       VALUES(%s, %s, %s)
                       RETURNING id_tema, id_unidad, nombre, descripcion""",
                    (params.id_unidad, params.nombre, params.descripcion),
                )
                row = cur.fetchone()
            conn.commit()
            return _scan_tema(row)
        finally:
            self.pool.putconn(conn)

    def editar_tema(self, params: EditarTemaParams) -> Tema:
        conn = self.pool.getconn()
        try:
            with conn.cursor() as cur:
                cur.execute(
                    """UPDATE tema
                        SET id_unidad = %s, nombre = %s, descripcion = %s
                      WHERE id_tema = %s
                      RETURNING id_tema, id_unidad, nombre, descripcion""",
                    (params.id_unidad, params.nombre, params.descripcion, params.id_tema),
                )
                row = cur.fetchone()
            conn.commit()
            if row is None:
                raise ValueError(f"No se encontró el tema {params.id_tema}")
            return _scan_tema(row)
        finally:
            self.pool.putconn(conn)

    def eliminar_tema(self, id_tema: int) -> None:
        conn = self.pool.getconn()
        try:
            with conn.cursor() as cur:
                cur.execute(
                    "DELETE FROM tema WHERE id_tema = %s",
                    (id_tema,),
                )
                if cur.rowcount == 0:
                    raise ValueError(f"No se encontró el tema {id_tema}")
            conn.commit()
        finally:
            self.pool.putconn(conn)

    def consultar_temas(
        self, params: ConsultarTemasParams
    ) -> ConsultarTemasResult:
        offset = (params.pagina - 1) * PAGE_SIZE
        filtro = "(%s = 0 OR id_unidad = %s)"
        args = (params.id_unidad, params.id_unidad)

        conn = self.pool.getconn()
        try:
            with conn.cursor() as cur:
                cur.execute(
                    f"""SELECT id_tema, id_unidad, nombre, descripcion
                         FROM tema
                         WHERE {filtro}
                         ORDER BY id_tema
                         LIMIT %s OFFSET %s""",
                    args + (PAGE_SIZE, offset),
                )
                registros = [_scan_tema(row) for row in cur.fetchall()]

            with conn.cursor() as cur:
                cur.execute(
                    f"""SELECT CEIL(COUNT(*)::numeric / %s)::int
                         FROM tema
                         WHERE {filtro}""",
                    (PAGE_SIZE,) + args,
                )
                total_paginas = cur.fetchone()[0]

            return ConsultarTemasResult(
                registros=registros,
                total_paginas=total_paginas,
            )
        finally:
            self.pool.putconn(conn)
