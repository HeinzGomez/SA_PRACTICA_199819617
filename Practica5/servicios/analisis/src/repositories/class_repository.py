import json
from abc import ABC, abstractmethod
from typing import List, Optional

from psycopg2.pool import ThreadedConnectionPool

from config.database import get_database
from models.batch import BatchClaseResponse, ClaseCargaInput
from models.clase import (
    ClaseGrabada,
    ConsultarCatalogoParams,
    ConsultarCatalogoResult,
    EditarClaseParams,
    RegistrarClaseParams,
)

PAGE_SIZE = 10

CLASE_COLUMNS = """
    id_clase,
    id_curso,
    id_periodo,
    id_area,
    titulo,
    to_char(fecha_impartida, 'YYYY-MM-DD HH24:MI:SS') AS fecha_impartida,
    duracio_min,
    descripcion,
    url_video,
    anio,
    num_semestre
"""


def _scan_clase(row: tuple) -> ClaseGrabada:
    return ClaseGrabada(
        id_clase=row[0],
        id_curso=row[1],
        id_periodo=row[2],
        id_area=row[3],
        titulo=row[4],
        fecha_impartida=row[5],
        duracio_min=row[6],
        descripcion=row[7],
        url_video=row[8],
        anio=row[9],
        num_semestre=row[10],
    )


def _serializar_clases(clases: List[ClaseCargaInput]) -> str:
    """Serializa el lote al JSON esperado por sp_carga_masiva_clases.

    Los campos opcionales se omiten cuando son None, replicando el
    comportamiento de omitempty del fixture Go.
    """
    items = []
    for clase in clases:
        item = {
            "id_curso": clase.id_curso,
            "id_periodo": clase.id_periodo,
            "id_area": clase.id_area,
            "titulo": clase.titulo,
            "fecha_impartida": clase.fecha_impartida,
            "duracion_min": clase.duracion_min,
        }
        if clase.descripcion is not None:
            item["descripcion"] = clase.descripcion
        if clase.url_video is not None:
            item["url_video"] = clase.url_video
        if clase.anio is not None:
            item["anio"] = clase.anio
        if clase.num_semestre is not None:
            item["num_semestre"] = clase.num_semestre
        items.append(item)
    return json.dumps(items)


class ClassRepository(ABC):
    @abstractmethod
    def crear_clase(self, params: RegistrarClaseParams) -> ClaseGrabada:
        """Crea una clase grabada usando sp_registrar_clase."""

    @abstractmethod
    def editar_clase(self, params: EditarClaseParams) -> ClaseGrabada:
        """Actualiza los datos de una clase grabada."""

    @abstractmethod
    def eliminar_clase(self, id_clase: int) -> None:
        """Elimina una clase grabada."""

    @abstractmethod
    def consultar_catalogo(
        self, params: ConsultarCatalogoParams
    ) -> ConsultarCatalogoResult:
        """Consulta el catálogo de clases con filtros y paginación."""

    @abstractmethod
    def carga_masiva_clases(
        self, clases: List[ClaseCargaInput]
    ) -> BatchClaseResponse:
        """Inserta un lote de clases usando sp_carga_masiva_clases."""


