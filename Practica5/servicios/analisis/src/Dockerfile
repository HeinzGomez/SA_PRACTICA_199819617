FROM python:3.11-slim AS runtime

WORKDIR /app

COPY servicios/analisis/src/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY servicios/analisis/src ./src

WORKDIR /app/src

ENV PYTHONPATH=/app/src

EXPOSE 50054 3004

CMD ["python", "-m", "app"]
