"""HeinzGomez - Práctica 9: pruebas de los casos de uso del examen (CDU 3.6) y de su
administración (crear examen / agregar preguntas con una o varias correctas)."""
from __future__ import annotations

import pytest

from app.domain import MAX_INTENTOS, CertificadosError
from tests.conftest import CORRECTAS, EVT, EVT_GENERICO, EVT_SIN_EXAMEN, MALAS, PREGUNTAS_EVT


def _inscribir(svc, usuario, evento):
    svc.registrar_inscripcion({"usuarioId": usuario, "eventoId": evento, "ticketId": "T"})


# ---------- consulta del examen
def test_examen_requiere_inscripcion(svc):
    with pytest.raises(CertificadosError) as e:
        svc.obtener_examen(EVT, "sin-reserva")
    assert e.value.code == "FAILED_PRECONDITION"
    with pytest.raises(CertificadosError) as e:
        svc.obtener_examen("", "")
    assert e.value.code == "INVALID_ARGUMENT"


def test_examen_no_expone_respuestas(svc):
    ex = svc.obtener_examen(EVT, "u1")
    assert ex["nota_minima"] == 70 and len(ex["preguntas"]) == 5
    assert ex["evento_id"] == EVT
    assert "correcta" not in str(ex)
    assert all(set(o) == {"id", "texto"} for p in ex["preguntas"] for o in p["opciones"])


def test_examen_sin_configurar_para_la_actividad(svc):
    _inscribir(svc, "u1", EVT_SIN_EXAMEN)
    with pytest.raises(CertificadosError) as e:
        svc.obtener_examen(EVT_SIN_EXAMEN, "u1")
    assert e.value.code == "FAILED_PRECONDITION"
    assert "no tiene un examen" in e.value.message


def test_examen_inactivo_no_se_puede_rendir(svc):
    svc.crear_examen("evt-inactivo-9", "Pausado", estado="INACTIVO")
    _inscribir(svc, "u1", "evt-inactivo-9")
    with pytest.raises(CertificadosError) as e:
        svc.obtener_examen("evt-inactivo-9", "u1")
    assert e.value.code == "FAILED_PRECONDITION"
    assert "no está activo" in e.value.message


# ---------- rendir el examen
def test_reprobar_y_limite_de_intentos(svc):
    for _ in range(MAX_INTENTOS):
        intento = svc.rendir_examen("u1", EVT, MALAS)
        assert intento.aprobado is False and intento.nota == 0
        assert intento.id.startswith("INT-") and intento.id_examen
    with pytest.raises(CertificadosError) as e:
        svc.rendir_examen("u1", EVT, CORRECTAS)
    assert e.value.code == "RESOURCE_EXHAUSTED"
    assert str(MAX_INTENTOS) in e.value.message


def test_no_se_rinde_si_ya_aprobo(svc):
    assert svc.rendir_examen("u1", EVT, CORRECTAS).nota == 100
    with pytest.raises(CertificadosError) as e:
        svc.rendir_examen("u1", EVT, CORRECTAS)
    assert e.value.code == "FAILED_PRECONDITION"
    assert "ya fue aprobado" in e.value.message


def test_rendir_sin_reserva_no_alcanza_a_calificar(svc):
    with pytest.raises(CertificadosError) as e:
        svc.rendir_examen("nadie", EVT, CORRECTAS)
    assert e.value.code == "FAILED_PRECONDITION"


# ---------- administración: crear examen
def test_crear_examen_usa_los_valores_por_defecto(svc):
    nuevo = svc.crear_examen("evt-crear-1", "  Examen nuevo  ")
    assert nuevo["evento_id"] == "evt-crear-1" and nuevo["titulo"] == "Examen nuevo"
    assert nuevo["puntaje_minimo"] == 70 and nuevo["estado"] == "ACTIVO"
    assert nuevo["preguntas"] == [] and nuevo["id_examen"] > 0


