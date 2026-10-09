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
