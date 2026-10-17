"""HeinzGomez - Práctica 9: pruebas del repositorio en memoria y de la semilla del esquema."""
from __future__ import annotations

import pytest

from app.domain import Certificado, Intento
from app.repository import InMemoryRepository
from app.repository.esquema import (ESTADO_SEMILLA, PUNTAJE_MINIMO, PUNTEO_PREGUNTA, SEMILLA, sembrar,
                                    preguntas_de_semilla)


@pytest.fixture
def repo():
    return InMemoryRepository()


# ---------- semilla del esquema
def test_preguntas_de_semilla_cubre_todos_los_eventos_sembrados():
    for evento, titulo, preguntas in SEMILLA:
        obtenidas = preguntas_de_semilla(evento)
        assert len(obtenidas) == len(preguntas)
        assert all(p.punteo == PUNTEO_PREGUNTA for p in obtenidas)
        assert all(len(p.correctas) == 1 for p in obtenidas)
    assert preguntas_de_semilla("evt-desconocido") == []


class _Cursor:
    def __init__(self, filas):
        self._filas = filas

    def fetchone(self):
        return self._filas[0] if self._filas else None


class _ConnSemilla:
    """Doble mínimo de psycopg: devuelve filas sintéticas y registra los INSERT."""

    def __init__(self, examenes_existentes: int):
        self._existentes = examenes_existentes
        self.inserts: list[tuple[str, tuple]] = []
        self._examen = 0
        self._pregunta = 0

    def execute(self, sql: str, params: tuple = ()):
        if sql.lstrip().upper().startswith("SELECT"):
            return _Cursor([{"n": self._existentes}])
        self.inserts.append((sql, params))
        if "RETURNING id_examen" in sql:
            self._examen += 1
            return _Cursor([{"id_examen": self._examen}])
        if "RETURNING id_pregunta" in sql:
            self._pregunta += 1
            return _Cursor([{"id_pregunta": self._pregunta}])
        return _Cursor([])


def test_sembrar_no_toca_una_base_ya_poblada():
    conn = _ConnSemilla(examenes_existentes=len(SEMILLA))
    sembrar(conn)
    assert conn.inserts == []


def test_sembrar_inserta_examenes_preguntas_y_opciones():
    conn = _ConnSemilla(examenes_existentes=0)
    sembrar(conn)

    por_tabla = {"examen": 0, "pregunta": 0, "opcion": 0}
    for sql, _params in conn.inserts:
        if "examen_acreditacion" in sql:
            por_tabla["examen"] += 1
        elif "preguntas" in sql:
            por_tabla["pregunta"] += 1
        elif "opciono" in sql:
            por_tabla["opcion"] += 1

    assert por_tabla["examen"] == len(SEMILLA)
    assert por_tabla["pregunta"] == sum(len(p) for _, _, p in SEMILLA)
    assert por_tabla["opcion"] == sum(len(opciones) for _, _, p in SEMILLA
                                      for _, opciones, _ in p)


# ---------- inscripciones
def test_registrar_inscripcion_es_idempotente(repo):
    repo.registrar_inscripcion("u1", "e1", "T-1")
    repo.registrar_inscripcion("u1", "e1", "T-2")
    assert repo.esta_inscrito("u1", "e1")
    assert not repo.esta_inscrito("u2", "e1")
    assert not repo.esta_inscrito("u1", "e2")


# ---------- exámenes
def test_examen_de_examen_por_id_y_contar(repo):
    sembrado = repo.examen_de("evt-sec-04")
    assert sembrado is not None and sembrado.estado == ESTADO_SEMILLA
    assert sembrado.puntaje_minimo == PUNTAJE_MINIMO
    assert len(sembrado.preguntas) == 5
    assert repo.examen_de("evt-inexistente") is None

    assert repo.examen_por_id(sembrado.id) is sembrado
    assert repo.examen_por_id(999_999) is None
    assert repo.contar_preguntas(sembrado.id) == 5
    assert repo.contar_preguntas(999_999) == 0


def test_crear_examen_y_agregar_pregunta(repo):
    examen = repo.crear_examen("evt-nuevo", "Examen nuevo", 80.0, "ACTIVO")
    assert examen.id > 0 and examen.preguntas == []
    assert repo.examen_de("evt-nuevo") is examen

    pregunta = repo.agregar_pregunta(examen.id, "¿Pregunta?", 50.0,
                                     [("a", True), ("b", False)])
    assert pregunta.enunciado == "¿Pregunta?" and pregunta.punteo == 50.0
    assert sorted(pregunta.opciones.values()) == ["a", "b"]
    assert len(pregunta.correctas) == 1
    assert repo.contar_preguntas(examen.id) == 1
    assert repo.examen_de("evt-nuevo").preguntas == [pregunta]


def test_agregar_pregunta_a_un_examen_inexistente_no_se_cuela(repo):
    with pytest.raises(KeyError):
        repo.agregar_pregunta(424242, "?", 10.0, [("a", True), ("b", False)])


# ---------- intentos
def test_intentos_se_filtran_por_usuario_y_evento(repo):
    repo.registrar_inscripcion("u1", "e1", "T")
    uno = Intento(id="I1", usuario_id="u1", evento_id="e1", nota=90, aprobado=True,
                  correctas=5, total=5, respondido_en="2026-10-01T00:00:00Z")
    repo.guardar_intento(uno)
    repo.guardar_intento(Intento(id="I2", usuario_id="u1", evento_id="e2", nota=10,
                                 aprobado=False, correctas=1, total=5,
                                 respondido_en="2026-10-02T00:00:00Z"))
    assert [i.id for i in repo.intentos_de("u1", "e1")] == ["I1"]
    assert repo.intentos_de("u2", "e1") == []


# ---------- certificados
def _cert(cid="CERT-1", usuario="u1", evento="e1", curso="0785"):
    return Certificado(id=cid, usuario_id=usuario, nombre_estudiante="Ana", evento_id=evento,
                       evento_titulo="Taller", curso_codigo=curso, curso_nombre="AyD",
                       nota=95, emitido_en="2026-10-05T18:00:00Z")


def test_certificados_se_buscan_por_id_o_por_hash(repo):
    cert = _cert()
    repo.guardar_certificado(cert)
    assert repo.buscar_certificado("CERT-1") is cert
    assert repo.buscar_certificado("ABC123") is None

    cert.codigo_hash = "abc123"
    assert repo.buscar_certificado("abc123") is cert


def test_certificado_de_y_listado_por_usuario(repo):
    repo.guardar_certificado(_cert())
    repo.guardar_certificado(_cert(cid="CERT-2", evento="e2"))
    repo.guardar_certificado(_cert(cid="CERT-3", usuario="u2", evento="e1"))
    assert repo.certificado_de("u1", "e2").id == "CERT-2"
    assert repo.certificado_de("u1", "e3") is None
    assert sorted(c.id for c in repo.certificados_de_usuario("u1")) == ["CERT-1", "CERT-2"]
    assert repo.certificados_de_usuario("nadie") == []
