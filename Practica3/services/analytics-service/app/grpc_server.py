import io
from concurrent import futures

import grpc
import pandas as pd
from google.protobuf.timestamp_pb2 import Timestamp

from app.pb import analytics_pb2, analytics_pb2_grpc  # generado por protoc, ver Dockerfile/README
from app.db import get_connection
from app.services.trends_service import TrendsService
from app.services.recommendation_service import RecommendationService
from app.services.email_service import EmailService


def _to_ranking_items(items):
    return [
        analytics_pb2.RankingItem(
            recording_id=i["recording_id"],
            title=i["title"],
            view_count=i.get("view_count", 0),
            score=i.get("score", 0.0),
        )
        for i in items
    ]


class AnalyticsServicer(analytics_pb2_grpc.AnalyticsServiceServicer):
    def GetMostViewedThisWeek(self, request, context):
        items, from_cache, _ = TrendsService.most_viewed_this_week(request.semester or None)
        return analytics_pb2.RankingResponse(items=_to_ranking_items(items), from_cache=from_cache)

    def GetExamSeasonTrends(self, request, context):
        items, from_cache, _ = TrendsService.exam_season_trends(request.semester or None)
        return analytics_pb2.RankingResponse(items=_to_ranking_items(items), from_cache=from_cache)

    def GetTopRatedRecordings(self, request, context):
        items, from_cache, _ = TrendsService.top_rated(request.course_id or None)
        return analytics_pb2.RankingResponse(items=_to_ranking_items(items), from_cache=from_cache)

    def GetRecommendationScore(self, request, context):
        score, rationale = RecommendationService.score(request.user_id, request.recording_id)
        return analytics_pb2.RecommendationResponse(recommendation_percentage=score, rationale=rationale)

    def BulkIngestCsv(self, request, context):
        try:
            df = pd.read_csv(io.BytesIO(request.csv_content))
        except Exception as exc:  # noqa: BLE001
            return analytics_pb2.BulkIngestResponse(success=False, rows_processed=0, errors=[str(exc)])

        errors = []
        processed = 0
        table = "views_history_raw" if request.dataset == "views_history" else "ratings_raw"

        with get_connection() as conn, conn.cursor() as cur:
            for _, row in df.iterrows():
                try:
                    if table == "views_history_raw":
                        cur.execute(
                            """INSERT INTO views_history_raw (user_id, recording_id, viewed_at, semester)
                               VALUES (%s, %s, %s, %s)""",
                            (row.get("user_id"), row.get("recording_id"), row.get("viewed_at"), row.get("semester")),
                        )
                    else:
                        cur.execute(
                            """INSERT INTO ratings_raw (user_id, recording_id, rating)
                               VALUES (%s, %s, %s)""",
                            (row.get("user_id"), row.get("recording_id"), row.get("rating")),
                        )
                    processed += 1
                except Exception as exc:  # noqa: BLE001
                    errors.append(str(exc))
            conn.commit()

        return analytics_pb2.BulkIngestResponse(success=len(errors) == 0, rows_processed=processed, errors=errors)

    def SendNotification(self, request, context):
        import asyncio

        notification_type_name = analytics_pb2.NotificationType.Name(request.type)
        message_id = asyncio.run(
            EmailService.send(request.institutional_email, notification_type_name, dict(request.template_data))
        )
        return analytics_pb2.SendNotificationResponse(queued=True, message_id=message_id)


def serve(port: str):
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
    analytics_pb2_grpc.add_AnalyticsServiceServicer_to_server(AnalyticsServicer(), server)
    server.add_insecure_port(f"0.0.0.0:{port}")
    server.start()
    print(f"[analytics-service] gRPC server listening on :{port}")
    server.wait_for_termination()
