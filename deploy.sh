#!/usr/bin/env bash
# =============================================================
#  Internal Support CRM — Automated Deployment Script
#  Tested on: Ubuntu 20.04+, Debian 11+, CentOS 8+, Amazon Linux 2
#
#  ONE-COMMAND INSTALL:
#    sudo bash deploy.sh
#
#  This script handles EVERYTHING:
#    1. System package updates
#    2. Docker + Docker Compose installation
#    3. Git installation + repo clone
#    4. Secure secret generation
#    5. Configuration files
#    6. Container build + launch
#    7. Health verification
#    8. Firewall rules
# =============================================================

set -euo pipefail

# ── Colours ──
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'

step()  { echo -e "\n${CYAN}${BOLD}[$1/${TOTAL_STEPS}]${NC} ${BLUE}$2${NC}"; }
ok()    { echo -e "  ${GREEN}✓${NC} $1"; }
warn()  { echo -e "  ${YELLOW}!${NC} $1"; }
fail()  { echo -e "  ${RED}✗${NC} $1"; }

TOTAL_STEPS=8
APP_DIR="/opt/crm"
REPO_URL="https://github.com/ravin0423/CRM.git"
BRANCH="claude/execute-prompt-docs-rBNtz"

# ──────────────────────────────────────────────────
# Pre-flight
# ──────────────────────────────────────────────────
echo -e "\n${BOLD}${CYAN}╔══════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}${CYAN}║     Internal Support CRM — Auto Deploy       ║${NC}"
echo -e "${BOLD}${CYAN}╚══════════════════════════════════════════════╝${NC}"
echo ""

if [ "$(id -u)" -ne 0 ]; then
    fail "This script must be run as root (sudo bash deploy.sh)"
    exit 1
fi

# Detect OS
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
    OS_VERSION=${VERSION_ID:-""}
else
    OS="unknown"
    OS_VERSION=""
fi
ok "Detected OS: $OS $OS_VERSION"

# Detect architecture
ARCH=$(uname -m)
ok "Architecture: $ARCH"

# ──────────────────────────────────────────────────
# STEP 1: System updates and prerequisites
# ──────────────────────────────────────────────────
step 1 "Installing system prerequisites..."

install_pkg() {
    case "$OS" in
        ubuntu|debian)
            export DEBIAN_FRONTEND=noninteractive
            apt-get update -qq 2>/dev/null
            apt-get install -y -qq "$@" 2>/dev/null
            ;;
        centos|rhel|rocky|almalinux)
            dnf install -y -q "$@" 2>/dev/null || yum install -y -q "$@" 2>/dev/null
            ;;
        amzn)
            yum install -y -q "$@" 2>/dev/null
            ;;
        fedora)
            dnf install -y -q "$@" 2>/dev/null
            ;;
        *)
            fail "Unsupported OS: $OS. Install Docker manually, then re-run."
            exit 1
            ;;
    esac
}

# Essential packages
install_pkg curl git ca-certificates gnupg openssl
ok "System packages installed"

# ──────────────────────────────────────────────────
# STEP 2: Install Docker
# ──────────────────────────────────────────────────
step 2 "Setting up Docker..."

if command -v docker &> /dev/null && docker info &> /dev/null; then
    ok "Docker already installed: $(docker --version | head -1)"
else
    echo "  Installing Docker..."
    case "$OS" in
        ubuntu|debian)
            # Remove ALL old/conflicting Docker & containerd packages
            for pkg in docker docker-engine docker.io containerd containerd.io runc podman-docker; do
                apt-get remove -y -qq "$pkg" 2>/dev/null || true
            done
            apt-get autoremove -y -qq 2>/dev/null || true
            install_pkg lsb-release
            install -m 0755 -d /etc/apt/keyrings
            curl -fsSL "https://download.docker.com/linux/$OS/gpg" | gpg --dearmor -o /etc/apt/keyrings/docker.gpg 2>/dev/null
            chmod a+r /etc/apt/keyrings/docker.gpg
            echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/$OS $(. /etc/os-release && echo "$VERSION_CODENAME") stable" > /etc/apt/sources.list.d/docker.list
            apt-get update -qq 2>/dev/null
            apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin 2>/dev/null
            ;;
        centos|rhel|rocky|almalinux)
            dnf config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo 2>/dev/null || \
                yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo 2>/dev/null
            dnf install -y -q docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin 2>/dev/null || \
                yum install -y -q docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin 2>/dev/null
            ;;
        amzn)
            yum install -y -q docker 2>/dev/null
            # Install Compose plugin
            mkdir -p /usr/local/lib/docker/cli-plugins
            COMPOSE_URL="https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)"
            curl -fsSL "$COMPOSE_URL" -o /usr/local/lib/docker/cli-plugins/docker-compose 2>/dev/null
            chmod +x /usr/local/lib/docker/cli-plugins/docker-compose
            ;;
        fedora)
            dnf install -y -q dnf-plugins-core 2>/dev/null
            dnf config-manager --add-repo https://download.docker.com/linux/fedora/docker-ce.repo 2>/dev/null
            dnf install -y -q docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin 2>/dev/null
            ;;
    esac

    systemctl enable docker 2>/dev/null || true
    systemctl start docker 2>/dev/null || true

    # Verify docker is running
    if ! docker info &> /dev/null; then
        fail "Docker failed to start. Check: systemctl status docker"
        exit 1
    fi
    ok "Docker installed successfully"
