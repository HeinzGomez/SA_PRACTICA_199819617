FROM python:3.11-slim AS runtime

WORKDIR /app

COPY servicios/notificaciones/src/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY servicios/notificaciones/src ./src

WORKDIR /app/src

ENV PYTHONPATH=/app/src

EXPOSE 50056 3006

CMD ["python", "-u", "-m", "app"]
