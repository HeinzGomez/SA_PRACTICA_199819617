// HeinzGomez - Práctica 9: cliente HTTP del API Gateway (única implementación de `Api`).
//
// Todas las respuestas se normalizan antes de devolverlas: si el gateway no envía una lista se
// devuelve `[]` y si falta un campo se completan los valores por defecto, para que la interfaz
// nunca reciba `undefined` donde la UI espera datos.
import {
  Api, ApiError, Certificado, Cupo, Evento, Examen, ExamenAdmin, FiltroCertificados, FiltroEventos,
  Opcion, Pregunta, PreguntaCreada, RegistroInput, ResultadoExamen, Sesion, SolicitudExamen,
  SolicitudPregunta, Ticket, TipoReserva, Verificacion,
} from './types';

type Fetch = typeof fetch;

export function qs(p: Record<string, string | undefined>): string {
  const s = new URLSearchParams(Object.entries(p).filter(([, v]) => v) as [string, string][]).toString();
  return s ? `?${s}` : '';
}

const lista = <T>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);
const texto = (v: unknown): string => (v === undefined || v === null ? '' : String(v));
const numero = (v: unknown, defecto: number): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : defecto;
};

/** Examen: el backend puede devolver un examen recién creado, todavía sin preguntas. */
function normalizarExamen(e: Partial<Examen> | null | undefined, eventoId: string): Examen {
  const preguntas = lista<Partial<Pregunta> | null>(e?.preguntas)
    .filter((p) => p !== null && p !== undefined)
    .map((p) => ({
      id: texto(p!.id),
      enunciado: texto(p!.enunciado),
      opciones: lista<Partial<Opcion> | null>(p!.opciones)
        .filter((o) => o !== null && o !== undefined)
        .map((o) => ({ id: texto(o!.id), texto: texto(o!.texto) })),
    }))
    .filter((p) => p.id !== '' && p.opciones.length > 0);
  return {
    evento_id: texto(e?.evento_id) || eventoId,
    nota_minima: numero(e?.nota_minima, 70),
    preguntas,
  };
}

/** Pregunta del examen para el administrador (incluye `es_correcta` de cada opción). */
function normalizarPregunta(p: Partial<PreguntaCreada> | null | undefined, idExamen: number): PreguntaCreada {
  return {
    id_pregunta: p?.id_pregunta ?? '',
    id_examen: numero(p?.id_examen, idExamen),
    enunciado: texto(p?.enunciado),
    punteo: numero(p?.punteo, 0),
    opciones: lista<Partial<PreguntaCreada['opciones'][number]> | null>(p?.opciones)
      .filter((o) => o !== null && o !== undefined)
      .map((o) => ({ id_opcion: texto(o!.id_opcion), texto: texto(o!.texto), es_correcta: o!.es_correcta === true })),
  };
}

/** Examen para el administrador: incluye las respuestas correctas y puede venir sin preguntas. */
function normalizarExamenAdmin(e: Partial<ExamenAdmin> | null | undefined): ExamenAdmin {
  const idExamen = numero(e?.id_examen, 0);
  return {
    id_examen: idExamen,
    evento_id: texto(e?.evento_id),
    titulo: texto(e?.titulo),
    puntaje_minimo: numero(e?.puntaje_minimo, 70),
    estado: texto(e?.estado) || 'ACTIVO',
    preguntas: lista<Partial<PreguntaCreada> | null>(e?.preguntas)
      .filter((p) => p !== null && p !== undefined)
      .map((p) => normalizarPregunta(p, idExamen)),
  };
}

function normalizarCertificado(c: Partial<Certificado> | null | undefined): Certificado {
  return {
    id: texto(c?.id),
    codigo_hash: texto(c?.codigo_hash),
    firma: texto(c?.firma),
    usuario_id: texto(c?.usuario_id),
    nombre_estudiante: texto(c?.nombre_estudiante),
    evento_id: texto(c?.evento_id),
    evento_titulo: texto(c?.evento_titulo),
    curso_codigo: texto(c?.curso_codigo),
    curso_nombre: texto(c?.curso_nombre),
    nota: numero(c?.nota, 0),
    emitido_en: texto(c?.emitido_en),
  };
}

