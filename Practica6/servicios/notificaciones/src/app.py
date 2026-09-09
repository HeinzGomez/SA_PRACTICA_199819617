import threading
from http.server import BaseHTTPRequestHandler, HTTPServer

from config.environment import get_config
from config.logger import get_logger
from controller.log_controller import LogController
from controller.notificaciones_controller import NotificacionesController
from repositories.audit_repository import PostgresAuditLogRepository
from repositories.notification_repository import PostgresNotificationRepository
from server.grpc_server import GrpcServer
from services.email_service import EmailService
from services.log_service import LogService
from services.notification_service import NotificationService

_logger = get_logger("notificaciones.app")


class HealthHandler(BaseHTTPRequestHandler):
    def do_GET(self) -> None:
        if self.path == "/health":
            body = b'{"status": "ok"}'
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
        else:
            self.send_error(404)


def _start_health_server() -> HTTPServer:
    http_port = get_config().HTTP_PORT
    http_server = HTTPServer(("0.0.0.0", http_port), HealthHandler)
    thread = threading.Thread(
        target=http_server.serve_forever, daemon=True
    )
    thread.start()
    return http_server


def main() -> None:
    repository = PostgresNotificationRepository()
    audit_repository = PostgresAuditLogRepository()
    email_service = EmailService()
    service = NotificationService(repository, email_service)
    log_service = LogService(audit_repository)
    notification_controller = NotificacionesController(service)
    log_controller = LogController(log_service)

    grpc_server = GrpcServer(
        notification_controller, log_controller
    ).start()
    http_server = _start_health_server()

    grpc_port = get_config().GRPC_PORT
    http_port = get_config().HTTP_PORT
    _logger.info("gRPC en puerto %s, HTTP en puerto %s", grpc_port, http_port)

    try:
        grpc_server.wait_for_termination()
    except KeyboardInterrupt:
        _logger.info("Servicio detenido por el usuario")
        grpc_server.stop(0)
        http_server.shutdown()


if __name__ == "__main__":
    main()
