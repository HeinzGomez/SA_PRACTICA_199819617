import { Router } from "express";
import { contentClient, identityClient, grpcCall } from "../grpc/clients";
import { requireAuth, requireRole } from "../middleware/auth.middleware";

export const catalogRouter = Router();

/** GET /catalog/courses — catalogo de cursos (identity-service) */
catalogRouter.get("/courses", requireAuth, async (req, res, next) => {
  try {
    const { semester, school, professorId } = req.query;
    const response = await grpcCall(identityClient, "ListCourses", { semester, school, professorId });
    res.json(response);
  } catch (err) {
    next(err);
  }
});

/**
 * Catálogo de filtros de solo lectura (Práctica 3): a diferencia de
 * /admin/schools, /admin/semesters y /admin/professors (que exigen rol
 * administrativo porque permiten escritura), estos endpoints solo listan
 * — cualquier usuario autenticado los usa para poblar los selectores de
 * filtro combinado del catálogo (Semestre, Escuela, Curso, Docente).
 */
catalogRouter.get("/schools", requireAuth, async (_req, res, next) => {
  try {
    const response = await grpcCall(identityClient, "ListSchools", {});
    res.json(response);
  } catch (err) {
    next(err);
  }
});

catalogRouter.get("/semesters", requireAuth, async (_req, res, next) => {
  try {
    const response = await grpcCall(identityClient, "ListSemesters", {});
    res.json(response);
  } catch (err) {
    next(err);
  }
});

catalogRouter.get("/professors", requireAuth, async (_req, res, next) => {
  try {
    const response = await grpcCall(identityClient, "ListProfessors", {});
    res.json(response);
  } catch (err) {
    next(err);
  }
});

// Tope de paginacion exigido por la Practica 3: nunca mas de 10 clases
// por pagina. content-service tambien lo clampa (repository.MaxPageSize)
// como fuente de verdad; este clamp aqui es defensa en profundidad.
const MAX_PAGE_SIZE = 10;

/**
 * GET /catalog/recordings — busqueda avanzada de grabaciones
 * (content-service), con paginacion desde el servidor (maximo 10 por
 * pagina) y filtros combinados por semestre, escuela, curso y docente.
 */
catalogRouter.get("/recordings", requireAuth, async (req, res, next) => {
  try {
    const { semester, school, courseId, professorId, tags, q, page, pageSize } = req.query;
    const response = await grpcCall(contentClient, "SearchRecordings", {
      semester,
      school,
      courseId,
      professorId,
      tags: typeof tags === "string" ? tags.split(",") : [],
      freeText: q,
      page: Number(page ?? 1),
      pageSize: Math.min(Number(pageSize ?? MAX_PAGE_SIZE), MAX_PAGE_SIZE),
    });
    res.json(response);
  } catch (err) {
    next(err);
  }
});

/** GET /catalog/recordings/:id — ficha tecnica detallada de una clase grabada */
catalogRouter.get("/recordings/:id", requireAuth, async (req, res, next) => {
  try {
    const detail = await grpcCall(contentClient, "GetRecordingDetail", {
      recordingId: req.params.id,
    });
    res.json(detail);
  } catch (err) {
    next(err);
  }
});

/** POST /catalog/recordings — ingesta de nuevas grabaciones (Catedratico/Auxiliar/Admin) */
catalogRouter.post(
  "/recordings",
  requireAuth,
  requireRole("ROLE_CATEDRATICO", "ROLE_AUXILIAR", "ROLE_ADMIN"),
  async (req, res, next) => {
    try {
      const response = await grpcCall(contentClient, "IngestRecording", req.body);
      res.status(201).json(response);
    } catch (err) {
      next(err);
    }
  }
);

/** POST /catalog/recordings/:id/playback — evento de reproduccion (play/pause/seek) */
catalogRouter.post("/recordings/:id/playback", requireAuth, async (req, res, next) => {
  try {
    const response = await grpcCall(contentClient, "RegisterPlaybackEvent", {
      userId: req.user!.userId,
      recordingId: req.params.id,
      eventType: req.body.eventType,
      positionSeconds: req.body.positionSeconds,
    });
    res.json(response);
  } catch (err) {
    next(err);
  }
});

/** PUT /catalog/recordings/:id/checkpoint — guarda el avance exacto del estudiante */
catalogRouter.put("/recordings/:id/checkpoint", requireAuth, async (req, res, next) => {
  try {
    const response = await grpcCall(contentClient, "SaveCheckpoint", {
      userId: req.user!.userId,
      recordingId: req.params.id,
      positionSeconds: req.body.positionSeconds,
      unit: req.body.unit,
      topic: req.body.topic,
    });
    res.json(response);
  } catch (err) {
    next(err);
  }
});

/** GET /catalog/recordings/:id/checkpoint — recupera el ultimo checkpoint guardado */
catalogRouter.get("/recordings/:id/checkpoint", requireAuth, async (req, res, next) => {
  try {
    const response = await grpcCall(contentClient, "GetLastCheckpoint", {
      userId: req.user!.userId,
      recordingId: req.params.id,
    });
    res.json(response);
  } catch (err) {
    next(err);
  }
});

/** GET /catalog/history/recent — historial de reproduccion reciente del estudiante */
catalogRouter.get("/history/recent", requireAuth, async (req, res, next) => {
  try {
    const response = await grpcCall(contentClient, "GetRecentHistory", {
      userId: req.user!.userId,
      limit: Number(req.query.limit ?? 10),
    });
    res.json(response);
  } catch (err) {
    next(err);
  }
});
