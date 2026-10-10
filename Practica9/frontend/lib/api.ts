// HeinzGomez - Práctica 9: selección de implementación del contrato `Api`.
// Solo existe el API Gateway real: NEXT_PUBLIC_API_URL apunta al gateway
// (docker compose / GKE); si se omite se asume el mismo origen.
import { HttpApi } from './http-api';
import type { Api } from './types';

let instancia: Api | null = null;
let avisado = false;

export function getApi(): Api {
  if (!instancia) {
    const url = process.env.NEXT_PUBLIC_API_URL;
    if (!url && !avisado) {
      avisado = true;
      console.warn('NEXT_PUBLIC_API_URL no está definida: se llamará al API Gateway en el mismo origen.');
    }
    instancia = new HttpApi(url ?? '');
  }
  return instancia;
}
