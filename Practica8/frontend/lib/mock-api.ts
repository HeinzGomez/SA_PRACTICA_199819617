// HeinzGomez - Práctica 7: implementación MOCK del contrato REST (modo por defecto en Vercel).
// Reproduce el comportamiento del backend SOA dentro del navegador:
//   productor (SolicitarReserva) -> cola en memoria -> consumidor con latencia simulada -> ticket CONFIRMADA/RECHAZADA
import { calificar, MAX_INTENTOS, NOTA_MINIMA, preguntasPara } from './examenes';
import { firmar, verificarFirma } from './firma';
import { EVENTOS_SEED } from './seed';
import {
  Api, ApiError, Certificado, Cupo, Evento, Examen, FiltroCertificados, FiltroEventos, RegistroInput,
  ResultadoExamen, Sesion, Ticket, TipoReserva, Usuario,
} from './types';
import { coincideFiltro, validarEvento, validarRegistro } from './validaciones';

export interface Almacen {
  leer(): string | null;
  escribir(v: string): void;
}

export class AlmacenMemoria implements Almacen {
  private v: string | null = null;
  leer() { return this.v; }
  escribir(v: string) { this.v = v; }
}

export class AlmacenLocal implements Almacen {
  constructor(private readonly clave = 'academix-mock-v1') {}
  leer() { try { return window.localStorage.getItem(this.clave); } catch { return null; } }
  escribir(v: string) { try { window.localStorage.setItem(this.clave, v); } catch { /* modo privado */ } }
}

interface UsuarioMock extends Usuario { password: string }
interface Intento { id: string; usuario_id: string; evento_id: string; nota: number; aprobado: boolean }
interface Mensaje { ticketId: string; listoEn: number }

export interface EstadoMock {
  version: 1;
  usuarios: UsuarioMock[];
  eventos: Evento[];
  tickets: Ticket[];
  cola: Mensaje[];
  inscritos: Record<string, string[]>;
  intentos: Intento[];
  certificados: Certificado[];
}

export const DEMO = {
  estudiante: { correo: 'demo@ingenieria.usac.edu.gt', password: 'Demo12345' },
  admin: { correo: 'admin@ingenieria.usac.edu.gt', password: 'Admin12345' },
  certificado: 'CERT-DEMO000001',
};

export interface OpcionesMock {
  almacen?: Almacen;
  ahora?: () => number;
  latenciaMs?: [number, number];
  aleatorio?: () => number;
  navegador?: boolean; // activa consumidor en segundo plano y "otros estudiantes"
}

const iso = (ms: number) => new Date(ms).toISOString().replace(/\.\d{3}Z$/, 'Z');
const idAleatorio = (prefijo: string, n: number, r: () => number) =>
  prefijo + Array.from({ length: n }, () => '0123456789ABCDEF'[Math.floor(r() * 16)]).join('');

export class MockApi implements Api {
  readonly modo = 'mock' as const;
  private readonly almacen: Almacen;
  private readonly ahora: () => number;
  private readonly latencia: [number, number];
  private readonly r: () => number;
  private listo: Promise<void>;

  constructor(op: OpcionesMock = {}) {
    this.almacen = op.almacen ?? new AlmacenMemoria();
    this.ahora = op.ahora ?? Date.now;
    this.latencia = op.latenciaMs ?? [900, 2400];
    this.r = op.aleatorio ?? Math.random;
    this.listo = this.inicializar();
    if (op.navegador) {
      setInterval(() => { this.procesarCola().catch(() => undefined); }, 350);
    }
  }