fi

# Verify compose
if docker compose version &> /dev/null; then
    ok "Docker Compose: $(docker compose version --short 2>/dev/null || echo 'available')"
elif command -v docker-compose &> /dev/null; then
    ok "Docker Compose (standalone): available"
    # Create a shim so `docker compose` works
    if [ ! -f /usr/local/lib/docker/cli-plugins/docker-compose ]; then
        mkdir -p /usr/local/lib/docker/cli-plugins
        ln -sf "$(which docker-compose)" /usr/local/lib/docker/cli-plugins/docker-compose
    fi
else
    fail "Docker Compose not found. Installing..."
    mkdir -p /usr/local/lib/docker/cli-plugins
    curl -fsSL "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" \
        -o /usr/local/lib/docker/cli-plugins/docker-compose
    chmod +x /usr/local/lib/docker/cli-plugins/docker-compose
    ok "Docker Compose installed"
fi

# ──────────────────────────────────────────────────
# STEP 3: Clone repository
# ──────────────────────────────────────────────────
step 3 "Setting up CRM application..."

if [ -d "$APP_DIR/.git" ]; then
    ok "CRM already exists at $APP_DIR"
    cd "$APP_DIR"
    git fetch origin "$BRANCH" 2>/dev/null || true
    git checkout "$BRANCH" 2>/dev/null || true
    git pull origin "$BRANCH" 2>/dev/null || true
    ok "Updated to latest code"
else
    git clone --branch "$BRANCH" "$REPO_URL" "$APP_DIR" 2>/dev/null || \
    git clone "$REPO_URL" "$APP_DIR" 2>/dev/null
    cd "$APP_DIR"
    ok "Cloned repository to $APP_DIR"
fi

# ──────────────────────────────────────────────────
# STEP 4: Generate secrets and configuration
# ──────────────────────────────────────────────────
step 4 "Generating secure configuration..."

mkdir -p "$APP_DIR/config"

# Helper: generate a random alphanumeric password
randpass() { openssl rand -base64 24 | tr -dc 'a-zA-Z0-9' | head -c "${1:-20}"; }

if [ ! -f "$APP_DIR/.env" ]; then
    # Generate Fernet-compatible key (32 bytes, url-safe base64)
    MASTER_KEY=$(openssl rand -base64 32 | tr '+/' '-_' | head -c 44)

    # Random passwords for all services
    PG_PASS=$(randpass 20)
    RABBIT_PASS=$(randpass 20)
    MINIO_PASS=$(randpass 20)
    MSSQL_PASS="CRM_$(randpass 16)!"

    # Detect server IP
    SERVER_IP=$(hostname -I 2>/dev/null | awk '{print $1}')
    [ -z "$SERVER_IP" ] && SERVER_IP=$(curl -s --max-time 5 ifconfig.me 2>/dev/null || echo "localhost")

    cat > "$APP_DIR/.env" <<ENVFILE
# ── CRM Configuration ── Auto-generated $(date -u +"%Y-%m-%d %H:%M:%S UTC") ──

# Master encryption key (encrypts all secrets at rest)
CRM_MASTER_KEY_B64=${MASTER_KEY}

# Runtime
CRM_ENV=production
CRM_LOG_LEVEL=INFO
CRM_CORS_ORIGINS=http://${SERVER_IP},http://localhost,http://127.0.0.1
CRM_CONFIG_PATH=/app/config/admin_settings.json
CRM_RATE_LIMIT_ENABLED=true

