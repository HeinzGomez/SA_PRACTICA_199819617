'use client';
// HeinzGomez - Práctica 7: vista imprimible del diploma
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Diploma } from '@/components/Diploma';
import { useSesion } from '@/components/Sesion';
import { Alerta, Requiere } from '@/components/Ui';
import type { Certificado } from '@/lib/types';

function Vista() {
  const { id } = useParams<{ id: string }>();
  const { api, sesion } = useSesion();
  const [cert, setCert] = useState<Certificado | null | undefined>(undefined);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    api.misCertificados(sesion!.token).then((l) => setCert(l.find((c) => c.id === id) ?? null)).catch(setError);
  }, [api, sesion, id]);

  if (error) return <Alerta error={error} />;
  if (cert === undefined) return <p className="muted">Cargando…</p>;
  if (cert === null) return <div className="alerta error">No se encontró el diploma {id} entre tus certificados.</div>;
  return (
    <div className="pila">
      <div className="fila entre no-imprimir">
        <Link href="/certificados" className="pequeno">← Mis diplomas</Link>
        <div className="fila">
          <Link href={`/verificar?codigo=${cert.id}`} className="btn secundario chico">Verificar</Link>
          <button className="btn chico" onClick={() => window.print()}>Imprimir / PDF</button>
        </div>
      </div>
      <Diploma c={cert} />
    </div>
  );
}

export default function Pagina() {
  return <Requiere><Vista /></Requiere>;
}
