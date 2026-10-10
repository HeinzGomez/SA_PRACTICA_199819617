# UNIVERSIDAD DE SAN CARLOS DE GUATEMALA

# FACULTAD DE INGENIERIA

# ESCUELA DE CIENCIAS Y SISTEMAS

# PROYECTO
---

|Nombre                       | Carnet   |
|-----------------------------|----------|
|Ramiro Agustin Telles Carcuz | 202010044|
|Heinz Ricardo Gomez Galindo  | 199819617|

# Índice

- [UNIVERSIDAD DE SAN CARLOS DE GUATEMALA](#universidad-de-san-carlos-de-guatemala)
- [FACULTAD DE INGENIERIA](#facultad-de-ingenieria)
- [ESCUELA DE CIENCIAS Y SISTEMAS](#escuela-de-ciencias-y-sistemas)
- [PROYECTO](#proyecto)
- [Índice](#índice)
- [1. Introduccion](#1-introduccion)
- [2. Requerimientos del sistema](#2-requerimientos-del-sistema)
  - [2.1 Requerimientos Funcionales](#21-requerimientos-funcionales)
  - [2.2 Requerimientos No Funcionales](#22-requerimientos-no-funcionales)
    - [2.2.1 Rendimiento](#221-rendimiento)
    - [2.2.2 Seguridad](#222-seguridad)
    - [2.2.3 Disponibilidad y Confiabilidad](#223-disponibilidad-y-confiabilidad)
    - [2.2.4 Escalabilidad](#224-escalabilidad)
    - [2.2.5 Portabilidad y Despliegue](#225-portabilidad-y-despliegue)
    - [2.2.6 Interoperabilidad y Comunicación](#226-interoperabilidad-y-comunicación)
    - [2.2.7 Integridad y Consistencia de Datos](#227-integridad-y-consistencia-de-datos)
    - [2.2.8 CI/CD y Calidad](#228-cicd-y-calidad)
- [3. Casos de Uso](#3-casos-de-uso)
  - [3.1 Core](#31-core)
    - [Plataforma para la gestión de eventos académicos, inscripción y reserva de cupos, así como la emisión y verificación de diplomas digitales.](#plataforma-para-la-gestión-de-eventos-académicos-inscripción-y-reserva-de-cupos-así-como-la-emisión-y-verificación-de-diplomas-digitales)
  - [3.2 Stakeholders](#32-stakeholders)
  - [3.3 Primera descomposicion](#33-primera-descomposicion)
  - [3.4 Casos de Uso Expandidos](#34-casos-de-uso-expandidos)
    - [3.4.1 CDU 1](#341-cdu-1)
    - [3.4.1.1 CDU 1 Diagrama](#3411-cdu-1-diagrama)
    - [3.4.1.2 CDU1.1 Descripcion Textual](#3412-cdu11-descripcion-textual)
    - [3.4.1.3 CDU1.2 Descripcion Textual](#3413-cdu12-descripcion-textual)
    - [3.4.1.4 CDU1.3 Descripcion Textual](#3414-cdu13-descripcion-textual)
    - [3.4.2 CDU 2](#342-cdu-2)
    - [3.4.2.1 CDU 2 Diagramas del 1 - 4](#3421-cdu-2-diagramas-del-1---4)
    - [3.4.2.2 CDU 2.1 Descripcion Textual](#3422-cdu-21-descripcion-textual)
    - [3.4.2.3 CDU 2.2 Descripcion Textual](#3423-cdu-22-descripcion-textual)
    - [3.4.2.4 CDU 2.3 Descripcion Textual](#3424-cdu-23-descripcion-textual)
    - [3.4.2.5 CDU 2.4 Descripcion Textual](#3425-cdu-24-descripcion-textual)
    - [3.4.2.1 CDU 2 Diagramas del 5 - 8](#3421-cdu-2-diagramas-del-5---8)
    - [3.4.2.6 CDU 2.5 Descripcion Textual](#3426-cdu-25-descripcion-textual)
    - [3.4.2.7 CDU 2.6 Descripcion Textual](#3427-cdu-26-descripcion-textual)
    - [3.4.2.8 CDU 2.7 Descripcion Textual](#3428-cdu-27-descripcion-textual)
    - [3.4.2.8 CDU 2.8 Descripcion Textual](#3428-cdu-28-descripcion-textual)
    - [3.4.3 CDU 3](#343-cdu-3)
    - [3.4.3.1 CDU 3](#3431-cdu-3)
    - [3.4.3.2 CDU 3.1 Descripcion Textual](#3432-cdu-31-descripcion-textual)
    - [3.4.3.3 CDU 3.2 Descripcion Textual](#3433-cdu-32-descripcion-textual)
    - [3.4.3.4 CDU 3.3 Descripcion Textual](#3434-cdu-33-descripcion-textual)
    - [3.4.3.5 CDU 3.4 Descripcion Textual](#3435-cdu-34-descripcion-textual)
    - [3.4.3.6 CDU 3.5 Descripcion Textual](#3436-cdu-35-descripcion-textual)
    - [3.4.3.8 CDU 3.6 Descripcion Textual](#3438-cdu-36-descripcion-textual)
    - [3.4.3.9 CDU 3.7 Descripcion Textual](#3439-cdu-37-descripcion-textual)
    - [3.4.4 CDU 4](#344-cdu-4)
    - [3.4.4.1 CDU 4 Diagrama](#3441-cdu-4-diagrama)
    - [3.4.4.2 CDU 4.1 Descripcion Textual](#3442-cdu-41-descripcion-textual)
    - [3.4.4.3 CDU 4.2 Descripcion Textual](#3443-cdu-42-descripcion-textual)
    - [3.4.4.4 CDU 4.3 Descripcion Textual](#3444-cdu-43-descripcion-textual)
    - [3.4.4.5 CDU 4.4 Descripcion Textual](#3445-cdu-44-descripcion-textual)
- [4. Vista 4+1](#4-vista-41)
  - [4.1 Vista Escenario](#41-vista-escenario)
    - [Reserva de cupo en una actividad académica](#reserva-de-cupo-en-una-actividad-académica)
    - [Articulación de las vistas técnicas](#articulación-de-las-vistas-técnicas)
  - [4.2 Vista Logica](#42-vista-logica)
    - [4.2.1 Diagrama Secuencias Autenticacion](#421-diagrama-secuencias-autenticacion)
    - [4.2.2 Diagrama Secuencias Registro de datos](#422-diagrama-secuencias-registro-de-datos)
    - [4.2.3 Diagrama Secuencias Consulta de Actividades Academicas](#423-diagrama-secuencias-consulta-de-actividades-academicas)
    - [4.2.4 Diagrama Secuencias Consulta de Datos Academicos](#424-diagrama-secuencias-consulta-de-datos-academicos)
    - [4.2.4 Diagrama Secuencias Consulta de Usuarios](#424-diagrama-secuencias-consulta-de-usuarios)
    - [4.2.4 Diagrama Secuencias Cambio de Rol](#424-diagrama-secuencias-cambio-de-rol)
    - [4.2.4 Diagrama Secuencias Consulta de Inscripciones](#424-diagrama-secuencias-consulta-de-inscripciones)
    - [4.2.4 Diagrama Secuencias Crear Inscripcion](#424-diagrama-secuencias-crear-inscripcion)
    - [4.2.4 Diagrama Secuencias Cambiar Estado Inscripcion](#424-diagrama-secuencias-cambiar-estado-inscripcion)
    - [4.2.5 Diagrama Secuencias Busqueda Clases Grabadas](#425-diagrama-secuencias-busqueda-clases-grabadas)
    - [4.2.6 Diagrama Secuencias Ver detalle Grabacion](#426-diagrama-secuencias-ver-detalle-grabacion)
    - [4.2.6 Diagrama Secuencias Consulta de Clases](#426-diagrama-secuencias-consulta-de-clases)
    - [4.2.6 Diagrama Secuencias Crear nueva Clase](#426-diagrama-secuencias-crear-nueva-clase)
    - [4.2.6 Diagrama Secuencias Carga Masiva Clases](#426-diagrama-secuencias-carga-masiva-clases)
  - [4.3 Vista Procesos](#43-vista-procesos)
    - [4.3.1 Diagrama Actividades Autenticacion](#431-diagrama-actividades-autenticacion)
    - [4.3.2 Diagrama Actividades Registro de Datos](#432-diagrama-actividades-registro-de-datos)
    - [4.3.3 Diagrama Actividades Consulta de Cursos Asignados](#433-diagrama-actividades-consulta-de-cursos-asignados)
    - [4.3.3 Diagrama Actividades Comprobar Rol](#433-diagrama-actividades-comprobar-rol)
    - [4.3.4 Diagrama Actividades Consulta Datos Academicos](#434-diagrama-actividades-consulta-datos-academicos)
    - [4.3.4 Diagrama Actividades Consulta de Usuarios](#434-diagrama-actividades-consulta-de-usuarios)
    - [4.3.4 Diagrama Actividades Cambio de Rol](#434-diagrama-actividades-cambio-de-rol)
    - [4.3.4 Diagrama Actividades Consulta de Inscripciones](#434-diagrama-actividades-consulta-de-inscripciones)
    - [4.3.5 Diagrama Actividades Consulta Clases Grabadas](#435-diagrama-actividades-consulta-clases-grabadas)
    - [4.3.6 Diagrama Actividades Ver Detalle Clases Grabadas](#436-diagrama-actividades-ver-detalle-clases-grabadas)
    - [4.3.6 Diagrama Actividades Consulta de Clases](#436-diagrama-actividades-consulta-de-clases)
    - [4.3.6 Diagrama Actividades Crear nueva clase](#436-diagrama-actividades-crear-nueva-clase)
    - [4.3.7 Diagrama Actividades Calificacion de Clases Grabadas](#437-diagrama-actividades-calificacion-de-clases-grabadas)
    - [4.3.8 Diagrama Actividades Consulta Clases Mas Vistas](#438-diagrama-actividades-consulta-clases-mas-vistas)
  - [4.4 Vista Despliegue](#44-vista-despliegue)
    - [Diagrama componentes](#diagrama-componentes)
  - [4.5 Vista Fisica](#45-vista-fisica)
    - [Diagrama Componentes Develop](#diagrama-componentes-develop)
- [5. Modelado de Datos](#5-modelado-de-datos)
  - [5.1 Entidad Relacion Autenticacion](#51-entidad-relacion-autenticacion)
    - [5.1.1 Programacion de Base de Datos](#511-programacion-de-base-de-datos)
  - [5.2 Entidad Relacion Actividades](#52-entidad-relacion-actividades)
  - [5.4 Entidad Relacion Certificacion](#54-entidad-relacion-certificacion)
- [6. Disenio UI/UX](#6-disenio-uiux)
  - [6.1 Mockup Catalogo](#61-mockup-catalogo)
  - [6.2 Mockup Actividad Academica](#62-mockup-actividad-academica)
  - [6.3 Mockup Verificar](#63-mockup-verificar)
  - [6.4 Mockup Administracion](#64-mockup-administracion)
- [7. Flujo CI/CD](#7-flujo-cicd)
  - [Diagrama de Flujo](#diagrama-de-flujo)
  - [Imagenes Creadas por CI](#imagenes-creadas-por-ci)
    - [Registry del Repositorio](#registry-del-repositorio)
- [8. Arquitectura implementada](#8-arquitectura-implementada)
    - [Matriz de Decisiones Técnicas (Qué, Por qué y Para qué)](#matriz-de-decisiones-técnicas-qué-por-qué-y-para-qué)
    - [Diagrama Arquitectura de Red en la nube](#diagrama-arquitectura-de-red-en-la-nube)
    - [Diagrama Flujo del aprovisionamiento](#diagrama-flujo-del-aprovisionamiento)
- [9. Matriz SOLID: Separación entre Productores y Consumidores](#9-matriz-solid-separación-entre-productores-y-consumidores)
- [10. Conclusiones](#10-conclusiones)
    - [Logros alcanzados](#logros-alcanzados)
    - [Validación de las decisiones de la matriz](#validación-de-las-decisiones-de-la-matriz)

# 1. Introduccion 

-

# 2. Requerimientos del sistema

## 2.1 Requerimientos Funcionales

| Código | Descripción | Prioridad |
|--------|-------------|-----------|
| RF-01 | El usuario debe poder autenticarse en la plataforma mediante sus credenciales de acceso. | Alta |
| RF-02 | El usuario debe poder registrar sus datos personales, correo y credenciales para crear una cuenta en la plataforma. | Alta |
| RF-03 | El sistema debe poder validar las credenciales de correo electrónico y contraseña proporcionadas por el usuario antes de permitirle el acceso a su cuenta. | Alta |
| RF-04 | El sistema debe permitir al estudiante consultar las actividades académicas disponibles en la plataforma. | Alta |
| RF-05 | El estudiante debe poder filtrar las actividades académicas por curso y rango de fechas. | Alta |
| RF-06 | El estudiante debe poder consultar la información del ponente asociado a una actividad académica. | Alta |
| RF-07 | El estudiante debe poder consultar los prerrequisitos necesarios para participar en una actividad académica. | Alta |
| RF-08 | El estudiante debe poder consultar el cupo disponible de una actividad académica. | Alta |
| RF-09 | El usuario debe poder ver en tiempo real el cupo de las actividades | Alta |
| RF-10 | El administrador debe poder consultar la lista de actividades académicas registradas en la plataforma. | Alta |
| RF-11 | El administrador debe poder crear nuevas actividades académicas indicando su información, ponente y prerrequisitos. | Alta |
| RF-12 | El administrador debe poder editar la información de una actividad académica registrada en la plataforma. | Alta |
| RF-13 | El administrador debe poder eliminar una actividad académica registrada en la plataforma. | Media |
| RF-14 | El sistema debe poder verificar la disponibilidad de cupos de una actividad académica antes de confirmar una reserva. | Alta |
| RF-15 | El estudiante debe poder reservar cupo en una actividad academica | Alta |
| RF-16 | El sistema debe rechazar una solicitud de reserva cuando la actividad académica no disponga de cupos disponibles. | Alta |
| RF-17 | El estudiante debe poder realizar un examen de certificación y responder las preguntas correspondientes del examen. | Alta |
| RF-18 | El sistema debe poder determinar si el estudiante aprobó o reprobó el examen de certificación al finalizarlo. | Alta |
| RF-19 | El estudiante debe poder solicitar la generación de un certificado cuando haya aprobado el examen de certificación correspondiente. | Alta |
| RF-20 | El estudiante debe recibir su certificado con un hash unico al pedir la generacion de su certificado| Alta |
| RF-21 | El estudiante debe poder consultar los certificados obtenidos en la plataforma. | Alta |
| RF-22 | El estudiante debe poder filtrar sus certificados por rango de fechas y curso. | Alta |
| RF-23 | El estudiante debe poder ingresar el identificador único o hash de un certificado para solicitar su validación. | Alta |
| RF-24 | El sistema debe poder comprobar la validez de un certificado encontrado mediante su identificador único o hash. | Alta |

## 2.2 Requerimientos No Funcionales

### 2.2.1 Rendimiento

| Código | Descripción                                                                                                                                                                                                                         |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| RNF-01 | El API Gateway debe responder en menos de 2 segundos para al menos el 95% de las solicitudes HTTP** bajo una carga de hasta **500 usuarios concurrentes.                                                                        |
| RNF-02 | El sistema debe ser capaz de procesar al menos 1,000 solicitudes concurrentes de reserva de cupo, utilizando comunicación asíncrona mediante el Message Broker.                                                                 |
| RNF-03 | El sistema debe confirmar o rechazar una solicitud de reserva en un tiempo máximo de 5 segundos para al menos el 95% de las solicitudes, una vez recibida por el servicio de reservas.                                          |
| RNF-04 | Las actualizaciones de cupos disponibles deben ser propagadas a los clientes conectados mediante WebSocket en un tiempo máximo de 3 segundos después de que el cambio sea confirmado por el servicio de reservas.               |
| RNF-05 | La consulta del catálogo de actividades académicas debe responder en menos de 2 segundos para al menos el 95% de las consultas bajo una carga de 500 usuarios concurrentes.                                                     |

### 2.2.2 Seguridad

| Código | Descripción                                                                                                                                                                                                                           |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| RNF-06 | Ningún cliente externo debe comunicarse directamente con los servicios internos; el 100% del tráfico externo hacia los servicios debe pasar por el API Gateway.                                                                   |
| RNF-07 | Las credenciales y secretos utilizados por los servicios no deben estar almacenados directamente en el código fuente ni en los repositorios Git, alcanzando un 100% de cumplimiento en las variables y configuraciones sensibles. |
| RNF-08 | La clave privada utilizada para la firma criptográfica de los certificados no debe ser accesible desde el Frontend ni exponerse mediante ningún endpoint público del sistema.                                                         |
| RNF-09 | Las sesiones o tokens de autenticación deben tener un tiempo de expiración máximo de 1 hora, después del cual el usuario deberá autenticarse nuevamente.                                                                          |
| RNF-10 | El sistema debe rechazar el 100% de las solicitudes dirigidas a operaciones administrativas cuando el usuario no posea los permisos correspondientes.                                                                             |

### 2.2.3 Disponibilidad y Confiabilidad

| Código | Descripción                                                                                                                                                                                                                                    |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| RNF-11 | El sistema desplegado en producción debe mantener una disponibilidad mínima del 99.5% mensual.                                                                                           |
| RNF-12 | La falla de un servicio individual no debe provocar la caída completa de los demás servicios del sistema, permitiendo que al menos el 80% de las funcionalidades no dependientes directamente del servicio afectado continúen disponibles. |
| RNF-13 | Los mensajes críticos de reserva publicados en RabbitMQ no deben perderse ante un reinicio del consumidor, manteniendo una tasa de pérdida de mensajes del 0% durante las pruebas de recuperación.                                         |
| RNF-14 | Las operaciones de reserva deben mantener una tasa de 0 reservas confirmadas por encima del cupo disponible durante las pruebas de concurrencia.                                                                                           |

### 2.2.4 Escalabilidad

| Código | Descripción                                                                                                                                                                                                                     |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| RNF-15 | El Message Broker debe permitir distribuir las solicitudes de reserva entre múltiples consumidores del servicio correspondiente, permitiendo procesar al menos 1,000 solicitudes concurrentes. |

### 2.2.5 Portabilidad y Despliegue

| Código | Descripción                                                                                                                                                                           |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| RNF-16 | El 100% de los servicios backend debe ejecutarse dentro de contenedores Docker y poder iniciarse mediante Docker Compose. |
| RNF-17 | La aplicación debe poder ser desplegada en la nube sin necesidad de grandes modificaciones en el código fuente de los servicios. |
| RNF-18 | El Frontend debe estar disponible mediante una URL pública de Vercel.     |
| RNF-19 | Las imágenes Docker utilizadas para producción deben almacenarse en un Container Registry y cada servicio debe contar con una imagen versionada disponible para su despliegue.        |

### 2.2.6 Interoperabilidad y Comunicación

| Código | Descripción                                                                                                                                                                                        |
| ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

| RNF-20 | Las transacciones deben utilizar RabbitMQ como Message Broker, evitando solicitudes HTTP bloqueantes entre los servicios involucrados. |

### 2.2.7 Integridad y Consistencia de Datos

| Código | Descripción                                                                                                                                                                                                                                                                      |
| ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| RNF-21 | El sistema debe garantizar que una actividad académica nunca confirme más reservas que el número de cupos disponibles, manteniendo una tasa de 0 sobreventas durante las pruebas de concurrencia.                                                                            |
| RNF-22 | Cada certificado generado debe poseer un identificador único o hash que permita localizarlo y verificarlo, alcanzando un 100% de unicidad para los certificados emitidos.                                                                                                    |

### 2.2.8 CI/CD y Calidad

| Código | Descripción                                                                                                                                                                                                                 |
| ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| RNF-23 | El pipeline debe ejecutar las pruebas unitarias de los servicios modificados y debe bloquear la integración cuando no llegue al coverage del >=75%.                                                          |
| RNF-24 | El pipeline debe construir las imágenes Docker del proyecto y publicarlas automáticamente en un Container Registry después de una ejecución exitosa de las pruebas.                                                         |
| RNF-25 | El pipeline debe detenerse y no ejecutar las etapas posteriores cuando ocurra una falla crítica en compilación, pruebas o construcción de imágenes, alcanzando un 100% de cumplimiento en las ejecuciones del pipeline. |
| RNF-26 | El proceso de CI/CD debe generar una versión identificable de las imágenes Docker mediante tags, permitiendo asociar el 100% de las imágenes publicadas con una versión del proyecto.                                   |


# 3. Casos de Uso

## 3.1 Core

![CDUcore](./imgs/CDUs/core.png)

### Plataforma para la gestión de eventos académicos, inscripción y reserva de cupos, así como la emisión y verificación de diplomas digitales.

La Plataforma para la Gestión de Eventos Académicos, Inscripción y Reserva de Cupos, así como la Emisión y Verificación de Diplomas Digitales, es una solución orientada a facilitar la participación de los estudiantes en talleres, conferencias y actividades académicas, permitiendo consultar eventos, conocer sus cupos disponibles y prerrequisitos, y realizar reservas de manera eficiente. La plataforma también permite gestionar procesos de certificación y generar diplomas digitales con mecanismos de verificación, proporcionando una experiencia centralizada, segura y orientada a la gestión de actividades académicas.

## 3.2 Stakeholders

Principales

- Estudiante
- Administrador

## 3.3 Primera descomposicion

![CDUprimeradescomposicion](./imgs/CDUs/primeraDerivacion.png)

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

### 3.4.2 CDU 2

### 3.4.2.1 CDU 2 Diagramas del 1 - 4

![CDU2](./imgs/CDUs/CDU2/CDU2_1-4.png)

### 3.4.2.2 CDU 2.1 Descripcion Textual

![CDU2.1](./imgs/CDUs/CDU2/CDU2.1.png)

### 3.4.2.3 CDU 2.2 Descripcion Textual

![CDU2.2](./imgs/CDUs/CDU2/CDU2.2.png)

### 3.4.2.4 CDU 2.3 Descripcion Textual

![CDU2.3](./imgs/CDUs/CDU2/CDU2.3.png)

### 3.4.2.5 CDU 2.4 Descripcion Textual

![CDU2.4](./imgs/CDUs/CDU2/CDU2.4.png)

### 3.4.2.1 CDU 2 Diagramas del 5 - 8

![CDU2](./imgs/CDUs/CDU2/CDU2_5-8.png)

### 3.4.2.6 CDU 2.5 Descripcion Textual

![CDU2.5](./imgs/CDUs/CDU2/CDU2.5.png)

### 3.4.2.7 CDU 2.6 Descripcion Textual

![CDU2.6](./imgs/CDUs/CDU2/CDU2.6.png)

### 3.4.2.8 CDU 2.7 Descripcion Textual

![CDU2.7](./imgs/CDUs/CDU2/CDU2.7.png)

### 3.4.2.8 CDU 2.8 Descripcion Textual

![CDU2.7](./imgs/CDUs/CDU2/CDU2.8.png)

### 3.4.3 CDU 3

### 3.4.3.1 CDU 3 

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

### 3.4.3.8 CDU 3.6 Descripcion Textual

![CDU3.5](./imgs/CDUs/CDU3/CDU3.6.png)

### 3.4.3.9 CDU 3.7 Descripcion Textual

![CDU3.5](./imgs/CDUs/CDU3/CDU3.7.png)

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

# 4. Vista 4+1

![vista4mas1](./imgs/vista41/vista4mas1.png)

## 4.1 Vista Escenario

- Dirigida a: Todos los stakeholders
- Propósito: Integrar las diferentes vistas arquitectónicas, mostrando cómo los componentes del sistema colaboran para gestionar eventos académicos, realizar reservas de cupos y emitir y verificar diplomas digitales.
- Diagrama: Casos de Uso presentados en la sección 3.

### Reserva de cupo en una actividad académica

Cuando un estudiante desea participar en un taller, conferencia o laboratorio, el sistema permite consultar las actividades académicas disponibles, visualizar información como el ponente, los prerrequisitos y los cupos disponibles, y seleccionar una actividad para iniciar el proceso de reserva. El sistema valida la disponibilidad del cupo y registra la reserva mediante un procesamiento desacoplado, permitiendo atender múltiples solicitudes concurrentes.

El sistema garantiza:

- Rendimiento: El API Gateway debe responder en menos de 2 segundos para el 95% de las peticiones bajo una carga de hasta 500 usuarios concurrentes. El sistema debe ser capaz de procesar hasta 1,000 solicitudes concurrentes de reserva y confirmar o rechazar una solicitud en un tiempo máximo de 5 segundos para el 95% de los casos.
- Seguridad: Las credenciales y secretos no deben almacenarse directamente en el código fuente.
- Desacoplamiento: Los servicios de autenticación, actividades, reservas y certificados funcionan de manera independiente, comunicándose mediante los mecanismos definidos por la arquitectura SOA. 
- Interoperabilidad: Las operaciones requieren procesamiento asíncrono utilizan RabbitMQ como Message Broker.
- Disponibilidad: La arquitectura busca evitar que la falla de un servicio individual provoque la caída completa de la plataforma.
- Consistencia: El sistema debe garantizar que una actividad académica no confirme más reservas que el número de cupos disponibles, incluso cuando múltiples estudiantes intenten reservar simultáneamente.

### Articulación de las vistas técnicas

- Vista Lógica:
  El escenario involucra principalmente las funcionalidades de autenticación, consulta de actividades académicas, consulta de ponentes y prerrequisitos, visualización de cupos, reserva de cupo y actualización del cupo disponible. Los conceptos de estudiante, actividad académica, curso, reserva y cupo colaboran para permitir que el estudiante consulte una actividad y solicite su reserva, manteniendo la cantidad de cupos disponible de forma consistente.

- Vista de Procesos:
  La solicitud comienza desde el frontend y atraviesa el API Gateway, que funciona como punto de entrada para las peticiones externas. Cuando el estudiante solicita reservar un cupo, el API Gateway envía la solicitud al sistema de mensajería RabbitMQ. El Servicio de Reservas consume el mensaje, valida la disponibilidad del cupo y procesa la reserva. Una vez confirmada la operación, el servicio actualiza la disponibilidad y publica un evento de actualización mediante RabbitMQ. El API Gateway recibe dicho evento y transmite el nuevo número de cupos al frontend mediante una conexión WebSocket, permitiendo actualizar la información mostrada a los usuarios sin necesidad de recargar la página.

- Vista de Despliegue:
  La solución está organizada en servicios independientes para la gestión de autenticación y usuarios, catálogo de actividades académicas, reservas/ticketing y certificados. El frontend constituye la interfaz de interacción con el estudiante y se encuentra desplegado públicamente en Vercel. El API Gateway funciona como punto de entrada único para las solicitudes externas, mientras que RabbitMQ permite la comunicación asíncrona entre los servicios. Los servicios backend se ejecutan mediante contenedores Docker, permitiendo escalar individualmente los componentes de acuerdo con la carga de trabajo.

- Vista Física:
  Los componentes de la plataforma se despliegan mediante contenedores Docker. El frontend desplegado en Vercel se comunica con el API Gateway, que dirige las solicitudes hacia los servicios correspondientes. RabbitMQ funciona como Message Broker para las operaciones asíncronas. Cada servicio puede mantener su propia persistencia siguiendo el principio de separación de responsabilidades. Las imágenes de los servicios se almacenan en un Container Registry y su construcción y publicación son automatizadas mediante el pipeline de CI/CD.

## 4.2 Vista Logica

- Dirigida a: Usuarios Finales y Analistas
- Propósito: Describir la funcionalidad del sistema desde la perspectiva de negocio
- Diagramas: Secuencia

### 4.2.1 Diagrama Secuencias Autenticacion

![secuenciasCDU1.1](./imgs/vista41/vistaLogica/diagramaSecuencias/SecuenciasCDU1.1.png)

### 4.2.2 Diagrama Secuencias Registro de datos

![secuenciasCDU1.1](./imgs/vista41/vistaLogica/diagramaSecuencias/SecuenciasCDU1.2.png)

### 4.2.3 Diagrama Secuencias Consulta de Actividades Academicas

![secuenciasCDU1.1](./imgs/vista41/vistaLogica/diagramaSecuencias/SecuenciasCDU2.1.png)

### 4.2.4 Diagrama Secuencias Consulta de Datos Academicos

![secuenciasCDU1.1](./imgs/vista41/vistaLogica/diagramaSecuencias/SecuenciasCDU2.4.png)

### 4.2.4 Diagrama Secuencias Consulta de Usuarios

![secuenciasCDU1.1](./imgs/vista41/vistaLogica/diagramaSecuencias/SecuenciasCDU2.5.png)

### 4.2.4 Diagrama Secuencias Cambio de Rol

![secuenciasCDU1.1](./imgs/vista41/vistaLogica/diagramaSecuencias/SecuenciasCDU2.6.png)

### 4.2.4 Diagrama Secuencias Consulta de Inscripciones

![secuenciasCDU1.1](./imgs/vista41/vistaLogica/diagramaSecuencias/SecuenciasCDU2.7.png)

### 4.2.4 Diagrama Secuencias Crear Inscripcion

![secuenciasCDU1.1](./imgs/vista41/vistaLogica/diagramaSecuencias/SecuenciasCDU2.8.png)

### 4.2.4 Diagrama Secuencias Cambiar Estado Inscripcion

![secuenciasCDU1.1](./imgs/vista41/vistaLogica/diagramaSecuencias/SecuenciasCDU3.1.png)

### 4.2.5 Diagrama Secuencias Busqueda Clases Grabadas

![secuenciasCDU1.1](./imgs/vista41/vistaLogica/diagramaSecuencias/SecuenciasCDU3.4.png)

### 4.2.6 Diagrama Secuencias Ver detalle Grabacion

![secuenciasCDU1.1](./imgs/vista41/vistaLogica/diagramaSecuencias/SecuenciasCDU3.6.png)

### 4.2.6 Diagrama Secuencias Consulta de Clases

![secuenciasCDU1.1](./imgs/vista41/vistaLogica/diagramaSecuencias/SecuenciasCDU3.7.png)

### 4.2.6 Diagrama Secuencias Crear nueva Clase

![secuenciasCDU1.1](./imgs/vista41/vistaLogica/diagramaSecuencias/SecuenciasCDU4.1.png)

### 4.2.6 Diagrama Secuencias Carga Masiva Clases

![secuenciasCDU1.1](./imgs/vista41/vistaLogica/diagramaSecuencias/SecuenciasCDU4.3.png)

Descripcion: Representa la interacción dinámica y el orden cronológico de los mensajes entre el cliente, el Frontend, el API Gateway y los microservicios del Core del backend. Ilustra de forma vertical cómo se ejecutan paso a paso flujos críticos como la validación de tokens JWT, el envio de notificaciones y la persistencia final de datos en la capa de base de datos.

## 4.3 Vista Procesos

- Dirigida a: Integradores
- Propósito: Abordar aspectos dinámicos: concurrencia, distribución, escalabilidad, disponibilidad y rendimiento
- Diagrama: Actividad

### 4.3.1 Diagrama Actividades Autenticacion

![actividadesCDU1.1](./imgs/vista41/vistaProcesos/ActividadesCDU1.1.png)


### 4.3.2 Diagrama Actividades Registro de Datos

![actividadesCDU1.2](./imgs/vista41/vistaProcesos/ActividadesCDU1.2.png)

### 4.3.3 Diagrama Actividades Consulta de Cursos Asignados

![actividadesCDU2.1](./imgs/vista41/vistaProcesos/ActividadesCDU2.1.png)

### 4.3.3 Diagrama Actividades Comprobar Rol

![actividadesCDU2.1](./imgs/vista41/vistaProcesos/ActividadesCDU2.4.png)

### 4.3.4 Diagrama Actividades Consulta Datos Academicos

![actividadesCDU2.5](./imgs/vista41/vistaProcesos/ActividadesCDU2.5.png)

### 4.3.4 Diagrama Actividades Consulta de Usuarios

![actividadesCDU2.5](./imgs/vista41/vistaProcesos/ActividadesCDU2.6.png)

### 4.3.4 Diagrama Actividades Cambio de Rol

![actividadesCDU2.5](./imgs/vista41/vistaProcesos/ActividadesCDU2.7.png)

### 4.3.4 Diagrama Actividades Consulta de Inscripciones

![actividadesCDU2.5](./imgs/vista41/vistaProcesos/ActividadesCDU2.8.png)

### 4.3.5 Diagrama Actividades Consulta Clases Grabadas

![actividadesCDU3.1](./imgs/vista41/vistaProcesos/ActividadesCDU3.1.png)

### 4.3.6 Diagrama Actividades Ver Detalle Clases Grabadas

![actividadesCDU3.3](./imgs/vista41/vistaProcesos/ActividadesCDU3.4.png)

### 4.3.6 Diagrama Actividades Consulta de Clases

![actividadesCDU3.3](./imgs/vista41/vistaProcesos/ActividadesCDU3.6.png)

### 4.3.6 Diagrama Actividades Crear nueva clase

![actividadesCDU3.3](./imgs/vista41/vistaProcesos/ActividadesCDU3.7.png)

### 4.3.7 Diagrama Actividades Calificacion de Clases Grabadas

![actividadesCDU4.1](./imgs/vista41/vistaProcesos/ActividadesCDU4.1.png)

### 4.3.8 Diagrama Actividades Consulta Clases Mas Vistas

![actividadesCDU4.4](./imgs/vista41/vistaProcesos/ActividadesCDU4.3.png)

Descripcion: Muestra el flujo de trabajo operacional y la lógica procedimental de los diferentes casos de uso de la plataforma mediante bifurcaciones, decisiones y uniones. Permite visualizar visualmente el camino que sigue el usuario como la autenticacion,  reproducir contenido, calificar contenido, ver historial, entre otros.

## 4.4 Vista Despliegue

- Dirigida a: Programadores y Gestión del software
- Propósito: Organización de los módulos de código, librerías compartidas, interfaces expuestas y dependencias
- Diagramas: Componentes

### Diagrama componentes

![diagramaComponentes](./imgs/vista41/vistaDespliegue/diagramaComponentes.png)


Descripcion: Ilustra la organización macro y las dependencias de alto nivel del proyecto, dividiéndolo en tres grandes capas: Frontend, Backend, y la Capa DB. Define claramente las fronteras arquitectónicas.

## 4.5 Vista Fisica

- Dirigida a: Ingenieros de Sistemas
- Propósito: Mapear los componentes a la infraestructura física o de nube
- Diagrama: Despliegue

### Diagrama Componentes Develop

![diagramaDespliegue](./imgs/vista41/vistaFisica/diagramaDespliegue.png)

Descripcion: Muestra la arquitectura física del sistema, mapeando el software a nodo de hardware para el Frontend, el Backend y la Capa DB. Detalla el uso de contenedores Docker individuales para garantizar el aislamiento de cada servicio.

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


## 5.2 Entidad Relacion Actividades

![ER2](./imgs/ER/ER2.png)

| Tipo               | Objeto                           | Propósito                                                                    |
| ------------------ | -------------------------------- | ---------------------------------------------------------------------------- 
| Vista              | `vw_audit_logs_paginados`              | Facilita la auditoria de los logs                    |
| Trigger            | `trg_auditoria_actividades`      | Auditar INSERT, UPDATE y DELETE sobre actividades.                         |
| Trigger            | `trg_auditoria_ponente`      | Auditar cambios en los ponentes.                                |
| Trigger            | `trg_auditoria_prerequisitos`      | Auditar cambios en los ponentes.                                |
| Función de Trigger | `fn_auditar_cambios`             | Registrar automáticamente las modificaciones en audit_logs.                  |

## 5.4 Entidad Relacion Certificacion

![ER4](./imgs/ER/ER4.png)

| Tipo               | Objeto                        | Propósito                                                                           |
| ------------------ | ----------------------------- | ----------------------------------------------------------------------------------- |
| Vista              | `vw_audit_logs_paginados`              | Facilita la auditoria de los logs                    |
| Trigger            | `trg_auditoria_certificado` | Auditar INSERT, UPDATE y DELETE sobre `certificado`.                      |
| Trigger            | `trg_auditoria_resultado`  | Auditar INSERT, UPDATE y DELETE sobre `resultado`.                         |
| Trigger            | `trg_auditoria_examen_acreditacion`  | Auditar INSERT, UPDATE y DELETE sobre `examen_acreditacion`.                         |
| Trigger            | `trg_auditoria_preguntas`  | Auditar INSERT, UPDATE y DELETE sobre `preguntas`.                         |
| Función de Trigger | `fn_auditar_cambios`          | Registrar automáticamente los cambios en `audit_logs`.                              |

# 6. Disenio UI/UX

## 6.1 Mockup Catalogo

![mockupAutenticacion](./imgs/mockups/mockupCatalogo.png)

## 6.2 Mockup Actividad Academica

![mockupCatalogo](./imgs/mockups/mockupCurso.png)

## 6.3 Mockup Verificar

![mockupReproductor](./imgs/mockups/mockupVerificar.png)

## 6.4 Mockup Administracion

![mockupAsignaciones](./imgs/mockups/mockupAdmin.png)

# 7. Flujo CI/CD

## Diagrama de Flujo

## Imagenes Creadas por CI

### Registry del Repositorio 

https://github.com/HeinzGomez?tab=packages&repo_name=SA_PRACTICA_199819617

# 8. Arquitectura implementada

### Matriz de Decisiones Técnicas (Qué, Por qué y Para qué)

| Decisión técnica | Qué | Por qué | Para qué |
|---|---|---|---|
| **Arquitectura Orientada a Servicios (SOA)** | Patrón SOA con un bus de servicios (ESB) implementado sobre un Message Broker y **4 servicios independientes**: Autenticación, Talleres/Actividades, Reservas y Certificaciones. Cada servicio expone contratos gRPC, tiene su propia base de datos (*Database per Microservice*) y un API Gateway fronta el acceso externo con JWT. | El sistema atiende **inscripciones en ráfaga** con cupos estrictamente limitados, donde miles de estudiantes piden lugar al mismo tiempo; eso no puede resolverse con peticiones bloqueantes sobre una aplicación monolítica. Además, el dominio de reserva es crítico y de carga variable, mientras que el catálogo y la verificación de diplomas son estables: juntarlos obligaría a escalar todo el sistema por el pico de las reservas. | Escalar **solo** el servicio de reservas y sus consumidores durante la ráfaga sin tocar los demás, y aislar los fallos: una sobrecarga en la reserva no apaga el catálogo ni el portal de verificación de diplomas (tolerancia a fallos y alta disponibilidad), además de permitir que cada servicio evolucione y se despliegue por separado. |
| **RabbitMQ como Message Broker** | Broker de mensajes que materializa el ESB: exchange tipo `topic` llamado `academix.events`, colas durables (`reservas.solicitudes`, `talleres.cupos`, `certificados.inscripciones`) y *Dead Letter Queue* (`reservas.solicitudes.dlq`) para mensajes que no se pudieron procesar. | Se evaluó **RabbitMQ vs Apache Kafka**. Kafka es un log distribuido pensado para *streaming* con alta retención y réplicas: exige planificar particiones, consumidores *rebalanceados* y offsets, complejidad que se paga solo si se necesita reproducir históricos de eventos a gran escala (analítica). RabbitMQ ofrece justo lo que exige este flujo: enrutamiento por *routing key*, entrega a un consumidor determinado, colas durables con confirmaciones (`ack`/`nack`), *dead-letter* y TTL nativos, todo en una pieza más simple de operar en este tamaño de despliegue. | **Desacoplar productor de consumidores** y absorber el pico sin perder mensajes: el Gateway responde **202 Accepted** de inmediato sin esperar el cupo, los workers de reservas consumen la cola a su ritmo ejecutando el descuento atómico, y Talleres y Certificados se enteran del resultado por el evento `reserva.confirmada` sin bloquear ni acoplarse entre sí (procesamiento asíncrono, reintentos seguros y trazabilidad de mensajes fallidos). |
| **Vercel para el Frontend** | Plataforma *serverless* donde se despliega la aplicación **Next.js 15**, conectada al repositorio de GitHub, con modo *mock* por defecto y `NEXT_PUBLIC_API_URL` para apuntar a un backend real. | El enunciado exige un frontend **desplegado y evaluado públicamente en la nube** con un framework moderno. Vercel es la plataforma nativa de Next.js: requiere cero configuración de servidor, aplica el *build* automático, incluye SSL, CDN global y *edge network*, y ahorra administrar infraestructura para un solo componente estático. | Tener una **URL pública estable** para la evaluación, generar un entorno de *preview* aislado por cada Pull Request y publicar producción con cada *push* a `main` sin romper lo que ya está en línea; y servir la interfaz con baja latencia desde cualquier ubicación, permitiendo migrar del modo *mock* a un backend real solo cambiando una variable de entorno. |
| Terraform para el aprovisionamiento de la infraestructura | Herramienta de Infraestructura como Codigo declarativa. Todo lo que sostiene el sistema está escrito en código: una VPC, tres subredes (desarrollo, base de datos y producción K3s), seis reglas de firewall, tres direcciones IP estáticas, tres instancias de Compute Engine y dos registros DNS. El estado de esos recursos queda guardado y cada ejecución empieza con un plan que muestra el cambio antes de aplicarlo. | Se comparó contra CloudFormation y contra scripts manuales con gcloud. CloudFormation solo entiende recursos de AWS y este laboratorio corre sobre Google Cloud, lo que obligaría a mantener dos proveedores o migrar todo; además Terraform es multicloud, por lo que la misma plantilla sigue sirviendo si el proveedor cambia. Un script gcloud es imperativo: describe pasos, no un estado deseado, así que si alguien modifica un recurso desde la consola el script no lo detecta y al re-ejecutarlo simplemente repite comandos sin corregir nada; Terraform en cambio compara el estado real con el declarado y solo modifica lo que difiere, dejando además un registro de qué cambió y cuándo. | Reproducir la infraestructura desde cero: si la red se borra o hace falta un ambiente de pruebas idéntico, se reconstruye con un solo comando. El plan previo permite revisar qué se va a crear o destruir antes de tocar producción, y el estado compartido evita que dos personas ejecuten la misma operación al mismo tiempo. |
| Ansible para la configuración del sistema operativo | Herramienta de orquestación que lleva una VM recién creada al estado deseado ejecutando playbooks por SSH, sin instalar agente en la máquina. Los plays cubren la base (repositorios, utilitarios y endurecimiento de SSH), Docker, K3s, el controlador ingress con cert-manager, la carpeta de aplicación con su archivo de entorno y PostgreSQL, aplicándose a cada VM según su grupo en el inventario. | Se evaluó resolverlo con Dockerfiles. Un Dockerfile empaqueta una aplicación y sus dependencias dentro de una imagen, pero no puede configurar la máquina que lo va a ejecutar: necesita Docker instalado, que es exactamente lo que pretende provisionar, y no alcanza tareas que viven fuera del contenedor, como endurecer SSH, desactivar swap, registrar usuarios en el grupo docker, instalar k3s como servicio del sistema o crear la estructura de carpetas con sus permisos. Ansible es declarativo e idempotente: cada tarea declara un estado y al volver a ejecutarse comprueba si ya se cumple, de modo que el juego completo de playbooks se puede correr en cada despliegue sin romper lo que ya funciona, mientras que con una imagen hay que reconstruirla y redesplegarla para cualquier cambio de configuración. El mismo conjunto de playbooks atiende las tres máquinas limitando por grupo, sin repetir lógica para cada una. | Dejar el aprovisionamiento completo en un comando reproducible y auditable, separando tres capas con responsabilidades distintas: Terraform crea la máquina, Ansible configura su sistema operativo y los Dockerfiles empaquetan la aplicación que corre dentro. |

### Diagrama Arquitectura de Red en la nube

![diagramaRed](./imgs/red/diagramaRed.png)

### Diagrama Flujo del aprovisionamiento

![diagramaAprovisionamiento](./imgs/aprovisionamiento/diagramaAprovisionamiento.png)

# 9. Matriz SOLID: Separación entre Productores y Consumidores

El sistema implementa una arquitectura basada en eventos utilizando RabbitMQ para garantizar la separación de responsabilidades, alineándose con los principios SOLID. A continuación, se detalla cómo los microservicios actúan como Productores y Consumidores de manera desacoplada:

| Principio SOLID | Implementación en el Sistema (Productor / Consumidor) | Beneficio Arquitectónico | Ejemplo Concreto en el Código |
| --- | --- | --- | --- |
| **S** | reservas-service gestiona únicamente la lógica de reservas. No se encarga de generar inscripciones ni actualizar el catálogo. Solo actúa como Productor publicando el evento reserva.confirmada. | Cada servicio tiene una única razón para cambiar. Los dominios críticos están altamente aislados. | En reservas-service/internal/broker/rabbit.go, el broker publica al exchange academix.events al concretar la reserva. |
| **O** | El sistema está abierto a extensión pero cerrado a modificación. | Se pueden agregar funcionalidades asíncronas sin alterar el flujo principal de reservas ni requerir redespliegues del productor. | Tanto certificados-service como talleres-service actúan como Consumidores escuchando la routing key reserva.confirmada. |
| **L** | El servicio de reservas puede operar indistintamente con cualquier implementación del publicador de eventos siempre que respete el contrato de la interfaz, sin alterar la lógica de negocio. | Facilita el testing y garantiza que el comportamiento del productor sea predecible. | En reservas-service/internal/service/reservas.go, la estructura ReservasService recibe cualquier objeto que implemente la interfaz Publisher, permitiendo inyectar un Mock durante las pruebas. |
| **I** | En lugar de tener una interfaz monolítica que obligue a implementar métodos de consumo y publicación a la vez, las responsabilidades están segregadas. | El caso de uso central de reservas no es forzado a depender de métodos de consumo que no utiliza. | En reservas-service/internal/service/reservas.go, la interfaz Publisher define únicamente el método Publicar(ctx, routingKey, msg), que es lo único que el servicio necesita. |
| **D** | Los consumidores certificados-service y el productor reservas-service no dependen de implementaciones concretas entre sí. Ambos dependen de una abstracción: el Exchange AMQP y el JSON. | Se evitan llamadas síncronas entre microservicios, previniendo el fuerte acoplamiento y permitiendo absorber picos de tráfico. | En certificados-service/app/consumer.py, el consumidor invoca a svc.registrar_inscripcion(json.loads(body)), desconociendo por completo al productor del evento. |

# 10. Conclusiones

### Logros alcanzados

Se implementó de extremo a extremo el sistema satélite YOUSAC Academix Pass & CertiHub: un catálogo de eventos con cupo en tiempo real, un proceso de reserva con emisión de ticket, un examen de certificación y la emisión/verificación pública de diplomas digitales firmados. La solución quedó conformada por un API Gateway y 4 servicios independientes (Autenticación, Talleres/Actividades, Reservas y Certificaciones), comunicados entre sí por  por un Message Broker (RabbitMQ).

### Validación de las decisiones de la matriz

- SOA: La decisión se justificó porque el pico de carga se confinó al dominio de reservas: mientras el servicio de reservas y sus consumidores absorben la ráfaga, el catálogo y el portal de verificación de diplomas siguen respondiendo.
- RabbitMQ:  La cola durable absorbe los mensajes que aún no se procesan, la DLQ captura los mensajes defectuosos en lugar de perderlos y el evento reserva.confirmada alimenta a dos consumidores distintos (Talleres y Certificados) sin que ellos se conozcan entre sí.
- Vercel: el objetivo de una URL pública estable y evaluada en la nube se cumplió, además de obtener despliegues de producción con cada push a main y develop, sin administrar servidores para el componente de interfaz.


