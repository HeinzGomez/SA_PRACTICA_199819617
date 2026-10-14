resource "google_compute_firewall" "interno" {
  name      = "${var.network_name}-allow-internal"
  network   = google_compute_network.academix.name
  direction = "INGRESS"
  priority  = 1000

  allow {
    protocol = "tcp"
  }
  allow {
    protocol = "udp"
  }
  allow {
    protocol = "icmp"
  }

  source_ranges = [var.rango_interno]
  target_tags   = local.etiquetas_comunes
}

resource "google_compute_firewall" "ssh" {
  name      = "${var.network_name}-allow-ssh"
  network   = google_compute_network.academix.name
  direction = "INGRESS"
  priority  = 1000

  allow {
    protocol = "tcp"
    ports    = ["22"]
  }

  source_ranges = var.allowed_ssh_cidrs
  target_tags   = local.etiquetas_comunes
}

resource "google_compute_firewall" "web" {
  name      = "${var.network_name}-allow-http-https"
  network   = google_compute_network.academix.name
  direction = "INGRESS"
  priority  = 1000

  allow {
    protocol = "tcp"
    ports    = ["80", "443"]
  }

  source_ranges = var.allowed_http_cidrs
  target_tags   = ["web"]
}

resource "google_compute_firewall" "k3s_api" {
  name      = "${var.network_name}-allow-k3s-api"
  network   = google_compute_network.academix.name
  direction = "INGRESS"
  priority  = 1000

  allow {
    protocol = "tcp"
    ports    = ["6443"]
  }

  source_ranges = var.allowed_k3s_api_cidrs
  target_tags   = ["k3s"]
}

# PostgreSQL (5432) en vm-database: el backend de K3s (10.10.2.x) lo usa como
# base de datos del entorno de producción. Solo dentro de la VPC.
# Nota: la regla "interno" ya permite todo el tráfico 10.10.0.0/16 al tag
# "academix", así que esta regla es la que documenta la intención y acota a
# un único puerto en lugar de "todos".
resource "google_compute_firewall" "postgres" {
  name      = "${var.network_name}-allow-postgres"
  network   = google_compute_network.academix.name
  direction = "INGRESS"
  priority  = 1000

  allow {
    protocol = "tcp"
    ports    = ["5432"]
  }

  source_ranges = var.allowed_db_cidrs
  target_tags   = ["database"]
}

resource "google_compute_firewall" "telemetria" {
  name      = "${var.network_name}-allow-telemetry"
  network   = google_compute_network.academix.name
  direction = "INGRESS"
  priority  = 1000

  allow {
    protocol = "tcp"
    ports    = var.telemetry_ports
  }

  source_ranges = var.telemetry_cidrs
  target_tags   = local.etiquetas_comunes
}
