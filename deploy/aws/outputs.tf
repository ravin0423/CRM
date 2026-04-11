output "alb_dns_name" {
  description = "Public DNS name of the Application Load Balancer."
  value       = aws_lb.main.dns_name
}

output "rds_endpoint" {
  description = "RDS SQL Server endpoint hostname."
  value       = aws_db_instance.sqlserver.address
}

output "redis_endpoint" {
  description = "ElastiCache Redis primary endpoint."
  value       = aws_elasticache_cluster.redis.cache_nodes[0].address
}

output "mq_endpoints" {
  description = "Amazon MQ AMQPS endpoints."
  value       = aws_mq_broker.rabbit.instances[0].endpoints
}

output "attachments_bucket" {
  description = "S3 bucket name for attachments."
  value       = aws_s3_bucket.attachments.bucket
}

output "master_key_b64" {
  description = "Generated Fernet master key — store in SSM Parameter Store."
  value       = local.master_key_b64
  sensitive   = true
}
