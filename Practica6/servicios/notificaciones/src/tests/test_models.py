from models.notification import (
    Notificacion,
    RegistrarNotificacionParams,
    ConsultarNotificacionesParams,
    ConsultarNotificacionesResult,
)
from models.audit_log import (
    AuditLog,
    ConsultarAuditLogsParams,
    ConsultarAuditLogsResult,
)


class TestModels:
    def test_notificacion(self):
        n = Notificacion(1, 10, "REGISTRO", "Bienvenido", "msg", "2024-01-01", "ENVIADO")
        assert n.id_notificacion == 1
        assert n.id_usuario == 10
        assert n.tipo == "REGISTRO"
        assert n.asunto == "Bienvenido"
        assert n.mensaje == "msg"
        assert n.fecha_envio == "2024-01-01"
        assert n.estado == "ENVIADO"

    def test_registrar_notificacion_params(self):
        p = RegistrarNotificacionParams(id_usuario=5, tipo="REGISTRO", asunto="A", mensaje="M")
        assert p.id_usuario == 5
        assert p.tipo == "REGISTRO"

    def test_consultar_notificaciones_params(self):
        p = ConsultarNotificacionesParams(id_usuario=1, pagina=2)
        assert p.id_usuario == 1
        assert p.pagina == 2

    def test_consultar_notificaciones_result_defaults(self):
        r = ConsultarNotificacionesResult()
        assert r.registros == []
        assert r.total_paginas == 0

    def test_consultar_notificaciones_result_with_data(self):
        n = Notificacion(1, 10, "REGISTRO", "A", "M", "2024-01-01", "ENVIADO")
        r = ConsultarNotificacionesResult(registros=[n], total_paginas=3)
        assert len(r.registros) == 1
        assert r.total_paginas == 3

    def test_audit_log(self):
        a = AuditLog(1, 10, "INSERT", "notificaciones", "2024-01-01", "", "{}")
        assert a.id_auditoria == 1
        assert a.usuario_responsable == 10
        assert a.operacion == "INSERT"
        assert a.tabla_afectada == "notificaciones"

    def test_consultar_audit_logs_params_defaults(self):
        p = ConsultarAuditLogsParams(pagina=1)
        assert p.pagina == 1
        assert p.usuario_filtro == 0
        assert p.tabla_filtro == ""

    def test_consultar_audit_logs_result_defaults(self):
        r = ConsultarAuditLogsResult()
        assert r.registros == []
        assert r.total_paginas == 0
