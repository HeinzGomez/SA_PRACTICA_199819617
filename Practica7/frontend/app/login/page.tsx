'use client';
// HeinzGomez - Práctica 7: inicio de sesión (CDU 1.1, 1.3)
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { useSesion } from '@/components/Sesion';
import { Alerta } from '@/components/Ui';
import { DEMO } from '@/lib/mock-api';

function Formulario() {
  const { api, iniciar } = useSesion();
  const router = useRouter();
  const siguiente = useSearchParams().get('siguiente');
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<unknown>(null);
  const [ocupado, setOcupado] = useState(false);

  async function entrar(c = correo, p = password) {
    setOcupado(true); setError(null);
    try {
      const s = await api.login(c, p);
      iniciar(s);
      const destino = siguiente && siguiente.startsWith('/') && !siguiente.startsWith('//') ? siguiente : s.usuario.rol === 'ADMINISTRADOR' ? '/admin' : '/';
      router.push(destino);
    } catch (e) { setError(e); setOcupado(false); }
  }

  return (
    <div className="card pila" style={{ maxWidth: 420, margin: '24px auto' }}>
      <h1>Ingresar</h1>
      <form onSubmit={(e) => { e.preventDefault(); entrar(); }}>
        <div className="campo"><label htmlFor="correo">Correo institucional</label>
          <input id="correo" type="email" autoComplete="username" value={correo} onChange={(e) => setCorreo(e.target.value)} required /></div>
        <div className="campo"><label htmlFor="pass">Contraseña</label>
          <input id="pass" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
        <Alerta error={error} />
        <button className="btn" type="submit" disabled={ocupado} style={{ width: '100%', marginTop: 12 }}>{ocupado ? 'Validando…' : 'Ingresar'}</button>
      </form>
      <p className="pequeno">¿No tienes cuenta? <Link href="/registro">Regístrate con tu correo institucional</Link></p>
      {api.modo === 'mock' && (
        <div className="alerta info pequeno pila">
          <div>Cuentas de demostración:</div>
          <div className="fila">
            <button className="btn secundario chico" onClick={() => entrar(DEMO.estudiante.correo, DEMO.estudiante.password)}>Entrar como estudiante</button>
            <button className="btn secundario chico" onClick={() => entrar(DEMO.admin.correo, DEMO.admin.password)}>Entrar como administrador</button>
          </div>
          <div className="mono">{DEMO.estudiante.correo} / {DEMO.estudiante.password}<br />{DEMO.admin.correo} / {DEMO.admin.password}</div>
        </div>
      )}
    </div>
  );
}

export default function Pagina() {
  return <Suspense fallback={null}><Formulario /></Suspense>;
}
