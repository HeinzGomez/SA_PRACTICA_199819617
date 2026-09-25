'use client';
// HeinzGomez - Práctica 7: portal PÚBLICO de verificación de diplomas (CDU 4.3, 4.4)
import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense, useCallback, useEffect, useState } from 'react';
import { Diploma } from '@/components/Diploma';
import { useSesion } from '@/components/Sesion';
import { Alerta } from '@/components/Ui';
import { DEMO } from '@/lib/mock-api';
import type { Verificacion } from '@/lib/types';

function Verificador() {
  const { api } = useSesion();
  const params = useSearchParams();
  const router = useRouter();
  const [codigo, setCodigo] = useState(params.get('codigo') ?? '');
  const [res, setRes] = useState<Verificacion | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [ocupado, setOcupado] = useState(false);

  const verificar = useCallback(async (c: string) => {
    if (!c.trim()) return;
    setOcupado(true); setError(null); setRes(null);
    try { setRes(await api.verificar(c)); } catch (e) { setError(e); }
    setOcupado(false);
  }, [api]);

  useEffect(() => {
    const c = params.get('codigo');
    if (c) { setCodigo(c); verificar(c); }
  }, [params, verificar]);

  return (
    <div className="pila" style={{ maxWidth: 820 }}>
      <h1>Verificación pública de diplomas</h1>
      <p className="muted">Cualquier persona —empleadores, otras universidades— puede comprobar la validez académica de un diploma
        emitido por Academix ingresando su identificador (CERT-…) o su hash SHA-256. No se requiere iniciar sesión.</p>
      <form className="card fila" onSubmit={(e) => { e.preventDefault(); router.replace(`/verificar?codigo=${encodeURIComponent(codigo.trim())}`); verificar(codigo); }}>
        <div style={{ flex: 1, minWidth: 220 }}>
          <label htmlFor="codigo">Identificador o hash del diploma</label>
          <input id="codigo" value={codigo} onChange={(e) => setCodigo(e.target.value)} placeholder="CERT-XXXXXXXXXX o 64 caracteres hexadecimales" autoComplete="off" />
        </div>
        <button className="btn" type="submit" disabled={ocupado || !codigo.trim()} style={{ alignSelf: 'flex-end' }}>{ocupado ? 'Verificando…' : 'Verificar'}</button>
      </form>
      {api.modo === 'mock' && !res && (
        <p className="pequeno muted">¿Sin diploma a mano? Prueba con el diploma de ejemplo{' '}
          <button className="btn secundario chico" onClick={() => { setCodigo(DEMO.certificado); verificar(DEMO.certificado); }}>{DEMO.certificado}</button></p>
      )}
      <Alerta error={error} />
      {res && (
        <div className="pila">
          <div className={`alerta ${res.valido ? 'ok' : 'error'}`} role="status">
            <strong>{res.valido ? '✓ Diploma auténtico. ' : '✕ '}</strong>{res.mensaje}
          </div>
          {res.valido && res.certificado && <Diploma c={res.certificado} />}
        </div>
      )}
    </div>
  );
}

export default function Pagina() {
  return <Suspense fallback={<p className="muted">Cargando…</p>}><Verificador /></Suspense>;
}
