resource "google_compute_network" "academix" {
  name                    = var.network_name
  auto_create_subnetworks = false
  routing_mode            = "REGIONAL"

  depends_on = [google_project_service.apis]
}

resource "google_compute_subnetwork" "desarrollo" {
  name                     = "${var.network_name}-desarrollo"
  region                   = var.region
  network                  = google_compute_network.academix.self_link
  ip_cidr_range            = var.subnet_desarrollo_cidr
  private_ip_google_access = true
}

resource "google_compute_subnetwork" "k3s" {
  name                     = "${var.network_name}-k3s"
  region                   = var.region
  network                  = google_compute_network.academix.self_link
  ip_cidr_range            = var.subnet_k3s_cidr
  private_ip_google_access = true
}

resource "google_compute_subnetwork" "base_de_datos" {
  name                     = "${var.network_name}-base-de-datos"
  region                   = var.region
  network                  = google_compute_network.academix.self_link
  ip_cidr_range            = var.subnet_base_de_datos_cidr
  private_ip_google_access = true
}
