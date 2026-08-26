from abc import ABC, abstractmethod
from typing import List, Optional

from psycopg2.pool import ThreadedConnectionPool

from config.database import get_database
from models.rating import (
    CalificacionClase,
    CalificacionUsuario,
    ClaseMasVista,
    ClaseValorada,
    ConsultarClasesMasVistasParams,
    ConsultarRankingValoradasParams,
    ConsultarTemasTendenciaParams,
    RegistrarCalificacionParams,
    RegistrarVisualizacionParams,
    TemaTendencia,
    VisualizacionClase,
)


class RatingRepository(ABC):
    @abstractmethod
    def registrar_visualizacion(
        self, params: RegistrarVisualizacionParams
    ) -> VisualizacionClase:
        """Registra una visualización usando sp_registrar_visualizacion y
        devuelve el estado de la clase mediante fn_clase_vista."""

    @abstractmethod
    def registrar_calificacion(
        self, params: RegistrarCalificacionParams
    ) -> CalificacionClase:
        """Registra una calificación usando sp_registrar_calificacion y
        devuelve el promedio actualizado."""

    @abstractmethod
    def consultar_calificacion_usuario(
        self, id_clase: int, id_usuario: int
    ) -> CalificacionUsuario:
        """Consulta si un usuario ya calificó la clase y devuelve su
        puntuación junto con el promedio actual de la clase."""

    @abstractmethod
    def consultar_clases_mas_vistas(
        self, params: ConsultarClasesMasVistasParams
    ) -> List[ClaseMasVista]:
        """Consulta las clases más vistas mediante fn_clases_mas_vistas."""

    @abstractmethod
    def consultar_temas_tendencia(
        self, params: ConsultarTemasTendenciaParams
    ) -> List[TemaTendencia]:
        """Consulta los temas en tendencia mediante fn_temas_tendencia."""

    @abstractmethod
    def consultar_ranking_valoradas(
        self, params: ConsultarRankingValoradasParams
    ) -> List[ClaseValorada]:
        """Consulta el ranking de clases más valoradas mediante fn_ranking_valoradas."""


