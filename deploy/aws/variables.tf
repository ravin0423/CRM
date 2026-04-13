variable "aws_region" {
  description = "AWS region to deploy into."
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name (dev/staging/prod)."
  type        = string
  default     = "prod"
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC."
  type        = string
  default     = "10.40.0.0/16"
}

variable "key_name" {
  description = "Name of an existing EC2 KeyPair for SSH access."
  type        = string
}

variable "app_instance_type" {
  description = "EC2 instance type for the FastAPI backend."
  type        = string
  default     = "t3.small"
}

variable "worker_instance_type" {
  description = "EC2 instance type for the Celery worker."
  type        = string
  default     = "t3.small"
}

variable "frontend_instance_type" {
  description = "EC2 instance type for the React frontend (nginx)."
  type        = string
  default     = "t3.micro"
}

variable "backend_image" {
  description = "Docker image for the FastAPI backend (registry/repo:tag)."
  type        = string
  default     = "ghcr.io/your-org/crm-backend:latest"
}

variable "frontend_image" {
  description = "Docker image for the React frontend (registry/repo:tag)."
  type        = string
  default     = "ghcr.io/your-org/crm-frontend:latest"
}

variable "db_instance_class" {
  description = "RDS instance class."
  type        = string
  default     = "db.t3.small"
}

variable "db_admin_username" {
  description = "RDS SQL Server admin username."
  type        = string
  default     = "crmadmin"
}

variable "db_admin_password" {
  description = "RDS SQL Server admin password. Provide via TF_VAR or tfvars."
  type        = string
  sensitive   = true
}

variable "db_allocated_storage" {
  description = "RDS allocated storage in GiB."
  type        = number
  default     = 20
}

variable "redis_node_type" {
  description = "ElastiCache Redis node type."
  type        = string
  default     = "cache.t3.micro"
}

variable "mq_instance_type" {
  description = "Amazon MQ broker instance type."
  type        = string
  default     = "mq.t3.micro"
}

variable "mq_admin_username" {
  description = "Amazon MQ broker admin username."
  type        = string
  default     = "crmadmin"
}

variable "mq_admin_password" {
  description = "Amazon MQ broker admin password. Provide via TF_VAR or tfvars."
  type        = string
  sensitive   = true
}

variable "attachments_bucket_name" {
  description = "S3 bucket name for attachments. Must be globally unique."
  type        = string
}

variable "dns_zone_id" {
  description = "Optional Route 53 hosted zone ID. Leave blank to skip DNS."
  type        = string
  default     = ""
}

variable "dns_record_name" {
  description = "Subdomain to create under the zone (e.g. crm.example.com)."
  type        = string
  default     = ""
}

variable "admin_allowed_cidrs" {
  description = "CIDRs allowed to reach the ALB HTTP listener."
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

variable "ssh_allowed_cidrs" {
  description = "CIDRs allowed to SSH to the application EC2 instances."
  type        = list(string)
  default     = []
}
