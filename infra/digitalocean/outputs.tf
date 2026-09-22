output "app_url" {
  value = digitalocean_app.scheduler.default_ingress
}

output "database_host" {
  value     = digitalocean_database_cluster.postgres.host
  sensitive = true
}