class PostgresRatingRepository(RatingRepository):
    def __init__(self, pool: Optional[ThreadedConnectionPool] = None):
        self.pool = pool if pool is not None else get_database()

    def registrar_visualizacion(
        self, params: RegistrarVisualizacionParams
    ) -> VisualizacionClase:
        conn = self.pool.getconn()
        try:
            with conn.cursor() as cur:
                cur.execute(
                    "CALL sp_registrar_visualizacion(%s)",
                    (params.id_clase,),
                )
            conn.commit()

            return self._consultar_clase_vista(conn, params.id_clase)
        finally:
            self.pool.putconn(conn)

    def registrar_calificacion(
        self, params: RegistrarCalificacionParams
    ) -> CalificacionClase:
        conn = self.pool.getconn()
        try:
            with conn.cursor() as cur:
                cur.execute(
                    "CALL sp_registrar_calificacion(%s, %s, %s)",
                    (params.id_clase, params.id_usuario, params.puntuacion),
                )
            conn.commit()

            return self._consultar_promedio(conn, params.id_clase)
        finally:
            self.pool.putconn(conn)

    def consultar_calificacion_usuario(
        self, id_clase: int, id_usuario: int
    ) -> CalificacionUsuario:
        conn = self.pool.getconn()
        try:
            return self._consultar_calificacion_usuario(conn, id_clase, id_usuario)
        finally:
            self.pool.putconn(conn)

    def consultar_clases_mas_vistas(
        self, params: ConsultarClasesMasVistasParams
    ) -> List[ClaseMasVista]:
        conn = self.pool.getconn()
        try:
            with conn.cursor() as cur:
                cur.execute(
                    """SELECT id_clase, titulo, total_visualizaciones
                         FROM fn_clases_mas_vistas(%s, %s, %s)
                         ORDER BY total_visualizaciones DESC""",
                    (
                        _fecha_o_none(params.fecha_inicio),
                        _fecha_o_none(params.fecha_fin),
                        params.limite,
                    ),
                )
                return [
                    ClaseMasVista(
                        id_clase=row[0],
                        titulo=row[1],
                        total_visualizaciones=row[2],
                    )
                    for row in cur.fetchall()
                ]
        finally:
            self.pool.putconn(conn)

    def consultar_temas_tendencia(
        self, params: ConsultarTemasTendenciaParams
    ) -> List[TemaTendencia]:
        conn = self.pool.getconn()
        try:
            with conn.cursor() as cur:
                cur.execute(
                    """SELECT id_tema, nombre, unidad, total_visualizaciones
                         FROM fn_temas_tendencia(%s, %s, %s)
                         ORDER BY total_visualizaciones DESC""",
                    (
                        _fecha_o_none(params.fecha_inicio),
                        _fecha_o_none(params.fecha_fin),
                        params.limite,
                    ),
                )
                return [
                    TemaTendencia(
                        id_tema=row[0],
                        nombre=row[1],
                        unidad=row[2],
                        total_visualizaciones=row[3],
                    )
                    for row in cur.fetchall()
                ]
        finally:
            self.pool.putconn(conn)

    def consultar_ranking_valoradas(
        self, params: ConsultarRankingValoradasParams
    ) -> List[ClaseValorada]:
        conn = self.pool.getconn()
        try:
            with conn.cursor() as cur:
                cur.execute(
                    """SELECT id_clase, titulo, promedio, total_calificaciones
                         FROM fn_ranking_valoradas(%s)
                         ORDER BY promedio DESC""",
                    (params.limite,),
                )
                return [
                    ClaseValorada(
                        id_clase=row[0],
                        titulo=row[1],
                        promedio=row[2],
                        total_calificaciones=row[3],
                    )
                    for row in cur.fetchall()
                ]
        finally:
            self.pool.putconn(conn)

    def _consultar_clase_vista(
        self, conn, id_clase: int
    ) -> VisualizacionClase:
        with conn.cursor() as cur:
            cur.execute(
                """SELECT id_clase, titulo, total_visualizaciones
                     FROM fn_clase_vista(%s)""",
                (id_clase,),
            )
            row = cur.fetchone()
            if row is None:
                raise ValueError(f"No se encontró la clase {id_clase}")
            return VisualizacionClase(
                id_clase=row[0],
                titulo=row[1],
                total_visualizaciones=row[2],
            )

    def _consultar_promedio(self, conn, id_clase: int) -> CalificacionClase:
        with conn.cursor() as cur:
            cur.execute(
                """SELECT %s::int AS id_clase,
                          fn_promedio_calificacion(%s) AS promedio,
                          COUNT(*)::int AS total_calificaciones
                     FROM calificacion_clase
                     WHERE id_clase = %s""",
                (id_clase, id_clase, id_clase),
            )
            row = cur.fetchone()
            return CalificacionClase(
                id_clase=row[0],
                promedio=row[1],
                total_calificaciones=row[2],
            )

    def _consultar_calificacion_usuario(
        self, conn, id_clase: int, id_usuario: int
    ) -> CalificacionUsuario:
        with conn.cursor() as cur:
            cur.execute(
                """SELECT %s::int AS id_clase,
                          %s::int AS id_usuario,
                          COALESCE(
                              (SELECT puntuacion FROM calificacion_clase
                                WHERE id_clase = %s AND id_usuario = %s),
                              0
                          ) AS puntuacion,
                          fn_promedio_calificacion(%s) AS promedio,
                          (SELECT COUNT(*) FROM calificacion_clase
                            WHERE id_clase = %s)::int AS total_calificaciones""",
                (id_clase, id_usuario, id_clase, id_usuario, id_clase, id_clase),
            )
            row = cur.fetchone()
            return CalificacionUsuario(
                id_clase=row[0],
                id_usuario=row[1],
                puntuacion=row[2],
                promedio=row[3],
                total_calificaciones=row[4],
            )


def _fecha_o_none(fecha: str) -> Optional[str]:
    fecha = (fecha or "").strip()
    return fecha or None
