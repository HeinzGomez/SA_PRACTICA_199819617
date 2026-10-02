# HeinzGomez - Práctica 7: imagen del Servicio de Certificados (Python). Contexto de build: raíz del repositorio.
FROM python:3.12-slim
WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 GRPC_PORT=50054
COPY services/certificados-service/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY proto /proto
COPY services/certificados-service/app ./app
COPY services/certificados-service/gen_proto.sh .
RUN PROTO_DIR=/proto sh gen_proto.sh && useradd -u 10001 -M app
USER app
EXPOSE 50054
CMD ["python", "-m", "app.main"]