  // ------------------------------------------------------------------ estado
  private async inicializar(): Promise<void> {
    if (this.leer()) return;
    const demoId = 'usr-demo-0001';
    const emitido = '2026-09-20T16:00:00Z';
    const k8s = EVENTOS_SEED[0];
    const base = {
      id: DEMO.certificado, usuario_id: demoId, nombre_estudiante: 'Estudiante Demo', evento_id: k8s.id,
      evento_titulo: k8s.titulo, curso_codigo: k8s.curso_codigo, nota: 90, emitido_en: emitido,
    };
    const cert: Certificado = { ...base, curso_nombre: k8s.curso_nombre, ...(await firmar(base)) };
    const eventos = EVENTOS_SEED.map((e) => ({ ...e, ponente: { ...e.ponente }, prerrequisitos: [...e.prerrequisitos] }));
    eventos[0].cupo_disponible -= 1;
    this.guardar({
      version: 1,
      usuarios: [
        { id: demoId, nombre: 'Estudiante Demo', carnet: '202600001', correo: DEMO.estudiante.correo, rol: 'ESTUDIANTE', password: DEMO.estudiante.password },
        { id: 'usr-admin-0001', nombre: 'Administrador Academix', carnet: '000000000', correo: DEMO.admin.correo, rol: 'ADMINISTRADOR', password: DEMO.admin.password },
      ],
      eventos,
      tickets: [{
        id: 'TKT-DEMO00000001', usuario_id: demoId, evento_id: k8s.id, estado: 'CONFIRMADA', motivo: '', tipo: 'ACREDITACION',
        creado_en: '2026-09-18T15:00:00Z', actualizado_en: '2026-09-18T15:00:02Z', cupo_restante: k8s.cupo_total - 1,
      }],
      cola: [],
      inscritos: { [k8s.id]: [demoId] },
      intentos: [{ id: 'INT-DEMO', usuario_id: demoId, evento_id: k8s.id, nota: 90, aprobado: true }],
      certificados: [cert],
    });
  }

  private leer(): EstadoMock | null {
    const raw = this.almacen.leer();
    if (!raw) return null;
    try {
      const e = JSON.parse(raw) as EstadoMock;
      return e.version === 1 ? e : null;
    } catch {
      return null;
    }
  }

  private guardar(e: EstadoMock) { this.almacen.escribir(JSON.stringify(e)); }

  private async estado(): Promise<EstadoMock> {
    await this.listo;
    let e = this.leer();
    if (!e) { this.listo = this.inicializar(); await this.listo; e = this.leer()!; }
    return e;
  }

  /** Reinicia los datos de demostración (botón en la UI). */
  async reiniciar(): Promise<void> {
    this.almacen.escribir('');
    this.listo = this.inicializar();
    await this.listo;
  }

  private usuarioDe(e: EstadoMock, token: string): UsuarioMock {
    const u = e.usuarios.find((x) => `mock.${x.id}` === token);
    if (!u) throw new ApiError(401, 'Sesión inválida o expirada');
    return u;
  }

  private sesion(u: UsuarioMock): Sesion {
    const { password: _p, ...usuario } = u;
    return { token: `mock.${u.id}`, usuario };
  }

  private exigirRol(u: Usuario, rol: Usuario['rol']) {
    if (u.rol !== rol) throw new ApiError(403, `Requiere rol ${rol}`);
  }

  // ------------------------------------------------------------------ CDU 1
  async login(correo: string, password: string): Promise<Sesion> {
    const e = await this.estado();
    const u = e.usuarios.find((x) => x.correo === (correo ?? '').trim().toLowerCase());
    if (!u || u.password !== password) throw new ApiError(401, 'Credenciales incorrectas');
    return this.sesion(u);
  }

  async register(input: RegistroInput): Promise<Sesion> {
    const errores = validarRegistro(input);
    if (errores.length) throw new ApiError(400, errores.join('; '));
    const e = await this.estado();
    const correo = input.correo.trim().toLowerCase();
    if (e.usuarios.some((u) => u.correo === correo)) throw new ApiError(409, 'El correo ya está registrado');
    const u: UsuarioMock = { id: idAleatorio('usr-', 12, this.r).toLowerCase(), nombre: input.nombre.trim(), carnet: input.carnet.trim(), correo, rol: 'ESTUDIANTE', password: input.password };
    e.usuarios.push(u);
    this.guardar(e);
    return this.sesion(u);
  }

  // ------------------------------------------------------------------ CDU 2
  async listarEventos(f: FiltroEventos = {}): Promise<Evento[]> {
    const e = await this.estado();
    return e.eventos.filter((ev) => coincideFiltro(ev, f)).sort((a, b) => Date.parse(a.fecha_inicio) - Date.parse(b.fecha_inicio));
  }

