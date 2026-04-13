data "aws_ami" "amazon_linux" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }
}

# Terraform doesn't pass the Fernet master key through here — in production,
# wire this up to SSM Parameter Store. For the scaffold we generate a random
# key at apply time and hand it to user_data. Rotate via terraform taint.
resource "random_password" "master_key" {
  length  = 32
  special = false
}

locals {
  master_key_b64 = base64encode(random_password.master_key.result)
  db_host        = aws_db_instance.sqlserver.address
  s3_bucket      = aws_s3_bucket.attachments.bucket
  redis_url      = "redis://${aws_elasticache_cluster.redis.cache_nodes[0].address}:6379/0"
  # Amazon MQ publishes an AMQPS endpoint; strip the scheme to build a URI.
  mq_url = "amqps://${var.mq_admin_username}:${var.mq_admin_password}@${replace(aws_mq_broker.rabbit.instances[0].endpoints[0], "amqps://", "")}/"
}

# --- Backend API ---
resource "aws_launch_template" "api" {
  name_prefix   = "${local.name_prefix}-api-"
  image_id      = data.aws_ami.amazon_linux.id
  instance_type = var.app_instance_type
  key_name      = var.key_name

  iam_instance_profile {
    arn = aws_iam_instance_profile.app.arn
  }

  vpc_security_group_ids = [aws_security_group.app.id]

  user_data = base64encode(templatefile("${path.module}/user_data.sh.tpl", {
    service_name   = "api"
    image          = var.backend_image
    port           = 8000
    master_key_b64 = local.master_key_b64
    aws_region     = var.aws_region
    s3_bucket      = local.s3_bucket
    db_host        = local.db_host
    redis_url      = local.redis_url
    mq_url         = local.mq_url
  }))

  tag_specifications {
    resource_type = "instance"
    tags          = { Name = "${local.name_prefix}-api" }
  }
}

resource "aws_autoscaling_group" "api" {
  name                = "${local.name_prefix}-api-asg"
  min_size            = 1
  max_size            = 3
  desired_capacity    = 1
  vpc_zone_identifier = aws_subnet.private[*].id
  target_group_arns   = [aws_lb_target_group.api.arn]
  health_check_type   = "ELB"

  launch_template {
    id      = aws_launch_template.api.id
    version = "$Latest"
  }

  tag {
    key                 = "Role"
    value               = "api"
    propagate_at_launch = true
  }
}

# --- Celery Worker ---
resource "aws_launch_template" "worker" {
  name_prefix   = "${local.name_prefix}-worker-"
  image_id      = data.aws_ami.amazon_linux.id
  instance_type = var.worker_instance_type
  key_name      = var.key_name

  iam_instance_profile {
    arn = aws_iam_instance_profile.app.arn
  }

  vpc_security_group_ids = [aws_security_group.app.id]

  user_data = base64encode(templatefile("${path.module}/user_data.sh.tpl", {
    service_name   = "worker"
    image          = var.backend_image
    port           = 8001
    master_key_b64 = local.master_key_b64
    aws_region     = var.aws_region
    s3_bucket      = local.s3_bucket
    db_host        = local.db_host
    redis_url      = local.redis_url
    mq_url         = local.mq_url
  }))

  tag_specifications {
    resource_type = "instance"
    tags          = { Name = "${local.name_prefix}-worker" }
  }
}

resource "aws_autoscaling_group" "worker" {
  name                = "${local.name_prefix}-worker-asg"
  min_size            = 1
  max_size            = 2
  desired_capacity    = 1
  vpc_zone_identifier = aws_subnet.private[*].id
  health_check_type   = "EC2"

  launch_template {
    id      = aws_launch_template.worker.id
    version = "$Latest"
  }

  tag {
    key                 = "Role"
    value               = "worker"
    propagate_at_launch = true
  }
}

# --- Frontend (nginx serving Vite build) ---
resource "aws_launch_template" "frontend" {
  name_prefix   = "${local.name_prefix}-web-"
  image_id      = data.aws_ami.amazon_linux.id
  instance_type = var.frontend_instance_type
  key_name      = var.key_name

  iam_instance_profile {
    arn = aws_iam_instance_profile.app.arn
  }

  vpc_security_group_ids = [aws_security_group.app.id]

  user_data = base64encode(templatefile("${path.module}/user_data.sh.tpl", {
    service_name   = "frontend"
    image          = var.frontend_image
    port           = 80
    master_key_b64 = local.master_key_b64
    aws_region     = var.aws_region
    s3_bucket      = local.s3_bucket
    db_host        = local.db_host
    redis_url      = local.redis_url
    mq_url         = local.mq_url
  }))

  tag_specifications {
    resource_type = "instance"
    tags          = { Name = "${local.name_prefix}-web" }
  }
}

resource "aws_autoscaling_group" "frontend" {
  name                = "${local.name_prefix}-web-asg"
  min_size            = 1
  max_size            = 2
  desired_capacity    = 1
  vpc_zone_identifier = aws_subnet.private[*].id
  target_group_arns   = [aws_lb_target_group.frontend.arn]
  health_check_type   = "ELB"

  launch_template {
    id      = aws_launch_template.frontend.id
    version = "$Latest"
  }

  tag {
    key                 = "Role"
    value               = "frontend"
    propagate_at_launch = true
  }
}
