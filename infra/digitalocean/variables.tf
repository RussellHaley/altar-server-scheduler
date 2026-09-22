variable "do_token" {
  type      = string
  sensitive = true
}

variable "region" {
  type    = string
  default = "tor1"
}

variable "app_name" {
  type    = string
  default = "sjhn-scheduler"
}

variable "repository" {
  type        = string
  description = "GitHub repository in owner/name form."
}

variable "branch" {
  type    = string
  default = "main"
}

variable "source_dir" {
  type    = string
  default = "scheduler-app"
}

variable "domain" {
  type        = string
  description = "Optional scheduler hostname, for example schedule.example.ca."
  default     = null
  nullable    = true
}

variable "database_size" {
  type    = string
  default = "db-s-1vcpu-1gb"
}