  async obtenerEvento(id: string): Promise<Evento> {
    const ev = (await this.estado()).eventos.find((x) => x.id === id);
    if (!ev) throw new ApiError(404, `Evento ${id} no existe`);
    return ev;
  }

  async cupos(): Promise<Cupo[]> {
    await this.procesarCola();
    return (await this.estado()).eventos.map((e) => ({ evento_id: e.id, cupo_total: e.cupo_total, cupo_disponible: e.cupo_disponible }));
  }

  /** Equivalente al SSE /api/eventos/cupos/stream. Simula además la demanda de otros estudiantes. */
  suscribirCupos(cb: (c: Cupo[]) => void, cadaMs = 2000): () => void {
    const tick = async () => {
      await this.simularOtrosEstudiantes();
      cb(await this.cupos());
    };
    tick();
    const t = setInterval(tick, cadaMs);
    return () => clearInterval(t);
  }

  async simularOtrosEstudiantes(): Promise<void> {
    if (this.r() > 0.35) return;
    const e = await this.estado();
    const candidatos = e.eventos.filter((ev) => ev.cupo_disponible > 3);
    if (!candidatos.length) return;
    const ev = candidatos[Math.floor(this.r() * candidatos.length)];
    ev.cupo_disponible -= 1;
    (e.inscritos[ev.id] ??= []).push(idAleatorio('otro-', 8, this.r));
    this.guardar(e);
  }

  async crearEvento(token: string, input: Partial<Evento>): Promise<Evento> {
    const e = await this.estado();
    this.exigirRol(this.usuarioDe(e, token), 'ADMINISTRADOR');
    const errores = validarEvento(input);
    if (errores.length) throw new ApiError(400, errores.join('; '));
    const ev: Evento = {
      id: input.id || idAleatorio('evt-', 8, this.r).toLowerCase(), titulo: input.titulo!.trim(), descripcion: input.descripcion ?? '',
      tipo: input.tipo!, curso_codigo: input.curso_codigo!, curso_nombre: input.curso_nombre ?? '', fecha_inicio: new Date(input.fecha_inicio!).toISOString(),
      duracion_min: input.duracion_min!, lugar: input.lugar ?? '', cupo_total: input.cupo_total!, cupo_disponible: input.cupo_total!,
      ponente: { nombre: '', titulo: '', bio: '', correo: '', ...input.ponente }, prerrequisitos: (input.prerrequisitos ?? []).filter(Boolean),
      tiene_certificacion: !!input.tiene_certificacion,
    };
    e.eventos.push(ev);
    this.guardar(e);
    return ev;
  }

  async actualizarEvento(token: string, input: Partial<Evento> & { id: string }): Promise<Evento> {
    const e = await this.estado();
    this.exigirRol(this.usuarioDe(e, token), 'ADMINISTRADOR');
    const i = e.eventos.findIndex((x) => x.id === input.id);
    if (i < 0) throw new ApiError(404, `Evento ${input.id} no existe`);
    const actual = e.eventos[i];
    const combinado: Evento = { ...actual, ...input, ponente: { ...actual.ponente, ...(input.ponente ?? {}) } };
    const errores = validarEvento(combinado);
    if (errores.length) throw new ApiError(400, errores.join('; '));
    const ocupados = actual.cupo_total - actual.cupo_disponible;
    if (combinado.cupo_total < ocupados) throw new ApiError(409, `No se puede reducir el cupo por debajo de ${ocupados} reservas confirmadas`);
    combinado.cupo_disponible = combinado.cupo_total - ocupados;
    combinado.fecha_inicio = new Date(combinado.fecha_inicio).toISOString();
    e.eventos[i] = combinado;
    this.guardar(e);
    return combinado;
  }

  async eliminarEvento(token: string, id: string): Promise<void> {
    const e = await this.estado();
    this.exigirRol(this.usuarioDe(e, token), 'ADMINISTRADOR');
    const ev = e.eventos.find((x) => x.id === id);
    if (!ev) throw new ApiError(404, `Evento ${id} no existe`);
    if (ev.cupo_disponible < ev.cupo_total) throw new ApiError(409, 'El evento tiene reservas confirmadas; no puede eliminarse');
    e.eventos = e.eventos.filter((x) => x.id !== id);
    this.guardar(e);
  }

