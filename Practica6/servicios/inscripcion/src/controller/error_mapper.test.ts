import { status } from "@grpc/grpc-js";
import { buildError } from "./error_mapper";

describe("buildError", () => {
  it("deberia retornar INVALID_ARGUMENT por defecto", () => {
    const err = buildError(new Error("campo requerido"));
    expect(err.code).toBe(status.INVALID_ARGUMENT);
  });

  it("deberia retornar ALREADY_EXISTS para 'ya existe'", () => {
    const err = buildError(new Error("El area ya existe"));
    expect(err.code).toBe(status.ALREADY_EXISTS);
  });

  it("deberia retornar ALREADY_EXISTS para 'ya está en uso'", () => {
    const err = buildError(new Error("El registro ya está en uso"));
    expect(err.code).toBe(status.ALREADY_EXISTS);
  });

  it("deberia retornar ALREADY_EXISTS para 'ya tiene asignado'", () => {
    const err = buildError(new Error("El usuario ya tiene asignado el rol"));
    expect(err.code).toBe(status.ALREADY_EXISTS);
  });

  it("deberia manejar error no-Error", () => {
    const err = buildError("string error");
    expect(err.code).toBe(status.INVALID_ARGUMENT);
    expect(err.message).toBe("Error interno del servidor");
  });

  it("deberia incluir details", () => {
    const err = buildError(new Error("test"));
    expect(err.details).toBe("test");
  });
});