def test_crear_examen_rechaza_datos_invalidos(svc):
    with pytest.raises(CertificadosError) as e:  # sin título
        svc.crear_examen("evt-crear-2", "   ")
    assert e.value.code == "INVALID_ARGUMENT"

    with pytest.raises(CertificadosError) as e:  # estado fuera del enumerado
        svc.crear_examen("evt-crear-3", "T", estado="borrador")
    assert e.value.code == "INVALID_ARGUMENT" and "ACTIVO|INACTIVO" in e.value.message

    with pytest.raises(CertificadosError) as e:  # puntaje no numérico
        svc.crear_examen("evt-crear-4", "T", puntaje_minimo="setenta")
    assert e.value.code == "INVALID_ARGUMENT" and "numérico" in e.value.message

    with pytest.raises(CertificadosError) as e:  # puntaje fuera de rango
        svc.crear_examen("evt-crear-5", "T", puntaje_minimo=150)
    assert e.value.code == "INVALID_ARGUMENT" and "entre 0 y 100" in e.value.message

    with pytest.raises(CertificadosError) as e:  # puntaje negativo
        svc.crear_examen("evt-crear-6", "T", puntaje_minimo=-1)
    assert e.value.code == "INVALID_ARGUMENT"


def test_crear_examen_no_duplica_la_actividad(svc):
    svc.crear_examen("evt-crear-7", "Único")
    with pytest.raises(CertificadosError) as e:
        svc.crear_examen("evt-crear-7", "Otro")
    assert e.value.code == "FAILED_PRECONDITION"
    assert "ya tiene un examen" in e.value.message


def test_crear_examen_no_toca_el_sembrado(svc):
    with pytest.raises(CertificadosError) as e:
        svc.crear_examen(EVT, "Sobre escrito")
    assert e.value.code == "FAILED_PRECONDITION"
    assert svc.obtener_examen_admin(EVT)["titulo"].startswith("Examen de certificación")


# ---------- administración: agregar preguntas
def _nuevo_examen(svc, evento="evt-preg-1"):
    return svc.crear_examen(evento, "Examen para preguntas")


def test_agregar_pregunta_con_una_correcta(svc):
    nuevo = _nuevo_examen(svc)
    pregunta = svc.agregar_pregunta(nuevo["id_examen"], "  ¿Dos más dos?  ",
                                    [{"texto": "4", "es_correcta": True},
                                     {"texto": "5", "es_correcta": False}])
    assert pregunta["enunciado"] == "¿Dos más dos?"
    assert pregunta["id_examen"] == nuevo["id_examen"]
    assert [o["texto"] for o in pregunta["opciones"] if o["es_correcta"]] == ["4"]
    # sin punteo explícito se reparte el 100 % entre las preguntas existentes
    assert pregunta["punteo"] == pytest.approx(100.0)


def test_agregar_pregunta_admite_varias_correctas(svc):
    nuevo = _nuevo_examen(svc, "evt-preg-multi")
    pregunta = svc.agregar_pregunta(
        nuevo["id_examen"], "¿Qué son APIs?",
        [{"texto": "Interfaces", "es_correcta": True},
         {"texto": "Contratos", "es_correcta": True},
         {"texto": "Bases de datos", "es_correcta": False},
         {"texto": "Lámparas", "es_correcta": False}])
    assert [o["texto"] for o in pregunta["opciones"] if o["es_correcta"]] == ["Interfaces", "Contratos"]
    assert len(pregunta["opciones"]) == 4


