#!/bin/bash
set -euo pipefail

# Baseline tooling.
yum update -y
amazon-linux-extras install -y docker
systemctl enable --now docker
usermod -aG docker ec2-user

# docker compose v2 plugin
mkdir -p /usr/local/lib/docker/cli-plugins
curl -SL https://github.com/docker/compose/releases/download/v2.29.2/docker-compose-linux-x86_64 \
  -o /usr/local/lib/docker/cli-plugins/docker-compose
chmod +x /usr/local/lib/docker/cli-plugins/docker-compose

mkdir -p /opt/crm
cd /opt/crm

cat > docker-compose.yml <<'EOF'
services:
  ${service_name}:
    image: ${image}
    restart: always
    env_file: /opt/crm/env
    ports:
      - "${port}:${port}"
    volumes:
      - /opt/crm/config:/app/config
EOF

cat > /opt/crm/env <<'EOF'
# Populated by cloud-init from Terraform outputs.
CRM_CONFIG_PATH=/app/config/admin_settings.json
CRM_MASTER_KEY_B64=${master_key_b64}
AWS_REGION=${aws_region}
AWS_S3_BUCKET=${s3_bucket}
DATABASE_HOST=${db_host}
DATABASE_PORT=1433
REDIS_URL=${redis_url}
MQ_URL=${mq_url}
EOF

docker compose pull
docker compose up -d

# Wait until /health responds. Terraform considers the target group healthy
# only after this loop succeeds.
for i in {1..30}; do
  if curl -fsS http://localhost:${port}/health > /dev/null; then
    echo "crm ${service_name} is healthy"
    exit 0
  fi
  sleep 5
done

echo "crm ${service_name} failed to become healthy" >&2
exit 1
