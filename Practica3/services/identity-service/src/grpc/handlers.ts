import * as grpc from "@grpc/grpc-js";
import { AuthService } from "../services/auth.service";
import { UserRepository } from "../repositories/user.repository";
import jwt from "jsonwebtoken";
import { env } from "../config/env";

const ROLE_ENUM: Record<string, string> = {
  ROLE_ESTUDIANTE: "ROLE_ESTUDIANTE",
  ROLE_CATEDRATICO: "ROLE_CATEDRATICO",
  ROLE_AUXILIAR: "ROLE_AUXILIAR",
  ROLE_ADMIN: "ROLE_ADMIN",
};

/**
 * Los Procedimientos Almacenados usados por el Panel de Administracion
 * validan RBAC a nivel de base de datos (fn_is_admin_role) y lanzan
 * excepciones Postgres cuando el actor no tiene permisos o los datos son
 * invalidos. Este helper las traduce a errores gRPC legibles en vez de
 * tumbar la conexion.
 */
function toGrpcError(err: any): grpc.ServiceError {
  const message: string = err?.message ?? "Error interno";
  const isRbac = message.includes("RBAC:");
  return {
    name: "GrpcError",
    message,
    code: isRbac ? grpc.status.PERMISSION_DENIED : grpc.status.FAILED_PRECONDITION,
    details: message,
    metadata: new grpc.Metadata(),
  } as grpc.ServiceError;
}

