resource "aws_db_instance" "sqlserver" {
  identifier             = "${local.name_prefix}-sqlserver"
  engine                 = "sqlserver-ex"
  engine_version         = "15.00.4236.7.v1"
  instance_class         = var.db_instance_class
  allocated_storage      = var.db_allocated_storage
  storage_type           = "gp3"
  storage_encrypted      = true
  username               = var.db_admin_username
  password               = var.db_admin_password
  port                   = 1433
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  publicly_accessible    = false
  skip_final_snapshot    = true
  deletion_protection    = false
  backup_retention_period = 7
  license_model          = "license-included"

  tags = { Name = "${local.name_prefix}-sqlserver" }
}
