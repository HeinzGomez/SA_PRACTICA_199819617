// HeinzGomez - Práctica 7: selección de implementación.
// Si NEXT_PUBLIC_API_URL está definido se usa el API Gateway real; si no, el mock documentado (Vercel).
import { HttpApi } from './http-api';
import { AlmacenLocal, MockApi } from './mock-api';
import type { Api } from './types';

let instancia: Api | null = null;

export function getApi(): Api {
  if (!instancia) {
    const url = process.env.NEXT_PUBLIC_API_URL;
    instancia = url
      ? new HttpApi(url)
      : new MockApi({ almacen: new AlmacenLocal(), navegador: typeof window !== 'undefined' });
  }
  return instancia;
}
