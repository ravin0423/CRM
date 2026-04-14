#!/usr/bin/env bash
# =============================================================
#  Internal Support CRM — One-Command Deployment Script
#  Works on: Ubuntu 20.04+, Debian 11+, CentOS 8+, Amazon Linux 2
#
#  Usage:  curl -sL <your-repo>/deploy.sh | bash
#     or:  chmod +x deploy.sh && ./deploy.sh
# =============================================================

set -euo pipefail

# ---- Colours for output ----
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_step()  { echo -e "\n${BLUE}[STEP]${NC}  $1"; }
print_ok()    { echo -e "${GREEN}[OK]${NC}    $1"; }
print_warn()  { echo -e "${YELLOW}[WARN]${NC}  $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# ---- Pre-flight checks ----
print_step "Checking system requirements..."

if [ "$(id -u)" -ne 0 ]; then
    print_error "This script must be run as root (or with sudo)"
    echo "  Run:  sudo bash deploy.sh"
    exit 1
fi

# Detect OS
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
else
    OS="unknown"
fi
print_ok "Detected OS: $OS"

# ============================================================
# STEP 1: Install Docker + Docker Compose
# ============================================================
print_step "Installing Docker and Docker Compose..."

if command -v docker &> /dev/null; then
    print_ok "Docker already installed: $(docker --version)"
else
    print_step "Installing Docker..."
    case "$OS" in
        ubuntu|debian)
            apt-get update -qq
            apt-get install -y -qq ca-certificates curl gnupg lsb-release
            install -m 0755 -d /etc/apt/keyrings
            curl -fsSL https://download.docker.com/linux/$OS/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg 2>/dev/null
            chmod a+r /etc/apt/keyrings/docker.gpg
            echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/$OS $(lsb_release -cs) stable" > /etc/apt/sources.list.d/docker.list
            apt-get update -qq
            apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-compose-plugin
            ;;
        centos|rhel|rocky|almalinux|fedora)
            dnf install -y -q dnf-plugins-core
            dnf config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
            dnf install -y -q docker-ce docker-ce-cli containerd.io docker-compose-plugin
            ;;
        amzn)
            yum install -y -q docker
            systemctl start docker
            # Install compose plugin
            mkdir -p /usr/local/lib/docker/cli-plugins
            curl -fsSL "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/lib/docker/cli-plugins/docker-compose
            chmod +x /usr/local/lib/docker/cli-plugins/docker-compose
            ;;
        *)
            print_error "Unsupported OS: $OS. Install Docker manually, then re-run."
            exit 1
            ;;
    esac
    systemctl enable docker
    systemctl start docker
    print_ok "Docker installed successfully"
fi

# Verify docker compose works
if docker compose version &> /dev/null; then
    print_ok "Docker Compose: $(docker compose version --short)"
elif docker-compose version &> /dev/null; then
    # Older standalone docker-compose
    print_ok "Docker Compose (standalone): $(docker-compose version --short)"
    # Create wrapper so rest of script can use `docker compose`
    echo '#!/bin/sh' > /usr/local/bin/docker-compose-wrapper
    echo 'docker-compose "$@"' >> /usr/local/bin/docker-compose-wrapper
    chmod +x /usr/local/bin/docker-compose-wrapper
else
    print_error "Docker Compose not available. Please install it manually."
    exit 1
fi

# ============================================================
# STEP 2: Install Git and clone the repository
# ============================================================
print_step "Setting up the CRM application..."

# Install git if needed
if ! command -v git &> /dev/null; then
    case "$OS" in
        ubuntu|debian) apt-get install -y -qq git ;;
        centos|rhel|rocky|almalinux|fedora) dnf install -y -q git ;;
        amzn) yum install -y -q git ;;
    esac
fi

APP_DIR="/opt/crm"

if [ -d "$APP_DIR/.git" ]; then
    print_ok "CRM already cloned at $APP_DIR — pulling latest..."
    cd "$APP_DIR"
    git pull origin main || true
else
    print_step "Cloning CRM repository..."
    git clone https://github.com/ravin0423/CRM.git "$APP_DIR"
    cd "$APP_DIR"
fi

print_ok "Application code ready at $APP_DIR"

# ============================================================
# STEP 3: Generate secrets and configuration
# ============================================================
print_step "Generating secure configuration..."

# Create config directory
mkdir -p "$APP_DIR/config"

