// HeinzGomez - Práctica 7: datos semilla del mock (idénticos a services/talleres-service/src/seed.ts)
import type { Evento } from './types';

export const EVENTOS_SEED: Evento[] = [
  {
    id: 'evt-k8s-01', titulo: 'Taller práctico: Kubernetes y GKE desde cero', tipo: 'TALLER',
    descripcion: 'Despliegue de microservicios en GKE: Deployments, Services, Ingress y HPA con un caso real de YOUSAC.',
    curso_codigo: '0970', curso_nombre: 'Software Avanzado', fecha_inicio: '2026-10-05T15:00:00.000Z', duracion_min: 180,
    lugar: 'Laboratorio T-3, Edificio T-3 (salón 214)', cupo_total: 40, cupo_disponible: 40,
    ponente: { nombre: 'Inga. María José Pérez', titulo: 'Cloud Architect – Google Developer Expert', bio: '10 años diseñando plataformas cloud-native en la región.', correo: 'mperez@ingenieria.usac.edu.gt' },
    prerrequisitos: ['Docker básico', 'Haber aprobado Redes de Computadoras 1'], tiene_certificacion: true,
  },
  {
    id: 'evt-mq-02', titulo: 'Conferencia: Mensajería asíncrona con RabbitMQ y Kafka', tipo: 'CONFERENCIA',
    descripcion: 'Patrones productor/consumidor, colas de mensajes muertos, idempotencia y back-pressure en sistemas de alta concurrencia.',
    curso_codigo: '0970', curso_nombre: 'Software Avanzado', fecha_inicio: '2026-10-08T23:00:00.000Z', duracion_min: 90,
    lugar: 'Auditorio Francisco Vela', cupo_total: 250, cupo_disponible: 250,
    ponente: { nombre: 'Ing. Carlos Méndez', titulo: 'Principal Engineer – Fintech GT', bio: 'Arquitecto de plataformas de pagos en tiempo real.', correo: 'cmendez@ingenieria.usac.edu.gt' },
    prerrequisitos: [], tiene_certificacion: false,
  },
  {
    id: 'evt-sql-03', titulo: 'Laboratorio: Optimización de consultas en PostgreSQL', tipo: 'LABORATORIO',
    descripcion: 'Índices, planes de ejecución (EXPLAIN ANALYZE), particionamiento y control de concurrencia.',
    curso_codigo: '0774', curso_nombre: 'Sistemas de Bases de Datos 1', fecha_inicio: '2026-10-12T14:00:00.000Z', duracion_min: 120,
    lugar: 'Laboratorio de Cómputo S-12', cupo_total: 25, cupo_disponible: 25,
    ponente: { nombre: 'Ing. Luis Fernando Ajú', titulo: 'DBA Senior', bio: 'Administrador de bases de datos de misión crítica en banca.', correo: 'lajux@ingenieria.usac.edu.gt' },
    prerrequisitos: ['SQL intermedio'], tiene_certificacion: true,
  },
  {
    id: 'evt-sec-04', titulo: 'Examen de certificación: Seguridad en APIs (OWASP API Top 10)', tipo: 'CERTIFICACION',
    descripcion: 'Evaluación práctica sobre autenticación JWT, control de acceso y mitigación de riesgos del OWASP API Security Top 10.',
    curso_codigo: '0785', curso_nombre: 'Análisis y Diseño de Sistemas 2', fecha_inicio: '2026-10-15T16:00:00.000Z', duracion_min: 60,
    lugar: 'Virtual – YOUSAC Live', cupo_total: 60, cupo_disponible: 60,
    ponente: { nombre: 'Inga. Andrea Castillo', titulo: 'Security Lead – CISSP', bio: 'Especialista en seguridad de aplicaciones y respuesta a incidentes.', correo: 'acastillo@ingenieria.usac.edu.gt' },
    prerrequisitos: ['Taller de Kubernetes y GKE', 'Conocimientos de HTTP/REST'], tiene_certificacion: true,
  },
  {
    id: 'evt-ci-05', titulo: 'Taller: CI/CD con GitHub Actions y Container Registry', tipo: 'TALLER',
    descripcion: 'Pipelines con pruebas unitarias, build multi-stage y publicación de imágenes en GHCR.',
    curso_codigo: '0970', curso_nombre: 'Software Avanzado', fecha_inicio: '2026-10-19T15:00:00.000Z', duracion_min: 150,
    lugar: 'Laboratorio T-3, Edificio T-3 (salón 214)', cupo_total: 5, cupo_disponible: 5,
    ponente: { nombre: 'Ing. Diego Ramírez', titulo: 'DevOps Engineer', bio: 'Automatización de despliegues para equipos distribuidos.', correo: 'dramirez@ingenieria.usac.edu.gt' },
    prerrequisitos: ['Git y GitHub'], tiene_certificacion: true,
  },
  {
    id: 'evt-comp-06', titulo: 'Conferencia: Compiladores modernos y LLVM', tipo: 'CONFERENCIA',
    descripcion: 'De la gramática al código máquina: IR, optimizaciones y generación de código con LLVM.',
    curso_codigo: '0781', curso_nombre: 'Organización de Lenguajes y Compiladores 2', fecha_inicio: '2026-10-22T22:00:00.000Z', duracion_min: 90,
    lugar: 'Salón de Usos Múltiples T-3', cupo_total: 120, cupo_disponible: 120,
    ponente: { nombre: 'Dr. Roberto Sic', titulo: 'Investigador en lenguajes de programación', bio: 'Doctor en Ciencias de la Computación.', correo: 'rsic@ingenieria.usac.edu.gt' },
    prerrequisitos: ['Compiladores 1'], tiene_certificacion: false,
  },
];
