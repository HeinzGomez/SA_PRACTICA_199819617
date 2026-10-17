// HeinzGomez - Práctica 9: rutas de autenticación (CDU 1) -> rpc/auth.ts
import { Router } from 'express';
import { Servicios } from '../types';
import { autenticar, envolver } from './middleware';

export function crearRutasAuth(s: Servicios): Router {
  const r = Router();

  r.post('/register', envolver(async (req, res) => {
    res.status(201).json(await s.auth.registro(req.body ?? {}));
  }));
  r.post('/login', envolver(async (req, res) => {
    res.json(await s.auth.login(req.body ?? {}));
  }));
  r.get('/me', autenticar(s), (req, res) => { res.json(req.usuario); });

  return r;
}