class PostgresClassRepository(ClassRepository):
    def __init__(self, pool: Optional[ThreadedConnectionPool] = None):
        self.pool = pool if pool is not None else get_database()

    def crear_clase(self, params: RegistrarClaseParams) -> ClaseGrabada:
        conn = self.pool.getconn()
        try:
            with conn.cursor() as cur:
                cur.execute(
                    "CALL sp_registrar_clase(%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)",
                    (
                        params.id_curso,
                        params.id_periodo,
                        params.id_area,
                        params.titulo,
                        params.fecha_impartida,
                        params.duracion,
                        params.descripcion,
                        params.url_video,
                        params.anio,
                        params.num_semestre,
                    ),
                )
            conn.commit()

            return self._buscar_reciente(
                conn,
                params.id_curso,
                params.id_periodo,
                params.id_area,
                params.titulo,
            )
        finally:
            self.pool.putconn(conn)

    def editar_clase(self, params: EditarClaseParams) -> ClaseGrabada:
        conn = self.pool.getconn()
        try:
            with conn.cursor() as cur:
                cur.execute(
                    """UPDATE clase_grabada
                        SET id_curso = %s,
                            id_periodo = %s,
                            id_area = %s,
                            titulo = %s,
                            fecha_impartida = %s,
                            duracio_min = %s,
                            descripcion = %s,
                            url_video = %s,
                            anio = %s,
                            num_semestre = %s
                      WHERE id_clase = %s""",
                    (
                        params.id_curso,
                        params.id_periodo,
                        params.id_area,
                        params.titulo,
                        params.fecha_impartida,
                        params.duracion,
                        params.descripcion,
                        params.url_video,
                        params.anio,
                        params.num_semestre,
                        params.id_clase,
                    ),
                )
                if cur.rowcount == 0:
                    raise ValueError(f"No se encontró la clase {params.id_clase}")
            conn.commit()

            return self._buscar_por_id(conn, params.id_clase)
        finally:
            self.pool.putconn(conn)

    def eliminar_clase(self, id_clase: int) -> None:
        conn = self.pool.getconn()
        try:
            with conn.cursor() as cur:
                cur.execute(
                    "DELETE FROM clase_grabada WHERE id_clase = %s",
                    (id_clase,),
                )
                if cur.rowcount == 0:
                    raise ValueError(f"No se encontró la clase {id_clase}")
            conn.commit()
        finally:
            self.pool.putconn(conn)

    def consultar_catalogo(
        self, params: ConsultarCatalogoParams
    ) -> ConsultarCatalogoResult:
        offset = (params.pagina - 1) * PAGE_SIZE
        filtros = """
            (%s = 0 OR id_curso = %s)
            AND (%s = 0 OR id_periodo = %s)
            AND (%s = 0 OR id_area = %s)
            AND (%s = 0 OR anio = %s)
        """
        args = (
            params.id_curso, params.id_curso,
            params.id_periodo, params.id_periodo,
            params.id_area, params.id_area,
            params.anio, params.anio,
        )

        conn = self.pool.getconn()
        try:
            with conn.cursor() as cur:
                cur.execute(
                    f"""SELECT {CLASE_COLUMNS}
                         FROM clase_grabada
                         WHERE {filtros}
                         ORDER BY id_clase DESC
                         LIMIT %s OFFSET %s""",
                    args + (PAGE_SIZE, offset),
                )
                registros = [_scan_clase(row) for row in cur.fetchall()]

            with conn.cursor() as cur:
                cur.execute(
                    f"""SELECT CEIL(COUNT(*)::numeric / %s)::int
                         FROM clase_grabada
                         WHERE {filtros}""",
                    (PAGE_SIZE,) + args,
                )
                total_paginas = cur.fetchone()[0]

            return ConsultarCatalogoResult(
                registros=registros,
                total_paginas=total_paginas,
            )
        finally:
            self.pool.putconn(conn)

    def carga_masiva_clases(
        self, clases: List[ClaseCargaInput]
    ) -> BatchClaseResponse:
        payload = _serializar_clases(clases)

        conn = self.pool.getconn()
        try:
            with conn.cursor() as cur:
                cur.execute(
                    "CALL sp_carga_masiva_clases(%s::jsonb)",
                    (payload,),
                )
            conn.commit()
        finally:
            self.pool.putconn(conn)

        return BatchClaseResponse(
            exito=True,
            mensaje="Carga procesada",
            resultados=[],
        )

    def _buscar_reciente(
        self,
        conn,
        id_curso: int,
        id_periodo: int,
        id_area: int,
        titulo: str,
    ) -> ClaseGrabada:
        with conn.cursor() as cur:
            cur.execute(
                f"""SELECT {CLASE_COLUMNS}
                     FROM clase_grabada
                     WHERE id_curso = %s
                       AND id_periodo = %s
                       AND id_area = %s
                       AND titulo = %s
                     ORDER BY id_clase DESC
                     LIMIT 1""",
                (id_curso, id_periodo, id_area, titulo),
            )
            row = cur.fetchone()
            if row is None:
                raise ValueError("No se encontró la clase registrada")
            return _scan_clase(row)

    def _buscar_por_id(self, conn, id_clase: int) -> ClaseGrabada:
        with conn.cursor() as cur:
            cur.execute(
                f"""SELECT {CLASE_COLUMNS}
                     FROM clase_grabada
                     WHERE id_clase = %s""",
                (id_clase,),
            )
            row = cur.fetchone()
            if row is None:
                raise ValueError(f"No se encontró la clase {id_clase}")
            return _scan_clase(row)
