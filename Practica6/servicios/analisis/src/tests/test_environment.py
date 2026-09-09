import os
import pytest
from unittest.mock import patch

ENV_REQUIRED = {
    "ANAL_DB_HOST": "localhost",
    "ANAL_DB_PORT": "5432",
    "ANAL_DB_NAME": "testdb",
    "ANAL_DB_USER": "user",
    "ANAL_DB_PASS": "pass",
    "ANAL_GRPC_PORT": "50051",
    "ANAL_HTTP_PORT": "8080",
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
        with patch.dict(os.environ, {"ANAL_DB_PORT": "abc"}):
            from config.environment import _required_int
            with pytest.raises(ValueError, match="entero"):
                _required_int("ANAL_DB_PORT")

    def test_raises_when_missing(self):
        from config.environment import _required_int
        with pytest.raises(ValueError, match="requerida"):
            _required_int("NONEXISTENT_INT_999")


class TestOptionalInt:
    def test_returns_default_when_missing(self):
        from config.environment import _optional_int
        result = _optional_int("NONEXISTENT_OPT_INT", 99)
        assert result == 99

    def test_returns_value_when_set(self):
        with patch.dict(os.environ, {"OPT_INT_TEST": "77"}):
            from config.environment import _optional_int
            assert _optional_int("OPT_INT_TEST", 99) == 77

    def test_raises_when_not_int(self):
        with patch.dict(os.environ, {"OPT_INT_BAD": "abc"}):
            from config.environment import _optional_int
            with pytest.raises(ValueError, match="entero"):
                _optional_int("OPT_INT_BAD", 99)


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
            assert cfg.GRPC_PORT == 50051
            assert cfg.HTTP_PORT == 8080

    def test_defaults_for_redis(self):
        with patch.dict(os.environ, ENV_REQUIRED):
            from config.environment import _load
            cfg = _load()
            assert cfg.REDIS_HOST == "localhost"
            assert cfg.REDIS_PORT == 6379
            assert cfg.REDIS_PASSWORD == ""
            assert cfg.REDIS_DB == 0

    def test_custom_redis_values(self):
        env = {**ENV_REQUIRED, "ANAL_REDIS_HOST": "redis-host", "ANAL_REDIS_PORT": "6380",
               "ANAL_REDIS_PASSWORD": "secret", "ANAL_REDIS_DB": "2"}
        with patch.dict(os.environ, env):
            from config.environment import _load
            cfg = _load()
            assert cfg.REDIS_HOST == "redis-host"
            assert cfg.REDIS_PORT == 6380
            assert cfg.REDIS_PASSWORD == "secret"
            assert cfg.REDIS_DB == 2

    def test_raises_when_required_missing(self):
        with patch.dict(os.environ, {}, clear=True):
            from config.environment import _load
            with pytest.raises(ValueError):
                _load()


class TestGetConfig:
    def test_singleton(self):
        with patch.dict(os.environ, ENV_REQUIRED):
            from config.environment import get_config, _load
            c1 = get_config()
            c2 = get_config()
            assert c1 is c2
