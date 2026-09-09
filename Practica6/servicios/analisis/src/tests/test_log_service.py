import pytest
from unittest.mock import MagicMock
from services.log_service import LogService
from models.log import ConsultarAuditLogsParams
from models.errors import BusinessValidationError


class TestLogService:
    def setup_method(self):
        self.repo = MagicMock()
        self.svc = LogService(self.repo)

    def test_consultar_ok(self):
        self.repo.consultar_audit_logs.return_value = MagicMock()
        result = self.svc.consultar_audit_logs(ConsultarAuditLogsParams(pagina=1))
        assert result is not None

    def test_pagina_invalida(self):
        with pytest.raises(BusinessValidationError, match="página"):
            self.svc.consultar_audit_logs(ConsultarAuditLogsParams(pagina=0))

    def test_usuario_negativo(self):
        with pytest.raises(BusinessValidationError, match="positivo"):
            self.svc.consultar_audit_logs(ConsultarAuditLogsParams(pagina=1, usuario_responsable=-1))

    def test_tabla_larga(self):
        with pytest.raises(BusinessValidationError, match="50"):
            self.svc.consultar_audit_logs(ConsultarAuditLogsParams(pagina=1, tabla_afectada="X" * 51))

    def test_operacion_larga(self):
        with pytest.raises(BusinessValidationError, match="50"):
            self.svc.consultar_audit_logs(ConsultarAuditLogsParams(pagina=1, operacion="X" * 51))

    def test_usuario_valido(self):
        self.repo.consultar_audit_logs.return_value = MagicMock()
        result = self.svc.consultar_audit_logs(ConsultarAuditLogsParams(pagina=1, usuario_responsable=5))
        assert result is not None

    def test_tabla_valida(self):
        self.repo.consultar_audit_logs.return_value = MagicMock()
        result = self.svc.consultar_audit_logs(ConsultarAuditLogsParams(pagina=1, tabla_afectada="users"))
        assert result is not None

    def test_operacion_valida(self):
        self.repo.consultar_audit_logs.return_value = MagicMock()
        result = self.svc.consultar_audit_logs(ConsultarAuditLogsParams(pagina=1, operacion="INSERT"))
        assert result is not None
