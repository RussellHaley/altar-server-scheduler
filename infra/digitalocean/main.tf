resource "digitalocean_database_cluster" "postgres" {
  name       = "${var.app_name}-postgres"
  engine     = "pg"
  version    = "17"
  region     = var.region
  size       = var.database_size
  node_count = 1
}

resource "digitalocean_database_db" "scheduler" {
  cluster_id = digitalocean_database_cluster.postgres.id
  name       = "scheduler"
}

resource "digitalocean_app" "scheduler" {
  spec {
    name   = var.app_name
    region = var.region

    service {
      name               = "web"
      instance_count     = 1
      instance_size_slug = "apps-s-1vcpu-1gb"
      http_port          = 3000
      source_dir         = var.source_dir
      dockerfile_path    = "Dockerfile"

      github {
        repo           = var.repository
        branch         = var.branch
        deploy_on_push = true
      }

      env {
        key   = "DATABASE_URL"
        value = digitalocean_database_cluster.postgres.uri
        type  = "SECRET"
      }

      env {
        key   = "NEXT_PUBLIC_APP_NAME"
        value = "SJHN Altar Server Scheduler"
      }

    }

    dynamic "domain" {
      for_each = var.domain == null ? [] : [var.domain]
      content {
        name = domain.value
      }
    }
  }
}

resource "digitalocean_database_firewall" "postgres" {
  cluster_id = digitalocean_database_cluster.postgres.id

  rule {
    type  = "app"
    value = digitalocean_app.scheduler.id
  }
}
