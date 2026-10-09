resource "google_compute_address" "desarrollo" {
  name         = "academix-ip-desarrollo"
  address_type = "EXTERNAL"
  region       = var.region
  labels       = var.labels
}

resource "google_compute_address" "k3s" {
  name         = "academix-ip-k3s"
  address_type = "EXTERNAL"
  region       = var.region
  labels       = var.labels
}

resource "google_compute_address" "base_de_datos" {
  name         = "academix-ip-base-de-datos"
  address_type = "EXTERNAL"
  region       = var.region
  labels       = var.labels
}

resource "google_compute_instance" "vm_development" {
  name         = "vm-development"
  machine_type = var.machine_type_desarrollo
  zone         = var.zone
  tags         = concat(local.etiquetas_comunes, ["web", "development"])
  labels       = var.labels

  allow_stopping_for_update = true
  deletion_protection       = false

  boot_disk {
    initialize_params {
      image = var.os_image
      size  = var.disk_size_desarrollo
      type  = var.disk_type
    }
  }

  network_interface {
    subnetwork = google_compute_subnetwork.desarrollo.self_link
    access_config {
      nat_ip = google_compute_address.desarrollo.address
    }
  }

  metadata = {
    ssh-keys       = "${var.ssh_user}:${file(pathexpand(var.ssh_public_key_path))}"
    enable-oslogin = "FALSE"
  }

  depends_on = [google_project_service.apis]
}

resource "google_compute_instance" "vm_production_k3s" {
  name         = "vm-production-k3s"
  machine_type = var.machine_type_k3s
  zone         = var.zone
  tags         = concat(local.etiquetas_comunes, ["web", "k3s"])
  labels       = var.labels

  allow_stopping_for_update = true
  deletion_protection       = false

  boot_disk {
    initialize_params {
      image = var.os_image
      size  = var.disk_size_k3s
      type  = var.disk_type
    }
  }

  network_interface {
    subnetwork = google_compute_subnetwork.k3s.self_link
    access_config {
      nat_ip = google_compute_address.k3s.address
    }
  }

  metadata = {
    ssh-keys       = "${var.ssh_user}:${file(pathexpand(var.ssh_public_key_path))}"
    enable-oslogin = "FALSE"
  }

  depends_on = [google_project_service.apis]
}

resource "google_compute_instance" "vm_database" {
  name         = "vm-database"
  machine_type = var.machine_type_base_de_datos
  zone         = var.zone
  tags         = concat(local.etiquetas_comunes, ["database"])
  labels       = var.labels

  allow_stopping_for_update = true
  deletion_protection       = false

  boot_disk {
    initialize_params {
      image = var.os_image
      size  = var.disk_size_base_de_datos
      type  = var.disk_type
    }
  }

  network_interface {
    subnetwork = google_compute_subnetwork.base_de_datos.self_link
    access_config {
      nat_ip = google_compute_address.base_de_datos.address
    }
  }

  metadata = {
    ssh-keys       = "${var.ssh_user}:${file(pathexpand(var.ssh_public_key_path))}"
    enable-oslogin = "FALSE"
  }

  depends_on = [google_project_service.apis]
}
