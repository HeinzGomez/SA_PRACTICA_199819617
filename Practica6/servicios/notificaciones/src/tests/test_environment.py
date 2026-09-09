import os
import pytest
from unittest.mock import patch

ENV_REQUIRED = {
    "NOT_DB_HOST": "localhost",
    "NOT_DB_PORT": "5432",
    "NOT_DB_NAME": "testdb",
    "NOT_DB_USER": "user",
    "NOT_DB_PASS": "pass",
    "NOTIFICATION_HOST_SMTP": "smtp.test.com",
    "NOTIFICATION_PORT_SMTP": "587",
    "NOTIFICATION_FROM_SMTP": "test@test.com",
    "NOTIFICATION_PASS_SMTP": "smtp_pass",
    "NOT_GRPC_PORT": "50051",
    "NOT_HTTP_PORT": "8080",
}


@pytest.fixture(autouse=True)
def _clean_config():
    import config.environment as env_mod
    env_mod._config = None
    yield
    env_mod._config = None


class TestRequired:
    def test_returns_value(self):
        with patch.dict(os.environ, {"TEST_KEY": "hello"}):
            from config.environment import _required
            assert _required("TEST_KEY") == "hello"

    def test_raises_when_missing(self):
        from config.environment import _required
        with pytest.raises(ValueError, match="requerida"):
            _required("NONEXISTENT_KEY_999")


class TestRequiredInt:
    def test_returns_int(self):
        with patch.dict(os.environ, {"TEST_INT": "42"}):
            from config.environment import _required_int
            assert _required_int("TEST_INT") == 42

    def test_raises_when_not_int(self):
        with patch.dict(os.environ, {"NOT_DB_PORT": "abc"}):
            from config.environment import _required_int
            with pytest.raises(ValueError, match="entero"):
                _required_int("NOT_DB_PORT")

    def test_raises_when_missing(self):
        from config.environment import _required_int
        with pytest.raises(ValueError, match="requerida"):
            _required_int("NONEXISTENT_INT_999")


class TestLoad:
    def test_loads_all_config(self):
        with patch.dict(os.environ, ENV_REQUIRED):
            from config.environment import _load
            cfg = _load()
            assert cfg.DB_HOST == "localhost"
            assert cfg.DB_PORT == 5432
            assert cfg.DB_NAME == "testdb"
            assert cfg.DB_USER == "user"
            assert cfg.DB_PASS == "pass"
            assert cfg.HOST_SMTP == "smtp.test.com"
            assert cfg.PORT_SMTP == 587
            assert cfg.FROM_SMTP == "test@test.com"
            assert cfg.PASS_SMTP == "smtp_pass"
            assert cfg.GRPC_PORT == 50051
            assert cfg.HTTP_PORT == 8080

    def test_raises_when_required_missing(self):
        with patch.dict(os.environ, {}, clear=True):
            from config.environment import _load
            with pytest.raises(ValueError):
                _load()


class TestGetConfig:
    def test_singleton(self):
        with patch.dict(os.environ, ENV_REQUIRED):
            from config.environment import get_config
            c1 = get_config()
            c2 = get_config()
            assert c1 is c2