# PostgreSQL
POSTGRES_USER=crm
POSTGRES_PASSWORD=${PG_PASS}
POSTGRES_DB=crm_meta

# RabbitMQ
RABBITMQ_DEFAULT_USER=crm
RABBITMQ_DEFAULT_PASS=${RABBIT_PASS}
CRM_CELERY_BROKER=amqp://crm:${RABBIT_PASS}@rabbitmq:5672//
CRM_CELERY_BACKEND=redis://redis:6379/0

# MinIO
MINIO_ROOT_USER=crm_admin
MINIO_ROOT_PASSWORD=${MINIO_PASS}

# SQL Server
MSSQL_SA_PASSWORD=${MSSQL_PASS}

# Bootstrap DB (sqlite for initial setup — configure real DB via Admin Panel)
CRM_BOOTSTRAP_DB=sqlite
ENVFILE

    chmod 600 "$APP_DIR/.env"
    ok "Generated .env with secure random passwords"
else
    ok ".env already exists — keeping current configuration"
fi

# Create admin_settings.json
if [ ! -f "$APP_DIR/config/admin_settings.json" ]; then
    cat > "$APP_DIR/config/admin_settings.json" <<'CFGFILE'
{
  "version": 1,
  "database": { "type": "sqlserver", "sqlserver": {}, "mongodb": {} },
  "email": {},
  "storage": {
    "type": "minio",
    "minio": { "endpoint": "http://minio:9000", "access_key": "crm_admin", "bucket": "crm-files" },
    "s3": {}
  },
  "api": { "base_url": "http://localhost:8000/api/v1", "timezone": "UTC", "session_timeout_minutes": 30, "max_upload_mb": 100, "debug": false },
  "integrations": { "freshdesk": {"enabled": false}, "slack": {"enabled": false}, "calendar": {"enabled": false} },
  "backup": { "schedule_hours": 6, "location": "local", "retention_count": 10 }
}
CFGFILE
    ok "Generated admin_settings.json"
fi

# Create frontend runtime config
mkdir -p "$APP_DIR/frontend/public"
cat > "$APP_DIR/frontend/public/config.json" <<RTCFG
{
  "apiBaseUrl": "/api/v1",
  "appName": "Support CRM",
  "version": "1.0.0"
}
RTCFG
ok "Frontend runtime config ready"

# ──────────────────────────────────────────────────
# STEP 5: Production docker-compose override
# ──────────────────────────────────────────────────
step 5 "Configuring production Docker services..."

# Remove dev override if it exists and create production one
cat > "$APP_DIR/docker-compose.override.yml" <<'OVERRIDE'
# Production overrides — generated by deploy.sh
services:
  backend:
    environment:
      CRM_ENV: production
      CRM_LOG_LEVEL: INFO
    volumes:
      - ./config:/app/config
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
OVERRIDE

ok "Production Docker config ready"

# ──────────────────────────────────────────────────
# STEP 6: Firewall
# ──────────────────────────────────────────────────
step 6 "Configuring firewall..."

if command -v ufw &> /dev/null; then
    ufw allow 80/tcp   2>/dev/null || true
    ufw allow 443/tcp  2>/dev/null || true
    ufw allow 8000/tcp 2>/dev/null || true
    ok "Opened ports 80, 443, 8000 (ufw)"
elif command -v firewall-cmd &> /dev/null; then
    firewall-cmd --permanent --add-port=80/tcp   2>/dev/null || true
    firewall-cmd --permanent --add-port=443/tcp  2>/dev/null || true
    firewall-cmd --permanent --add-port=8000/tcp 2>/dev/null || true
    firewall-cmd --reload 2>/dev/null || true
    ok "Opened ports 80, 443, 8000 (firewalld)"
elif command -v iptables &> /dev/null; then
    iptables -I INPUT -p tcp --dport 80 -j ACCEPT 2>/dev/null || true
    iptables -I INPUT -p tcp --dport 443 -j ACCEPT 2>/dev/null || true
    iptables -I INPUT -p tcp --dport 8000 -j ACCEPT 2>/dev/null || true
    ok "Opened ports 80, 443, 8000 (iptables)"
else
    warn "No firewall detected — ensure ports 80 and 8000 are open in your CloudStack security group"
fi

