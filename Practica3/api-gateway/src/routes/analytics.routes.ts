import { Router } from "express";
import { analyticsClient, grpcCall } from "../grpc/clients";
import { requireAuth, requireRole } from "../middleware/auth.middleware";

export const analyticsRouter = Router();

/** GET /analytics/trending/weekly — clases mas vistas por semana (cache Redis, TTL corto) */
analyticsRouter.get("/trending/weekly", requireAuth, async (req, res, next) => {
  try {
    const response = await grpcCall(analyticsClient, "GetMostViewedThisWeek", {
      semester: req.query.semester,
    });
    res.json(response);
  } catch (err) {
    next(err);
  }
});

/** GET /analytics/trending/exam-season — tendencias en epoca de examenes */
analyticsRouter.get("/trending/exam-season", requireAuth, async (req, res, next) => {
  try {
    const response = await grpcCall(analyticsClient, "GetExamSeasonTrends", {
      semester: req.query.semester,
    });
    res.json(response);
  } catch (err) {
    next(err);
  }
});

/** GET /analytics/top-rated — ranking de clases mejor valoradas */
analyticsRouter.get("/top-rated", requireAuth, async (req, res, next) => {
  try {
    const response = await grpcCall(analyticsClient, "GetTopRatedRecordings", {
      courseId: req.query.courseId,
    });
    res.json(response);
  } catch (err) {
    next(err);
  }
});

/** GET /analytics/recommendation — porcentaje de recomendacion academica */
analyticsRouter.get("/recommendation", requireAuth, async (req, res, next) => {
  try {
    const response = await grpcCall(analyticsClient, "GetRecommendationScore", {
      userId: req.user!.userId,
      recordingId: req.query.recordingId,
    });
    res.json(response);
  } catch (err) {
    next(err);
  }
});

/** POST /analytics/bulk-ingest — carga masiva CSV (solo Admin) */
analyticsRouter.post("/bulk-ingest", requireAuth, requireRole("ROLE_ADMIN"), async (req, res, next) => {
  try {
    const response = await grpcCall(analyticsClient, "BulkIngestCsv", {
      csvContent: Buffer.from(req.body.csvBase64, "base64"),
      dataset: req.body.dataset,
    });
    res.json(response);
  } catch (err) {
    next(err);
  }
});
