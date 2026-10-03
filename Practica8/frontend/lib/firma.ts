// HeinzGomez - Práctica 7: hash SHA-256 y firma del diploma en el mock (Web Crypto).
// El payload canónico es idéntico al del Servicio de Certificados (Python). En el backend la firma
// es Ed25519; en el mock se usa HMAC-SHA256 para no exponer una llave privada en el navegador.
import type { Certificado } from './types';

type Base = Pick<Certificado, 'id' | 'usuario_id' | 'nombre_estudiante' | 'evento_id' | 'evento_titulo' | 'curso_codigo' | 'nota' | 'emitido_en'>;

export function payloadCanonico(c: Base): string {
  const datos: Record<string, string | number> = {
    curso_codigo: c.curso_codigo,
    emisor: 'USAC-FIUSAC-ACADEMIX',
    emitido_en: c.emitido_en,
    evento_id: c.evento_id,
    evento_titulo: c.evento_titulo,
    id: c.id,
    nombre_estudiante: c.nombre_estudiante,
    nota: c.nota,
    usuario_id: c.usuario_id,
  };
  return JSON.stringify(datos); // claves ya en orden alfabético, sin espacios (= json.dumps sort_keys)
}

const enc = new TextEncoder();
const hex = (b: ArrayBuffer) => [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, '0')).join('');
const b64 = (b: ArrayBuffer) => {
  let s = '';
  new Uint8Array(b).forEach((x) => { s += String.fromCharCode(x); });
  return btoa(s);
};

export async function sha256Hex(texto: string): Promise<string> {
  return hex(await crypto.subtle.digest('SHA-256', enc.encode(texto)));
}

const CLAVE_MOCK = 'academix-mock-signing-key';

async function clave(): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', enc.encode(CLAVE_MOCK), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}

export async function firmar(c: Base): Promise<{ codigo_hash: string; firma: string }> {
  const payload = payloadCanonico(c);
  return {
    codigo_hash: await sha256Hex(payload),
    firma: b64(await crypto.subtle.sign('HMAC', await clave(), enc.encode(payload))),
  };
}

export async function verificarFirma(c: Certificado): Promise<boolean> {
  const payload = payloadCanonico(c);
  if ((await sha256Hex(payload)) !== c.codigo_hash) return false;
  try {
    const firma = Uint8Array.from(atob(c.firma), (ch) => ch.charCodeAt(0));
    return await crypto.subtle.verify('HMAC', await clave(), firma, enc.encode(payload));
  } catch {
    return false;
  }
}
