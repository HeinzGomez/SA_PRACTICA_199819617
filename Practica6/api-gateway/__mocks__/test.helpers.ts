import { Request, Response } from "express";

export function mockRes(): Response {
  const res: Partial<Response> = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    cookie: jest.fn().mockReturnThis(),
    clearCookie: jest.fn().mockReturnThis(),
    redirect: jest.fn().mockReturnThis(),
  };
  return res as Response;
}

export function mockReq(overrides: Record<string, unknown> = {}): Request {
  return {
    body: {},
    params: {},
    query: {},
    headers: {},
    sesion: undefined,
    usuario: undefined,
    ...overrides,
  } as unknown as Request;
}

export const okResponse = { exito: true, mensaje: "ok" };

export const gs = Object.assign(new Error("fail"), { code: 13 });
