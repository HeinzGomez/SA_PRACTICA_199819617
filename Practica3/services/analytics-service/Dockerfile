# Contexto de build: RAIZ del repo (ver docker-compose.*.yml)
FROM python:3.12-slim AS base
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends gcc libpq-dev && rm -rf /var/lib/apt/lists/*

COPY services/analytics-service/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY services/analytics-service/ ./
COPY proto /proto

# Genera los stubs de gRPC a partir de los contratos compartidos.
# NOTA: proto_path apunta directo a /proto/analytics (no a /proto) para que
# los *_pb2.py generados caigan planos en app/pb/, coincidiendo con el
# import "from app.pb import analytics_pb2, analytics_pb2_grpc" del codigo.
# Ademas, grpc_tools genera "import analytics_pb2" como import absoluto
# dentro de analytics_pb2_grpc.py; se parchea a import relativo para que
# funcione dentro del paquete app.pb.
RUN mkdir -p app/pb && python -m grpc_tools.protoc \
      --proto_path=/proto/analytics \
      --python_out=app/pb --grpc_python_out=app/pb \
      /proto/analytics/analytics.proto && \
    touch app/pb/__init__.py && \
    sed -i 's/^import analytics_pb2 as analytics__pb2/from . import analytics_pb2 as analytics__pb2/' app/pb/analytics_pb2_grpc.py

EXPOSE 50053 8083
CMD ["python", "-m", "app.main"]
