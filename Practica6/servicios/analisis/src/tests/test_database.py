import pytest
from unittest.mock import MagicMock, patch


class TestGetDatabase:
    @patch("config.database.get_config")
    @patch("config.database.ThreadedConnectionPool")
    def test_creates_pool(self, MockPool, mock_get_config):
        import config.database as db_mod
        db_mod._pool = None
        mock_get_config.return_value = MagicMock(DB_HOST="h", DB_PORT=5432, DB_NAME="d", DB_USER="u", DB_PASS="p")
        pool = MagicMock()
        MockPool.return_value = pool
        from config.database import get_database
        result = get_database()
        assert result is pool
        db_mod._pool = None

    @patch("config.database.get_config")
    @patch("config.database.ThreadedConnectionPool")
    def test_singleton(self, MockPool, mock_get_config):
        import config.database as db_mod
        db_mod._pool = None
        mock_get_config.return_value = MagicMock(DB_HOST="h", DB_PORT=5432, DB_NAME="d", DB_USER="u", DB_PASS="p")
        MockPool.return_value = MagicMock()
        from config.database import get_database
        p1 = get_database()
        p2 = get_database()
        assert p1 is p2
        db_mod._pool = None


class TestGetConnection:
    @patch("config.database.get_database")
    def test_returns_conn(self, mock_get_db):
        import config.database as db_mod
        db_mod._pool = None
        pool = MagicMock()
        conn = MagicMock()
        pool.getconn.return_value = conn
        mock_get_db.return_value = pool
        from config.database import get_connection
        result = get_connection()
        assert result is conn


class TestReleaseConnection:
    @patch("config.database.get_database")
    def test_releases_conn(self, mock_get_db):
        import config.database as db_mod
        db_mod._pool = None
        pool = MagicMock()
        mock_get_db.return_value = pool
        conn = MagicMock()
        from config.database import release_connection
        release_connection(conn)
        pool.putconn.assert_called_once_with(conn)

    def test_release_none_does_nothing(self):
        from config.database import release_connection
        release_connection(None)


class TestCloseDatabase:
    @patch("config.database.get_database")
    def test_close(self, mock_get_db):
        import config.database as db_mod
        pool = MagicMock()
        db_mod._pool = pool
        from config.database import close_database
        close_database()
        pool.closeall.assert_called_once()
        assert db_mod._pool is None

    def test_close_when_none(self):
        import config.database as db_mod
        db_mod._pool = None
        from config.database import close_database
        close_database()
