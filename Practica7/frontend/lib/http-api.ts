// HeinzGomez - Práctica 7: cliente HTTP del API Gateway (modo "api", cuando existe NEXT_PUBLIC_API_URL)
import {
  Api, ApiError, Certificado, Cupo, Evento, Examen, FiltroCertificados, FiltroEventos, RegistroInput,
  ResultadoExamen, Sesion, Ticket, TipoReserva, Verificacion,
} from './types';

type Fetch = typeof fetch;

export function qs(p: Record<string, string | undefined>): string {
  const s = new URLSearchParams(Object.entries(p).filter(([, v]) => v) as [string, string][]).toString();
  return s ? `?${s}` : '';
}

export class HttpApi implements Api {
  readonly modo = 'api' as const;
  constructor(private readonly base: string, private readonly f: Fetch = (...a) => fetch(...a)) {}

  private async req<T>(ruta: string, init: RequestInit & { token?: string } = {}): Promise<T> {
    const { token, headers, ...resto } = init;
    let res: Response;
    try {
      res = await this.f(`${this.base.replace(/\/$/, '')}${ruta}`, {
        ...resto,
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(headers ?? {}) },
      });
    } catch {
      throw new ApiError(0, 'No se pudo contactar al API Gateway');
    }
    if (res.status === 204) return undefined as T;
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new ApiError(res.status, body?.error ?? `Error HTTP ${res.status}`);
    return body as T;
  }

  login(correo: string, password: string) {
    return this.req<Sesion>('/api/auth/login', { method: 'POST', body: JSON.stringify({ correo, password }) });
  }
  register(input: RegistroInput) {
    return this.req<Sesion>('/api/auth/register', { method: 'POST', body: JSON.stringify(input) });
  }
  listarEventos(f: FiltroEventos = {}) {
    return this.req<Evento[]>(`/api/eventos${qs({ curso: f.curso, tipo: f.tipo, desde: f.desde, hasta: f.hasta })}`);
  }
  obtenerEvento(id: string) { return this.req<Evento>(`/api/eventos/${encodeURIComponent(id)}`); }
  cupos() { return this.req<Cupo[]>('/api/eventos/cupos'); }

  suscribirCupos(cb: (c: Cupo[]) => void): () => void {
    if (typeof EventSource === 'undefined') {
      const t = setInterval(() => this.cupos().then(cb).catch(() => undefined), 2000);
      return () => clearInterval(t);
    }
    const es = new EventSource(`${this.base.replace(/\/$/, '')}/api/eventos/cupos/stream`);
    es.addEventListener('cupos', (ev) => cb(JSON.parse((ev as MessageEvent).data)));
    return () => es.close();
  }

  crearEvento(token: string, e: Partial<Evento>) {
    return this.req<Evento>('/api/eventos', { method: 'POST', token, body: JSON.stringify(e) });
  }
  actualizarEvento(token: string, e: Partial<Evento> & { id: string }) {
    return this.req<Evento>(`/api/eventos/${encodeURIComponent(e.id)}`, { method: 'PUT', token, body: JSON.stringify(e) });
  }
  eliminarEvento(token: string, id: string) {
    return this.req<void>(`/api/eventos/${encodeURIComponent(id)}`, { method: 'DELETE', token });
  }
  solicitarReserva(token: string, eventoId: string, tipo: TipoReserva) {
    return this.req<Ticket>('/api/reservas', { method: 'POST', token, body: JSON.stringify({ evento_id: eventoId, tipo }) });
  }
  consultarTicket(token: string, id: string) { return this.req<Ticket>(`/api/reservas/${encodeURIComponent(id)}`, { token }); }
  misReservas(token: string) { return this.req<Ticket[]>('/api/reservas', { token }); }
  obtenerExamen(token: string, eventoId: string) { return this.req<Examen>(`/api/examenes/${encodeURIComponent(eventoId)}`, { token }); }
  rendirExamen(token: string, eventoId: string, respuestas: Record<string, string>) {
    return this.req<ResultadoExamen>(`/api/examenes/${encodeURIComponent(eventoId)}`, { method: 'POST', token, body: JSON.stringify({ respuestas }) });
  }
  generarCertificado(token: string, eventoId: string) {
    return this.req<Certificado>('/api/certificados', { method: 'POST', token, body: JSON.stringify({ evento_id: eventoId }) });
  }
  misCertificados(token: string, f: FiltroCertificados = {}) {
    return this.req<Certificado[]>(`/api/certificados${qs({ curso: f.curso, desde: f.desde, hasta: f.hasta })}`, { token });
  }
  verificar(codigo: string) {
    return this.req<Verificacion>(`/api/certificados/verificar/${encodeURIComponent(codigo.trim())}`);
  }
}
