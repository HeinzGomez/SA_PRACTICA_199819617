from app.db import get_connection


class RecommendationService:
    """Motor de recomendaciones: calcula el % de recomendacion academica de
    una grabacion combinando valoraciones y comportamiento de visualizacion
    mediante la funcion SQL fn_recommendation_score (db/init.sql)."""

    @staticmethod
    def score(user_id: str, recording_id: str):
        with get_connection() as conn, conn.cursor() as cur:
            cur.execute("SELECT fn_recommendation_score(%s, %s) AS score", (user_id, recording_id))
            row = cur.fetchone()
        score = float(row["score"]) if row and row["score"] is not None else 0.0
        rationale = (
            "Basado en valoraciones de estudiantes con perfil academico similar y en la "
            "frecuencia de repaso durante epocas de examenes."
        )
        return score, rationale
