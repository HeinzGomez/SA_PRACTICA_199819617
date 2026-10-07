'use client';
// HeinzGomez - Práctica 7: contexto de sesión (JWT del API Gateway o token del mock)
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { getApi } from '@/lib/api';
import type { Api, Sesion } from '@/lib/types';

interface Ctx {
  api: Api;
  sesion: Sesion | null;
  cargando: boolean;
  iniciar: (s: Sesion) => void;
  cerrar: () => void;
}

const SesionCtx = createContext<Ctx | null>(null);
const CLAVE = 'academix-sesion';

export function SesionProvider({ children }: { children: ReactNode }) {
  const api = useMemo(() => getApi(), []);
  const [sesion, setSesion] = useState<Sesion | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(CLAVE);
      if (raw) setSesion(JSON.parse(raw));
    } catch { /* sin almacenamiento */ }
    setCargando(false);
  }, []);

  const iniciar = useCallback((s: Sesion) => {
    setSesion(s);
    try { window.localStorage.setItem(CLAVE, JSON.stringify(s)); } catch { /* */ }
  }, []);

  const cerrar = useCallback(() => {
    setSesion(null);
    try { window.localStorage.removeItem(CLAVE); } catch { /* */ }
  }, []);

  return <SesionCtx.Provider value={{ api, sesion, cargando, iniciar, cerrar }}>{children}</SesionCtx.Provider>;
}

export function useSesion(): Ctx {
  const c = useContext(SesionCtx);
  if (!c) throw new Error('useSesion fuera de SesionProvider');
  return c;
}
