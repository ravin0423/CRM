#!/bin/sh
# Auto-create default admin_settings.json if not mounted/present
CONFIG="${CRM_CONFIG_PATH:-/app/config/admin_settings.json}"
if [ ! -f "$CONFIG" ]; then
  mkdir -p "$(dirname "$CONFIG")"
  cat > "$CONFIG" <<'EOF'
{
  "version": 1,
  "database": { "type": "sqlserver", "sqlserver": {}, "mongodb": {} },
  "email": {},
  "storage": { "type": "minio", "minio": {}, "s3": {} },
  "api": {},
  "integrations": {},
  "backup": {}
}
EOF
  echo "Created default $CONFIG"
fi

exec "$@"
