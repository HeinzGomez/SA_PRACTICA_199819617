import { Router } from "express";
import { contentClient, identityClient, grpcCall } from "../grpc/clients";
import { requireAuth, requireRole } from "../middleware/auth.middleware";

/**
 * Panel Web de Administración (Práctica 3) — RBAC: todas las rutas de
 * este router exigen sesión válida (JWT/Session Cookie) Y uno de los
 * roles administrativos (Admin, Catedrático o Auxiliar). El "actor" que
 * ejecuta cada operación se toma del usuario autenticado (req.user), NO
 * del body, para evitar suplantación — y se revalida otra vez a nivel de
 * base de datos dentro de cada Procedimiento Almacenado
 * (fn_is_admin_role en identity-service/db/init.sql).
 */
export const adminRouter = Router();

const ADMIN_ROLES = ["ROLE_ADMIN", "ROLE_CATEDRATICO", "ROLE_AUXILIAR"];

adminRouter.use(requireAuth, requireRole(...ADMIN_ROLES));

// ---------------------------------------------------------------------
// Escuelas / Áreas
// ---------------------------------------------------------------------

adminRouter.get("/schools", async (_req, res, next) => {
  try {
    const response = await grpcCall(identityClient, "ListSchools", {});
    res.json(response);
  } catch (err) {
    next(err);
  }
});

adminRouter.post("/schools", async (req, res, next) => {
  try {
    const response = await grpcCall(identityClient, "UpsertSchool", {
      actorUserId: req.user!.userId,
      schoolId: req.body.schoolId ?? "",
      name: req.body.name,
    });
    res.status(201).json(response);
  } catch (err) {
    next(err);
  }
});

adminRouter.delete("/schools/:id", async (req, res, next) => {
  try {
    const response = await grpcCall(identityClient, "DeleteSchool", {
      actorUserId: req.user!.userId,
      entityId: req.params.id,
    });
    res.json(response);
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------
// Semestres
// ---------------------------------------------------------------------

adminRouter.get("/semesters", async (_req, res, next) => {
  try {
    const response = await grpcCall(identityClient, "ListSemesters", {});
    res.json(response);
  } catch (err) {
    next(err);
  }
});

adminRouter.post("/semesters", async (req, res, next) => {
  try {
    const response = await grpcCall(identityClient, "UpsertSemester", {
      actorUserId: req.user!.userId,
      semesterId: req.body.semesterId ?? "",
      code: req.body.code,
      label: req.body.label,
      startsOn: req.body.startsOn ?? "",
      endsOn: req.body.endsOn ?? "",
    });
    res.status(201).json(response);
  } catch (err) {
    next(err);
  }
});

adminRouter.delete("/semesters/:id", async (req, res, next) => {
  try {
    const response = await grpcCall(identityClient, "DeleteSemester", {
      actorUserId: req.user!.userId,
      entityId: req.params.id,
    });
    res.json(response);
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------
// Cursos
// ---------------------------------------------------------------------

adminRouter.post("/courses", async (req, res, next) => {
  try {
    const response = await grpcCall(identityClient, "UpsertCourse", {
      actorUserId: req.user!.userId,
      courseId: req.body.courseId ?? "",
      name: req.body.name,
      schoolId: req.body.schoolId,
      semesterId: req.body.semesterId,
    });
    res.status(201).json(response);
  } catch (err) {
    next(err);
  }
});

adminRouter.delete("/courses/:id", async (req, res, next) => {
  try {
    const response = await grpcCall(identityClient, "DeleteCourse", {
      actorUserId: req.user!.userId,
      entityId: req.params.id,
    });
    res.json(response);
  } catch (err) {
    next(err);
  }
});

/** Asignación académica: asigna un docente (Catedrático/Auxiliar) a un curso. */
adminRouter.post("/courses/:id/assign-professor", async (req, res, next) => {
  try {
    const response = await grpcCall(identityClient, "AssignProfessorToCourse", {
      actorUserId: req.user!.userId,
      courseId: req.params.id,
      professorId: req.body.professorId,
    });
    res.json(response);
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------
// Docentes
// ---------------------------------------------------------------------

adminRouter.get("/professors", async (_req, res, next) => {
  try {
    const response = await grpcCall(identityClient, "ListProfessors", {});
    res.json(response);
  } catch (err) {
    next(err);
  }
});

adminRouter.post("/professors", async (req, res, next) => {
  try {
    const response = await grpcCall(identityClient, "CreateProfessor", {
      actorUserId: req.user!.userId,
      institutionalEmail: req.body.institutionalEmail,
      fullName: req.body.fullName,
      password: req.body.password,
      carnet: req.body.carnet,
      role: req.body.role === "ROLE_AUXILIAR" ? "ROLE_AUXILIAR" : "ROLE_CATEDRATICO",
    });
    res.status(201).json(response);
  } catch (err) {
    next(err);
  }
});

adminRouter.patch("/professors/:id/active", async (req, res, next) => {
  try {
    const response = await grpcCall(identityClient, "SetProfessorActive", {
      actorUserId: req.user!.userId,
      professorId: req.params.id,
      isActive: !!req.body.isActive,
    });
    res.json(response);
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------
// Ingesta masiva de grabaciones (CSV)
// ---------------------------------------------------------------------

/**
 * POST /admin/recordings/bulk-csv
 * Body: { csvBase64: string }  (el cliente web lee el archivo con
 * FileReader.readAsDataURL/base64 antes de enviarlo — evita depender de
 * multipart/form-data y una dependencia extra de upload en el Gateway).
 */
adminRouter.post("/recordings/bulk-csv", async (req, res, next) => {
  try {
    if (!req.body.csvBase64) {
      return res.status(400).json({ error: "Falta el archivo CSV (csvBase64)." });
    }
    const response = await grpcCall(contentClient, "BulkIngestRecordingsCsv", {
      actorUserId: req.user!.userId,
      csvContent: Buffer.from(req.body.csvBase64, "base64"),
    });
    res.status(201).json(response);
  } catch (err) {
    next(err);
  }
});
