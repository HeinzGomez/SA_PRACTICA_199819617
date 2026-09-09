import threading
from http.server import BaseHTTPRequestHandler, HTTPServer

from config.environment import get_config
from controller.assign_controller import AssignController
from controller.class_controller import ClassController
from controller.log_controller import LogController
from controller.rating_controller import RatingController
from controller.topic_controller import TopicController
from repositories.assign_repository import PostgresAssignRepository
from repositories.class_repository import PostgresClassRepository
from repositories.log_repository import PostgresLogRepository
from repositories.rating_repository import PostgresRatingRepository
from repositories.redis_repository import RedisCacheRepository
from repositories.topic_repository import PostgresTopicRepository
from server.grpc_server import GrpcServer
from services.assign_service import AssignService
from services.class_service import ClassService
from services.log_service import LogService
from services.rating_service import RatingService
from services.topic_service import TopicService


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
    topic_controller = TopicController(
        TopicService(PostgresTopicRepository())
    )
    class_controller = ClassController(
        ClassService(PostgresClassRepository())
    )
    assign_controller = AssignController(
        AssignService(PostgresAssignRepository())
    )
    rating_controller = RatingController(
        RatingService(PostgresRatingRepository(), RedisCacheRepository())
    )
    log_controller = LogController(
        LogService(PostgresLogRepository())
    )

    grpc_server = GrpcServer(
        topic_controller,
        class_controller,
        assign_controller,
        rating_controller,
        log_controller,
    ).start()
    http_server = _start_health_server()

    grpc_port = get_config().GRPC_PORT
    http_port = get_config().HTTP_PORT
    print(f"[analisis-service] gRPC en puerto {grpc_port}, HTTP en {http_port}")

    try:
        grpc_server.wait_for_termination()
    except KeyboardInterrupt:
        grpc_server.stop(0)
        http_server.shutdown()


if __name__ == "__main__":
    main()