export class HttpApi implements Api {
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
    if (!res.ok) throw new ApiError(res.status, texto((body as { error?: unknown })?.error) || `Error HTTP ${res.status}`);
    return body as T;
  }

  /** Igual que `req`, pero garantiza un arreglo aunque el cuerpo venga mal formado. */
  private reqLista<T>(ruta: string, init?: RequestInit & { token?: string }): Promise<T[]> {
    return this.req<unknown>(ruta, init).then((v) => lista<T>(v));
  }

  async login(correo: string, password: string): Promise<Sesion> {
    return this.req<Sesion>('/api/auth/login', { method: 'POST', body: JSON.stringify({ correo, password }) });
  }
  async register(input: RegistroInput): Promise<Sesion> {
    return this.req<Sesion>('/api/auth/register', { method: 'POST', body: JSON.stringify(input) });
  }

  listarEventos(f: FiltroEventos = {}) {
    return this.reqLista<Evento>(`/api/eventos${qs({ curso: f.curso, tipo: f.tipo, desde: f.desde, hasta: f.hasta })}`);
  }
  obtenerEvento(id: string) { return this.req<Evento>(`/api/eventos/${encodeURIComponent(id)}`); }
  cupos() { return this.reqLista<Cupo>('/api/eventos/cupos'); }

  suscribirCupos(cb: (c: Cupo[]) => void): () => void {
    const entregar = (v: unknown) => cb(lista<Cupo>(v));
    if (typeof EventSource === 'undefined') {
      const t = setInterval(() => this.cupos().then(cb).catch(() => undefined), 2000);
      return () => clearInterval(t);
    }
    const es = new EventSource(`${this.base.replace(/\/$/, '')}/api/eventos/cupos/stream`);
    es.addEventListener('cupos', (ev) => {
      try { entregar(JSON.parse((ev as MessageEvent).data)); } catch { /* fotograma ilegible */ }
    });
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
  misReservas(token: string) { return this.reqLista<Ticket>('/api/reservas', { token }); }

  // --- examen (CDU 3.6) y su administración
  async obtenerExamen(token: string, eventoId: string): Promise<Examen> {
    const e = await this.req<Partial<Examen>>(`/api/examenes/${encodeURIComponent(eventoId)}`, { token });
    return normalizarExamen(e, eventoId);
  }
  rendirExamen(token: string, eventoId: string, respuestas: Record<string, string>) {
    return this.req<ResultadoExamen>(`/api/examenes/${encodeURIComponent(eventoId)}`, {
      method: 'POST', token, body: JSON.stringify({ respuestas }),
    });
  }
  async obtenerExamenAdmin(token: string, eventoId: string): Promise<ExamenAdmin> {
    const e = await this.req<Partial<ExamenAdmin>>(
      `/api/examenes/${encodeURIComponent(eventoId)}/admin`, { token });
    return normalizarExamenAdmin(e);
  }
  async crearExamen(token: string, e: SolicitudExamen): Promise<ExamenAdmin> {
    const r = await this.req<Partial<ExamenAdmin>>('/api/examenes', {
      method: 'POST', token, body: JSON.stringify(e) });
    return normalizarExamenAdmin(r);
  }
  async agregarPregunta(token: string, e: SolicitudPregunta): Promise<PreguntaCreada> {
    const { id_examen: id, ...resto } = e;
    const r = await this.req<Partial<PreguntaCreada>>(
      `/api/examenes/${encodeURIComponent(String(id))}/preguntas`,
      { method: 'POST', token, body: JSON.stringify(resto) });
    return normalizarPregunta(r, id);
  }

  // --- diplomas (CDU 3.7, 4.1 - 4.4)
  async generarCertificado(token: string, eventoId: string): Promise<Certificado> {
    const c = await this.req<Partial<Certificado>>('/api/certificados', {
      method: 'POST', token, body: JSON.stringify({ evento_id: eventoId }),
    });
    return normalizarCertificado(c);
  }
  async misCertificados(token: string, f: FiltroCertificados = {}): Promise<Certificado[]> {
    const l = await this.reqLista<Partial<Certificado>>(
      `/api/certificados${qs({ curso: f.curso, desde: f.desde, hasta: f.hasta })}`, { token });
    return l.map(normalizarCertificado);
  }
  async verificar(codigo: string): Promise<Verificacion> {
    const v = await this.req<Partial<Verificacion>>(
      `/api/certificados/verificar/${encodeURIComponent(codigo.trim())}`);
    const cert = v?.certificado ? normalizarCertificado(v.certificado) : null;
    return { valido: v?.valido === true, mensaje: texto(v?.mensaje), certificado: v?.valido === true ? cert : null };
  }
}
