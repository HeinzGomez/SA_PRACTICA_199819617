# Estado compartido entre la máquina de administración y el CI (GitHub Actions).
# Sin backend remoto, un `terraform apply` en el runner vería el estado vacío e
# intentaría crear TODA la infra de cero — por eso el estado vive en GCS.
#
# Bootstrap (una sola vez, ANTES de que el pipeline corra terraform):
#   gcloud storage buckets create gs://fiery-nimbus-508806-i4-tfstate \
#     --project=fiery-nimbus-508806-i4 --location=us-central1
#   cd Practica10/terraform && terraform init -migrate-state
terraform {
  backend "gcs" {
    bucket = "fiery-nimbus-508806-i4-tfstate"
    prefix = "academix"
  }
}
