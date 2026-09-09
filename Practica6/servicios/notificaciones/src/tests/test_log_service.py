import pytest
from unittest.mock import MagicMock
from services.log_service import LogService, TABLA_NOTIFICACIONES
from models.audit_log import ConsultarAuditLogsResult


class TestLogService:
    def setup_method(self):
        self.repo = MagicMock()
        self.svc = LogService(self.repo)

    def test_consultar_ok(self):
        self.repo.consultar_audit_logs.return_value = MagicMock(registros=[], total_paginas=1)
        result = self.svc.consultar_audit_logs(pagina=1)
        assert result is not None

    def test_pagina_0_se_corrige_a_1(self):
        self.repo.consultar_audit_logs.return_value = MagicMock(registros=[], total_paginas=1)
        self.svc.consultar_audit_logs(pagina=0)
        call_args = self.repo.consultar_audit_logs.call_args[0][0]
        assert call_args.pagina == 1

    def test_pagina_negativa_se_corrige(self):
        self.repo.consultar_audit_logs.return_value = MagicMock(registros=[], total_paginas=1)
        self.svc.consultar_audit_logs(pagina=-5)
        call_args = self.repo.consultar_audit_logs.call_args[0][0]
        assert call_args.pagina == 1

    def test_usuario_negativo_se_corrige_a_0(self):
        self.repo.consultar_audit_logs.return_value = MagicMock(registros=[], total_paginas=1)
        self.svc.consultar_audit_logs(pagina=1, usuario_filtro=-1)
        call_args = self.repo.consultar_audit_logs.call_args[0][0]
        assert call_args.usuario_filtro == 0

    def test_tabla_diferente_a_notificaciones_retorna_vacio(self):
        result = self.svc.consultar_audit_logs(pagina=1, tabla_filtro="otra_tabla")
        assert isinstance(result, ConsultarAuditLogsResult)
        assert result.registros == []
        assert result.total_paginas == 0
        self.repo.consultar_audit_logs.assert_not_called()

    def test_tabla_notificaciones_se_consulta(self):
        self.repo.consultar_audit_logs.return_value = MagicMock(registros=[], total_paginas=1)
        self.svc.consultar_audit_logs(pagina=1, tabla_filtro=TABLA_NOTIFICACIONES)
        self.repo.consultar_audit_logs.assert_called_once()

    def test_tabla_vacia_se_consulta(self):
        self.repo.consultar_audit_logs.return_value = MagicMock(registros=[], total_paginas=1)
        self.svc.consultar_audit_logs(pagina=1, tabla_filtro="")
        self.repo.consultar_audit_logs.assert_called_once()

    def test_usuario_valido(self):
        self.repo.consultar_audit_logs.return_value = MagicMock(registros=[], total_paginas=1)
        self.svc.consultar_audit_logs(pagina=1, usuario_filtro=5)
        call_args = self.repo.consultar_audit_logs.call_args[0][0]
        assert call_args.usuario_filtro == 5