# Generate master encryption key if not exists
if [ ! -f "$APP_DIR/.env" ]; then
    # Generate a cryptographically secure Fernet key
    MASTER_KEY=$(python3 -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())" 2>/dev/null || \
                 docker run --rm python:3.11-slim python3 -c "
import base64, os
key = base64.urlsafe_b64encode(os.urandom(32)).decode()
print(key)
")

    # Generate random passwords for services
    DB_PASS=$(openssl rand -base64 16 | tr -dc 'a-zA-Z0-9' | head -c 20)
    RABBIT_PASS=$(openssl rand -base64 16 | tr -dc 'a-zA-Z0-9' | head -c 20)
    MINIO_PASS=$(openssl rand -base64 16 | tr -dc 'a-zA-Z0-9' | head -c 20)

    # Detect the machine's IP address
    SERVER_IP=$(hostname -I 2>/dev/null | awk '{print $1}' || curl -s ifconfig.me || echo "localhost")

    cat > "$APP_DIR/.env" <<ENVEOF
# ============================================================
# CRM Configuration — Auto-generated on $(date -u +"%Y-%m-%d %H:%M:%S UTC")
# ============================================================

# Encryption master key (DO NOT LOSE — encrypts all secrets at rest)
CRM_MASTER_KEY_B64=${MASTER_KEY}

# Environment
CRM_ENV=production
CRM_LOG_LEVEL=INFO
CRM_CORS_ORIGINS=http://${SERVER_IP},http://localhost
CRM_CONFIG_PATH=/app/config/admin_settings.json
CRM_RATE_LIMIT_ENABLED=true

# Database
CRM_BOOTSTRAP_DB=sqlite
POSTGRES_USER=crm
POSTGRES_PASSWORD=${DB_PASS}
POSTGRES_DB=crm_meta

# Message broker
RABBITMQ_USER=crm
RABBITMQ_PASS=${RABBIT_PASS}
CRM_CELERY_BROKER=amqp://crm:${RABBIT_PASS}@rabbitmq:5672//
CRM_CELERY_BACKEND=redis://redis:6379/0

# Object storage
MINIO_ROOT_USER=crm_admin
MINIO_ROOT_PASSWORD=${MINIO_PASS}

# SQL Server (optional — leave empty to use SQLite initially)
MSSQL_SA_PASSWORD=Crm_Auto_$(openssl rand -base64 8 | tr -dc 'a-zA-Z0-9')!
ENVEOF

    chmod 600 "$APP_DIR/.env"
    print_ok "Generated .env with secure random passwords"
    print_ok "Master encryption key saved (back this up!)"
else
    print_ok ".env already exists — keeping existing configuration"
fi

# Source the env file for variable substitution
set -a
source "$APP_DIR/.env"
set +a

# Create admin_settings.json if it doesn't exist
if [ ! -f "$APP_DIR/config/admin_settings.json" ]; then
    cat > "$APP_DIR/config/admin_settings.json" <<CFGEOF
{
  "version": 1,
  "database": {
    "type": "sqlserver",
    "sqlserver": {},
    "mongodb": {}
  },
  "email": {},
  "storage": {
    "type": "minio",
    "minio": {
      "endpoint": "http://minio:9000",
      "access_key": "${MINIO_ROOT_USER:-crm_admin}",
      "bucket": "crm-files"
    },
    "s3": {}
  },
  "api": {
    "base_url": "http://localhost:8000/api/v1",
    "timezone": "UTC",
    "session_timeout_minutes": 30,
    "max_upload_mb": 100,
    "debug": false
  },
  "integrations": {
    "freshdesk": {"enabled": false},
    "slack": {"enabled": false},
    "calendar": {"enabled": false}
  },
  "backup": {
    "schedule_hours": 6,
    "location": "local",
    "retention_count": 10
  }
}
CFGEOF
    print_ok "Generated initial admin_settings.json"
fi

# ============================================================
# STEP 4: Create production docker-compose override
# ============================================================
print_step "Configuring Docker services for production..."

cat > "$APP_DIR/docker-compose.override.yml" <<'DOCKEOF'
# Production overrides — generated by deploy.sh
services:
  backend:
    environment:
      CRM_ENV: production
      CRM_LOG_LEVEL: INFO
    restart: always

  worker:
    restart: always

  frontend:
    restart: always

  postgres:
    restart: always

  redis:
    restart: always

  rabbitmq:
    restart: always

  minio:
    restart: always
