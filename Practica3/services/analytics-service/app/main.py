import threading

import uvicorn
from fastapi import FastAPI

from app.config import settings
from app.grpc_server import serve as serve_grpc
from app.routers.health import router as health_router

# FastAPI se usa UNICAMENTE para el healthcheck HTTP interno del contenedor.
# El trafico funcional real de este microservicio viaja por gRPC, tal como
# exige el enunciado (comunicacion east-west solo via gRPC/Protocol Buffers).
app = FastAPI(title="analytics-service", version="1.0.0")
app.include_router(health_router)


def main():
    grpc_thread = threading.Thread(target=serve_grpc, args=(settings.grpc_port,), daemon=True)
    grpc_thread.start()

    uvicorn.run(app, host="0.0.0.0", port=int(settings.http_port))


if __name__ == "__main__":
    main()
