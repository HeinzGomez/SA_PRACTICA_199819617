output "ips_publicas" {
  description = "IPs públicas asignadas a cada una de las instancias."
  value = {
    vm_development   = google_compute_address.desarrollo.address
    vm_production_k3s = google_compute_address.k3s.address
    vm_database      = google_compute_address.base_de_datos.address
  }
}

output "ip_vm_development" {
  description = "IP pública de vm-development."
  value       = google_compute_address.desarrollo.address
}

output "ip_vm_production_k3s" {
  description = "IP pública de vm-production-k3s."
  value       = google_compute_address.k3s.address
}

output "ip_vm_database" {
  description = "IP pública de vm-database."
  value       = google_compute_address.base_de_datos.address
}

output "ips_internas" {
  description = "IPs privadas dentro de la VPC, usadas por el inventario de Ansible cuando se prefiere SSH interno."
  value = {
    vm_development   = google_compute_instance.vm_development.network_interface[0].network_ip
    vm_production_k3s = google_compute_instance.vm_production_k3s.network_interface[0].network_ip
    vm_database      = google_compute_instance.vm_database.network_interface[0].network_ip
  }
}

output "nombres_instancias" {
  description = "Nombres de las instancias creadas."
  value = {
    vm_development   = google_compute_instance.vm_development.name
    vm_production_k3s = google_compute_instance.vm_production_k3s.name
    vm_database      = google_compute_instance.vm_database.name
  }
}

output "dominios" {
  description = "Dominios apuntando a las VMs mediante Cloud DNS."
  value = {
    academixdev_yo_usac_com = local.host_desarrollo
    academixk3s_yo_usac_com = local.host_k3s
  }
}

output "registros_dns" {
  description = "Registros A creados y su TTL."
  value = {
    zona   = data.google_dns_managed_zone.yo_usac.name
    ttl    = var.dns_ttl
    nombre = local.host_desarrollo
    k3s    = local.host_k3s
  }
}

output "comandos_ssh" {
  description = "Comandos SSH listos para usar desde la máquina de administración."
  value = {
    vm_development    = "ssh ${var.ssh_user}@${google_compute_address.desarrollo.address}"
    vm_production_k3s = "ssh ${var.ssh_user}@${google_compute_address.k3s.address}"
    vm_database       = "ssh ${var.ssh_user}@${google_compute_address.base_de_datos.address}"
  }
}

output "inventario_ansible" {
  description = "Hosts listos para copiar en el inventario de Ansible."
  value = {
    desarrollo     = google_compute_address.desarrollo.address
    k3s            = google_compute_address.k3s.address
    base_de_datos  = google_compute_address.base_de_datos.address
    usuario        = var.ssh_user
  }
}

output "inventory_ini" {
  description = "Inventario de Ansible generado desde las IPs. Uso: terraform output -raw inventory_ini > ../ansible/inventory.ini"
  value       = <<-EOT
    # Generado por Terraform desde las IPs públicas de las instancias.
    # Regenerar con: cd terraform && terraform output -raw inventory_ini > ../ansible/inventory.ini

    [desarrollo]
    vm-development ansible_host=${google_compute_address.desarrollo.address}

    [base_de_datos]
    vm-database ansible_host=${google_compute_address.base_de_datos.address}

    [k3s]
    vm-production-k3s ansible_host=${google_compute_address.k3s.address}

    [all:vars]
    ansible_user=${var.ssh_user}
    ansible_python_interpreter=/usr/bin/python3
  EOT
}
