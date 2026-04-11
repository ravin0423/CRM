-- Canonical relational schema (SQL Server flavour).
-- Auto-applied by app.db.sqlserver_adapter.ensure_schema() on first startup.
-- Mongo uses analogous collections with the same field names.

CREATE TABLE users (
    id              BIGINT IDENTITY PRIMARY KEY,
    email           NVARCHAR(255) NOT NULL UNIQUE,
    password_hash   NVARCHAR(255) NOT NULL,
    name            NVARCHAR(255) NOT NULL,
    role            NVARCHAR(32)  NOT NULL DEFAULT 'agent',
    status          NVARCHAR(32)  NOT NULL DEFAULT 'active',
    must_change_pw  BIT           NOT NULL DEFAULT 0,
    created_at      DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME()
);

CREATE TABLE tickets (
    id              BIGINT IDENTITY PRIMARY KEY,
    ticket_number   NVARCHAR(32) NOT NULL UNIQUE,
    subject         NVARCHAR(500) NOT NULL,
    description     NVARCHAR(MAX) NULL,
    status          NVARCHAR(32) NOT NULL DEFAULT 'open',
    priority        NVARCHAR(32) NOT NULL DEFAULT 'medium',
    customer_id     BIGINT NULL,
    agent_id        BIGINT NULL,
    created_at      DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at      DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    resolved_at     DATETIME2 NULL
);

CREATE TABLE ticket_comments (
    id          BIGINT IDENTITY PRIMARY KEY,
    ticket_id   BIGINT NOT NULL,
    user_id     BIGINT NOT NULL,
    content     NVARCHAR(MAX) NOT NULL,
    is_internal BIT NOT NULL DEFAULT 0,
    created_at  DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);

CREATE TABLE contacts (
    id              BIGINT IDENTITY PRIMARY KEY,
    email           NVARCHAR(255) NOT NULL,
    phone           NVARCHAR(64) NULL,
    name            NVARCHAR(255) NULL,
    company         NVARCHAR(255) NULL,
    lifecycle_stage NVARCHAR(32) NULL,
    created_at      DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);

CREATE TABLE deals (
    id          BIGINT IDENTITY PRIMARY KEY,
    contact_id  BIGINT NOT NULL,
    name        NVARCHAR(255) NOT NULL,
    amount      DECIMAL(18,2) NULL,
    stage       NVARCHAR(32) NOT NULL,
    probability INT NULL,
    created_at  DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);

CREATE TABLE knowledge_articles (
    id          BIGINT IDENTITY PRIMARY KEY,
    title       NVARCHAR(500) NOT NULL,
    slug        NVARCHAR(500) NOT NULL UNIQUE,
    content     NVARCHAR(MAX) NOT NULL,
    status      NVARCHAR(32) NOT NULL DEFAULT 'draft',
    views_count INT NOT NULL DEFAULT 0,
    created_at  DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);

CREATE TABLE workflows (
    id          BIGINT IDENTITY PRIMARY KEY,
    name        NVARCHAR(255) NOT NULL,
    trigger_type NVARCHAR(64) NOT NULL,
    conditions  NVARCHAR(MAX) NOT NULL,  -- JSON
    actions     NVARCHAR(MAX) NOT NULL,  -- JSON
    enabled     BIT NOT NULL DEFAULT 1,
    created_at  DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);

CREATE TABLE chat_conversations (
    id          BIGINT IDENTITY PRIMARY KEY,
    user_id     BIGINT NULL,
    messages    NVARCHAR(MAX) NOT NULL,  -- JSON
    created_at  DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    resolved    BIT NOT NULL DEFAULT 0
);

CREATE TABLE admin_settings (
    id              BIGINT IDENTITY PRIMARY KEY,
    setting_key     NVARCHAR(255) NOT NULL UNIQUE,
    setting_value   NVARCHAR(MAX) NOT NULL,
    updated_at      DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);

CREATE TABLE audit_log (
    id          BIGINT IDENTITY PRIMARY KEY,
    user_id     BIGINT NULL,
    action      NVARCHAR(255) NOT NULL,
    entity_type NVARCHAR(64) NOT NULL,
    entity_id   NVARCHAR(64) NULL,
    timestamp   DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);
