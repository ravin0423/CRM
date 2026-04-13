resource "aws_mq_broker" "rabbit" {
  broker_name         = "${local.name_prefix}-rabbit"
  engine_type         = "RabbitMQ"
  engine_version      = "3.11.20"
  host_instance_type  = var.mq_instance_type
  deployment_mode     = "SINGLE_INSTANCE"
  publicly_accessible = false
  subnet_ids          = [aws_subnet.private[0].id]
  security_groups     = [aws_security_group.mq.id]

  user {
    username = var.mq_admin_username
    password = var.mq_admin_password
  }

  tags = { Name = "${local.name_prefix}-rabbit" }
}
