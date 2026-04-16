FROM python:3.11-slim-bookworm AS base

# System deps for pyodbc (SQL Server driver) and native builds
# Uses modern GPG keyring (apt-key was removed in Debian 12+)
RUN set -eux; \
    apt-get update; \
    apt-get install -y --no-install-recommends \
        curl gnupg2 apt-transport-https build-essential unixodbc-dev; \
    # MSSQL ODBC driver (amd64 only)
    ARCH="$(dpkg --print-architecture)"; \
    if [ "$ARCH" = "amd64" ]; then \
        curl -fsSL https://packages.microsoft.com/keys/microsoft.asc \
            | gpg --dearmor -o /usr/share/keyrings/microsoft-prod.gpg; \
        echo "deb [arch=amd64 signed-by=/usr/share/keyrings/microsoft-prod.gpg] https://packages.microsoft.com/debian/12/prod bookworm main" \
            > /etc/apt/sources.list.d/mssql-release.list; \
        apt-get update; \
        ACCEPT_EULA=Y apt-get install -y --no-install-recommends msodbcsql18; \
    else \
        echo "WARN: MSSQL ODBC driver not available for $ARCH — skipping"; \
    fi; \
    # Clean up build-only deps but keep curl for healthchecks
    apt-get purge -y --auto-remove gnupg2 apt-transport-https; \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

# Production: no --reload, 4 workers, graceful shutdown
CMD ["uvicorn", "app.main:app", \
     "--host", "0.0.0.0", \
     "--port", "8000", \
     "--workers", "4", \
     "--access-log", \
     "--timeout-keep-alive", "30"]