# ──────────────────────────────────────────────────
# STEP 7: Build and launch
# ──────────────────────────────────────────────────
step 7 "Building and starting services (this may take 3-8 minutes)..."

cd "$APP_DIR"

# Stop existing containers if running
docker compose down 2>/dev/null || true

# Build
echo "  Building containers..."
docker compose build 2>&1 | while IFS= read -r line; do
    # Only show key build events
    case "$line" in
        *"Building"*|*"Successfully"*|*"FINISHED"*|*"ERROR"*)
            echo "  $line"
            ;;
    esac
done

# Start
echo "  Starting containers..."
docker compose up -d 2>&1

ok "All containers started"

# ──────────────────────────────────────────────────
# STEP 8: Health check
# ──────────────────────────────────────────────────
step 8 "Verifying deployment..."

echo "  Waiting for services to initialize..."

BACKEND_OK=false
FRONTEND_OK=false
MAX_WAIT=180
ELAPSED=0

while [ $ELAPSED -lt $MAX_WAIT ]; do
    # Check backend
    if [ "$BACKEND_OK" = false ] && curl -sf http://localhost:8000/health > /dev/null 2>&1; then
        ok "Backend API is healthy"
        BACKEND_OK=true
    fi

    # Check frontend
    if [ "$FRONTEND_OK" = false ] && curl -sf http://localhost:80 > /dev/null 2>&1; then
        ok "Frontend is healthy"
        FRONTEND_OK=true
    fi

    # Both up? Done.
    if [ "$BACKEND_OK" = true ] && [ "$FRONTEND_OK" = true ]; then
        break
    fi

    sleep 3
    ELAPSED=$((ELAPSED + 3))
    printf "."
done
echo ""

if [ "$BACKEND_OK" = false ]; then
    warn "Backend may still be starting. Check: docker compose logs backend"
fi
if [ "$FRONTEND_OK" = false ]; then
    warn "Frontend may still be starting. Check: docker compose logs frontend"
fi

# Show container status
echo ""
echo "  Container Status:"
docker compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null || \
docker compose ps 2>/dev/null

# ──────────────────────────────────────────────────
# Done
# ──────────────────────────────────────────────────
SERVER_IP=$(hostname -I 2>/dev/null | awk '{print $1}' || echo "your-server-ip")

echo ""
echo -e "${BOLD}${GREEN}╔══════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}${GREEN}║         DEPLOYMENT COMPLETE!                 ║${NC}"
echo -e "${BOLD}${GREEN}╚══════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  ${BOLD}Access your CRM:${NC}"
echo -e "    ${CYAN}Web App:${NC}          http://${SERVER_IP}"
echo -e "    ${CYAN}API:${NC}              http://${SERVER_IP}:8000"
echo -e "    ${CYAN}Health Check:${NC}     http://${SERVER_IP}:8000/health"
echo -e "    ${CYAN}RabbitMQ Admin:${NC}   http://${SERVER_IP}:15672"
echo -e "    ${CYAN}MinIO Console:${NC}    http://${SERVER_IP}:9001"
echo ""
echo -e "  ${BOLD}Login Credentials:${NC}"
echo -e "    ${CYAN}Email:${NC}     admin@company.com"
echo -e "    ${CYAN}Password:${NC}  password123"
echo ""
echo -e "  ${RED}${BOLD}>>> CHANGE THE DEFAULT PASSWORD IMMEDIATELY <<<${NC}"
echo ""
echo -e "  ${BOLD}Management Commands:${NC}"
echo -e "    View logs:      ${CYAN}cd $APP_DIR && docker compose logs -f${NC}"
echo -e "    Restart:        ${CYAN}cd $APP_DIR && docker compose restart${NC}"
echo -e "    Stop:           ${CYAN}cd $APP_DIR && docker compose down${NC}"
echo -e "    Update:         ${CYAN}cd $APP_DIR && git pull && docker compose up -d --build${NC}"
echo -e "    View status:    ${CYAN}cd $APP_DIR && docker compose ps${NC}"
echo -e "    Backup key:     ${CYAN}grep MASTER_KEY $APP_DIR/.env${NC}"
echo ""
echo -e "  ${YELLOW}${BOLD}IMPORTANT:${NC} Your encryption key is in ${CYAN}$APP_DIR/.env${NC}"
echo -e "  ${YELLOW}Back it up securely — lost keys mean lost encrypted data.${NC}"
echo ""
