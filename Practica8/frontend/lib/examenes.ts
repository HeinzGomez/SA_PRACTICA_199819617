// HeinzGomez - Práctica 7: banco de preguntas del mock (espejo de services/certificados-service/app/domain.py)
export interface PreguntaBanco {
  id: string;
  enunciado: string;
  opciones: Record<string, string>;
  correcta: string;
}

export const NOTA_MINIMA = 70;
export const MAX_INTENTOS = 3;

const GENERICAS: PreguntaBanco[] = [
  { id: 'g1', enunciado: '¿Qué patrón desacopla productores y consumidores mediante una cola?', opciones: { a: 'Singleton', b: 'Message Queue / Pub-Sub', c: 'MVC', d: 'Decorator' }, correcta: 'b' },
  { id: 'g2', enunciado: '¿Qué garantiza una operación idempotente?', opciones: { a: 'Que se ejecuta más rápido', b: 'Que nunca falla', c: 'Que repetirla produce el mismo resultado', d: 'Que es asíncrona' }, correcta: 'c' },
  { id: 'g3', enunciado: 'En SOA, ¿qué describe el contrato de un servicio?', opciones: { a: 'Su interfaz y mensajes', b: 'Su base de datos interna', c: 'El lenguaje usado', d: 'El servidor físico' }, correcta: 'a' },
  { id: 'g4', enunciado: '¿Qué algoritmo produce un resumen de 256 bits?', opciones: { a: 'MD5', b: 'SHA-1', c: 'SHA-256', d: 'Base64' }, correcta: 'c' },
  { id: 'g5', enunciado: '¿Qué componente orquesta contenedores en producción en este proyecto?', opciones: { a: 'Kubernetes (GKE)', b: 'Vercel', c: 'Redis', d: 'RabbitMQ' }, correcta: 'a' },
];

const BANCO: Record<string, PreguntaBanco[]> = {
  'evt-sec-04': [
    { id: 's1', enunciado: '¿Qué riesgo del OWASP API Top 10 ocupa el primer lugar (2023)?', opciones: { a: 'Inyección SQL', b: 'Broken Object Level Authorization', c: 'XSS', d: 'CSRF' }, correcta: 'b' },
    { id: 's2', enunciado: '¿Qué parte de un JWT garantiza su integridad?', opciones: { a: 'Header', b: 'Payload', c: 'Firma', d: 'El campo exp' }, correcta: 'c' },
    { id: 's3', enunciado: '¿Qué mitiga el rate limiting?', opciones: { a: 'Consumo irrestricto de recursos', b: 'SSRF', c: 'Fuga de logs', d: 'CORS' }, correcta: 'a' },
    { id: 's4', enunciado: '¿Dónde NO se debe almacenar un secreto de firma JWT?', opciones: { a: 'Gestor de secretos', b: 'Variable de entorno', c: 'Repositorio de código', d: 'Kubernetes Secret' }, correcta: 'c' },
    { id: 's5', enunciado: '¿Qué cabecera HTTP transporta normalmente el token Bearer?', opciones: { a: 'Cookie', b: 'Authorization', c: 'Accept', d: 'Host' }, correcta: 'b' },
  ],
};

export function preguntasPara(eventoId: string): PreguntaBanco[] {
  return BANCO[eventoId] ?? GENERICAS;
}

export function calificar(eventoId: string, respuestas: Record<string, string>) {
  const ps = preguntasPara(eventoId);
  const correctas = ps.filter((p) => respuestas[p.id] === p.correcta).length;
  const total = ps.length;
  return { nota: total ? Math.round((correctas * 100) / total) : 0, correctas, total };
}
