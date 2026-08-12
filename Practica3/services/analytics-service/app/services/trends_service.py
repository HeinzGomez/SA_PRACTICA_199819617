from datetime import datetime, timezone

from app.db import get_connection
from app.redis_client import cache_get, cache_set


class TrendsService:
    """Calcula tendencias academicas (mas vistas, epoca de examenes, mejor
    valoradas) respaldadas por cache Redis con TTL, tal como exige el
    enunciado (evitar sobrecargar la BD en picos de concurrencia)."""

    @staticmethod
    def most_viewed_this_week(semester: str | None):
        cache_key = f"trends:most_viewed:{semester or 'all'}"
        cached = cache_get(cache_key)
        if cached:
            return cached["items"], True, cached["generated_at"]

        with get_connection() as conn, conn.cursor() as cur:
            cur.execute(
                """
                SELECT recording_id, title, view_count
                FROM v_weekly_ranking
                WHERE (%s IS NULL OR semester = %s)
                ORDER BY view_count DESC
                LIMIT 20
                """,
                (semester, semester),
            )
            rows = cur.fetchall()

        items = [
            {"recording_id": r["recording_id"], "title": r["title"], "view_count": r["view_count"], "score": 0.0}
            for r in rows
        ]
        generated_at = datetime.now(timezone.utc).isoformat()
        cache_set(cache_key, {"items": items, "generated_at": generated_at})
        return items, False, generated_at

    @staticmethod
    def exam_season_trends(semester: str | None):
        cache_key = f"trends:exam_season:{semester or 'all'}"
        cached = cache_get(cache_key)
        if cached:
            return cached["items"], True, cached["generated_at"]

        with get_connection() as conn, conn.cursor() as cur:
            # fn_is_exam_season() encapsula la logica de fechas de examenes
            cur.execute(
                """
                SELECT recording_id, title, view_count
                FROM v_weekly_ranking
                WHERE fn_is_exam_season(now())
                  AND (%s IS NULL OR semester = %s)
                ORDER BY view_count DESC
                LIMIT 20
                """,
                (semester, semester),
            )
            rows = cur.fetchall()

        items = [
            {"recording_id": r["recording_id"], "title": r["title"], "view_count": r["view_count"], "score": 0.0}
            for r in rows
        ]
        generated_at = datetime.now(timezone.utc).isoformat()
        cache_set(cache_key, {"items": items, "generated_at": generated_at}, ttl_seconds=120)
        return items, False, generated_at

    @staticmethod
    def top_rated(course_id: str | None):
        cache_key = f"trends:top_rated:{course_id or 'all'}"
        cached = cache_get(cache_key)
        if cached:
            return cached["items"], True, cached["generated_at"]

        with get_connection() as conn, conn.cursor() as cur:
            cur.execute(
                """
                SELECT recording_id, title, avg_rating
                FROM v_top_rated
                WHERE (%s IS NULL OR course_id::text = %s)
                ORDER BY avg_rating DESC
                LIMIT 20
                """,
                (course_id, course_id),
            )
            rows = cur.fetchall()

        items = [
            {"recording_id": r["recording_id"], "title": r["title"], "view_count": 0, "score": float(r["avg_rating"] or 0)}
            for r in rows
        ]
        generated_at = datetime.now(timezone.utc).isoformat()
        cache_set(cache_key, {"items": items, "generated_at": generated_at})
        return items, False, generated_at
