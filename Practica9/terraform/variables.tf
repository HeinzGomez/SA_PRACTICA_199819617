variable "project_id" {
  description = "ID del proyecto de Google Cloud donde se aprovisiona la infraestructura."
  type        = string
}

variable "region" {
  description = "Región de GCP para la VPC, las subredes y las IPs reservadas."
  type        = string
  default     = "us-central1"
}

variable "zone" {
  description = "Zona de GCP donde se crean las tres instancias."
  type        = string
  default     = "us-central1-a"
}

variable "enable_apis" {
  description = "Activa las APIs de Compute Engine y Cloud DNS en el proyecto."
  type        = bool
  default     = true
}

variable "network_name" {
  description = "Nombre de la red VPC privada del entorno."
  type        = string
  default     = "academix-network"
}

variable "subnet_desarrollo_cidr" {
  description = "Bloque CIDR de la subred dedicada a vm-development."
  type        = string
  default     = "10.10.1.0/24"
}

variable "subnet_k3s_cidr" {
  description = "Bloque CIDR de la subred dedicada a vm-production-k3s."
  type        = string
  default     = "10.10.2.0/24"
}

variable "subnet_base_de_datos_cidr" {
  description = "Bloque CIDR de la subred dedicada a vm-database."
  type        = string
  default     = "10.10.3.0/24"
}

variable "rango_interno" {
  description = "Rango total de la VPC que las VMs pueden usar para conversar entre sí."
  type        = string
  default     = "10.10.0.0/16"
}

variable "allowed_ssh_cidrs" {
  description = "Orígenes permitidos para SSH (22). Restringir a la IP de la máquina de administración."
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

variable "allowed_http_cidrs" {
  description = "Orígenes permitidos para HTTP (80) y HTTPS (443)."
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

variable "allowed_k3s_api_cidrs" {
  description = "Orígenes permitidos para la API de K3s (6443)."
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

variable "telemetry_ports" {
  description = "Puertos TCP de telemetría (Prometheus, Grafana, node-exporter)."
  type        = list(string)
  default     = ["3000", "9090", "9100"]
}

variable "telemetry_cidrs" {
  description = "Orígenes permitidos para los puertos de telemetría."
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

variable "machine_type_desarrollo" {
  description = "Tipo de instancia de vm-development (entorno Docker Compose)."
  type        = string
  default     = "e2-medium"
}

variable "machine_type_k3s" {
  description = "Tipo de instancia de vm-production-k3s (clúster K3s + backends)."
  type        = string
  default     = "e2-standard-2"
}

variable "machine_type_base_de_datos" {
  description = "Tipo de instancia de vm-database (PostgreSQL)."
  type        = string
  default     = "e2-medium"
}

variable "disk_size_desarrollo" {
  description = "Tamaño del disco de arranque de vm-development en GB."
  type        = number
  default     = 10
}

variable "disk_size_k3s" {
  description = "Tamaño del disco de arranque de vm-production-k3s en GB."
  type        = number
  default     = 25
}

variable "disk_size_base_de_datos" {
  description = "Tamaño del disco de arranque de vm-database en GB."
  type        = number
  default     = 15
}

variable "disk_type" {
  description = "Tipo de disco persistente para las tres instancias."
  type        = string
  default     = "pd-balanced"
}

variable "os_image" {
  description = "Imagen base de sistema operativo usada por las tres instancias."
  type        = string
  default     = "ubuntu-os-cloud/ubuntu-2204-lts"
}

variable "ssh_user" {
  description = "Usuario creado por la imagen y usado por el inventario de Ansible."
  type        = string
  default     = "ubuntu"
}

variable "ssh_public_key_path" {
  description = "Ruta de la clave pública que se inyecta en las VMs para el acceso de Ansible."
  type        = string
  default     = "~/.ssh/academix_lab.pub"
}

variable "dns_zone_name" {
  description = "Nombre del recurso de la zona de Cloud DNS ya existente que contiene yo-usac.com (no es el dominio)."
  type        = string
  default     = "yo-usac-com"
}

variable "create_dns_records" {
  description = "Crea los registros A del dominio contra la zona existente."
  type        = bool
  default     = true
}

variable "hostname_desarrollo" {
  description = "Etiqueta de subdominio que apunta a la IP pública de vm-development."
  type        = string
  default     = "academixdev"
}

variable "hostname_k3s" {
  description = "Etiqueta de subdominio que apunta a la IP pública de vm-production-k3s."
  type        = string
  default     = "academixk3s"
}

variable "dns_ttl" {
  description = "TTL de los registros A en segundos (bajo para sobrevivir un destroy/apply en vivo)."
  type        = number
  default     = 60
}

variable "labels" {
  description = "Etiquetas aplicadas a todas las instancias y a las IPs reservadas."
  type        = map(string)
  default = {
    proyecto   = "academix"
    practica   = "9"
    gestionado = "terraform"
  }
}
