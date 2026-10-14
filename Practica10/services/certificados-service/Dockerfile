# HeinzGomez - Práctica 10: imagen del Servicio de Certificados (Python). Contexto de build: raíz del repositorio.
FROM python:3.12-slim
WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 PUERTO=8094
COPY services/certificados-service/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY services/certificados-service/app ./app
RUN useradd -u 10001 -M app
USER app
# Liveness de Docker/Kubernetes: la imagen no trae curl, se usa el propio intérprete.
HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=5 \
  CMD ["python", "-m", "app.observabilidad.healthcheck"]
CMD ["python", "-m", "app.main"]
