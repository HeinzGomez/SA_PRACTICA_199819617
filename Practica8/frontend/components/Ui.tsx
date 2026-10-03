'use client';
// HeinzGomez - Práctica 7: componentes de interfaz reutilizables
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useSesion } from './Sesion';
import { nivelCupo } from '@/lib/formato';
import { ApiError, type Cupo, type Rol } from '@/lib/types';

export function Encabezado() {
  const { sesion, cerrar, api } = useSesion();
  const ruta = usePathname();
  const router = useRouter();
  const enlaces: [string, string, boolean][] = [
    ['/', 'Catálogo', true],
    ['/reservas', 'Mis reservas', sesion?.usuario.rol === 'ESTUDIANTE'],
    ['/certificados', 'Mis diplomas', sesion?.usuario.rol === 'ESTUDIANTE'],
    ['/verificar', 'Verificar', true],
    ['/simulador', 'Simulador', true],
    ['/admin', 'Administración', sesion?.usuario.rol === 'ADMINISTRADOR'],
  ];
  const activo = (href: string) => (href === '/' ? ruta === '/' || ruta.startsWith('/eventos') : ruta.startsWith(href));
  return (
    <>
      <div className={`banda-modo ${api.modo === 'api' ? 'api' : ''}`}>
        {api.modo === 'api'
          ? 'Conectado al API Gateway (servicios SOA + RabbitMQ)'
          : 'Modo demostración: consumiendo mocks del contrato REST documentado (sin backend)'}
      </div>
      <header className="header">
        <div className="contenedor">
          <Link href="/" className="marca">
            <span className="marca-logo">AP</span>
            <span>Academix Pass<small>YOUSAC · CertiHub</small></span>
          </Link>
          <nav className="nav" aria-label="Principal">
            {enlaces.filter(([, , ver]) => ver).map(([href, txt]) => (
              <Link key={href} href={href} className={activo(href) ? 'activo' : ''}>{txt}</Link>
            ))}
          </nav>
          <div className="usuario">
            {sesion ? (
              <>
                <span title={sesion.usuario.correo}>{sesion.usuario.nombre}</span>
                <span className="chip primario">{sesion.usuario.rol === 'ADMINISTRADOR' ? 'Admin' : 'Estudiante'}</span>
                <button className="btn secundario chico" onClick={() => { cerrar(); router.push('/'); }}>Salir</button>
              </>
            ) : (
              <>
                <Link href="/login" className="btn secundario chico">Ingresar</Link>
                <Link href="/registro" className="btn chico">Crear cuenta</Link>
              </>
            )}
          </div>
        </div>
      </header>
    </>
  );
}

export function Requiere({ rol, children }: { rol?: Rol; children: ReactNode }) {
  const { sesion, cargando } = useSesion();
  const router = useRouter();
  const ruta = usePathname();
  useEffect(() => {
    if (!cargando && !sesion) router.replace(`/login?siguiente=${encodeURIComponent(ruta)}`);
  }, [cargando, sesion, router, ruta]);
  if (cargando || !sesion) return <p className="muted">Cargando sesión…</p>;
  if (rol && sesion.usuario.rol !== rol) {
    return <div className="alerta error">Esta sección requiere el rol {rol === 'ADMINISTRADOR' ? 'Administrador' : 'Estudiante'}.</div>;
  }
  return <>{children}</>;
}

export function BarraCupo({ disponible, total, compacta = false }: { disponible: number; total: number; compacta?: boolean }) {
  const nivel = nivelCupo(disponible, total);
  const prev = useRef(disponible);
  const [pulso, setPulso] = useState(false);
  useEffect(() => {
    if (prev.current !== disponible) {
      setPulso(true);
      const t = setTimeout(() => setPulso(false), 900);
      prev.current = disponible;
      return () => clearTimeout(t);
    }
  }, [disponible]);
  const pct = total ? Math.max(0, Math.min(100, (disponible / total) * 100)) : 0;
  return (
    <div className={`cupo ${nivel} ${pulso ? 'pulso' : ''}`} aria-live="polite">
      <div className="fila entre">
        <span>
          {nivel === 'agotado' ? <strong>Cupo agotado</strong> : <><span className="num">{disponible}</span> de {total} cupos disponibles</>}
        </span>
        {!compacta && nivel === 'bajo' && <span className="chip warn">¡Últimos lugares!</span>}
      </div>
      <div className="cupo-barra" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={disponible}>
        <span style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

/** Suscripción al cupo en tiempo real (SSE en modo API, intervalo en modo mock). */
export function useCupos(): Map<string, Cupo> {
  const { api } = useSesion();
  const [cupos, setCupos] = useState<Map<string, Cupo>>(new Map());
  useEffect(() => api.suscribirCupos((lista) => setCupos(new Map(lista.map((c) => [c.evento_id, c])))), [api]);
  return cupos;
}

export function Alerta({ error }: { error: unknown }) {
  if (!error) return null;
  const msg = error instanceof ApiError ? error.message : error instanceof Error ? error.message : String(error);
  return <div className="alerta error" role="alert">{msg}</div>;
}
