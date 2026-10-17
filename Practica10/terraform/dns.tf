data "google_dns_managed_zone" "yo_usac" {
  name = var.dns_zone_name
}

resource "google_dns_record_set" "desarrollo" {
  count = var.create_dns_records ? 1 : 0

  managed_zone = data.google_dns_managed_zone.yo_usac.name
  name         = "${local.host_desarrollo}."
  type         = "A"
  ttl          = var.dns_ttl
  rrdatas      = [google_compute_address.desarrollo.address]

  depends_on = [google_compute_instance.vm_development]
}

resource "google_dns_record_set" "k3s" {
  count = var.create_dns_records ? 1 : 0

  managed_zone = data.google_dns_managed_zone.yo_usac.name
  name         = "${local.host_k3s}."
  type         = "A"
  ttl          = var.dns_ttl
  rrdatas      = [google_compute_address.k3s.address]

  depends_on = [google_compute_instance.vm_production_k3s]
}

resource "google_dns_record_set" "base_de_datos" {
  count = var.create_dns_records ? 1 : 0

  managed_zone = data.google_dns_managed_zone.yo_usac.name
  name         = "${local.host_base_de_datos}."
  type         = "A"
  ttl          = var.dns_ttl
  rrdatas      = [google_compute_address.base_de_datos.address]

  depends_on = [google_compute_instance.vm_database]
}

# grafana.academixk3s.yo-usac.com → misma IP estática que el nodo K3s
# (el Ingress k3s/ingress/grafana.yaml y el GF_ROOT_URL usan este host).
resource "google_dns_record_set" "grafana" {
  count = var.create_dns_records ? 1 : 0

  managed_zone = data.google_dns_managed_zone.yo_usac.name
  name         = "${local.host_grafana}."
  type         = "A"
  ttl          = var.dns_ttl
  rrdatas      = [google_compute_address.k3s.address]

  depends_on = [google_compute_instance.vm_production_k3s]
}