def test_agregar_pregunta_rechaza_entradas_invalidas(svc):
    nuevo = _nuevo_examen(svc, "evt-preg-2")

    with pytest.raises(CertificadosError) as e:  # id no numérico
        svc.agregar_pregunta("abc", "?", [{"texto": "a", "es_correcta": True},
                                          {"texto": "b"}])
    assert e.value.code == "INVALID_ARGUMENT" and "numérico" in e.value.message

    with pytest.raises(CertificadosError) as e:  # id nulo
        svc.agregar_pregunta(None, "?", [{"texto": "a", "es_correcta": True},
                                         {"texto": "b"}])
    assert e.value.code == "INVALID_ARGUMENT"

    with pytest.raises(CertificadosError) as e:  # examen inexistente
        svc.agregar_pregunta(999_999, "?", [{"texto": "a", "es_correcta": True},
                                             {"texto": "b"}])
    assert e.value.code == "NOT_FOUND"

    with pytest.raises(CertificadosError) as e:  # sin enunciado
        svc.agregar_pregunta(nuevo["id_examen"], "  ",
                             [{"texto": "a", "es_correcta": True}, {"texto": "b"}])
    assert e.value.code == "INVALID_ARGUMENT"

    with pytest.raises(CertificadosError) as e:  # una sola opción
        svc.agregar_pregunta(nuevo["id_examen"], "?", [{"texto": "a", "es_correcta": True}])
    assert e.value.code == "INVALID_ARGUMENT" and "al menos 2" in e.value.message

    with pytest.raises(CertificadosError) as e:  # opción vacía
        svc.agregar_pregunta(nuevo["id_examen"], "?", [{"texto": "a", "es_correcta": True},
                                                       {"texto": "   "}])
    assert e.value.code == "INVALID_ARGUMENT" and "vacías" in e.value.message

    with pytest.raises(CertificadosError) as e:  # ninguna correcta
        svc.agregar_pregunta(nuevo["id_examen"], "?", [{"texto": "a"}, {"texto": "b"}])
    assert e.value.code == "INVALID_ARGUMENT" and "al menos una" in e.value.message

    with pytest.raises(CertificadosError) as e:  # punteo no numérico
        svc.agregar_pregunta(nuevo["id_examen"], "?", [{"texto": "a", "es_correcta": True},
                                                       {"texto": "b"}], punteo="alto")
    assert e.value.code == "INVALID_ARGUMENT" and "numérico" in e.value.message

    with pytest.raises(CertificadosError) as e:  # punteo negativo
        svc.agregar_pregunta(nuevo["id_examen"], "?", [{"texto": "a", "es_correcta": True},
                                                       {"texto": "b"}], punteo=-5)
    assert e.value.code == "INVALID_ARGUMENT" and "negativo" in e.value.message


def test_agregar_pregunta_reparte_el_punteo_en_bloque(svc):
    nuevo = _nuevo_examen(svc, "evt-preg-3")
    opciones = [{"texto": "a", "es_correcta": True}, {"texto": "b"}]
    primera = svc.agregar_pregunta(nuevo["id_examen"], "P1", opciones)
    segunda = svc.agregar_pregunta(nuevo["id_examen"], "P2", opciones)
    assert primera["punteo"] == pytest.approx(100.0)   # 100 / (0 + 1)
    assert segunda["punteo"] == pytest.approx(50.0)     # 100 / (1 + 1)


def test_agregar_pregunta_con_punteo_explicito(svc):
    nuevo = _nuevo_examen(svc, "evt-preg-5")
    opciones = [{"texto": "a", "es_correcta": True}, {"texto": "b"}]
    pregunta = svc.agregar_pregunta(nuevo["id_examen"], "Con peso", opciones, punteo=25)
    assert pregunta["punteo"] == 25.0
    # el punteo explícito no se reparte: sigue valiendo 25 en la siguiente
    assert svc.agregar_pregunta(nuevo["id_examen"], "Otra", opciones, punteo=10)["punteo"] == 10.0
    assert svc.examen.examenes.contar_preguntas(nuevo["id_examen"]) == 2


def test_agregar_pregunta_se_ve_en_la_consulta_del_estudiante(svc):
    nuevo = _nuevo_examen(svc, "evt-preg-4")
    svc.agregar_pregunta(nuevo["id_examen"], "¿Visible?", [{"texto": "sí", "es_correcta": True},
                                                           {"texto": "no"}])
    _inscribir(svc, "u1", "evt-preg-4")
    ex = svc.obtener_examen("evt-preg-4", "u1")
    assert len(ex["preguntas"]) == 1
    assert ex["nota_minima"] == 70


# ---------- consulta de administración
def test_consulta_de_examen_para_administrador(svc, llamar, codigo_de):
    """El administrador ve el examen (y sus respuestas) sin estar inscrito."""
    ex = llamar("certificados.obtener_examen_admin", {"evento_id": EVT})
    assert ex["id_examen"] > 0 and len(ex["preguntas"]) == len(PREGUNTAS_EVT)
    assert any(o["es_correcta"] for p in ex["preguntas"] for o in p["opciones"])
    assert codigo_de("certificados.obtener_examen_admin", {"evento_id": EVT_SIN_EXAMEN}) == "NOT_FOUND"


def test_consulta_admin_tambien_funciona_sobre_el_examen_generico(svc):
    ex = svc.obtener_examen_admin(EVT_GENERICO)
    assert ex["titulo"] and ex["estado"] == "ACTIVO"
    assert all(p["punteo"] for p in ex["preguntas"])
