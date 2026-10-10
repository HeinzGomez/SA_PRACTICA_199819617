"""HeinzGomez - Práctica 9: repositorio PostgreSQL (certificados_db)."""
from __future__ import annotations

import threading
from typing import List, Optional, Sequence, Tuple

from ..domain import Certificado, Examen, Intento, Pregunta
from .esquema import MIGRACION, sembrar

_SELECT = ("SELECT", "WITH")


class PostgresRepository:  # pragma: no cover - requiere base de datos real
    def __init__(self, dsn: str):
        import psycopg
        from psycopg.rows import dict_row

        self._conn = psycopg.connect(dsn, autocommit=True, row_factory=dict_row)
        self._lock = threading.Lock()
        with self._lock:
            self._conn.execute(MIGRACION)
            sembrar(self._conn)

    def _q(self, sql: str, params: tuple = ()):
        with self._lock:
            if sql.lstrip().upper().startswith(_SELECT):
                return self._conn.execute(sql, params).fetchall()
            return self._conn.execute(sql, params)

    def _fila(self, sql: str, params: tuple = ()) -> Optional[dict]:
        with self._lock:
            return self._conn.execute(sql, params).fetchone()

    # --- inscripciones
    def registrar_inscripcion(self, usuario_id, evento_id, ticket_id):
        self._q("INSERT INTO inscripcion (usuario_id, evento_id, ticket_id) VALUES (%s,%s,%s) "
                "ON CONFLICT DO NOTHING", (usuario_id, evento_id, ticket_id))

    def esta_inscrito(self, usuario_id, evento_id):
        return bool(self._q("SELECT 1 FROM inscripcion WHERE usuario_id=%s AND evento_id=%s",
                            (usuario_id, evento_id)))

    # --- exámenes
    def examen_de(self, evento_id) -> Optional[Examen]:
        filas = self._q("SELECT id_examen, id_actividad, titulo_examen, puntaje_minimo, estado "
                        "FROM examen_acreditacion WHERE id_actividad=%s", (evento_id,))
        if not filas:
            return None
        f = filas[0]
        return Examen(id=f["id_examen"], id_actividad=f["id_actividad"], titulo=f["titulo_examen"],
                      puntaje_minimo=float(f["puntaje_minimo"] or 0), estado=f["estado"],
                      preguntas=self._preguntas_de(f["id_examen"]))

    def _preguntas_de(self, examen_id: int) -> List[Pregunta]:
        filas = self._q("SELECT p.id_pregunta, p.enunciado, p.punteo, "
                        "o.id_opcion, o.opcion, o.escorrecta "
                        "FROM preguntas p LEFT JOIN opciono o ON o.id_pregunta = p.id_pregunta "
                        "WHERE p.id_examen=%s ORDER BY p.id_pregunta, o.id_opcion", (examen_id,))
        preguntas: dict[int, dict] = {}
        for f in filas:
            datos = preguntas.setdefault(f["id_pregunta"], {"enunciado": f["enunciado"],
                                                            "punteo": f["punteo"], "opciones": {},
                                                            "correctas": set()})
            if f["id_opcion"] is not None:
                datos["opciones"][str(f["id_opcion"])] = f["opcion"]
                if f["escorrecta"]:
                    datos["correctas"].add(str(f["id_opcion"]))
        return [Pregunta(id=str(pid), enunciado=d["enunciado"],
                         opciones=d["opciones"], correctas=frozenset(d["correctas"]),
                         punteo=float(d["punteo"] or 0))
                for pid, d in preguntas.items()]

    def examen_por_id(self, examen_id) -> Optional[Examen]:
        filas = self._q("SELECT id_examen, id_actividad, titulo_examen, puntaje_minimo, estado "
                        "FROM examen_acreditacion WHERE id_examen=%s", (examen_id,))
        if not filas:
            return None
        f = filas[0]
        return Examen(id=f["id_examen"], id_actividad=f["id_actividad"], titulo=f["titulo_examen"],
                      puntaje_minimo=float(f["puntaje_minimo"] or 0), estado=f["estado"],
                      preguntas=self._preguntas_de(f["id_examen"]))

    def crear_examen(self, evento_id, titulo, puntaje_minimo, estado) -> Examen:
        f = self._fila("INSERT INTO examen_acreditacion (id_actividad, titulo_examen, puntaje_minimo, estado) "
                       "VALUES (%s,%s,%s,%s) RETURNING id_examen", (evento_id, titulo, puntaje_minimo, estado))
        return Examen(id=f["id_examen"], id_actividad=evento_id, titulo=titulo,
                      puntaje_minimo=puntaje_minimo, estado=estado, preguntas=[])

    def agregar_pregunta(self, examen_id, enunciado, punteo, opciones: Sequence[Tuple[str, bool]]) -> Pregunta:
        with self._lock:
            with self._conn.transaction():
                fila = self._conn.execute(
                    "INSERT INTO preguntas (id_examen, enunciado, punteo) VALUES (%s,%s,%s) RETURNING id_pregunta",
                    (examen_id, enunciado, punteo),
                ).fetchone()
                identificador = fila["id_pregunta"]
                textos, correctas = {}, set()
                for indice, (texto, es_correcta) in enumerate(opciones):
                    opcion = self._conn.execute(
                        "INSERT INTO opciono (id_pregunta, opcion, esCorrecta) VALUES (%s,%s,%s) RETURNING id_opcion",
                        (identificador, texto, es_correcta),
                    ).fetchone()
                    textos[str(opcion["id_opcion"])] = texto
                    if es_correcta:
                        correctas.add(str(opcion["id_opcion"]))
        return Pregunta(id=str(identificador), enunciado=enunciado, opciones=textos,
                        correctas=frozenset(correctas), punteo=punteo)

    def contar_preguntas(self, examen_id) -> int:
        filas = self._q("SELECT COUNT(*) AS n FROM preguntas WHERE id_examen=%s", (examen_id,))
        return int(filas[0]["n"])

    # --- intentos
    def guardar_intento(self, i: Intento):
        self._q("INSERT INTO intento_examen (id, usuario_id, evento_id, nota, aprobado, correctas, "
                "total, respondido_en, id_examen) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)",
                (i.id, i.usuario_id, i.evento_id, i.nota, i.aprobado, i.correctas, i.total,
                 i.respondido_en, i.id_examen))

    def intentos_de(self, usuario_id, evento_id):
        filas = self._q("SELECT * FROM intento_examen WHERE usuario_id=%s AND evento_id=%s",
                        (usuario_id, evento_id))
        return [Intento(**{**f, "respondido_en": f["respondido_en"].isoformat()}) for f in filas]

    # --- certificados
    def guardar_certificado(self, c: Certificado):
        self._q("INSERT INTO certificado (id,codigo_hash,firma,usuario_id,nombre_estudiante,evento_id,evento_titulo,"
                "curso_codigo,curso_nombre,nota,emitido_en) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)",
                (c.id, c.codigo_hash, c.firma, c.usuario_id, c.nombre_estudiante, c.evento_id, c.evento_titulo,
                 c.curso_codigo, c.curso_nombre, c.nota, c.emitido_en))

    @staticmethod
    def _cert(f) -> Certificado:
        return Certificado(**{**f, "emitido_en": f["emitido_en"].isoformat().replace("+00:00", "Z"),
                              "codigo_hash": f["codigo_hash"].strip()})

    def certificado_de(self, usuario_id, evento_id):
        filas = self._q("SELECT * FROM certificado WHERE usuario_id=%s AND evento_id=%s",
                        (usuario_id, evento_id))
        return self._cert(filas[0]) if filas else None

    def buscar_certificado(self, codigo):
        filas = self._q("SELECT * FROM certificado WHERE id=%s OR codigo_hash=%s", (codigo, codigo))
        return self._cert(filas[0]) if filas else None

    def certificados_de_usuario(self, usuario_id):
        return [self._cert(f) for f in self._q("SELECT * FROM certificado WHERE usuario_id=%s", (usuario_id,))]
