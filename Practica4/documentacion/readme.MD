# UNIVERSIDAD DE SAN CARLOS DE GUATEMALA

# FACULTAD DE INGENIERIA

# ESCUELA DE CIENCIAS Y SISTEMAS

# PROYECTO
---

|Nombre                       | Carnet   |
|-----------------------------|----------|
|Ramiro Agustin Telles Carcuz | 202010044|

# Índice

- [1. Introducción](#1-introduccion)
- [2. Requerimientos del sistema](#2-requerimientos-del-sistema)
  - [2.1 Requerimientos Funcionales](#21-requerimientos-funcionales)
  - [2.2 Requerimientos No Funcionales](#22-requerimientos-no-funcionales)
    - [2.2.1 Rendimiento](#221-rendimiento)
    - [2.2.2 Seguridad](#222-seguridad)
    - [2.2.3 Disponibilidad](#223-disponibilidad)
    - [2.2.4 Escalabilidad](#224-escalabilidad)
    - [2.2.5 Portabilidad](#225-portabilidad)
    - [2.2.6 Interoperabilidad](#226-interoperabilidad)
- [3. Casos de Uso](#3-casos-de-uso)
  - [3.1 Core](#31-core)
  - [3.2 Stakeholders](#32-stakeholders)
  - [3.3 Primera descomposición](#33-primera-descomposicion)
  - [3.4 Casos de Uso Expandidos](#34-casos-de-uso-expandidos)
    - [3.4.1 CDU 1](#341-cdu-1)
    - [3.4.2 CDU 2](#342-cdu-2)
    - [3.4.3 CDU 3](#343-cdu-3)
    - [3.4.4 CDU 4](#344-cdu-4)
    - [3.4.5 CDU 5](#345-cdu-5)
    - [3.4.6 CDU 6](#346-cdu-6)
- [4. Vista 4+1](#4-vista-41)
  - [4.1 Vista Escenario](#41-vista-escenario)
  - [4.2 Vista Lógica](#42-vista-logica)
  - [4.3 Vista Procesos](#43-vista-procesos)
  - [4.4 Vista Despliegue](#44-vista-despliegue)
  - [4.5 Vista Física](#45-vista-fisica)
- [5. Modelado de Datos](#5-modelado-de-datos)
  - [5.1 Entidad Relación Autenticación](#51-entidad-relacion-autenticacion)
  - [5.2 Entidad Relación Inscripciones](#52-entidad-relacion-inscripciones)
  - [5.3 Entidad Relación Grabaciones](#53-entidad-relacion-grabaciones)
  - [5.4 Entidad Relación Analítica](#54-entidad-relacion-analitica)
  - [5.5 Entidad Relación Historial](#55-entidad-relacion-historial)
  - [5.6 Entidad Relación Notificaciones](#56-entidad-relacion-notificaciones)
- [6. Diseño UI/UX](#6-disenio-uiux)
  - [6.1 Mockup Autenticación](#61-mockup-autenticacion)
  - [6.2 Mockup Catálogo Grabaciones](#62-mockup-catalogo-grabaciones)
  - [6.3 Mockup Reproducción Clase](#63-mockup-reproduccion-clase)
  - [6.4 Mockup Asignaciones](#64-mockup-asignaciones)
  - [6.5 Mockup Configuración](#65-mockup-configuracion)
  - [6.6 Mockup Panel Admin](#66-mockup-panel-admin)
- [7. Arquitectura implementada](#7-arquitectura-implementada)
- [8. Principios SOLID](#8-principios-solid)
  - [8.1 Single Responsibility Principle](#81-single-responsibility-principle)
  - [8.2 Open/Closed Principle](#82-openclosed-principle)
  - [8.3 Liskov Substitution Principle](#83-liskov-substitution-principle)
  - [8.4 Interface Segregation Principle](#84-interface-segregation-principle)
  - [8.5 Dependency Inversion Principle](#85-dependency-inversion-principle)
- [9. Conclusiones](#9-conclusiones)
  - [Arquitectura y Diseño](#arquitectura-y-diseño)
  - [Stack Políglota y Distribución Tecnológica](#stack-políglota-y-distribución-tecnológica)
  - [Seguridad y Gestión de Identidad](#seguridad-y-gestión-de-identidad)
  - [Gestión Académica y Contenido](#gestión-académica-y-contenido)
  - [Analítica, Caché y Rendimiento](#analítica-caché-y-rendimiento)
  - [Historial y Reproducción](#historial-y-reproducción)
  - [Notificaciones](#notificaciones)
  - [Requerimientos y Calidad](#requerimientos-y-calidad)
  - [Contenedores, Infraestructura y Despliegue](#contenedores-infraestructura-y-despliegue)
  - [Conclusión Técnica](#conclusión-técnica)
- [10. Fase 2 — Módulos nuevos](#10-fase-2--módulos-nuevos)

# 1. Introduccion 

El presente documento describe el análisis, diseño y arquitectura de la plataforma YoUSAC, una solución web orientada a centralizar el acceso al acervo académico digital de la Universidad de San Carlos de Guatemala mediante un servicio de reproducción de clases grabadas bajo demanda. La documentación contempla los requerimientos funcionales y no funcionales, los casos de uso expandidos y los principales elementos de la arquitectura propuesta. La solución se estructura mediante una arquitectura de microservicios políglota, utilizando TypeScript, Go y Python según las necesidades de cada dominio, además de mecanismos de comunicación interna mediante gRPC, almacenamiento independiente por microservicio, caché con Redis y despliegue mediante contenedores Docker en Google Cloud Platform. De esta manera, se busca proporcionar una plataforma segura, escalable, tolerante a fallos y capaz de atender las necesidades de estudiantes, docentes, auxiliares y administradores en la consulta, reproducción, seguimiento y análisis del contenido académico.

# 2. Requerimientos del sistema

## 2.1 Requerimientos Funcionales

| Código | Descripción | Prioridad |
|--------|-------------|-----------|
| RF-01 | El usuario debe poder autenticarse en la plataforma mediante sus credenciales de acceso. | Alta |
| RF-02 | El usuario debe poder registrar sus datos personales, correo institucional y credenciales para crear una cuenta en la plataforma. | Alta |
| RF-03 | El usuario debe poder validar sus credenciales de correo electrónico y contraseña para acceder a su cuenta personal en la plataforma. | Alta |
| RF-04 | El usuario debe poder autenticarse con la Oauth. | Alta |
| RF-05 | El estudiante debe poder consultar los cursos en los que está inscrito. | Alta |
| RF-06 | El estudiante debe poder filtrar sus cursos asignados por año y semestre. | Alta |
| RF-07 | El estudiante debe poder filtrar sus cursos asignados por estado de matriculación. | Alta |
| RF-08 | El estudiante debe poder consultar su datos académicos como información personal e información de su carrera. | Alta |
| RF-09 | El sistema debe poder comprobar el rol del estudiante y validar que posee los permisos necesarios para consultar sus cursos asignados. | Alta |
| RF-10 | El usuario debe poder consultar las clases grabadas. | Alta |
| RF-11 | El usuario debe poder aplicar filtros por semestre/año, escuela/área, curso, profesor y temas para realizar búsquedas de clases grabadas. | Alta |
| RF-12 | El usuario debe poder consultar la ficha técnica de una clase grabada, incluyendo la unidad del programa, fecha de impartición y material adjunto. | Alta |
| RF-13 | El usuario debe poder consultar la lista de docentes y auxiliares participantes de una clase grabada. | Media |
| RF-14 | El estudiante debe poder calificar mediante estrellas las clases grabadas en las que esté inscrito. | Media |
| RF-15 | El administrador debe poder consultar las clases grabadas más vistas durante un período seleccionado. | Alta |
| RF-16 | El administrador debe poder consultar los temas con mayor tendencia en la plataforma durante un período seleccionado. | Alta |
| RF-17 | El administrador debe poder consultar el ranking de las clases grabadas mejor valoradas en la plataforma. | Alta |
| RF-18 | El estudiante debe poder consultar su historial de reproducción de clases grabadas, incluyendo el semestre, curso, unidad, tema y minuto exacto donde dejó cada clase. | Media |
| RF-19 | El estudiante debe poder reanudar una clase grabada justo en el semestre, curso, unidad, tema y minuto en que lo dejó. | Media |
| RF-20 | El estudiante debe poder reproducir las clases grabadas. | Alta |
| RF-21 | El estudiante debe poder pausar la reproducción de una clase grabada. | Alta |
| RF-22 | El estudiante debe poder reanudar la reproducción de una clase grabada después de haberla pausado. | Alta |
| RF-23 | El usuario debe recibir un correo electrónico de confirmación cuando su registro en la plataforma haya sido completado. | Baja |
| RF-24 | El usuario debe poder recibir notificaciones por correo electrónico cuando se agregue nuevo contenido a la plataforma. | Baja |
| RF-25 | El usuario debe poder recibir notificaciones por correo electrónico relacionadas con avisos generales de la plataforma. | Baja |


## 2.2 Requerimientos No Funcionales

### 2.2.1 Rendimiento

| Código | Descripción |
|--------|-------------|
| RNF-01 | El API Gateway debe responder en menos de 2 segundos para el 95% de las peticiones bajo carga de hasta 500 usuarios concurrentes. |
| RNF-02 | El sistema debe enviar las notificaciones por correo electrónico en un tiempo menor a 5 segundos después de generarse el aviso correspondiente. |
| RNF-03 | El servicio de grabaciones debe soportar más de 200 búsquedas por segundo con una latencia por debajo de 2 segundos. |

### 2.2.2 Seguridad

| Código | Descripción |
|--------|-------------|
| RNF-04 | Todos los JWT deben tener un tiempo de expiración menor a 1 hora. |
| RNF-05 | Ningún cliente externo puede comunicarse directamente con un microservicio. El 100% del tráfico externo debe pasar por el API Gateway. |
| RNF-06 | El 100% de los usuarios registrados en la plataforma debe utilizar un correo electrónico perteneciente al dominio institucional de la Facultad de Ingeniería. |
| RNF-07 | El sistema debe implementar control de acceso basado en roles, restringiendo las funcionalidades según los roles de Estudiante, Docente, Auxiliar y Administrador. |

### 2.2.3 Disponibilidad

| Código | Descripción |
|--------|-------------|
| RNF-08 | El sistema en producción debe mantener una disponibilidad mayor al 99.5%, excluyendo ventanas de mantenimiento programado. |
| RNF-09 | El fallo de un microservicio individual no debe provocar la caída completa del sistema. |
| RNF-10 | Tras un fallo del contenedor, el servicio debe restaurarse automáticamente en ≤ 60 segundos. |

### 2.2.4 Escalabilidad

| Código | Descripción |
|--------|-------------|
| RNF-11 | El sistema debe tener una arquitectura de microservicios con base de datos independiente por cada servicio, para el escalamiento horizontal sin tener que modificar los demás microservicios. |

### 2.2.5 Portabilidad

| Código | Descripción |
|--------|-------------|
| RNF-12 | La aplicación debe ser capaz de desplegarse localmente para pruebas, pero también fácilmente trasladable a la nube mediante el uso de contenedores Docker y Docker Compose. |

### 2.2.6 Interoperabilidad

| Código | Descripción |
|--------|-------------|
| RNF-13 | La comunicación interna entre microservicios debe realizarse mediante gRPC sobre HTTP/2 y utilizar contratos estrictos definidos mediante archivos Protocol Buffers. |

# 3. Casos de Uso

## 3.1 Core

![CDUcore](./imgs/CDUs/CDUCore.png)

### Plataforma Academica Digital Universitaria para el streaming de video bajo demanda

La Plataforma Académica Digital Universitaria para el streaming de video bajo demanda es una solución orientada a facilitar el acceso de los estudiantes a contenido académico grabado, permitiendo consultar y reproducir clases, buscar contenido mediante diferentes filtros y dar seguimiento al progreso de reproducción. La plataforma integra servicios de autenticación, inscripción, grabaciones, analítica, historial y notificaciones, proporcionando una experiencia centralizada y segura. 

## 3.2 Stakeholders

Principales

- Estudiante
- Administrador
- Docente
- Auxiliar

## 3.3 Primera descomposicion

![CDUprimeradescomposicion](./imgs/CDUs/CDUPrimeraDescomposicion.png)

## 3.4 Casos de Uso Expandidos

### 3.4.1 CDU 1

### 3.4.1.1 CDU 1 Diagrama

![CDU1](./imgs/CDUs/CDU1/CDU1.png)

### 3.4.1.2 CDU1.1 Descripcion Textual

![CDU1.1](./imgs/CDUs/CDU1/CDU1.1.png)

### 3.4.1.3 CDU1.2 Descripcion Textual

![CDU1.2](./imgs/CDUs/CDU1/CDU1.2.png)

### 3.4.1.4 CDU1.3 Descripcion Textual

![CDU1.3](./imgs/CDUs/CDU1/CDU1.3.png)

### 3.4.1.4 CDU1.4 Descripcion Textual

![CDU1.3](./imgs/CDUs/CDU1/CDU1.4.png)

### 3.4.2 CDU 2

### 3.4.2.1 CDU 2 Diagrama

![CDU2](./imgs/CDUs/CDU2/CDU2.png)

### 3.4.2.2 CDU 2.1 Descripcion Textual

![CDU2.1](./imgs/CDUs/CDU2/CDU2.1.png)

### 3.4.2.3 CDU 2.2 Descripcion Textual

![CDU2.2](./imgs/CDUs/CDU2/CDU2.2.png)

### 3.4.2.4 CDU 2.3 Descripcion Textual

![CDU2.3](./imgs/CDUs/CDU2/CDU2.3.png)

### 3.4.2.5 CDU 2.4 Descripcion Textual

![CDU2.4](./imgs/CDUs/CDU2/CDU2.4.png)

### 3.4.2.6 CDU 2.5 Descripcion Textual

![CDU2.5](./imgs/CDUs/CDU2/CDU2.5.png)

### 3.4.2.7 CDU 2.6 Descripcion Textual

![CDU2.6](./imgs/CDUs/CDU2/CDU2.6.png)

### 3.4.2.8 CDU 2.7 Descripcion Textual

![CDU2.7](./imgs/CDUs/CDU2/CDU2.7.png)

### 3.4.3 CDU 3

### 3.4.3.1 CDU 3 Diagrama

![CDU3](./imgs/CDUs/CDU3/CDU3.png)

### 3.4.3.2 CDU 3.1 Descripcion Textual

![CDU3.1](./imgs/CDUs/CDU3/CDU3.1.png)

### 3.4.3.3 CDU 3.2 Descripcion Textual

![CDU3.2](./imgs/CDUs/CDU3/CDU3.2.png)

### 3.4.3.4 CDU 3.3 Descripcion Textual

![CDU3.3](./imgs/CDUs/CDU3/CDU3.3.png)

### 3.4.3.5 CDU 3.4 Descripcion Textual

![CDU3.4](./imgs/CDUs/CDU3/CDU3.4.png)

### 3.4.3.6 CDU 3.5 Descripcion Textual

![CDU3.5](./imgs/CDUs/CDU3/CDU3.5.png)

### 3.4.4 CDU 4

### 3.4.4.1 CDU 4 Diagrama

![CDU4](./imgs/CDUs/CDU4/CDU4.png)

### 3.4.4.2 CDU 4.1 Descripcion Textual

![CDU4.1](./imgs/CDUs/CDU4/CDU4.1.png)

### 3.4.4.3 CDU 4.2 Descripcion Textual

![CDU4.2](./imgs/CDUs/CDU4/CDU4.2.png)

### 3.4.4.4 CDU 4.3 Descripcion Textual

![CDU4.3](./imgs/CDUs/CDU4/CDU4.3.png)

### 3.4.4.5 CDU 4.4 Descripcion Textual

![CDU4.4](./imgs/CDUs/CDU4/CDU4.4.png)

### 3.4.4.6 CDU 4.5 Descripcion Textual

![CDU4.5](./imgs/CDUs/CDU4/CDU4.5.png)

### 3.4.4.7 CDU 4.6 Descripcion Textual

![CDU4.6](./imgs/CDUs/CDU4/CDU4.6.png)

### 3.4.5 CDU 5

### 3.4.5.1 CDU 5 Diagrama

![CDU5](./imgs/CDUs/CDU5/CDU5.png)

### 3.4.5.2 CDU 5.1 Descripcion Textual

![CDU5.1](./imgs/CDUs/CDU5/CDU5.1.png)

### 3.4.5.3 CDU 5.2 Descripcion Textual

![CDU5.2](./imgs/CDUs/CDU5/CDU5.2.png)

### 3.4.5.4 CDU 5.3 Descripcion Textual

![CDU5.3](./imgs/CDUs/CDU5/CDU5.3.png)

### 3.4.5.5 CDU 5.4 Descripcion Textual

![CDU5.4](./imgs/CDUs/CDU5/CDU5.4.png)

### 3.4.5.6 CDU 5.5 Descripcion Textual

![CDU5.5](./imgs/CDUs/CDU5/CDU5.5.png)

### 3.4.6 CDU 6

### 3.4.6.1 CDU 6 Diagrama

![CDU6](./imgs/CDUs/CDU6/CDU6.png)

### 3.4.6.2 CDU 6.1 Descripcion Textual

![CDU6.1](./imgs/CDUs/CDU6/CDU6.1.png)

### 3.4.6.3 CDU 6.2 Descripcion Textual

![CDU6.2](./imgs/CDUs/CDU6/CDU6.2.png)

### 3.4.6.4 CDU 6.3 Descripcion Textual

![CDU6.3](./imgs/CDUs/CDU6/CDU6.3.png)

### 3.4.6.5 CDU 6.4 Descripcion Textual

![CDU6.4](./imgs/CDUs/CDU6/CDU6.4.png)

# 4. Vista 4+1

![vista4mas1](./imgs/vista41/Vistas4mas1.png)

## 4.1 Vista Escenario

- Dirigida a: Todos los stakeholders
- Propósito: Integrar las diferentes vistas arquitectónicas, mostrando cómo los componentes del sistema colaboran para resolver flujos críticos de la plataforma académica.
- Diagrama: Casos de Uso presentados en la seccion 3.

Consulta y reproducción de una clase grabada con checkpoint

Cuando un estudiante autenticado desea consultar y reproducir una clase grabada, el sistema valida su identidad y permisos, consulta los cursos en los que se encuentra inscrito, permite buscar el contenido académico y posteriormente registra su progreso de reproducción. Si el estudiante ya había iniciado anteriormente la clase, el sistema permite reanudarla desde el punto donde la dejó.

El sistema garantiza:

- Rendimiento: El API Gateway debe responder en menos de 2 segundos para el 95% de las peticiones bajo una carga de hasta 500 usuarios concurrentes, mientras que el servicio de grabaciones debe soportar más de 200 búsquedas por segundo con una latencia inferior a 2 segundos.
- Seguridad: Las peticiones externas ingresan exclusivamente mediante el API Gateway y utilizan mecanismos de autenticación basados en JWT, cuyos tokens tienen una duración menor a una hora. Además, el acceso se restringe según los roles definidos para la plataforma.
- Desacoplamiento: Los servicios de autenticación, inscripción, grabaciones e historial funcionan de manera independiente, cada uno con su propia base de datos, permitiendo escalar los componentes individualmente.
- Interoperabilidad: La comunicación interna entre los microservicios se realiza mediante gRPC sobre HTTP/2 utilizando contratos definidos mediante Protocol Buffers.
- Disponibilidad: La arquitectura está diseñada para que el fallo de un microservicio no provoque la caída completa de la plataforma y para restaurar automáticamente los servicios ante fallos de contenedores.

Articulación de las vistas técnicas

- Vista Lógica:
El escenario involucra principalmente las funcionalidades de autenticación, consulta de cursos asignados, búsqueda y consulta de clases grabadas, reproducción y registro del progreso. Los conceptos de usuario, curso, inscripción, grabación e historial colaboran para permitir que el estudiante acceda únicamente al contenido correspondiente a sus cursos y pueda conservar su progreso de reproducción.

- Vista de Procesos:
La solicitud comienza desde el frontend y atraviesa el API Gateway, que dirige las peticiones hacia los microservicios correspondientes. El servicio de Autenticación valida la sesión y los permisos, mientras que el servicio de Inscripción permite comprobar los cursos asignados al estudiante. Posteriormente, el servicio de Grabaciones consulta el contenido solicitado y el servicio de Historial registra el minuto o segundo donde el estudiante detuvo la reproducción, permitiendo posteriormente reanudarla desde ese punto. Esta separación permite que cada proceso opere de forma independiente.

- Vista de Despliegue:
La solución está organizada en seis microservicios independientes: Autenticación, Inscripción, Grabaciones, Analítica, Historial y Notificaciones. Los servicios utilizan una arquitectura políglota basada en TypeScript, Go y Python, de acuerdo con el dominio de cada componente. La comunicación interna se realiza mediante gRPC y contratos Protocol Buffers, mientras que el API Gateway funciona como punto de entrada único para las solicitudes externas. Esta distribución corresponde a los requisitos de desacoplamiento y backend políglota establecidos para el sistema.

- Vista Fisica:
Los componentes de la plataforma se despliegan mediante contenedores Docker dentro de la infraestructura de Google Cloud Platform. El frontend se comunica con el API Gateway, que posteriormente conecta con los microservicios mediante gRPC. Cada microservicio posee una base de datos independiente, siguiendo el patrón Database per Microservice, mientras que Redis se utiliza como mecanismo de caché para las consultas frecuentes de analítica y catálogo. El contenido multimedia puede almacenarse en el servicio de almacenamiento definido para la plataforma. La infraestructura puede ser inicializada mediante Docker Compose tanto en el entorno local como en el entorno cloud.

## 4.2 Vista Logica

- Dirigida a: Usuarios Finales y Analistas
- Propósito: Describir la funcionalidad del sistema desde la perspectiva de negocio
- Diagramas: Secuencia

### 4.2.1 Diagrama Secuencias Autenticacion

![secuenciasCDU1.1](./imgs/vista41/vistaLogica/diagramasSecuencias/secuenciasCDU1.1.png)

### 4.2.2 Diagrama Secuencias Registro de datos

![secuenciasCDU1.2](./imgs/vista41/vistaLogica/diagramasSecuencias/secuenciasCDU1.2.png)

### 4.2.2 Diagrama Secuencias Registro con Oauth

![secuenciasCDU1.2](./imgs/vista41/vistaLogica/diagramasSecuencias/secuenciasCDU1.4.png)

### 4.2.3 Diagrama Secuencias Consulta de Cursos Asignados

![secuenciasCDU2.1](./imgs/vista41/vistaLogica/diagramasSecuencias/secuenciasCDU2.1.png)

### 4.2.3 Diagrama Secuencias Comprobar Rol

![secuenciasCDU2.1](./imgs/vista41/vistaLogica/diagramasSecuencias/secuenciasCDU2.4.png)

### 4.2.4 Diagrama Secuencias Consulta de Datos Academicos

![secuenciasCDU2.5](./imgs/vista41/vistaLogica/diagramasSecuencias/secuenciasCDU2.5.png)

### 4.2.5 Diagrama Secuencias Busqueda Clases Grabadas

![secuenciasCDU3.1](./imgs/vista41/vistaLogica/diagramasSecuencias/secuenciasCDU3.1.png)

### 4.2.6 Diagrama Secuencias Ver detalle Grabacion

![secuenciasCDU3.3](./imgs/vista41/vistaLogica/diagramasSecuencias/secuenciasCDU3.3.png)

### 4.2.7 Diagrama Secuencias Calificacion de Clase Grabada

![secuenciasCDU4.1](./imgs/vista41/vistaLogica/diagramasSecuencias/secuenciasCDU4.1.png)

### 4.2.8 Diagrama Secuencias Consulta Clases mas Vistas

![secuenciasCDU4.4](./imgs/vista41/vistaLogica/diagramasSecuencias/secuenciasCDU4.4.png)

### 4.2.9 Diagrama Secuencias Consulta Temas con Mas Tendencia

![secuenciasCDU4.5](./imgs/vista41/vistaLogica/diagramasSecuencias/secuenciasCDU4.5.png)

### 4.2.10 Diagrama Secuencias Consulta Ranking Clases Mas Valoradas

![secuenciasCDU4.6](./imgs/vista41/vistaLogica/diagramasSecuencias/secuenciasCDU4.6.png)

### 4.2.11 Diagrama Secuencias Consulta Historial de Reproduccion

![secuenciasCDU5.1](./imgs/vista41/vistaLogica/diagramasSecuencias/secuenciasCDU5.1.png)

### 4.2.12 Diagrama Secuencias Reanudacion de Reproduccion por Historial 

![secuenciasCDU5.2](./imgs/vista41/vistaLogica/diagramasSecuencias/secuenciasCDU5.2.png)

### 4.2.13 Diagrama Secuencias Reproduccion de Contenido

![secuenciasCDU5.3](./imgs/vista41/vistaLogica/diagramasSecuencias/secuenciasCDU5.3.png)

### 4.2.14 Diagrama Secuencias Aviso de Registro

![secuenciasCDU6.2](./imgs/vista41/vistaLogica/diagramasSecuencias/secuenciasCDU6.2.png)

### 4.2.15 Diagrama Secuencias Aviso de Nuevo Contenido

![secuenciasCDU6.3](./imgs/vista41/vistaLogica/diagramasSecuencias/secuenciasCDU6.3.png)

### 4.2.16 Diagrama Secuencias Aviso General

![secuenciasCDU6.4](./imgs/vista41/vistaLogica/diagramasSecuencias/secuenciasCDU6.4.png)

Descripcion: Representa la interacción dinámica y el orden cronológico de los mensajes entre el cliente, el Frontend, el API Gateway y los microservicios del Core del backend. Ilustra de forma vertical cómo se ejecutan paso a paso flujos críticos como la validación de tokens JWT, el envio de notificaciones y la persistencia final de datos en la capa de base de datos.

## 4.3 Vista Procesos

- Dirigida a: Integradores
- Propósito: Abordar aspectos dinámicos: concurrencia, distribución, escalabilidad, disponibilidad y rendimiento
- Diagrama: Actividad

### 4.3.1 Diagrama Actividades Autenticacion

![actividadesCDU1.1](./imgs/vista41/vistaProcesos/diagramasActividades/actividadesCDU1.1.png)


### 4.3.2 Diagrama Actividades Registro de Datos

![actividadesCDU1.2](./imgs/vista41/vistaProcesos/diagramasActividades/actividadesCDU1.2.png)

### 4.3.2 Diagrama Actividades Registro con OAuth

![actividadesCDU1.2](./imgs/vista41/vistaProcesos/diagramasActividades/actividadesCDU1.4.png)

### 4.3.3 Diagrama Actividades Consulta de Cursos Asignados

![actividadesCDU2.1](./imgs/vista41/vistaProcesos/diagramasActividades/actividadesCDU2.1.png)

### 4.3.3 Diagrama Actividades Comprobar Rol

![actividadesCDU2.1](./imgs/vista41/vistaProcesos/diagramasActividades/actividadesCDU2.4.png)

### 4.3.4 Diagrama Actividades Consulta Datos Academicos

![actividadesCDU2.5](./imgs/vista41/vistaProcesos/diagramasActividades/actividadesCDU2.5.png)

### 4.3.5 Diagrama Actividades Consulta Clases Grabadas

![actividadesCDU3.1](./imgs/vista41/vistaProcesos/diagramasActividades/actividadesCDU3.1.png)

### 4.3.6 Diagrama Actividades Ver Detalle Clases Grabadas

![actividadesCDU3.3](./imgs/vista41/vistaProcesos/diagramasActividades/actividadesCDU3.3.png)

### 4.3.7 Diagrama Actividades Calificacion de Clases Grabadas

![actividadesCDU4.1](./imgs/vista41/vistaProcesos/diagramasActividades/actividadesCDU4.1.png)

### 4.3.8 Diagrama Actividades Consulta Clases Mas Vistas

![actividadesCDU4.4](./imgs/vista41/vistaProcesos/diagramasActividades/actividadesCDU4.4.png)

### 4.3.9 Diagrama Actividades Consulta Temas con Mas Tendencia

![actividadesCDU4.5](./imgs/vista41/vistaProcesos/diagramasActividades/actividadesCDU4.5.png)

### 4.3.10 Diagrama Actividades Ranking Clases Mas Valoradas

![actividadesCDU4.6](./imgs/vista41/vistaProcesos/diagramasActividades/actividadesCDU4.6.png)

### 4.3.11 Diagrama Actividades Consulta Historial de Reproduccion

![actividadesCDU5.1](./imgs/vista41/vistaProcesos/diagramasActividades/actividadesCDU5.1.png)

### 4.3.12 Diagrama Actividades Reanudacion de Reproduccion por Historials 

![actividadesCDU5.2](./imgs/vista41/vistaProcesos/diagramasActividades/actividadesCDU5.2.png)

### 4.3.13 Diagrama Actividades Reproduccion de Contenido

![actividadesCDU5.3](./imgs/vista41/vistaProcesos/diagramasActividades/actividadesCDU5.3.png)

### 4.3.14 Diagrama Actividades Aviso de Registro


![actividadesCDU6.2](./imgs/vista41/vistaProcesos/diagramasActividades/actividadesCDU6.2.png)

### 4.3.15 Diagrama Actividades Aviso de Contenido Nuevo

![actividadesCDU6.3](./imgs/vista41/vistaProcesos/diagramasActividades/actividadesCDU6.3.png)

### 4.3.16 Diagrama Actividades Aviso General 


![actividadesCDU6.4](./imgs/vista41/vistaProcesos/diagramasActividades/actividadesCDU6.4.png)

Descripcion: Muestra el flujo de trabajo operacional y la lógica procedimental de los diferentes casos de uso de la plataforma mediante bifurcaciones, decisiones y uniones. Permite visualizar visualmente el camino que sigue el usuario como la autenticacion,  reproducir contenido, calificar contenido, ver historial, entre otros.

## 4.4 Vista Despliegue

- Dirigida a: Programadores y Gestión del software
- Propósito: Organización de los módulos de código, librerías compartidas, interfaces expuestas y dependencias
- Diagramas: Componentes

![diagramaComponentes](./imgs/vista41/vistaDespliegue/diagramaComponentes.png)

Descripcion: Ilustra la organización macro y las dependencias de alto nivel del proyecto, dividiéndolo en tres grandes capas: Frontend, Backend, y la Capa DB. Define claramente las fronteras arquitectónicas,  el uso de contratos .proto desde el Gateway hacia los microservicios o la comunicacion con capa externa.

## 4.5 Vista Fisica

- Dirigida a: Ingenieros de Sistemas
- Propósito: Mapear los componentes a la infraestructura física o de nube
- Diagrama: Despliegue

![diagramaDespliegue](./imgs/vista41/vistaFisica/diagramaDespliegue.png)

Descripcion: Muestra la arquitectura física del sistema, mapeando el software a nodo de hardware para el Frontend, el Backend y la Capa DB. Detalla el uso de contenedores Docker individuales para garantizar el aislamiento de cada microservicio, el uso de caché con Redis, y las conexiones de red hacia la API externa para notificaciones por correo y bucket S3.

# 5. Modelado de Datos

## 5.1 Entidad Relacion Autenticacion

![ER1](./imgs/ER/ER1.png)

### 5.1.1 Programacion de Base de Datos

| Tipo               | Nombre                           | Propósito                                                     |
| ------------------ | -------------------------------- | ------------------------------------------------------------- |
| Procedimiento      | `sp_registrar_usuario`           | Registrar un usuario validando el correo institucional        |
| Procedimiento      | `sp_registrar_usuario_google`           | Registrar un usuario que se registra con Oauth Google        |
| Procedimiento      | `sp_crear_sesion`                | Crear una sesión para un usuario                              |
| Procedimiento      | `sp_cerrar_sesion`               | Cerrar una sesión existente                                   |
| Función            | `fn_correo_institucional_valido` | Validar que el correo pertenezca a la Facultad de Ingeniería  |
| Función            | `fn_sesion_valida`               | Comprobar si una sesión sigue activa y no ha expirado         |
| Vista              | `vw_audit_logs_paginados`        | Consultar auditorías de 10 en 10 y permitir filtrar por tabla |
| Trigger            | `trg_auditoria_usuario`          | Auditar INSERT, UPDATE y DELETE de usuario                  |
| Trigger            | `trg_auditoria_sesion`           | Auditar INSERT, UPDATE y DELETE de sesion                   |
| Función de trigger | `fn_auditar_cambios`           | Registrar automáticamente los cambios en audit_logs         |


## 5.2 Entidad Relacion Inscripciones

![ER2](./imgs/ER/ER2.png)

| Tipo               | Objeto                           | Propósito                                                                    |
| ------------------ | -------------------------------- | ---------------------------------------------------------------------------- |
| Procedure          | `sp_inscribir_estudiante`        | Registrar una inscripción validando curso, período, estado y duplicados.     |
| Procedure          | `sp_actualizar_estado_matricula` | Actualizar el estado de una inscripción.                                     |
| Función            | `fn_usuario_tiene_rol`           | Validar si un usuario posee un rol determinado.                              |
| Vista              | `vw_cursos_estudiante`           | Centralizar la información académica necesaria para el panel del estudiante. |
| Vista              | `vw_usuarios_roles`              | Facilitar la consulta de roles asignados a los usuarios.                     |
| Vista              | `vw_audit_logs_paginados`              | Facilita la auditoria de los logs                    |
| Trigger            | `trg_auditoria_inscripcion`      | Auditar INSERT, UPDATE y DELETE sobre inscripciones.                         |
| Trigger            | `trg_auditoria_usuario_rol`      | Auditar cambios en los roles de los usuarios.                                |
| Función de Trigger | `fn_auditar_cambios`             | Registrar automáticamente las modificaciones en audit_logs.                  |


## 5.3 Entidad Relacion Grabaciones

![ER3](./imgs/ER/ER3.png)

| Tipo               | Objeto                        | Propósito                                                                                      |
| ------------------ | ----------------------------- | ---------------------------------------------------------------------------------------------- |
| Procedure          | `sp_registrar_clase`          | Registrar una nueva clase grabada con su información principal.                                |
| Procedure          | `sp_agregar_material`         | Asociar material de apoyo a una clase grabada.                                                  |
| Procedure          | `sp_asignar_docente`          | Asignar un docente responsable a una clase grabada.                                             |
| Procedure          | `sp_asignar_auxiliar`         | Asignar un auxiliar participante a una clase grabada.                                           |
| Procedure          | `sp_asignar_tema_clase`       | Asociar uno o varios temas a una clase grabada.                                                 |
| Procedure          | `sp_carga_masiva_clases`       | Realizar Carga masiva de Clases a Base de Datos                         |
| Función            | `fn_busqueda_avanzada`        | Buscar clases aplicando filtros por semestre, año, área, curso, docente y tema.                |
| Vista              | `vw_catalogo_clases`          | Centralizar la información necesaria para mostrar el catálogo de clases grabadas.               |
| Vista              | `vw_ficha_tecnica`            | Mostrar la ficha técnica de cada clase con su unidad, temas y materiales de apoyo.              |
| Vista              | `vw_docentes_auxiliares`      | Mostrar los docentes y auxiliares asociados a cada clase grabada.                               |
| Trigger            | `trg_auditoria_clase`         | Auditar INSERT, UPDATE y DELETE sobre la tabla clase_grabada.                                 |
| Trigger            | `trg_auditoria_material`      | Auditar INSERT, UPDATE y DELETE sobre la tabla material_apoyo.                                |
| Función de Trigger | `fn_auditar_cambios`          | Registrar automáticamente en audit_logs las modificaciones realizadas en las tablas auditadas. |

## 5.4 Entidad Relacion Analitica

![ER4](./imgs/ER/ER4.png)

| Tipo               | Objeto                        | Propósito                                                                           |
| ------------------ | ----------------------------- | ----------------------------------------------------------------------------------- |
| Procedure          | `sp_registrar_visualizacion`  | Registrar una nueva visualización de una clase.                                     |
| Procedure          | `sp_registrar_calificacion`   | Registrar una nueva calificación para una clase.                                    |
| Procedure          | `sp_registrar_clase`          | Registrar una nueva clase grabada con su información principal.                                |
| Procedure          | `sp_carga_masiva_clases`       | Realizar Carga masiva de Clases a Base de Datos                         |
| Función            | `fn_promedio_calificacion`    | Calcular el promedio de estrellas de una clase.                                     |
| Función            | `fn_total_visualizaciones`    | Obtener el número total de visualizaciones de una clase.                            |
| Función            | `fn_clases_mas_vistas`        | Devolver las clases más vistas durante un período determinado.                      |
| Función            | `fn_ranking_valoradas`        | Calcular el ranking de clases mejor valoradas.                                      |
| Función            | `fn_temas_tendencia`          | Obtener los temas con mayor tendencia durante un período.                           |
| Vista              | `vw_ranking_clases`           | Mostrar el ranking de clases ordenadas por calificación promedio.                   |
| Vista              | `vw_clases_mas_vistas`        | Mostrar las clases ordenadas por cantidad de visualizaciones.                       |
| Vista              | `vw_tendencias`               | Mostrar los temas con mayor cantidad de reproducciones.                             |
| Trigger            | `trg_auditoria_visualizacion` | Auditar INSERT, UPDATE y DELETE sobre `visualizaciones_clase`.                      |
| Trigger            | `trg_auditoria_calificacion`  | Auditar INSERT, UPDATE y DELETE sobre `calificacion_clase`.                         |
| Función de Trigger | `fn_auditar_cambios`          | Registrar automáticamente los cambios en `audit_logs`.                              |


## 5.5 Entidad Relacion Historial

![ER5](./imgs/ER/ER5.png)

| Tipo               | Objeto                         | Propósito                                                                                                                                     |
| ------------------ | ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Procedure          | `sp_registrar_progreso`        | Registrar el avance de reproducción de una clase. Si el historial ya existe, actualiza el checkpoint; de lo contrario crea un nuevo registro. |
| Procedure          | `sp_marcar_completada`         | Marcar una clase como completada cuando el estudiante termine de verla.                                                                       |
| Función            | `fn_calcular_porcentaje_visto` | Calcular automáticamente el porcentaje de avance según el minuto actual y la duración total.                                                  |
| Función            | `fn_obtener_checkpoint`        | Obtener el punto exacto donde debe reanudarse una clase (tema, minuto y porcentaje).                                                          |
| Vista              | `vw_historial_reproduccion`    | Mostrar el historial completo del estudiante con curso, clase, tema, porcentaje y fecha de última reproducción.                               |
| Trigger            | `trg_auditoria_historial`      | Auditar INSERT, UPDATE y DELETE sobre la tabla `historial_reproduccion`.                                                                      |
| Función de Trigger | `fn_auditar_cambios`           | Registrar automáticamente los cambios realizados en `audit_logs`.                                                                             |
| Vista              | `vw_audit_logs`        | Consultar auditorías  |


## 5.6 Entidad Relacion Notificaciones

![ER6](./imgs/ER/ER6.png)

| Tipo               | Objeto                                | Propósito                                                                      |
| ------------------ | ------------------------------------- | ------------------------------------------------------------------------------ |
| Procedure          | `sp_crear_notificacion`               | Registrar una nueva notificación para un usuario.                              |
| Vista              | `vw_notificaciones_usuario`           | Centralizar la información de las notificaciones de los usuarios.              |
| Trigger            | `trg_auditoria_notificaciones`        | Auditar los `INSERT`, `UPDATE` y `DELETE` realizados sobre las notificaciones. |
| Función de Trigger | `fn_auditar_notificacion`             | Registrar automáticamente los cambios realizados en `audit_notification`.      |


# 6. Disenio UI/UX

## 6.1 Mockup Autenticacion

![mockupAutenticacion](./imgs/mockups/mockupAutenticacion.png)

## 6.2 Mockup Catalogo Grabaciones

![mockupCatalogo](./imgs/mockups/mockupCatalogo.png)

## 6.3 Mockup Reproduccion Clase

![mockupReproductor](./imgs/mockups/mockupReproductor.png)

## 6.4 Mockup Asignaciones

![mockupAsignaciones](./imgs/mockups/mockupAsignaciones.png)

## 6.5 Mockup Configuracion

![mockupConfiguracion](./imgs/mockups/mockupConfiguracion.png)

## 6.6 Mockup Panel Admin

![mockupAdmin](./imgs/mockups/mockupAdmin.png)

# 7. Arquitectura implementada

La solución arquitectónica implementada para la plataforma **YoUSAC** se basa en un patrón de **Microservicios desacoplados con Database per Microservice**. Esta decisión permite que cada dominio de negocio funcione de forma autónoma con su propio motor de almacenamiento. De esta manera, si un servicio o base de datos experimenta un fallo o una sobrecarga de tráfico, los demás servicios continúan operando con total normalidad, garantizando una alta disponibilidad, aislamiento de errores y la capacidad de escalar individualmente cada componente según sus necesidades operativas.

### Justificación del Stack Tecnológico y Lenguajes

- **Frontend Web (React + TypeScript):**
  - Se utilizó React debido a su arquitectura basada en componentes reutilizables y su Virtual DOM, lo cual permite construir una interfaz de usuario reactiva, fluida y modular alineada con los mockups del sistema. 
  - Se integró TypeScript para añadir un sistema de tipos estático que detecta errores en tiempo de compilación, facilita el refactorizado y garantiza un contrato de datos riguroso al consumir las respuestas del API Gateway.

- **Microservicios de Autenticación e Inscripción (TypeScript / Node.js):**
  - Se utilizó **TypeScript** en estos dominios debido al ecosistema robusto de librerías para la validación de identidades, encriptación de credenciales y emisión de tokens de acceso. Además, su tipado fuerte permite modelar con precisión las estructuras de datos de usuarios, roles y reglas de matriculación académica.

- **Microservicios de Grabaciones e Historial (Go):**
  - Se utilizó Go en estos componentes debido a su rendimiento cercano a lenguaje ensamblador, bajo consumo de memoria y su modelo nativo de concurrencia basado en goroutines y channels. Esto resulta fundamental para gestionar el catálogo de clases grabadas, procesar múltiples peticiones de reproducción de video en paralelo y guardar con altísima precisión y baja latencia los checkpoints donde cada estudiante pausa su clase.

- **Microservicios de Analítica y Notificaciones (Python):**
  - Se utilizó Python en el microservicio de Analítica debido a su sintaxis expresiva y sus amplias capacidades nativas para la manipulación y procesamiento de datos, facilitando el cálculo de tendencias, rankings de clases mejor valoradas y estadísticas de visualización.
  - Se utilizó Python en el microservicio de Notificaciones para gestionar de forma asíncrona e independiente las tareas en segundo plano, permitiendo el envío masivo de correos electrónicos de confirmación y avisos generales sin bloquear el hilo principal de ejecución de la aplicación.

### gRPC y Contratos .proto

Toda la comunicación interna entre el API Gateway y la malla de microservicios se realiza mediante gRPC sobre HTTP/2, prohibiendo el uso de REST en la red interna. 

- gRPC utiliza Protocol Buffers (.proto) como lenguaje de definición de interfaz y formato de serialización binaria. Esto proporciona contratos estricta y mutually acordados entre microservicios escritos en lenguajes distintos, elimina errores de tipado entre servicios y reduce drásticamente el tamaño del payload y la latencia en comparación con el intercambio de JSON sobre REST tradicional. Además, HTTP/2 permite multiplexar múltiples peticiones síncronas sobre una sola conexión TCP.

### Mecanismo de Autenticación (JWT)

- Se utilizó JWT como mecanismo de autenticación sin estado (*stateless*). Esto permite que el API Gateway verifique la validez del token de manera descentralizada mediante su firma criptográfica sin tener que consultar la base de datos en cada petición HTTP externa. Los tokens incluyen la información del usuario y su rol, y se complementan con Session Cookies configuradas con las banderas HttpOnly y Secure para evitar el acceso malicioso desde scripts del lado del cliente (XSS) y proteger las credenciales en tránsito.

### Contenedorización y Orquestación (Docker y Docker Compose)

- **¿Por qué y cómo está Dockerizado todo el sistema?** Cada microservicio, el API Gateway, la aplicación Frontend y las bases de datos cuentan con su propio **Dockerfile** independiente. Esto permite empaquetar la aplicación junto con sus dependencias, librerías y binarios específicos dentro de contenedores livianos e aislados, garantizando la paridad total entre los entornos de desarrollo, pruebas y producción, y eliminando problemas de compatibilidad en el sistema operativo anfitrión.
- **¿Por qué se usa Docker Compose?** Se utiliza **Docker Compose** (`docker-compose.local.yml`) como la herramienta de orquestación local para definir, enlazar redes internas, configurar variables de entorno y administrar el ciclo de vida de todo el ecosistema de contenedores mediante un único comando ejecutable.


# 8. Principios SOLID

A continuación se presenta el detalle explícito de la aplicación de los 5 principios **SOLID** 

### 8.1 Single Responsibility Principle

Se aplica la separación estricta de responsabilidades entre capas: los controladores procesan peticiones gRPC, los servicios aplican reglas de negocio y validación de correo institucional, y los repositorios ejecutan las consultas nativas a PostgreSQL.


```typescript
export class UserServiceImp implements UserService {
  constructor(private userRepository: UserRepository) {}

  async registrarUsuario(input: RegistrarUsuarioInput): Promise<UsuarioRow> {
    this.validarRegistro(input);

    const yaExiste = await this.userRepository.buscarPorCorreo(input.correo);
    if (yaExiste) {
      throw new Error("El correo institucional ya se encuentra registrado");
    }

    const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

    return this.userRepository.crear({
      nombre: input.nombre.trim(),
      apellido: input.apellido.trim(),
      correo: input.correo.trim().toLowerCase(),
      password_hash: passwordHash,
      estado: ESTADO_ACTIVO,
    });
  }

  private validarRegistro(input: RegistrarUsuarioInput): void {
    if (!CORREO_INSTITUCIONAL_REGEX.test(input.correo.trim().toLowerCase())) {
      throw new Error(
        "El correo debe pertenecer al dominio institucional de la Facultad de Ingeniería"
      );
    }
  }
}
```

---

### 8.2 Open/Closed Principle

Los repositorios y servicios están diseñados para extenderse mediante nuevas implementaciones de interfaces sin alterar el código existente ni modificar el cliente que los consume.

```typescript
export class InscribirServiceImp implements InscribirService {
  constructor(
    private inscribirRepository: InscribirRepository,
    private cursoRepository: CursoRepository
  ) {}

  async inscribirEstudiante(input: InscribirEstudianteInput): Promise<InscripcionRow> {
    this.validarEnteroPositivo(input.id_usuario, "El id del usuario es obligatorio");
    this.validarEnteroPositivo(input.id_curso, "El id del curso es obligatorio");

    const curso = await this.cursoRepository.buscarCursoPorId(input.id_curso);
    if (!curso) {
      throw new Error(`El curso con id '${input.id_curso}' no existe`);
    }

    return this.inscribirRepository.inscribirEstudiante({
      id_usuario: input.id_usuario,
      id_curso: input.id_curso,
      id_periodo: input.id_periodo,
      id_estado_matricula: input.id_estado_matricula,
      tipo_inscripcion: input.tipo_inscripcion?.trim() || null,
    });
  }
}
```

---

### 8.3 Liskov Substitution Principle

Los componentes dependen de interfaces como UserRepository o ClassRepository. Cualquier estructura que implemente la interfaz puede ser sustituida por otra implementación (como un mock de pruebas) manteniendo la validez del programa.

```typescript
export interface UserRepository {
  crear(params: CrearUsuarioParams): Promise<UsuarioRow>;
  buscarPorCorreo(correo: string): Promise<UsuarioRow | null>;
  buscarPorId(id_usuario: number): Promise<UsuarioRow | null>;
  correoExiste(correo: string): Promise<boolean>;
  passwordHash(correo: string): Promise<string | null>;
  actualizarPassword(params: ActualizarPasswordParams): Promise<void>;
}

export class PostgresUserRepository implements UserRepository {
  constructor(private pool: Pool) {}

  async crear(params: CrearUsuarioParams): Promise<UsuarioRow> {
    const client = await this.pool.connect();
    try {
      await client.query("CALL sp_registrar_usuario($1, $2, $3, $4, $5)", [
        params.nombre,
        params.apellido,
        params.correo,
        params.password_hash,
        params.estado,
      ]);
      const { rows } = await client.query<UsuarioRow>(
        "SELECT id_usuario, nombre, apellido, correo_institucional, estado, fecha_registro FROM usuario WHERE correo_institucional = $1",
        [params.correo.toLowerCase()]
      );
      return rows[0];
    } finally {
      client.release();
    }
  }

}
```

---

### 8.4 Interface Segregation Principle

En lugar de definir repositorios o contratos monolíticos, las interfaces se segregan específicamente por dominio funcional. 

```go
package repositories

import (
	"database/sql"
	"servicio-grabaciones/types"
)

type ClassRepository interface {
	CrearClaseGrabada(params types.CrearClaseGrabadaParams) (types.ClaseGrabada, error)
	EditarClaseGrabada(params types.EditarClaseGrabadaParams) (types.ClaseGrabada, error)
	EliminarClaseGrabada(idClase int32) error
	BuscarClaseGrabada(idClase int32) (types.ClaseGrabada, error)
	ConsultarCatalogoClases() ([]types.CatalogoClase, error)
	BusquedaAvanzada(filtros types.BusquedaAvanzadaFiltros) ([]types.ClaseBusqueda, error)
	ConsultarFichaTecnica(idClase int32) ([]types.FichaTecnicaRow, error)
	ObtenerEnlaceClaseGrabada(idClase int32) (string, error)
}
```

---

### 8.5 Dependency Inversion Principle

Los controladores gRPC no instancian directamente las conexiones a base de datos de bajo nivel ni las implementaciones concretas, sino que reciben la abstracción inyectada mediante su constructor.


```typescript
export class UserController {
  constructor(private userService: UserService) {}

  async registrarUsuario(
    call: ServerUnaryCall<RegistrarUsuarioRequest, RegistrarUsuarioResponse>,
    callback: sendUnaryData<RegistrarUsuarioResponse>
  ): Promise<void> {
    try {
      const { nombre, apellido, correo, password } = call.request;

      const usuario = await this.userService.registrarUsuario({
        nombre,
        apellido,
        correo,
        password,
      });

      callback(null, {
        exito: true,
        mensaje: "Usuario registrado exitosamente",
        usuario: this.mapUsuario(usuario),
      });
    } catch (error) {
      const mensaje =
        error instanceof Error ? error.message : "Error interno del servidor";
      callback(this.buildError(status.INVALID_ARGUMENT, mensaje));
    }
  }
}
```

---

# 9. Conclusiones

La Fase 1 del proyecto YoUSAC establece las bases de análisis, diseño, arquitectura y documentación necesarias para el desarrollo de una plataforma web de streaming de video bajo demanda orientada al entorno universitario. A partir de los requerimientos establecidos en el enunciado, se definió una solución basada en una arquitectura de microservicios políglota, desacoplada y contenerizada, enfocada en brindar seguridad, escalabilidad, disponibilidad y tiempos de respuesta adecuados para la consulta y reproducción de contenido académico.

## Arquitectura y Diseño

Se definió una arquitectura basada en seis microservicios principales: Autenticación, Inscripción, Grabaciones, Analítica, Historial y Notificaciones, permitiendo separar las responsabilidades de cada dominio y facilitar su mantenimiento y escalabilidad independiente.

Cada microservicio cuenta con una base de datos independiente, siguiendo el patrón Database per Microservice, evitando el acoplamiento directo entre los diferentes dominios de datos de la plataforma.

La comunicación interna entre los servicios se diseñó mediante gRPC sobre HTTP/2, utilizando contratos definidos mediante Protocol Buffers, mientras que el API Gateway funciona como único punto de entrada para las solicitudes provenientes del cliente web.

## Stack Políglota y Distribución Tecnológica

La solución contempla el uso de tres lenguajes establecidos en el proyecto: TypeScript, Go y Python, distribuidos de acuerdo con las responsabilidades de los diferentes servicios.

TypeScript se utiliza en el frontend y en los servicios relacionados con autenticación e inscripción; Go se emplea para los servicios relacionados con grabaciones e historial, particularmente adecuados para operaciones de alta concurrencia; y Python se utiliza en los servicios de analítica y notificaciones.

Esta distribución permite aprovechar las características de cada lenguaje y mantiene los diferentes dominios desacoplados dentro de la arquitectura de microservicios.

## Seguridad y Gestión de Identidad

La arquitectura contempla mecanismos de seguridad basados en JWT y Session Cookies, permitiendo gestionar de manera segura la autenticación y las sesiones de los usuarios.

Asimismo, el sistema restringe el registro y acceso a usuarios que posean un correo institucional perteneciente al dominio de la Facultad de Ingeniería, evitando el acceso mediante cuentas personales o comerciales.

El API Gateway se establece como el punto de entrada único de la plataforma, evitando que los clientes externos puedan comunicarse directamente con los microservicios internos. Además, se contempla un esquema de control de acceso basado en roles (RBAC) para diferenciar los permisos de Estudiantes, Docentes, Auxiliares y Administradores.  

## Gestión Académica y Contenido

La plataforma permite consultar cursos asignados, filtrarlos por semestre, estado de matriculación y datos académicos. También permite buscar clases grabadas por semestre, escuela, curso, profesor y temas, consultar su información detallada y calificarlas mediante estrellas.

## Analítica, Caché y Rendimiento

El servicio de Analítica permite consultar las clases más vistas, temas en tendencia y clases mejor valoradas. Redis se utiliza como caché para mejorar el rendimiento y reducir la carga sobre las bases de datos.

## Historial y Reproducción

El sistema registra el progreso de reproducción del estudiante, incluyendo el semestre, curso, unidad, tema y minuto o segundo donde se detuvo, permitiendo reanudar la clase desde ese punto.

## Notificaciones

El sistema cuenta con un servicio de notificaciones por correo institucional para confirmar registros, informar sobre nuevo contenido y enviar avisos generales de la plataforma.

## Requerimientos y Calidad

Durante esta fase se identificaron y documentaron 24 requerimientos funcionales, cubriendo las principales capacidades de los módulos de autenticación, inscripción, catálogo y grabaciones, analítica, historial, reproducción y notificaciones.

También se definieron 13 requerimientos no funcionales, agrupados en las categorías de Rendimiento, Seguridad, Disponibilidad, Escalabilidad, Portabilidad e Interoperabilidad, estableciendo criterios medibles que permitirán evaluar posteriormente la calidad y el comportamiento de la plataforma.

Los casos de uso fueron desarrollados a partir de estos requerimientos, permitiendo representar las interacciones entre los diferentes actores y las funcionalidades que debe proporcionar el sistema.

## Contenedores, Infraestructura y Despliegue

La solución fue diseñada para ejecutarse mediante Docker y Docker Compose, permitiendo encapsular los diferentes componentes de la plataforma y facilitar la reproducción del entorno.

El diagrama de despliegue representa la ejecución de la solución dentro de Google Cloud Platform, utilizando Google Compute Engine como infraestructura de ejecución y Docker Compose para administrar los contenedores correspondientes al frontend, API Gateway, microservicios y bases de datos.

Además, se contempla el uso de Google Cloud Storage para el almacenamiento de contenido multimedia y Redis como capa de caché para el servicio de analítica.

La separación entre los componentes de aplicación, almacenamiento y servicios externos permite mantener una estructura organizada y facilita futuras modificaciones o ampliaciones de la plataforma.

## Conclusión Técnica

En conjunto, la arquitectura propuesta para YoUSAC integra una arquitectura de microservicios, un backend políglota basado en TypeScript, Go y Python, comunicación interna mediante gRPC, un API Gateway como punto de entrada único, bases de datos independientes, Redis para caché y una infraestructura contenerizada desplegable en Google Cloud Platform.

La separación de responsabilidades entre los microservicios permite construir una solución escalable, mantenible y tolerante a fallos, mientras que los mecanismos de autenticación, autorización y restricción al correo institucional permiten establecer una plataforma orientada al entorno académico de la Facultad de Ingeniería.

Finalmente, los diseños realizados durante esta fase proporcionan una base sólida para la implementación de la plataforma, ya que los requerimientos, casos de uso, diagramas de componentes, despliegue y modelado de datos permiten establecer de forma clara tanto las funcionalidades esperadas como la estructura técnica que deberá seguir el desarrollo de YoUSAC.

# 10. Fase 2 — Módulos nuevos

<!-- HeinzGomez - Enlace a la documentación del módulo de Segmentación por Capítulos (Fase 2) -->
La documentación técnica de los nuevos módulos de la Fase 2 se desarrolla en archivos dedicados dentro de `documentacion/fase2/`, para mantener el trabajo modular y facilitar la integración por Pull Request.

## 10.1 Segmentación por Capítulos (Video Chapters)

Documento técnico del módulo (RF/RNF, casos de uso expandidos, Vista 4+1, DER extendido, contratos gRPC/REST, mockups y pruebas unitarias):

- [documentacion/fase2/segmentacion-capitulos.md](./fase2/segmentacion-capitulos.md)

Archivos crudos editables (PlantUML) de los diagramas: [documentacion/fase2/crudos/](./fase2/crudos/)
