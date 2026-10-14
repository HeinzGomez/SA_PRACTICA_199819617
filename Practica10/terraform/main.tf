locals {
  etiquetas_comunes = ["academix"]

  apis = var.enable_apis ? [
    "compute.googleapis.com",
    "dns.googleapis.com",
  ] : []

  sufijo_dns = trimsuffix(data.google_dns_managed_zone.yo_usac.dns_name, ".")

  host_desarrollo = "${var.hostname_desarrollo}.${local.sufijo_dns}"
  host_k3s        = "${var.hostname_k3s}.${local.sufijo_dns}"
}

resource "google_project_service" "apis" {
  for_each = toset(local.apis)

  service            = each.value
  disable_on_destroy = false
}
