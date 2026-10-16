# Informe Técnico — Práctica 10

**Observabilidad, Monitoreo y Despliegue en Clúster**
Plataforma Academix Pass & CertiHub — Proyecto Fase 3.

Universidad de San Carlos de Guatemala
Facultad de Ingeniería
Escuela de Ciencias y Sistemas

> Responsable: Heinz Gómez — Carné 199819617

---

## Índice

- [Informe Técnico — Práctica 10](#informe-técnico--práctica-10)
  - [Índice](#índice)
  - [1. Introducción](#1-introducción)
  - [2. Requerimientos nuevos](#2-requerimientos-nuevos)
    - [2.1 Requerimientos funcionales nuevos](#21-requerimientos-funcionales-nuevos)
    - [2.2 Requerimientos no funcionales nuevos](#22-requerimientos-no-funcionales-nuevos)
  - [3. CDUs nuevos](#3-cdus-nuevos)
  - [4. VISTA 4+1](#4-vista-41)
    - [4.1 Diagramas de secuencia](#41-diagramas-de-secuencia)
    - [4.2 Diagramas de actividades](#42-diagramas-de-actividades)
    - [4.3 Diagramas de componentes](#43-diagramas-de-componentes)
    - [4.4 Diagramas de despliegue](#44-diagramas-de-despliegue)
  - [5. Matriz de decisiones técnicas](#5-matriz-de-decisiones-técnicas)
    - [5.1 Prometheus y Grafana para la observabilidad](#51-prometheus-y-grafana-para-la-observabilidad)
    - [5.2 Kubernetes con K3s como plataforma de despliegue](#52-kubernetes-con-k3s-como-plataforma-de-despliegue)
    - [5.3 Doble entorno: Docker Compose (develop) y K3s (producción)](#53-doble-entorno-docker-compose-develop-y-k3s-producción)
  - [6. Conclusiones](#6-conclusiones)

---

## 1. Introducción

Esta práctica añade al sistema Academix Pass & CertiHub las tres capas que faltaban para operarlo como un producto real: observabilidad por servicio, monitoreo del conjunto y un despliegue con semántica de producción.

La observabilidad se incorporó a los cinco servicios backend de forma uniforme. Cada uno emite logs estructurados en JSON (pino en Node, winston en Python, log estándar con campos clave en Go), expone un liveness en `/health` y un readiness en `/health/ready` que comprueba sus dependencias (PostgreSQL, Redis y el broker), y publica métricas en formato Prometheus en `/metrics`. Las claves y contraseñas se redactan de los logs y las métricas llevan nombres y etiquetas comunes (`academix_rpc_calls_total`, `academix_worker_messages_total`, entre otras) para que un único tablero pueda observar servicios escritos en tres lenguajes distintos.

El monitoreo del conjunto se resolvió con Prometheus y Grafana, más cadvisor y node-exporter para la capa de infraestructura. Prometheus raspa cada `/metrics` y el endpoint de métricas de RabbitMQ (`/metrics/per-object`, que agrega las etiquetas `queue=` y `vhost=`), guarda 15 días de histórico y evalúa reglas de alerta básicas. Grafana aprovisiona dos tableros —Infraestructura y Métricas de Negocio y Colas— desde archivos versionados en el repositorio, de modo que el tablero es parte del código y no un estado oculto en la base de datos de Grafana.

El despliegue de producción se resolvió con un clúster K3s de un nodo sobre la VM `vm-production-k3s` aprovisionada en la práctica anterior. Los manifiestos viven en la carpeta `k3s/`, organizados por kind (deployments, services, configmaps, secrets, namespaces, ingress y monitoring), y cubren el backend completo: gateway, los cuatro servicios, RabbitMQ y Redis con sus volúmenes persistentes, y el stack de monitoreo. El tráfico externo entra por ingress-nginx (instalado con Helm y `hostNetwork`) y TLS lo emite cert-manager con Let's Encrypt. El frontend corre en Vercel y la base de datos en una VM dedicada; el único punto de entrada del clúster es el api-gateway, publicado por un Ingress con host.

Finalmente, el frontend incorporó un simulador de inscripción en ráfaga que dispara solicitudes reales contra el gateway: crea usuarios de prueba en paralelo y luego lanza la ráfaga de reservas con un token por estudiante, lo que permite demostrar en vivo cómo la cola absorbe el pico y cómo los workers lo drenan sin sobreventa, observándolo todo en los tableros de Grafana.

---

## 2. Requerimientos nuevos

### 2.1 Requerimientos funcionales nuevos

*(Sección de estructura: los requerimientos funcionales nuevos se agregan en la entrega final.)*

### 2.2 Requerimientos no funcionales nuevos

*(Sección de estructura: los requerimientos no funcionales nuevos se agregan en la entrega final.)*

---

## 3. CDUs nuevos

*(Sección de estructura: los casos de uso nuevos se agregan en la entrega final.)*

---

## 4. VISTA 4+1

### 4.1 Diagramas de secuencia

*(Sección de estructura: los diagramas de secuencia se agregan en la entrega final.)*

### 4.2 Diagramas de actividades

*(Sección de estructura: los diagramas de actividades se agregan en la entrega final.)*

### 4.3 Diagramas de componentes

*(Sección de estructura: los diagramas de componentes se agregan en la entrega final.)*

### 4.4 Diagramas de despliegue

*(Sección de estructura: los diagramas de despliegue se agregan en la entrega final.)*

---

## 5. Matriz de decisiones técnicas

### 5.1 Prometheus y Grafana para la observabilidad

| Decisión técnica | Qué | Por qué | Para qué |
|---|---|---|---|
| Prometheus para la recolección de métricas y Grafana para los tableros | Prometheus es una base de datos de series temporales y un motor de raspa (scrape): cada servicio expone sus métricas en formato de texto Prometheus sobre `/metrics` y el servidor las consulta cada 15 segundos, guarda 15 días de histórico y evalúa reglas de alerta. Grafana se conecta a Prometheus como datasource y aprovisiona los tableros desde archivos JSON versionados en el repositorio (carpeta `monitoring/`, migrada a ConfigMaps en `k3s/monitoring/`). El conjunto completo incluye cadvisor y node-exporter como DaemonSets para las métricas de contenedores y del nodo. | Se evaluaron tres alternativas. Los logs por sí solos no responden preguntas de estado ni de tendencia: "¿cuánta cola hay ahorita?", "¿en qué momento empezó a caer el gateway?" o "¿cuánto consumo de memoria lleva el worker?" solo se contestan con métricas históricas. Un stack ELK (Elasticsearch, Logstash, Kibana) habría unificado logs y métricas, pero pesa varias veces más en RAM (mínimo 4 GB solo para Elasticsearch) y su curva de configuración excede el alcance de un laboratorio. Los APM gestionados (Datadog, New Relic) resuelven el problema con cero operación, pero son de pago y envían los datos del sistema a un tercero, lo que contradice el objetivo de tener la plataforma bajo control propio. Prometheus es el estándar de facto en el ecosistema Kubernetes, ligero (un binario, sin dependencias externas), y su formato de métricas es el mismo que ya exponían prom-client (Node), prometheus_client (Python) y client_golang (Go); Grafana se integra con él de forma nativa. | Responder en la demo, en vivo y sin acceso a la terminal de los servidores, dos preguntas: ¿la ráfaga de inscripciones se está drenando? (tablero "Métricas de Negocio y Colas": longitud de `reservas.solicitudes`, tasa de procesamiento de los workers, métricas RPC por operación y estado) y ¿la infraestructura lo está soportando? (tablero "Infraestructura": CPU, memoria y red por contenedor y por nodo). Además, con 15 días de histórico y las alertas `TargetDown`, `ColaSaturada` y `MemoriaContenedorAlta` queda material para diagnosticar un incidente ocurrido horas o días atrás, no solo uno en curso. |

### 5.2 Kubernetes con K3s como plataforma de despliegue

| Decisión técnica | Qué | Por qué | Para qué |
|---|---|---|---|
| K3s como clúster Kubernetes de un nodo para el entorno de producción | K3s es una distribución de Kubernetes empaquetada en un binario único, sin componentes innecesarios, que corre como servicio del sistema en la VM `vm-production-k3s`. Sobre él se despliega el backend completo con manifiestos estándar de Kubernetes (`k3s/`: deployments, services, configmaps, secrets, PVCs e ingress): cada servicio tiene sus probes de liveness y readiness, estrategia RollingUpdate sin caída (`maxUnavailable: 0`), límites de recursos ajustados a la VM de 8 GB, y tráfico externo vía ingress-nginx con TLS de cert-manager. | Se compararon cuatro opciones. Docker Compose en la VM de producción habría sido la continuación más directa del entorno de desarrollo, pero no ofrece orquestación: no reinicia un contenedor que muere, no tiene probes (el gateway seguiría recibiendo tráfico con el broker caído), no hace actualizaciones sin ventana de caída, no separa configuración de secretos a nivel de plataforma y no escala un servicio sin reescribir el archivo. Docker Swarm resuelve parte de eso, pero su ecosistema prácticamente se detuvo en 2017 y todo lo que se construya sobre él (ingress, cert-manager, dashboards) queda fuera del camino estándar de la industria. Un clúster GKE gestionado eliminaría el trabajo de operar el plano de control, pero introduce costo fijo mensual y una superficie de configuración que no aporta nada a un nodo único de laboratorio. K3s entrega la semántica completa de Kubernetes (los mismos manifiests, la misma API, el mismo `kubectl`) en un binario de menos de 100 MB que instala Ansible en un minuto y convive sin fricción en una VM de 8 GB. Al usar manifiestos estándar, lo que corre en K3s es idéntico a lo que correría en GKE, EKS o AKS: la migración a un clúster gestionado futuro sería un cambio de plataforma, no de código. | Operar el backend con las garantías que la demo necesita: si un worker muere, Kubernetes lo reinicia solo; si una actualización falla, el rollout se detiene antes de sacrificar las réplicas sanas; el tráfico no llega a un pod cuyo readiness reporta que la base de datos no responde; los secretos (JWT, contraseñas, semilla de firma) no viven incrustados en los manifiestos sino en objetos Secret; y la absorción de la ráfaga puede escalar horizontalmente con un `kubectl scale` sobre el deployment de reservas en lugar de levantar procesos a mano. |

### 5.3 Doble entorno: Docker Compose (develop) y K3s (producción)

| Decisión técnica | Qué | Por qué | Para qué |
|---|---|---|---|
| Dos entornos con la misma aplicación empaquetada: Docker Compose para desarrollo y K3s para producción | El entorno de desarrollo (develop) es el `docker-compose.yml` de la raíz, que levanta todo en una sola máquina (vm-development): cuatro bases de datos y middleware, cinco servicios, frontend, y el stack de observabilidad, con datos en volúmenes locales y URLs apuntando a `localhost`. El entorno de producción es el clúster K3s de la sección anterior, con el backend desplegado en pods, la base de datos en una VM externa, el frontend en Vercel y el tráfico entrando por ingress-nginx. Ambos entornos consumen las mismas imágenes publicadas en ghcr.io por el pipeline de CI: ni el compose ni los manifiestos K3s compilan código. | Se consideró un solo entorno. Quedarse solo con Compose habría ahorrado los manifiestos, pero la práctica anterior ya aprobó una VM de producción con K3s y el objetivo explícito es desplegar ahí; además Compose no puede demostrar la orquestación (probes, rolling updates, auto-sanación) que es justamente lo nuevo. Ir directo a K3s para todo, incluido el día a día del desarrollo, habría castigado la iteración: cada cambio de una línea en el gateway requeriría reconstruir la imagen, subirla al registro y aplicar un rollout, cuando en compose basta con `docker compose up --build` y ver el resultado en segundos. La dualidad no duplica esfuerzo porque la unidad de despliegue es la misma imagen: el pipeline publica `ghcr.io/ramirotelles/academix-<servicio>:<tag>` y el compose la consume con `image:` igual que los deployments de Kubernetes. Lo único que difiere entre entornos es la dirección (localhost vs DNS de servicios) y la persistencia (volumenes locales vs PVCs), no el código. | Poder desarrollar y probar en segundos sobre vm-development (arranque completo en menos de un minuto, iteración sin clúster), mientras se mantiene un entorno con semántica de producción para la demo final y para cualquier prueba que dependa del comportamiento real de Kubernetes: el simulador de ráfaga, por ejemplo, funciona idéntico contra ambos entornos porque solo necesita la URL del api-gateway. La separación también acota el riesgo: un `docker compose down -v` en desarrollo destruye datos de prueba sin tocar nada del clúster, y un error en los manifiestos de K3s no afecta el entorno en el que se programa. |

---

## 6. Conclusiones

La observabilidad de la plataforma dejó de ser una capa improvisada para convertirse en un contrato entre los servicios: los cinco backend emiten logs estructurados en JSON con redacción de secretos, responden liveness y readiness con el mismo esquema (`/health` y `/health/ready`), y publican métricas con nombres y etiquetas comunes bajo el prefijo `academix_`. Que los servicios estén escritos en Node, Python y Go dejó de importar para el monitoreo: el formato de exposición de Prometheus es el mismo en los tres, y un único tablero observa por igual el RPC del gateway, la cola de reservas y la firma de certificados.

Prometheus y Grafana demostraron ser la combinación adecuada para la escala del proyecto. El costo operativo es mínimo (dos contenedores y dos DaemonSets) y a cambio la demo puede mostrar en vivo lo que antes solo se podía afirmar: la ráfaga golpea el gateway, la cola `reservas.solicitudes` crece, los workers la drenan a su ritmo y el cupo nunca se sobrepasa, todo trazable en los tableros versionados con el código. Las alertas básicas y el histórico de 15 días cierran el ciclo: no solo se observa el presente del sistema, se conserva su pasado reciente para diagnosticar lo que no se vio venir.

K3s y el desplegado en `k3s/` completan el salto de un montaje de laboratorio a una plataforma operable. Los manifiestos tradujeron las decisiones de la práctica anterior —una VM con su red y sus firewall— en objetos de Kubernetes con responsabilidades claras: cada servicio con sus probes y sus límites de recursos, los datos persistentes en PVCs, los secretos fuera de los manifiestos y el tráfico entrando por un único Ingress con TLS emitido automáticamente. Mantener el doble entorno (Compose para desarrollar, K3s para operar) sin duplicar esfuerzo, apoyado en las mismas imágenes del registro, es lo que permite que la iteración diaria siga siendo rápida sin sacrificar la fidelidad del entorno que se demuestra.
