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
# base de datos del entorno de producción, conectándose por el DNS público
# academxdb.yo-usac.com (tráfico que entra por la IP pública), por eso el origen
# se deja en 0.0.0.0/0 (ver allowed_db_cidrs). Autenticación por contraseña.
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
