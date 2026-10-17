project_id = "fiery-nimbus-508806-i4"

region = "us-central1"
zone   = "us-central1-a"

ssh_user            = "ubuntu"
ssh_public_key_path = "~/.ssh/academix_lab.pub"

allowed_ssh_cidrs     = ["0.0.0.0/0"]
allowed_http_cidrs    = ["0.0.0.0/0"]
allowed_k3s_api_cidrs = ["0.0.0.0/0"]
# PostgreSQL (5432): abierto a cualquier origen para que los pods de K3s se
# conecten por el DNS público academxdb.yo-usac.com sin problemas de firewall.
allowed_db_cidrs = ["0.0.0.0/0"]
# Telemetría (Grafana 3000, Prometheus 9090, node-exporter 9100): hoy no corre
# ningún servicio de ese tipo en el repo, así que se limita a la VPC. Si algún
# día instalas el stack de monitoreo y lo quieres ver desde el navegador sin
# depender de tu IP (que cambia), usa un túnel SSH en vez de abrirlo:
#   ssh -L 3000:localhost:3000 ubuntu@<ip_publica>
telemetry_ports = ["3000", "9090", "9100"]
telemetry_cidrs = ["10.10.0.0/16"]

machine_type_desarrollo    = "e2-medium"
machine_type_k3s           = "e2-standard-2"
machine_type_base_de_datos = "e2-medium"

dns_zone_name          = "yo-usac-com"
hostname_desarrollo    = "academixdev"
hostname_k3s           = "academixk3s"
hostname_base_de_datos = "academxdb"
hostname_grafana       = "grafana" # grafana.academixk3s.yo-usac.com → IP de vm-k3s
dns_ttl                = 60
create_dns_records     = true
