# Índice

1. [Core del Negocio](./documentacion_arquitectonica.md#core-del-negocio)
   - [Diagrama del Core del Negocio](./documentacion_arquitectonica.md#diagrama-del-core-del-negocio)
   - [Actores del Negocio](./documentacion_arquitectonica.md#actores-del-negocio)
   - [Capacidades Principales del Negocio](./documentacion_arquitectonica.md#capacidades-principales-del-negocio)
   - [Relación entre Actores y Capacidades](./documentacion_arquitectonica.md#relación-entre-actores-y-capacidades)
   - [Objetivo del Core](./documentacion_arquitectonica.md#objetivo-del-core)


2. [Primera Descomposición del Core del Negocio](./documentacion_arquitectonica.md#primera-descomposición-del-core-del-negocio)
   - [Diagrama de Primera Descomposición](./documentacion_arquitectonica.md#diagrama-de-primera-descomposición)
   - [Capacidades de Negocio](./documentacion_arquitectonica.md#capacidades-de-negocio)
   - [Relación con los Casos de Uso](./documentacion_arquitectonica.md#relación-con-los-casos-de-uso)
   - [Resultado de la Descomposición](./documentacion_arquitectonica.md#resultado-de-la-descomposición)

3. [Requerimientos Funcionales](./documentacion_arquitectonica.md#requerimientos-funcionales)

4. [Requerimientos No Funcionales](./documentacion_arquitectonica.md#requerimientos-no-funcionales)

5. [Caso de Uso: Autenticación Institucional](./documentacion_arquitectonica.md#caso-de-uso-autenticación-institucional)

6. [Caso de Uso: Catálogo y Búsqueda Académica](./documentacion_arquitectonica.md#caso-de-uso-catálogo-y-búsqueda-académica)

7. [Caso de Uso: Reproducción de Clases](./documentacion_arquitectonica.md#caso-de-uso-reproducción-de-clases)

8. [Caso de Uso: Gestión de Asignaciones y Permisos](./documentacion_arquitectonica.md#caso-de-uso-gestión-de-asignaciones-y-permisos)

9. [Vista de Escenarios](./documentacion_arquitectonica.md#vista-de-escenarios)
   - [Diagrama de la Vista de Escenarios](./documentacion_arquitectonica.md#diagrama-de-la-vista-de-escenarios)
   - [Actores](./documentacion_arquitectonica.md#actores)
   - [Casos de Uso Principales](./documentacion_arquitectonica.md#casos-de-uso-principales)
   - [Trazabilidad con las demás vistas](./documentacion_arquitectonica.md#trazabilidad-con-las-demás-vistas)

10. [Vista Lógica](./documentacion_arquitectonica.md#vista-lógica)
    - [Diagrama de Vista Lógica](./documentacion_arquitectonica.md#diagrama-de-vista-lógica)
    - [Componentes lógicos](./documentacion_arquitectonica.md#componentes-lógicos)
    - [Relaciones entre componentes](./documentacion_arquitectonica.md#relaciones-entre-componentes)
    - [Flujo lógico principal](./documentacion_arquitectonica.md#flujo-lógico-principal)

11. [Vista de Procesos (gRPC)](./documentacion_arquitectonica.md#vista-de-procesos-grpc)
    - [Diagrama de Procesos gRPC](./documentacion_arquitectonica.md#diagrama-de-procesos-grpc)
    - [Procesos principales](./documentacion_arquitectonica.md#procesos-principales)
    - [Comunicación entre procesos](./documentacion_arquitectonica.md#comunicación-entre-procesos)
    - [Flujo general de procesamiento](./documentacion_arquitectonica.md#flujo-general-de-procesamiento)
    - [Flujo de autenticación](./documentacion_arquitectonica.md#flujo-de-autenticación)
    - [Flujo de búsqueda y reproducción](./documentacion_arquitectonica.md#flujo-de-búsqueda-y-reproducción)
    - [Flujo durante la reproducción](./documentacion_arquitectonica.md#flujo-durante-la-reproducción)
    - [Flujo de valoración](./documentacion_arquitectonica.md#flujo-de-valoración)
    - [Características de la comunicación gRPC](./documentacion_arquitectonica.md#características-de-la-comunicación-grpc)
    - [Manejo de errores](./documentacion_arquitectonica.md#manejo-de-errores)
    - [Consideraciones de concurrencia](./documentacion_arquitectonica.md#consideraciones-de-concurrencia)

12. [Vista de Componentes](./documentacion_arquitectonica.md#vista-de-componentes)
    - [Diagrama de Componentes](./documentacion_arquitectonica.md#diagrama-de-componentes)
    - [Componentes principales](./documentacion_arquitectonica.md#componentes-principales)
    - [Interfaces de comunicación](./documentacion_arquitectonica.md#interfaces-de-comunicación)
    - [Componentes de persistencia](./documentacion_arquitectonica.md#componentes-de-persistencia)
    - [Dependencias entre componentes](./documentacion_arquitectonica.md#dependencias-entre-componentes)
    - [API Gateway / BFF](./documentacion_arquitectonica.md#api-gateway--bff)
    - [Comunicación mediante gRPC](./documentacion_arquitectonica.md#comunicación-mediante-grpc)
    - [Principio de separación de responsabilidades](./documentacion_arquitectonica.md#principio-de-separación-de-responsabilidades)

13. [Vista de Despliegue](./documentacion_arquitectonica.md#vista-de-despliegue)
    - [Diagrama de Despliegue](./documentacion_arquitectonica.md#diagrama-de-despliegue)
    - [Nodos de despliegue](./documentacion_arquitectonica.md#nodos-de-despliegue)
    - [Artefactos desplegados](./documentacion_arquitectonica.md#artefactos-desplegados)
    - [Persistencia](./documentacion_arquitectonica.md#persistencia)
    - [Almacenamiento de contenido multimedia](./documentacion_arquitectonica.md#almacenamiento-de-contenido-multimedia)

14. [Modelado de Datos](./documentacion_arquitectonica.md#modelado-de-datos)

15. [Diagrama Entidad-Relación](./documentacion_arquitectonica.md#diagrama-entidad-relación)
    - [Dominios de información](./documentacion_arquitectonica.md#dominios-de-información)
    - [Entidades principales](./documentacion_arquitectonica.md#entidades-principales)
    - [Modelo académico](./documentacion_arquitectonica.md#modelo-académico)
    - [Modelo de reproducción](./documentacion_arquitectonica.md#modelo-de-reproducción)
    - [Modelo de valoración](./documentacion_arquitectonica.md#modelo-de-valoración)
    - [Relaciones principales](./documentacion_arquitectonica.md#relaciones-principales)
    - [Reglas de integridad](./documentacion_arquitectonica.md#reglas-de-integridad)

16. [Objetos Programables de Base de Datos](./documentacion_arquitectonica.md#objetos-programables-de-base-de-datos)
    - [Stored Procedures](./documentacion_arquitectonica.md#stored-procedures)
    - [Vistas](./documentacion_arquitectonica.md#vistas)
    - [Funciones](./documentacion_arquitectonica.md#funciones)
    - [Triggers](./documentacion_arquitectonica.md#triggers)
    - [Mapeo de Objetos Programables](./documentacion_arquitectonica.md#mapeo-de-objetos-programables)

17. [Mapeo con los Componentes de la Arquitectura](./documentacion_arquitectonica.md#mapeo-con-los-componentes-de-la-arquitectura)

18. [Distribución por Dominio](./documentacion_arquitectonica.md#distribución-por-dominio)

19. [Consideraciones de Diseño](./documentacion_arquitectonica.md#consideraciones-de-diseño)

20. [Trazabilidad con los Casos de Uso](./documentacion_arquitectonica.md#trazabilidad-con-los-casos-de-uso)

21. [Objetivo del Modelo de Datos](./documentacion_arquitectonica.md#objetivo-del-modelo-de-datos)

22. [UI/UX - Mockups](./documentacion_arquitectonica.md#uiux---mockups)
    - [Mockups Interactivos del Cliente Web](./documentacion_arquitectonica.md#mockups-interactivos-del-cliente-web)
    - [Mockup 1 — Login Institucional](./documentacion_arquitectonica.md#mockup-1--login-institucional)
    - [Mockup 2 — Catálogo Académico](./documentacion_arquitectonica.md#mockup-2--catálogo-académico)
    - [Mockup 3 — Reproductor de Clases](./documentacion_arquitectonica.md#mockup-3--reproductor-de-clases)
    - [Mockup 4 — Gestión de Asignaciones](./documentacion_arquitectonica.md#mockup-4--gestión-de-asignaciones)
    - [Mockup 5 — Configuración](./documentacion_arquitectonica.md#mockup-5--configuración)
    - [Mockup 6 — Panel Administrativo](./documentacion_arquitectonica.md#mockup-6--panel-administrativo)

