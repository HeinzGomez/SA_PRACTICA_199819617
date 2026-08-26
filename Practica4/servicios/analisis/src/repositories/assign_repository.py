from abc import ABC, abstractmethod
from typing import Optional

from psycopg2.pool import ThreadedConnectionPool

from config.database import get_database
from models.assign import (
    AsignarTemaClaseParams,
    ConsultarTemasClaseResult,
    DesasignarTemaClaseParams,
    TemaAsignado,
)
from models.errors import NotFoundError


def _scan_tema_asignado(row: tuple) -> TemaAsignado:
    return TemaAsignado(
        id_tema=row[0],
        id_unidad=row[1],
        nombre=row[2],
        descripcion=row[3],
    )


class AssignRepository(ABC):
    @abstractmethod
    def asignar_tema_clase(
        self, params: AsignarTemaClaseParams
    ) -> ConsultarTemasClaseResult:
        """Asigna un tema a una clase grabada y devuelve los temas de la clase."""

    @abstractmethod
    def consultar_temas_clase(self, id_clase: int) -> ConsultarTemasClaseResult:
        """Consulta los temas asignados a una clase grabada."""

    @abstractmethod
    def desasignar_tema_clase(
        self, params: DesasignarTemaClaseParams
    ) -> None:
        """Elimina la asignación de un tema a una clase grabada."""


class PostgresAssignRepository(AssignRepository):
    def __init__(self, pool: Optional[ThreadedConnectionPool] = None):
        self.pool = pool if pool is not None else get_database()

    def asignar_tema_clase(
        self, params: AsignarTemaClaseParams
    ) -> ConsultarTemasClaseResult:
        conn = self.pool.getconn()
        try:
            with conn.cursor() as cur:
                self._validar_clase(cur, params.id_clase)
                self._validar_tema(cur, params.id_tema)
                cur.execute(
                    """INSERT INTO clase_tema(id_clase, id_tema)
                       VALUES(%s, %s)
                       ON CONFLICT (id_clase, id_tema) DO NOTHING""",
                    (params.id_clase, params.id_tema),
                )
            conn.commit()

            return self._consultar_temas_clase(conn, params.id_clase)
        finally:
            self.pool.putconn(conn)

    def consultar_temas_clase(self, id_clase: int) -> ConsultarTemasClaseResult:
        conn = self.pool.getconn()
        try:
            self._validar_clase(conn.cursor(), id_clase)
            return self._consultar_temas_clase(conn, id_clase)
        finally:
            self.pool.putconn(conn)

    def desasignar_tema_clase(
        self, params: DesasignarTemaClaseParams
    ) -> None:
        conn = self.pool.getconn()
        try:
            with conn.cursor() as cur:
                cur.execute(
                    "DELETE FROM clase_tema WHERE id_clase = %s AND id_tema = %s",
                    (params.id_clase, params.id_tema),
                )
                if cur.rowcount == 0:
                    raise NotFoundError("La asignación del tema no existe")
            conn.commit()
        finally:
            self.pool.putconn(conn)

    def _validar_clase(self, cur, id_clase: int) -> None:
        cur.execute(
            "SELECT 1 FROM clase_grabada WHERE id_clase = %s",
            (id_clase,),
        )
        if cur.fetchone() is None:
            raise ValueError(f"No se encontró la clase {id_clase}")

    def _validar_tema(self, cur, id_tema: int) -> None:
        cur.execute(
            "SELECT 1 FROM tema WHERE id_tema = %s",
            (id_tema,),
        )
        if cur.fetchone() is None:
            raise ValueError(f"No se encontró el tema {id_tema}")

    def _consultar_temas_clase(
        self, conn, id_clase: int
    ) -> ConsultarTemasClaseResult:
        with conn.cursor() as cur:
            cur.execute(
                """SELECT t.id_tema, t.id_unidad, t.nombre, t.descripcion
                     FROM clase_tema ct
                     INNER JOIN tema t ON ct.id_tema = t.id_tema
                     WHERE ct.id_clase = %s
                     ORDER BY t.id_tema""",
                (id_clase,),
            )
            registros = [_scan_tema_asignado(row) for row in cur.fetchall()]
        return ConsultarTemasClaseResult(id_clase=id_clase, registros=registros)
