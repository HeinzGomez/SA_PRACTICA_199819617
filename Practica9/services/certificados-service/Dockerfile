# HeinzGomez - Práctica 9: imagen del Servicio de Certificados (Python). Contexto de build: raíz del repositorio.
FROM python:3.12-slim
WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
COPY services/certificados-service/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY services/certificados-service/app ./app
RUN useradd -u 10001 -M app
USER app
CMD ["python", "-m", "app.main"]
