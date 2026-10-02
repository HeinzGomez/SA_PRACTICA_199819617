// HeinzGomez - Práctica 7: representación visual del diploma digital
import { fechaLarga } from '@/lib/formato';
import type { Certificado } from '@/lib/types';

export function Diploma({ c }: { c: Certificado }) {
  return (
    <div className="diploma">
      <div style={{ fontSize: '.8rem', letterSpacing: '.18em', color: '#5b6776' }}>UNIVERSIDAD DE SAN CARLOS DE GUATEMALA · FACULTAD DE INGENIERÍA</div>
      <h1 style={{ marginTop: 16 }}>Diploma de Certificación</h1>
      <p>Se otorga el presente reconocimiento a</p>
      <div className="nombre">{c.nombre_estudiante}</div>
      <p>por aprobar la evaluación de la actividad académica</p>
      <p style={{ fontSize: '1.2rem', fontWeight: 700, margin: '4px 0 2px' }}>{c.evento_titulo}</p>
      <p style={{ color: '#5b6776' }}>{c.curso_codigo} · {c.curso_nombre} — Nota obtenida: {c.nota}/100</p>
      <p style={{ color: '#5b6776' }}>Emitido el {fechaLarga(c.emitido_en)}</p>
      <div className="sello">
        <div><strong>ID:</strong> <span style={{ fontFamily: 'monospace' }}>{c.id}</span></div>
        <div><strong>SHA-256:</strong> <span style={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>{c.codigo_hash}</span></div>
        <div><strong>Firma digital:</strong> <span style={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>{c.firma.slice(0, 48)}…</span></div>
        <div style={{ marginTop: 6 }}>Verifique la autenticidad de este documento en la sección «Verificar diploma» de Academix Pass ingresando el ID o el hash.</div>
      </div>
    </div>
  );
}
