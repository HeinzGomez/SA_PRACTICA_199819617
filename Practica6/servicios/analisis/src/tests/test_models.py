from models.errors import BusinessValidationError, NotFoundError
from models.clase import ClaseGrabada, RegistrarClaseParams, EditarClaseParams, ConsultarCatalogoParams, ConsultarCatalogoResult
from models.topic import Unidad, Tema, RegistrarUnidadParams, EditarUnidadParams, ConsultarUnidadesParams, ConsultarUnidadesResult, RegistrarTemaParams, EditarTemaParams, ConsultarTemasParams, ConsultarTemasResult
from models.rating import (
    RegistrarVisualizacionParams, VisualizacionClase,
    RegistrarCalificacionParams, CalificacionClase, CalificacionUsuario,
    ConsultarClasesMasVistasParams, ClaseMasVista,
    ConsultarTemasTendenciaParams, TemaTendencia,
    ConsultarRankingValoradasParams, ClaseValorada,
)
from models.assign import AsignarTemaClaseParams, DesasignarTemaClaseParams, TemaAsignado, ConsultarTemasClaseResult
from models.log import AuditLog, ConsultarAuditLogsParams, ConsultarAuditLogsResult
from models.batch import ClaseCargaInput, BatchClaseResult, BatchClaseResponse


class TestModels:
    def test_clase_grabada(self):
        c = ClaseGrabada(1, 1, 1, 1, "T", "D", 60, None, "http://v", 2024, 1)
        assert c.id_clase == 1

    def test_registrar_clase_params(self):
        p = RegistrarClaseParams(1, 1, 1, "T", "D", 60, None, "http://v", 2024, 1)
        assert p.titulo == "T"

    def test_editar_clase_params(self):
        p = EditarClaseParams(1, 1, 1, 1, "T", "D", 60, None, "http://v", 2024, 1)
        assert p.id_clase == 1

    def test_consultar_catalogo_params(self):
        p = ConsultarCatalogoParams(pagina=1)
        assert p.pagina == 1

    def test_consultar_catalogo_result(self):
        r = ConsultarCatalogoResult()
        assert r.registros == []

    def test_unidad(self):
        u = Unidad(1, "U", None)
        assert u.nombre == "U"

    def test_tema(self):
        t = Tema(1, 1, "T", None)
        assert t.id_tema == 1

    def test_registrar_unidad_params(self):
        p = RegistrarUnidadParams("U", None)
        assert p.nombre == "U"

    def test_editar_unidad_params(self):
        p = EditarUnidadParams(1, "U", None)
        assert p.id_unidad == 1

    def test_consultar_unidades_params(self):
        p = ConsultarUnidadesParams(pagina=1)
        assert p.pagina == 1

    def test_consultar_unidades_result(self):
        r = ConsultarUnidadesResult()
        assert r.total_paginas == 0

    def test_registrar_tema_params(self):
        p = RegistrarTemaParams(1, "T", None)
        assert p.id_unidad == 1

    def test_editar_tema_params(self):
        p = EditarTemaParams(1, 1, "T", None)
        assert p.id_tema == 1

    def test_consultar_temas_params(self):
        p = ConsultarTemasParams(pagina=1, id_unidad=0)
        assert p.id_unidad == 0

    def test_consultar_temas_result(self):
        r = ConsultarTemasResult()
        assert r.registros == []

    def test_registrar_visualizacion_params(self):
        p = RegistrarVisualizacionParams(id_clase=1)
        assert p.id_clase == 1

    def test_visualizacion_clase(self):
        v = VisualizacionClase(1, "T", 10)
        assert v.total_visualizaciones == 10

    def test_registrar_calificacion_params(self):
        p = RegistrarCalificacionParams(1, 1, 5)
        assert p.puntuacion == 5

    def test_calificacion_clase(self):
        c = CalificacionClase(1, 4.5, 10)
        assert c.promedio == 4.5

    def test_calificacion_usuario(self):
        c = CalificacionUsuario(1, 1, 5, 4.5, 10)
        assert c.puntuacion == 5

    def test_consultar_clases_mas_vistas_params(self):
        p = ConsultarClasesMasVistasParams("2024-01-01", "2024-12-31", 10)
        assert p.limite == 10

    def test_clase_mas_vista(self):
        c = ClaseMasVista(1, "T", 100)
        assert c.total_visualizaciones == 100

    def test_consultar_temas_tendencia_params(self):
        p = ConsultarTemasTendenciaParams("2024-01-01", "2024-12-31", 10)
        assert p.fecha_inicio == "2024-01-01"

    def test_tema_tendencia(self):
        t = TemaTendencia(1, "T", "U", 50)
        assert t.unidad == "U"

    def test_consultar_ranking_valoradas_params(self):
        p = ConsultarRankingValoradasParams(limite=10)
        assert p.limite == 10

    def test_clase_valorada(self):
        c = ClaseValorada(1, "T", 4.5, 10)
        assert c.total_calificaciones == 10

    def test_asignar_tema_clase_params(self):
        p = AsignarTemaClaseParams(1, 1)
        assert p.id_clase == 1

    def test_desasignar_tema_clase_params(self):
        p = DesasignarTemaClaseParams(1, 1)
        assert p.id_tema == 1

    def test_tema_asignado(self):
        t = TemaAsignado(1, 1, "T", None)
        assert t.nombre == "T"

    def test_consultar_temas_clase_result(self):
        r = ConsultarTemasClaseResult(id_clase=1)
        assert r.id_clase == 1

    def test_audit_log(self):
        a = AuditLog(1, 10, "INSERT", "users", "2024-01-01", None, None)
        assert a.operacion == "INSERT"

    def test_consultar_audit_logs_params(self):
        p = ConsultarAuditLogsParams(pagina=1)
        assert p.tabla_afectada == ""

    def test_consultar_audit_logs_result(self):
        r = ConsultarAuditLogsResult()
        assert r.total_paginas == 0

    def test_clase_carga_input(self):
        c = ClaseCargaInput(id_curso=1, id_periodo=1, id_area=1, titulo="T",
                             fecha_impartida="2024-01-01", duracion_min=60)
        assert c.descripcion is None

    def test_batch_clase_result(self):
        b = BatchClaseResult(index=0, status="ok")
        assert b.id_clase is None

    def test_batch_clase_response(self):
        b = BatchClaseResponse(exito=True, mensaje="ok")
        assert b.resultados == []

    def test_business_validation_error(self):
        e = BusinessValidationError("msg")
        assert str(e) == "msg"

    def test_not_found_error(self):
        e = NotFoundError("not found")
        assert str(e) == "not found"