DOCKEOF

print_ok "Docker Compose production config ready"

# ============================================================
# STEP 5: Open firewall ports
# ============================================================
print_step "Configuring firewall..."

if command -v ufw &> /dev/null; then
    ufw allow 80/tcp   2>/dev/null || true   # Frontend
    ufw allow 8000/tcp 2>/dev/null || true   # Backend API
    print_ok "Opened ports 80 and 8000 (ufw)"
elif command -v firewall-cmd &> /dev/null; then
    firewall-cmd --permanent --add-port=80/tcp   2>/dev/null || true
    firewall-cmd --permanent --add-port=8000/tcp 2>/dev/null || true
    firewall-cmd --reload 2>/dev/null || true
    print_ok "Opened ports 80 and 8000 (firewalld)"
else
    print_warn "No firewall manager found — make sure ports 80 and 8000 are open in your CloudStack security group"
fi

# ============================================================
# STEP 6: Build and launch
# ============================================================
print_step "Building and starting all services (this takes 3-5 minutes on first run)..."

cd "$APP_DIR"

# Remove old override if it was the dev one
docker compose build --no-cache 2>&1 | tail -5

print_step "Starting services..."
docker compose up -d 2>&1

# ============================================================
# STEP 7: Wait for services to be healthy
# ============================================================
print_step "Waiting for services to come up..."

MAX_WAIT=120
ELAPSED=0

while [ $ELAPSED -lt $MAX_WAIT ]; do
    # Check if backend is healthy
    if curl -sf http://localhost:8000/health > /dev/null 2>&1; then
        print_ok "Backend is healthy"
        break
    fi
    sleep 5
    ELAPSED=$((ELAPSED + 5))
    echo -n "."
done

if [ $ELAPSED -ge $MAX_WAIT ]; then
    print_warn "Backend didn't become healthy in ${MAX_WAIT}s. Checking logs..."
    docker compose logs backend --tail=20
    echo ""
    print_warn "Services may still be starting. Check with: docker compose logs -f"
fi

# Check frontend
if curl -sf http://localhost:80 > /dev/null 2>&1; then
    print_ok "Frontend is healthy"
elif curl -sf http://localhost:3000 > /dev/null 2>&1; then
    print_ok "Frontend is healthy (port 3000)"
fi

# ============================================================
# STEP 8: Show status and login info
# ============================================================
echo ""
echo -e "${GREEN}============================================================${NC}"
echo -e "${GREEN}   CRM DEPLOYMENT COMPLETE!${NC}"
echo -e "${GREEN}============================================================${NC}"
echo ""

SERVER_IP=$(hostname -I 2>/dev/null | awk '{print $1}' || echo "your-server-ip")

echo -e "  ${BLUE}Application URL:${NC}    http://${SERVER_IP}"
echo -e "  ${BLUE}API URL:${NC}            http://${SERVER_IP}:8000"
echo -e "  ${BLUE}API Health Check:${NC}   http://${SERVER_IP}:8000/health"
echo -e "  ${BLUE}RabbitMQ Console:${NC}   http://${SERVER_IP}:15672"
echo -e "  ${BLUE}MinIO Console:${NC}      http://${SERVER_IP}:9001"
echo ""
echo -e "  ${YELLOW}Default Login:${NC}"
echo -e "    Email:    admin@company.com"
echo -e "    Password: password123"
echo ""
echo -e "  ${RED}>>> IMPORTANT: Change the admin password immediately after first login! <<<${NC}"
echo ""
echo -e "  ${BLUE}Useful Commands:${NC}"
echo -e "    View logs:      cd $APP_DIR && docker compose logs -f"
echo -e "    Restart:        cd $APP_DIR && docker compose restart"
echo -e "    Stop:           cd $APP_DIR && docker compose down"
echo -e "    Update:         cd $APP_DIR && git pull && docker compose up -d --build"
echo -e "    Backup key:     cat $APP_DIR/.env | grep MASTER_KEY"
echo ""
echo -e "  ${YELLOW}Your master encryption key is in $APP_DIR/.env${NC}"
echo -e "  ${YELLOW}BACK IT UP — if you lose it, encrypted settings cannot be recovered.${NC}"
echo ""
echo -e "${GREEN}============================================================${NC}"