  // ------------------------------------------------------------------ CDU 3.1-3.3 (asíncrono)
  async solicitarReserva(token: string, eventoId: string, tipo: TipoReserva): Promise<Ticket> {
    const e = await this.estado();
    const u = this.usuarioDe(e, token);
    this.exigirRol(u, 'ESTUDIANTE');
    if (!e.eventos.some((x) => x.id === eventoId)) throw new ApiError(404, `Evento ${eventoId} no existe`);
    const ahora = this.ahora();
    const t: Ticket = {
      id: idAleatorio('TKT-', 12, this.r), usuario_id: u.id, evento_id: eventoId, estado: 'PENDIENTE', motivo: '', tipo,
      creado_en: iso(ahora), actualizado_en: iso(ahora), cupo_restante: -1,
    };
    e.tickets.push(t);
    const [min, max] = this.latencia;
    e.cola.push({ ticketId: t.id, listoEn: ahora + min + this.r() * (max - min) }); // publicar en "reservas.solicitudes"
    this.guardar(e);
    return t; // HTTP 202 Accepted
  }

  /** Consumidor: procesa en orden FIFO los mensajes cuya latencia ya transcurrió. */
  async procesarCola(forzar = false): Promise<Ticket[]> {
    const e = await this.estado();
    const ahora = this.ahora();
    const procesados: Ticket[] = [];
    while (e.cola.length && (forzar || e.cola[0].listoEn <= ahora)) {
      const msg = e.cola.shift()!;
      const t = e.tickets.find((x) => x.id === msg.ticketId);
      if (!t || t.estado !== 'PENDIENTE') continue; // idempotencia
      const ev = e.eventos.find((x) => x.id === t.evento_id);
      const inscritos = (e.inscritos[t.evento_id] ??= []);
      if (!ev) Object.assign(t, { estado: 'RECHAZADA', motivo: 'EVENTO_NO_EXISTE', cupo_restante: 0 });
      else if (inscritos.includes(t.usuario_id)) Object.assign(t, { estado: 'RECHAZADA', motivo: 'RESERVA_DUPLICADA', cupo_restante: ev.cupo_disponible });
      else if (ev.cupo_disponible <= 0) Object.assign(t, { estado: 'RECHAZADA', motivo: 'SIN_CUPO', cupo_restante: 0 });
      else {
        ev.cupo_disponible -= 1;
        inscritos.push(t.usuario_id);
        Object.assign(t, { estado: 'CONFIRMADA', motivo: '', cupo_restante: ev.cupo_disponible });
      }
      t.actualizado_en = iso(ahora);
      procesados.push({ ...t });
    }
    if (procesados.length) this.guardar(e);
    return procesados;
  }

  async consultarTicket(token: string, id: string): Promise<Ticket> {
    await this.procesarCola();
    const e = await this.estado();
    const u = this.usuarioDe(e, token);
    const t = e.tickets.find((x) => x.id === id);
    if (!t || (t.usuario_id !== u.id && u.rol !== 'ADMINISTRADOR')) throw new ApiError(404, 'Ticket no encontrado');
    return t;
  }

  async misReservas(token: string): Promise<Ticket[]> {
    await this.procesarCola();
    const e = await this.estado();
    const u = this.usuarioDe(e, token);
    return e.tickets.filter((t) => t.usuario_id === u.id).sort((a, b) => b.creado_en.localeCompare(a.creado_en));
  }

  // ------------------------------------------------------------------ CDU 3.4-3.7
  private exigirInscripcion(e: EstadoMock, usuarioId: string, eventoId: string) {
    if (!(e.inscritos[eventoId] ?? []).includes(usuarioId)) {
      throw new ApiError(409, 'Debe tener una reserva CONFIRMADA en la actividad para rendir el examen');
    }
  }

  async obtenerExamen(token: string, eventoId: string): Promise<Examen> {
    const e = await this.estado();
    const u = this.usuarioDe(e, token);
    this.exigirInscripcion(e, u.id, eventoId);
    return {
      evento_id: eventoId, nota_minima: NOTA_MINIMA,
      preguntas: preguntasPara(eventoId).map((p) => ({ id: p.id, enunciado: p.enunciado, opciones: Object.entries(p.opciones).map(([id, texto]) => ({ id, texto })) })),
    };
  }

