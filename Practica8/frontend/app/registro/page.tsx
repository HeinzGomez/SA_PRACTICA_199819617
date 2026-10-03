'use client';
// HeinzGomez - Práctica 7: registro de estudiante (CDU 1.2)
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useSesion } from '@/components/Sesion';
import { Alerta } from '@/components/Ui';
import type { RegistroInput } from '@/lib/types';
import { validarRegistro } from '@/lib/validaciones';

export default function Registro() {
  const { api, iniciar } = useSesion();
  const router = useRouter();
  const [f, setF] = useState<RegistroInput>({ nombre: '', carnet: '', correo: '', password: '' });
  const [errores, setErrores] = useState<string[]>([]);
  const [error, setError] = useState<unknown>(null);
  const [ocupado, setOcupado] = useState(false);

  const set = (k: keyof RegistroInput) => (e: React.ChangeEvent<HTMLInputElement>) => setF((x) => ({ ...x, [k]: e.target.value }));

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    const v = validarRegistro(f);
    setErrores(v);
    if (v.length) return;
    setOcupado(true); setError(null);
    try { iniciar(await api.register(f)); router.push('/'); } catch (err) { setError(err); setOcupado(false); }
  }

  return (
    <div className="card pila" style={{ maxWidth: 480, margin: '24px auto' }}>
      <h1>Crear cuenta de estudiante</h1>
      <form onSubmit={enviar} noValidate>
        <div className="campo"><label htmlFor="nombre">Nombre completo</label><input id="nombre" value={f.nombre} onChange={set('nombre')} autoComplete="name" /></div>
        <div className="campo"><label htmlFor="carnet">Carnet (9 dígitos)</label><input id="carnet" inputMode="numeric" maxLength={9} value={f.carnet} onChange={set('carnet')} /></div>
        <div className="campo"><label htmlFor="correo">Correo institucional</label><input id="correo" type="email" placeholder="usuario@ingenieria.usac.edu.gt" value={f.correo} onChange={set('correo')} autoComplete="email" /></div>
        <div className="campo"><label htmlFor="pass">Contraseña</label><input id="pass" type="password" value={f.password} onChange={set('password')} autoComplete="new-password" />
          <span className="pequeno muted">Mínimo 8 caracteres, una mayúscula y un número.</span></div>
        {errores.length > 0 && <div className="alerta error"><ul style={{ margin: 0, paddingLeft: 18 }}>{errores.map((x) => <li key={x}>{x}</li>)}</ul></div>}
        <Alerta error={error} />
        <button className="btn" type="submit" disabled={ocupado} style={{ width: '100%', marginTop: 12 }}>{ocupado ? 'Creando…' : 'Crear cuenta'}</button>
      </form>
      <p className="pequeno">¿Ya tienes cuenta? <Link href="/login">Ingresa aquí</Link></p>
    </div>
  );
}
