# analytics-service (Python)

Dominio: analítica académica, tendencias, motor de recomendaciones, caché
Redis con TTL, carga masiva CSV y notificaciones institucionales por correo.
Único canal expuesto: **gRPC** (puerto `GRPC_PORT`, por defecto `50053`). El
puerto HTTP (`HTTP_PORT`) solo sirve `/health` vía FastAPI.

## Generar los stubs de gRPC

Los archivos generados (`app/pb/*_pb2*.py`) **no se versionan**. El
`Dockerfile` los genera automáticamente en build. Para desarrollo local:

```bash
pip install -r requirements.txt
mkdir -p app/pb && touch app/pb/__init__.py
python -m grpc_tools.protoc \
  --proto_path=../../proto/analytics \
  --python_out=app/pb --grpc_python_out=app/pb \
  ../../proto/analytics/analytics.proto

# grpc_tools genera un import absoluto que hay que volver relativo:
sed -i 's/^import analytics_pb2 as analytics__pb2/from . import analytics_pb2 as analytics__pb2/' app/pb/analytics_pb2_grpc.py

python -m app.main
```

## Base de datos y caché

`db/init.sql` crea el esquema `analytics_db` con procedimiento almacenado
(`sp_log_notification`), vistas (`v_weekly_ranking`, `v_top_rated`), funciones
(`fn_is_exam_season`, `fn_recommendation_score`) y trigger
(`trg_prevent_duplicate_rating`). Las consultas de tendencias se cachean en
Redis (`app/redis_client.py`) con TTL configurable (`CACHE_TTL_SECONDS`).