  async rendirExamen(token: string, eventoId: string, respuestas: Record<string, string>): Promise<ResultadoExamen> {
    const e = await this.estado();
    const u = this.usuarioDe(e, token);
    this.exigirInscripcion(e, u.id, eventoId);
    const previos = e.intentos.filter((i) => i.usuario_id === u.id && i.evento_id === eventoId);
    if (previos.some((i) => i.aprobado)) throw new ApiError(409, 'El examen ya fue aprobado');
    if (previos.length >= MAX_INTENTOS) throw new ApiError(429, `Se agotaron los ${MAX_INTENTOS} intentos permitidos`);
    const { nota, correctas, total } = calificar(eventoId, respuestas);
    const intento = { id: idAleatorio('INT-', 12, this.r), usuario_id: u.id, evento_id: eventoId, nota, aprobado: nota >= NOTA_MINIMA };
    e.intentos.push(intento);
    this.guardar(e);
    return { intento_id: intento.id, aprobado: intento.aprobado, nota, correctas, total };
  }

  async generarCertificado(token: string, eventoId: string): Promise<Certificado> {
    const e = await this.estado();
    const u = this.usuarioDe(e, token);
    const existente = e.certificados.find((c) => c.usuario_id === u.id && c.evento_id === eventoId);
    if (existente) return existente;
    const aprobados = e.intentos.filter((i) => i.usuario_id === u.id && i.evento_id === eventoId && i.aprobado);
    if (!aprobados.length) throw new ApiError(409, 'No tiene aprobado el examen de certificación');
    const ev = e.eventos.find((x) => x.id === eventoId);
    if (!ev) throw new ApiError(404, `Evento ${eventoId} no existe`);
    const base = {
      id: idAleatorio('CERT-', 10, this.r), usuario_id: u.id, nombre_estudiante: u.nombre, evento_id: ev.id, evento_titulo: ev.titulo,
      curso_codigo: ev.curso_codigo, nota: Math.max(...aprobados.map((i) => i.nota)), emitido_en: iso(this.ahora()),
    };
    const cert: Certificado = { ...base, curso_nombre: ev.curso_nombre, ...(await firmar(base)) };
    e.certificados.push(cert);
    this.guardar(e);
    return cert;
  }

  // ------------------------------------------------------------------ CDU 4
  async misCertificados(token: string, f: FiltroCertificados = {}): Promise<Certificado[]> {
    const e = await this.estado();
    const u = this.usuarioDe(e, token);
    const hasta = f.hasta ? Date.parse(f.hasta) + (f.hasta.length <= 10 ? 86_399_999 : 0) : Infinity;
    const desde = f.desde ? Date.parse(f.desde) : -Infinity;
    return e.certificados
      .filter((c) => c.usuario_id === u.id && (!f.curso || c.curso_codigo === f.curso))
      .filter((c) => { const t = Date.parse(c.emitido_en); return t >= desde && t <= hasta; })
      .sort((a, b) => b.emitido_en.localeCompare(a.emitido_en));
  }

  async verificar(codigo: string) {
    const c = (codigo ?? '').trim();
    if (!c) throw new ApiError(400, 'Ingrese el identificador o hash del diploma');
    const e = await this.estado();
    const cert = e.certificados.find((x) => x.id.toUpperCase() === c.toUpperCase() || x.codigo_hash === c.toLowerCase());
    if (!cert) return { valido: false, mensaje: 'Certificado inválido: no existe en el registro académico', certificado: null };
    if (!(await verificarFirma(cert))) return { valido: false, mensaje: 'Certificado inválido: la firma digital no coincide (documento alterado)', certificado: null };
    return { valido: true, mensaje: 'Certificado válido, emitido y firmado por FIUSAC – Academix', certificado: cert };
  }

  /** Solo pruebas: permite manipular el estado persistido. */
  async _estado(): Promise<EstadoMock> { return this.estado(); }
  _guardar(e: EstadoMock) { this.guardar(e); }
}