export const identityHandlers = {
  async RegisterInstitutionalUser(
    call: grpc.ServerUnaryCall<any, any>,
    callback: grpc.sendUnaryData<any>
  ) {
    const req = call.request;
    const result = await AuthService.register({
      email: req.institutionalEmail,
      fullName: req.fullName,
      password: req.password,
      carnet: req.carnet,
      initialRole: req.initialRole ?? "ROLE_ESTUDIANTE",
    });
    callback(null, {
      success: result.success,
      userId: result.userId ?? "",
      errorMessage: result.error ?? "",
    });
  },

  async ValidateCredentials(call: grpc.ServerUnaryCall<any, any>, callback: grpc.sendUnaryData<any>) {
    const req = call.request;
    const result = await AuthService.validateCredentials(req.institutionalEmail, req.password);
    callback(null, {
      valid: result.valid,
      userId: result.userId ?? "",
      roles: (result.roles ?? []).map((r: string) => ROLE_ENUM[r] ?? r),
      errorMessage: result.error ?? "",
    });
  },

  async ValidateSession(call: grpc.ServerUnaryCall<any, any>, callback: grpc.sendUnaryData<any>) {
    try {
      const payload: any = jwt.verify(call.request.jwt, env.jwtSecret);
      callback(null, {
        valid: true,
        userId: payload.userId,
        roles: payload.roles ?? [],
        expiresAt: { seconds: payload.exp, nanos: 0 },
      });
    } catch {
      callback(null, { valid: false, userId: "", roles: [] });
    }
  },

  async GetUserProfile(call: grpc.ServerUnaryCall<any, any>, callback: grpc.sendUnaryData<any>) {
    const user = await UserRepository.findById(call.request.userId);
    if (!user) {
      return callback({ code: grpc.status.NOT_FOUND, message: "Usuario no encontrado" } as any);
    }
    const roles = await UserRepository.getRoles(user.user_id);
    callback(null, {
      userId: user.user_id,
      institutionalEmail: user.institutional_email,
      fullName: user.full_name,
      carnet: user.carnet,
      roles,
      createdAt: { seconds: Math.floor(new Date(user.created_at).getTime() / 1000), nanos: 0 },
    });
  },

  async ListUserRoles(call: grpc.ServerUnaryCall<any, any>, callback: grpc.sendUnaryData<any>) {
    const roles = await UserRepository.getRoles(call.request.userId);
    callback(null, { roles });
  },

  async GetEnrolledCourses(call: grpc.ServerUnaryCall<any, any>, callback: grpc.sendUnaryData<any>) {
    const courses = await UserRepository.getEnrolledCourses(call.request.userId, call.request.semester);
    callback(null, { courses: courses.map(mapCourse) });
  },

  async VerifyCourseAccess(call: grpc.ServerUnaryCall<any, any>, callback: grpc.sendUnaryData<any>) {
    const hasAccess = await UserRepository.verifyCourseAccess(call.request.userId, call.request.courseId);
    callback(null, { hasAccess, reason: hasAccess ? "Inscrito" : "No inscrito en el curso" });
  },

  async ListCourses(call: grpc.ServerUnaryCall<any, any>, callback: grpc.sendUnaryData<any>) {
    const courses = await UserRepository.listCourses({
      semester: call.request.semester,
      school: call.request.school,
      professorId: call.request.professorId,
    });
    callback(null, { courses: courses.map(mapCourse) });
  },

  // -----------------------------------------------------------------
  // Panel de Administración (RBAC) — Práctica 3
  // -----------------------------------------------------------------

  async ListSchools(_call: grpc.ServerUnaryCall<any, any>, callback: grpc.sendUnaryData<any>) {
    const schools = await UserRepository.listSchools();
    callback(null, {
      schools: schools.map((s: any) => ({ schoolId: s.school_id, name: s.name, isActive: s.is_active })),
    });
  },

  async UpsertSchool(call: grpc.ServerUnaryCall<any, any>, callback: grpc.sendUnaryData<any>) {
    try {
      const req = call.request;
      const result = await UserRepository.upsertSchool(req.actorUserId, req.schoolId || null, req.name);
      callback(null, { schoolId: result.school_id, name: req.name, isActive: true });
    } catch (err) {
      callback(toGrpcError(err));
    }
  },

  async DeleteSchool(call: grpc.ServerUnaryCall<any, any>, callback: grpc.sendUnaryData<any>) {
    try {
      await UserRepository.deleteSchool(call.request.actorUserId, call.request.entityId);
      callback(null, { success: true });
    } catch (err: any) {
      callback(null, { success: false, errorMessage: err.message });
    }
  },

  async ListSemesters(_call: grpc.ServerUnaryCall<any, any>, callback: grpc.sendUnaryData<any>) {
    const semesters = await UserRepository.listSemesters();
    callback(null, {
      semesters: semesters.map((s: any) => ({
        semesterId: s.semester_id,
        code: s.code,
        label: s.label,
        startsOn: s.starts_on ? formatDate(s.starts_on) : "",
        endsOn: s.ends_on ? formatDate(s.ends_on) : "",
        isActive: s.is_active,
      })),
    });
  },

  async UpsertSemester(call: grpc.ServerUnaryCall<any, any>, callback: grpc.sendUnaryData<any>) {
    try {
      const req = call.request;
      const result = await UserRepository.upsertSemester(
        req.actorUserId,
        req.semesterId || null,
        req.code,
        req.label,
        req.startsOn || null,
        req.endsOn || null
      );
      callback(null, {
        semesterId: result.semester_id,
        code: req.code,
        label: req.label,
        startsOn: req.startsOn,
        endsOn: req.endsOn,
        isActive: true,
      });
    } catch (err) {
      callback(toGrpcError(err));
    }
  },

  async DeleteSemester(call: grpc.ServerUnaryCall<any, any>, callback: grpc.sendUnaryData<any>) {
    try {
      await UserRepository.deleteSemester(call.request.actorUserId, call.request.entityId);
      callback(null, { success: true });
    } catch (err: any) {
      callback(null, { success: false, errorMessage: err.message });
    }
  },

  async UpsertCourse(call: grpc.ServerUnaryCall<any, any>, callback: grpc.sendUnaryData<any>) {
    try {
      const req = call.request;
      const result = await UserRepository.upsertCourse(
        req.actorUserId,
        req.courseId || null,
        req.name,
        req.schoolId,
        req.semesterId
      );
      // Se relee desde v_course_catalog (por course_id) para devolver los
      // nombres de escuela/semestre/docente ya resueltos.
      const course = await UserRepository.getCourseById(result.course_id);
      callback(null, course ? mapCourse(course) : {});
    } catch (err) {
      callback(toGrpcError(err));
    }
  },

  async DeleteCourse(call: grpc.ServerUnaryCall<any, any>, callback: grpc.sendUnaryData<any>) {
    try {
      await UserRepository.deleteCourse(call.request.actorUserId, call.request.entityId);
      callback(null, { success: true });
    } catch (err: any) {
      callback(null, { success: false, errorMessage: err.message });
    }
  },

  async AssignProfessorToCourse(call: grpc.ServerUnaryCall<any, any>, callback: grpc.sendUnaryData<any>) {
    try {
      const req = call.request;
      await UserRepository.assignProfessorToCourse(req.actorUserId, req.courseId, req.professorId);
      callback(null, { success: true });
    } catch (err: any) {
      callback(null, { success: false, errorMessage: err.message });
    }
  },

  async ListProfessors(_call: grpc.ServerUnaryCall<any, any>, callback: grpc.sendUnaryData<any>) {
    const professors = await UserRepository.listProfessors();
    callback(null, {
      professors: professors.map((p: any) => ({
        userId: p.user_id,
        fullName: p.full_name,
        institutionalEmail: p.institutional_email,
        isActive: p.is_active,
        role: p.role_name,
      })),
    });
  },

  async CreateProfessor(call: grpc.ServerUnaryCall<any, any>, callback: grpc.sendUnaryData<any>) {
    const req = call.request;
    // El actor (Admin/Catedratico/Auxiliar) ya fue validado por el API
    // Gateway (RBAC) y se revalida dentro de sp_register_user en una
    // futura iteracion; por ahora reutiliza el mismo flujo de registro.
    const result = await AuthService.register({
      email: req.institutionalEmail,
      fullName: req.fullName,
      password: req.password,
      carnet: req.carnet,
      initialRole: req.role === "ROLE_AUXILIAR" ? "ROLE_AUXILIAR" : "ROLE_CATEDRATICO",
    });
    callback(null, {
      success: result.success,
      userId: result.userId ?? "",
      errorMessage: result.error ?? "",
    });
  },

  async SetProfessorActive(call: grpc.ServerUnaryCall<any, any>, callback: grpc.sendUnaryData<any>) {
    try {
      const req = call.request;
      await UserRepository.setProfessorActive(req.actorUserId, req.professorId, req.isActive);
      callback(null, { success: true });
    } catch (err: any) {
      callback(null, { success: false, errorMessage: err.message });
    }
  },
};

function mapCourse(row: any) {
  return {
    courseId: row.course_id,
    name: row.name,
    school: row.school,
    semester: row.semester,
    professorId: row.professor_id ?? "",
    schoolId: row.school_id,
    semesterId: row.semester_id,
    professorName: row.professor_name ?? "",
    isActive: row.is_active,
  };
}

function formatDate(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toISOString().slice(0, 10);
}
