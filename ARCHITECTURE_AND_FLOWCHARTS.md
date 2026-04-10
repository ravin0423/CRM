# VISUAL ARCHITECTURE & DEPLOYMENT FLOWCHART

## 🎯 SYSTEM ARCHITECTURE DIAGRAM

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          END USER'S MACHINE                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────┐     │
│  │                     WEB BROWSER                              │     │
│  │  (React 18 + TypeScript + Tailwind CSS + shadcn/ui)         │     │
│  │                                                              │     │
│  │  ├─ Dashboard (View KPIs, analytics)                        │     │
│  │  ├─ Tickets (Support tickets management)                    │     │
│  │  ├─ CRM (Contacts, deals, activities)                       │     │
│  │  ├─ Knowledge Base (Articles, search)                       │     │
│  │  ├─ Chatbot Widget (AI-powered)                             │     │
│  │  ├─ Admin Panel (ALL CONFIGURATION HERE)                    │     │
│  │  └─ Reports (Custom dashboards)                             │     │
│  └────────────┬──────────────────────────────────────────────┬─┘     │
│               │ HTTP/HTTPS (TLS 1.3)                          │       │
└───────────────┼────────────────────────────────────────────┬──┘───────┘
                │                                            │
┌───────────────┼────────────────────────────────────────────┼──────────┐
│  DOCKER COMPOSE (or AWS)                                   │          │
├───────────────┼────────────────────────────────────────────┼──────────┤
│               │                                            │          │
│  ┌────────────▼──────────────────────────────────────────┐ │          │
│  │         NGINX REVERSE PROXY                           │ │          │
│  │  (Port 80/443 - HTTP/HTTPS)                          │ │          │
│  └────────────┬──────────────────────────────────────────┘ │          │
│               │                                             │          │
│  ┌────────────▼──────────────────────────────────────────┐ │          │
│  │      FASTAPI BACKEND (Python)                        │ │          │
│  │                                                      │ │          │
│  │  API Routes:                                        │ │          │
│  │  ├─ POST /api/v1/auth/login                        │ │          │
│  │  ├─ POST /api/v1/tickets (create)                  │ │          │
│  │  ├─ GET  /api/v1/tickets (list)                    │ │          │
│  │  ├─ POST /api/v1/contacts                          │ │          │
│  │  ├─ POST /api/v1/chat/message                      │ │          │
│  │  ├─ POST /api/v1/admin/settings (admin only)       │ │          │
│  │  ├─ POST /api/v1/import/freshdesk                  │ │          │
│  │  └─ GET  /api/v1/admin/health (system status)      │ │          │
│  │                                                      │ │          │
│  │  Authentication:                                    │ │          │
│  │  ├─ JWT Token Generation                           │ │          │
│  │  ├─ Role-Based Access Control                      │ │          │
│  │  └─ Admin-Only Endpoints Protection                │ │          │
│  └────────────┬──────────────────────────────────────┬─┘ │          │
│               │                                      │    │          │
│    ┌──────────▼──────────┐              ┌──────────▼────┐│          │
│    │ Configuration Manager│              │ Business Logic│││          │
│    │                     │              │               │││          │
│    │ Loads settings from:│              │ ├─ Ticket Mgmt││          │
│    │ 1. Admin Settings   │              │ ├─ CRM Logic  ││          │
│    │    (database)       │              │ ├─ Email Send ││          │
│    │ 2. Environment Vars │              │ ├─ Workflows  ││          │
│    │    (fallback)       │              │ ├─ Analytics  ││          │
│    │ 3. Config File      │              │ ├─ Chatbot    ││          │
│    │    (JSON)           │              │ └─ Freshdesk  ││          │
│    │                     │              │    Import     ││          │
│    └──────────┬──────────┘              └──────┬────────┘│          │
│               │                                │         │          │
│               └────┬───────────────────────────┘         │          │
│                    │                                     │          │
│  ┌─────────────────▼──────────────────────────────────┐ │          │
│  │         DATA ACCESS LAYER (DAL)                   │ │          │
│  │                                                  │ │          │
│  │  Database Abstraction:                          │ │          │
│  │  ├─ SQLAlchemy (for SQL Server)                 │ │          │
│  │  └─ PyMongo/Motor (for MongoDB)                 │ │          │
│  │                                                  │ │          │
│  │  Smart routing based on admin settings:         │ │          │
│  │  ┌──────────────────────────────────────┐       │ │          │
│  │  │ Is Database = SQL Server?            │       │ │          │
│  │  │ YES → Use SQLAlchemy ORM             │       │ │          │
│  │  │ NO  → Use PyMongo                    │       │ │          │
│  │  └──────────────────────────────────────┘       │ │          │
│  └────┬────────────────────────────────────┬───────┘ │          │
│       │                                    │         │          │
└───────┼────────────────────────────────────┼─────────┘          │
        │                                    │
   OPTION 1                            OPTION 2
   SQL SERVER                          MONGODB
        │                                    │
  ┌─────▼──────────┐                 ┌─────▼──────────┐
  │ SQL Server     │                 │ MongoDB        │
  │ Express        │                 │ (Local or      │
  │ (Windows/Linux)│                 │  Hosted)       │
  │                │                 │                │
  │ Database:      │                 │ Database:      │
  │ CRM_Production │                 │ crm_production │
  │                │                 │                │
  │ Connection     │                 │ Connection     │
  │ String:        │                 │ String:        │
  │ (Admin         │                 │ (Admin         │
  │  Configured)   │                 │  Configured)   │
  └────────────────┘                 └────────────────┘
```

---

## 🔄 DATA FLOW DIAGRAM

```
┌─────────────────────────────────────────────────────────────┐
│ USER INTERACTION                                            │
└──────────────────────┬──────────────────────────────────────┘
                       │
              ┌────────▼────────┐
              │ React Frontend  │
              │ (Vite + React)  │
              └────────┬────────┘
                       │
          ┌────────────▼────────────┐
          │ API Request             │
          │ (HTTP/HTTPS)            │
          │ Authorization: Bearer   │
          │ <JWT_TOKEN>             │
          └────────────┬────────────┘
                       │
         ┌─────────────▼─────────────┐
         │ NGINX Reverse Proxy       │
         │ (Port 80/443)             │
         └─────────────┬─────────────┘
                       │
         ┌─────────────▼─────────────┐
         │ FastAPI Backend           │
         │ (Request Processing)      │
         └─────────────┬─────────────┘
                       │
    ┌──────────────────┼──────────────────┐
    │                  │                  │
    │              BRANCHING LOGIC:       │
    │                  │                  │
    └──────────────────┼──────────────────┘
                       │
    ┌──────────────────┴──────────────────┐
    │                                     │
 ┌──▼──────────┐                ┌────────▼──────┐
 │ Is Admin    │                │ Regular User  │
 │ Setting?    │                │ Operation?    │
 │             │                │               │
 │ YES         │                │ YES           │
 └──┬──────────┘                └────────┬──────┘
    │                                    │
    │                            ┌───────▼────────┐
    │                            │ Load/Check     │
    │                            │ Credentials    │
    │                            │ from JWT Token │
    │                            └───────┬────────┘
    │                                    │
┌───▼──────────────────────┐    ┌────────▼──────────┐
│ Load Admin Settings from │    │ Check RBAC Rules  │
│ Database/Config File     │    │ (Role-Based       │
│                          │    │  Access Control)  │
│ ├─ Database Type         │    │                   │
│ ├─ Database Credentials  │    │ ├─ Is Admin?      │
│ ├─ Email Settings        │    │ ├─ Is Agent?      │
│ ├─ Storage Settings      │    │ ├─ Is Customer?   │
│ ├─ API Config            │    │ └─ Permissions?   │
│ └─ Deployment Type       │    └────────┬──────────┘
└───┬──────────────────────┘             │
    │                                    │
    │                            ┌───────▼──────────┐
    │                            │ Route to        │
    │                            │ Appropriate      │
    │                            │ Business Logic   │
    │                            │ Handler          │
    │                            └───────┬──────────┘
    │                                    │
    └────────────┬─────────────────────┬─┘
                 │                     │
        ┌────────▼──────┐   ┌──────────▼───────┐
        │ Update Config │   │ Process Request  │
        │ in Database   │   │ (Create/Read/    │
        │               │   │  Update/Delete)  │
        │ ├─ Validate   │   │                  │
        │ ├─ Test Conn. │   │ ├─ Validate Input│
        │ ├─ Save       │   │ ├─ Execute Logic │
        │ └─ Confirm    │   │ ├─ Update DB     │
        │               │   │ └─ Log Action    │
        └────────┬──────┘   └──────────┬───────┘
                 │                     │
                 └────────┬────────────┘
                          │
             ┌────────────▼────────────┐
             │ Query/Update Database   │
             │                         │
             │ (Uses Config Manager    │
             │  to determine which DB  │
             │  to use)                │
             │                         │
             │ ├─ If SQL Server:       │
             │ │  Use SQLAlchemy ORM   │
             │ │  Execute T-SQL        │
             │ │                       │
             │ └─ If MongoDB:          │
             │    Use PyMongo          │
             │    Execute BSON Queries │
             └────────────┬────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
    ┌───▼──┐         ┌────▼───┐      ┌─────▼──┐
    │ Read │         │ Write  │      │ Delete │
    │ Data │         │ Data   │      │ Data   │
    └───┬──┘         └────┬───┘      └─────┬──┘
        │                 │                 │
        └─────────────────┼─────────────────┘
                          │
             ┌────────────▼────────────┐
             │ Response Formatting     │
             │                         │
             │ Convert DB result to    │
             │ JSON response           │
             │                         │
             │ ├─ Success Response     │
             │ │  {                    │
             │ │    success: true,     │
             │ │    data: {...}        │
             │ │  }                    │
             │ │                       │
             │ └─ Error Response       │
             │    {                    │
             │      success: false,    │
             │      error: {...}       │
             │    }                    │
             └────────────┬────────────┘
                          │
                ┌─────────▼─────────┐
                │ Return to Frontend│
                │ (HTTP Response)   │
                └─────────┬─────────┘
                          │
               ┌──────────▼──────────┐
               │ React Updates UI    │
               │ with Response Data  │
               │                     │
               │ ├─ Update State     │
               │ ├─ Re-render Comp.  │
               │ ├─ Show Success Msg │
               │ └─ Refresh Display  │
               └──────────┬──────────┘
                          │
                ┌─────────▼─────────┐
                │ USER SEES RESULT  │
                │ (Success/Error)   │
                └───────────────────┘
```

---

## 🚀 LOCAL DEPLOYMENT FLOW

```
START
  │
  ├─ Check Docker installed? 
  │  YES → Continue
  │  NO → Direct to Docker installation
  │
  ├─ docker-compose up
  │  │
  │  ├─ PostgreSQL starts (metadata cache)
  │  │  └─ Wait for healthy
  │  │
  │  ├─ Redis starts (caching)
  │  │  └─ Wait for healthy
  │  │
  │  ├─ RabbitMQ starts (task queue)
  │  │  └─ Wait for healthy
  │  │
  │  ├─ MinIO starts (file storage)
  │  │  └─ Wait for healthy
  │  │
  │  ├─ FastAPI Backend starts
  │  │  │
  │  │  ├─ Read /config/admin_settings.json
  │  │  │
  │  │  ├─ Check if first startup?
  │  │  │  YES → Create default admin user
  │  │  │  NO  → Load existing config
  │  │  │
  │  │  ├─ Connect to configured database
  │  │  │  ├─ If SQL Server: Use SQLAlchemy
  │  │  │  └─ If MongoDB: Use PyMongo
  │  │  │
  │  │  ├─ Check schema exists?
  │  │  │  YES → Skip
  │  │  │  NO  → Auto-create all tables
  │  │  │
  │  │  └─ Health check passes → Ready
  │  │
  │  └─ React Frontend starts (Vite dev server)
  │     │
  │     ├─ Compile TypeScript/React
  │     ├─ Start dev server on :3000
  │     └─ Hot reload enabled
  │
  ├─ Browser opens http://localhost:3000
  │  │
  │  ├─ Login page displayed
  │  │  Default: admin@company.com / password123
  │  │
  │  ├─ User enters credentials
  │  │
  │  ├─ Backend validates JWT
  │  │  └─ Session created in Redis
  │  │
  │  └─ Dashboard displayed
  │
  ├─ User clicks Settings gear icon
  │  │
  │  ├─ Admin Panel opens
  │  │
  │  ├─ Database Tab
  │  │  ├─ Shows current database type
  │  │  ├─ User selects SQL Server or MongoDB
  │  │  ├─ User enters connection details
  │  │  ├─ User clicks "Test Connection"
  │  │  │  └─ Backend tests connection
  │  │  │     ├─ Success → Green checkmark
  │  │  │     └─ Failure → Red error message
  │  │  └─ User clicks "Save"
  │  │     └─ Saved to admin_settings.json
  │  │
  │  ├─ Email Configuration Tab
  │  │  ├─ User enters SMTP details
  │  │  ├─ User clicks "Test Email"
  │  │  └─ Test email sent successfully
  │  │
  │  ├─ Storage Configuration Tab
  │  │  ├─ Select MinIO or AWS S3
  │  │  ├─ Enter credentials
  │  │  └─ Test connection
  │  │
  │  └─ Integration Tab
  │     ├─ Setup Freshdesk API key
  │     └─ Click "Start Import Wizard"
  │
  ├─ Freshdesk Import Wizard
  │  │
  │  ├─ Step 1: Connect Freshdesk
  │  │  ├─ Enter domain and API key
  │  │  └─ Backend connects to Freshdesk API
  │  │
  │  ├─ Step 2: Select what to import
  │  │  ├─ Checkboxes for Tickets, Contacts, Templates
  │  │  └─ User selects items
  │  │
  │  ├─ Step 3: Map fields
  │  │  ├─ Freshdesk status → CRM status
  │  │  ├─ Freshdesk priority → CRM priority
  │  │  └─ Auto-mapping available
  │  │
  │  ├─ Step 4: Review & confirm
  │  │  ├─ Show summary of data to import
  │  │  ├─ Warn about existing data (suggest backup)
  │  │  └─ User confirms
  │  │
  │  ├─ Step 5: Import progress
  │  │  ├─ Show progress bar
  │  │  ├─ Show current task
  │  │  ├─ Estimate time remaining
  │  │  └─ Backend:
  │  │     ├─ Fetch from Freshdesk API in batches
  │  │     ├─ Transform data to new schema
  │  │     ├─ Insert into configured database
  │  │     └─ Log all errors
  │  │
  │  └─ Step 6: Complete
  │     ├─ Show summary of imported data
  │     ├─ Show any errors encountered
  │     └─ Option to view imported data
  │
  ├─ System ready for use
  │  │
  │  ├─ Dashboard shows metrics
  │  ├─ Tickets ready to create
  │  ├─ Contacts imported and searchable
  │  ├─ Knowledge base articles available
  │  ├─ Chatbot ready for queries
  │  └─ Workflows can be created
  │
  └─ PRODUCTION READY ✓
```

---

## ☁️ AWS DEPLOYMENT FLOW

```
START FROM ADMIN PANEL
  │
  ├─ Click Settings → Deployment Tab
  │
  ├─ Select "AWS" from dropdown
  │
  ├─ Enter AWS Credentials
  │  ├─ AWS Access Key ID
  │  ├─ AWS Secret Access Key
  │  ├─ Region (us-east-1, etc.)
  │  └─ EC2 Instance Type (t3.medium, etc.)
  │
  ├─ Select Database Type
  │  ├─ AWS RDS with SQL Server
  │  └─ MongoDB Atlas (cloud-hosted)
  │
  ├─ Select Storage
  │  └─ AWS S3 Bucket
  │
  ├─ Click "Deploy to AWS"
  │
  ├─ Backend automation begins:
  │  │
  │  ├─ Validate AWS credentials
  │  │  └─ Connect to AWS API
  │  │
  │  ├─ Create VPC & Security Groups
  │  │  ├─ Port 80, 443 (HTTP/HTTPS) open
  │  │  ├─ Port 5432 (Database) locked
  │  │  └─ Port 9000 (MinIO) locked
  │  │
  │  ├─ Create EC2 Instance
  │  │  ├─ Type: Selected instance type
  │  │  ├─ AMI: Ubuntu 22.04 LTS
  │  │  ├─ Auto-install Docker
  │  │  ├─ Auto-install Docker Compose
  │  │  └─ Install application files
  │  │
  │  ├─ Create RDS Database
  │  │  ├─ Type: SQL Server or MongoDB Atlas
  │  │  ├─ Identifier: crm-production-db
  │  │  ├─ Username: (auto-generated random)
  │  │  ├─ Password: (auto-generated random, encrypted)
  │  │  ├─ Backup: Enabled (daily)
  │  │  └─ Multi-AZ: Enabled (for high availability)
  │  │
  │  ├─ Create S3 Bucket
  │  │  ├─ Name: crm-files-<account-id>
  │  │  ├─ Versioning: Enabled
  │  │  ├─ Public Access: Blocked
  │  │  └─ Server-side encryption: Enabled
  │  │
  │  ├─ Create IAM Role for EC2
  │  │  ├─ Permission: EC2 → RDS access
  │  │  ├─ Permission: EC2 → S3 access
  │  │  └─ Permission: CloudWatch logs
  │  │
  │  ├─ Setup CloudFront (CDN)
  │  │  ├─ Distribution for S3 bucket
  │  │  ├─ Enable compression
  │  │  └─ Cache policy: Optimized for web
  │  │
  │  ├─ Configure Route53 (DNS)
  │  │  ├─ Create subdomain record
  │  │  ├─ Point to CloudFront distribution
  │  │  └─ Enable SSL/TLS
  │  │
  │  ├─ Deploy Application
  │  │  ├─ SSH into EC2 instance
  │  │  ├─ Docker Compose up
  │  │  ├─ Services start:
  │  │  │  ├─ FastAPI (port 8000)
  │  │  │  ├─ React (compiled static)
  │  │  │  ├─ Nginx (reverse proxy)
  │  │  │  └─ Health checks
  │  │  │
  │  │  ├─ Application Configuration
  │  │  │  ├─ Inject RDS credentials
  │  │  │  ├─ Inject S3 bucket credentials
  │  │  │  ├─ Set domain name
  │  │  │  └─ Enable HTTPS
  │  │  │
  │  │  └─ Create admin user (unique password)
  │  │
  │  ├─ Setup Monitoring & Alerts
  │  │  ├─ CloudWatch for metrics
  │  │  ├─ CloudWatch Logs for application logs
  │  │  ├─ SNS notifications for alerts
  │  │  └─ Auto-restart on failure
  │  │
  │  ├─ Setup Automatic Backups
  │  │  ├─ RDS daily snapshots
  │  │  ├─ S3 versioning for files
  │  │  └─ Cross-region replication option
  │  │
  │  └─ Send Email to Admin
  │     ├─ Application URL
  │     ├─ Admin email: admin@company.com
  │     ├─ Admin password: (temporary, must change on first login)
  │     ├─ Cost estimate (monthly AWS charges)
  │     └─ Support contact info
  │
  ├─ Deployment progress shown in Admin Panel
  │  ├─ Step 1/8: Creating VPC...
  │  ├─ Step 2/8: Creating EC2...
  │  ├─ Step 3/8: Creating RDS...
  │  ├─ Step 4/8: Creating S3...
  │  ├─ Step 5/8: Deploying application...
  │  ├─ Step 6/8: Setting up monitoring...
  │  ├─ Step 7/8: Running tests...
  │  └─ Step 8/8: Complete!
  │
  ├─ Admin Panel Deployment Tab Updated
  │  ├─ Environment: ● AWS (Running)
  │  ├─ Public URL: crm.mycompany.com
  │  ├─ Database: RDS SQL Server
  │  ├─ Storage: AWS S3
  │  ├─ Status: ✓ All Services Healthy
  │  ├─ CPU Usage: 15%
  │  ├─ Memory Usage: 2.3 GB / 4 GB
  │  ├─ Monthly Cost: $127.45
  │  │
  │  └─ Management Options:
  │     ├─ [Stop Deployment]
  │     ├─ [Restart Services]
  │     ├─ [Scale Up/Down]
  │     ├─ [View Logs]
  │     ├─ [Backup Now]
  │     └─ [Destroy & Delete]
  │
  └─ AWS DEPLOYMENT COMPLETE ✓
```

---

## 🔄 DATABASE SWITCHING FLOW

```
SCENARIO: User wants to switch from SQL Server to MongoDB

  ├─ Admin clicks Settings → Database Tab
  │
  ├─ Current database shown: SQL Server
  │
  ├─ Admin selects MongoDB from dropdown
  │
  ├─ Admin enters MongoDB connection string:
  │  mongodb://user:pass@mongohost:27017/crm_db
  │
  ├─ Admin clicks "Test Connection"
  │  └─ Backend validates MongoDB connection
  │     ├─ Success → ✓ Green checkmark
  │     └─ Failure → ✗ Red error
  │
  ├─ Admin sees warning:
  │  "⚠️ Switching databases will migrate all data.
  │   This may take several minutes.
  │   Backup will be created before migration.
  │   Continue?"
  │
  ├─ Admin clicks "Yes, Migrate"
  │
  ├─ Backend starts migration:
  │  │
  │  ├─ Create backup of current database
  │  │
  │  ├─ Connect to MongoDB
  │  │
  │  ├─ For each table in SQL Server:
  │  │  │
  │  │  ├─ Read all rows from SQL Server
  │  │  ├─ Convert schema to MongoDB format:
  │  │  │  ├─ Relational → Document-based
  │  │  │  ├─ Foreign keys → References
  │  │  │  └─ Custom fields → JSONB → JSON object
  │  │  │
  │  │  ├─ Insert into MongoDB collection
  │  │  ├─ Create indexes
  │  │  └─ Verify data integrity
  │  │
  │  ├─ Migrate admin settings
  │  │  └─ Update /config/admin_settings.json
  │  │     ├─ database_type: "MongoDB"
  │  │     └─ database_url: "mongodb://..."
  │  │
  │  ├─ Restart FastAPI backend
  │  │  └─ Now uses PyMongo instead of SQLAlchemy
  │  │
  │  └─ Verify connection
  │     ├─ Test read operation
  │     ├─ Test write operation
  │     └─ Success → ✓ Migration complete
  │
  ├─ Admin sees success message:
  │  "✓ Successfully migrated to MongoDB
  │   1,234 tickets migrated
  │   567 contacts migrated
  │   All data verified
  │   System is ready to use"
  │
  └─ System now uses MongoDB ✓

  REVERSE SCENARIO (MongoDB → SQL Server):
  Same process in reverse
  └─ System now uses SQL Server ✓
```

---

## 🔌 STORAGE SWITCHING FLOW

```
SCENARIO: User wants to switch from MinIO to AWS S3

  ├─ Admin clicks Settings → Storage Tab
  │
  ├─ Current storage shown: MinIO (Local)
  │
  ├─ Admin selects "AWS S3" from dropdown
  │
  ├─ Admin enters AWS credentials:
  │  ├─ AWS Access Key
  │  ├─ AWS Secret Key
  │  ├─ Region: us-east-1
  │  └─ Bucket Name: my-crm-files
  │
  ├─ Admin clicks "Test Connection"
  │  └─ Backend validates S3 connection
  │
  ├─ Admin sees warning:
  │  "⚠️ Switching storage will copy all files to S3.
  │   Existing files in MinIO will be archived.
  │   Continue?"
  │
  ├─ Admin clicks "Yes, Migrate"
  │
  ├─ Backend starts migration:
  │  │
  │  ├─ List all files in MinIO
  │  │
  │  ├─ Create S3 bucket (if doesn't exist)
  │  │
  │  ├─ For each file in MinIO:
  │  │  │
  │  │  ├─ Download from MinIO
  │  │  ├─ Upload to S3
  │  │  ├─ Verify checksum
  │  │  ├─ Update database references
  │  │  │  ├─ Old path: http://localhost:9000/files/123.pdf
  │  │  │  └─ New path: https://s3.amazonaws.com/bucket/files/123.pdf
  │  │  │
  │  │  └─ Delete from MinIO
  │  │
  │  ├─ Archive MinIO bucket (keep for reference)
  │  │
  │  ├─ Update configuration file
  │  │  ├─ storage_type: "S3"
  │  │  ├─ s3_bucket: "my-crm-files"
  │  │  └─ s3_region: "us-east-1"
  │  │
  │  ├─ Restart backend
  │  │  └─ Now uses S3 SDK
  │  │
  │  └─ Verify all file links work
  │
  ├─ Admin sees success message:
  │  "✓ Successfully migrated to AWS S3
  │   1,245 files migrated (4.3 GB)
  │   All file references updated
  │   MinIO archived locally"
  │
  └─ System now uses AWS S3 ✓

  REVERSE SCENARIO (S3 → MinIO):
  Same process in reverse
  └─ System now uses MinIO ✓
```

---

## 📊 ADMIN SETTINGS PRIORITY & DEPENDENCIES

```
INITIALIZATION ORDER:

1. JWT_SECRET_KEY (Generated on first startup if missing)
2. DATABASE Configuration (Must work before anything else)
   └─ Dependency: Nothing
   └─ Impact: ALL other components

3. REDIS Configuration (Optional, but recommended)
   └─ Dependency: Nothing
   └─ Impact: Caching, session storage

4. EMAIL Configuration (Optional for notifications)
   └─ Dependency: DATABASE
   └─ Impact: Email notifications, password resets

5. STORAGE Configuration (Optional, files work without)
   └─ Dependency: DATABASE
   └─ Impact: File uploads, attachments

6. FRESHDESK Configuration (Optional, only for import)
   └─ Dependency: DATABASE, STORAGE
   └─ Impact: Data import feature

7. CHATBOT Configuration (Optional, can disable)
   └─ Dependency: DATABASE, STORAGE, KNOWLEDGE BASE
   └─ Impact: AI chatbot feature

VALIDATION FLOW:

Before using any feature:
  │
  ├─ Check: Is required component configured?
  │  YES → Use feature
  │  NO  → Show error message with link to Admin Panel
  │
  ├─ Example: User tries to upload file
  │  └─ Check: Is STORAGE configured?
  │     NO  → Show "File storage not configured.
  │            Go to Admin > Storage to configure."
  │
  └─ Example: User tries to send email
     └─ Check: Is EMAIL configured?
        NO  → Show "Email service not configured.
               Go to Admin > Email to configure."
```

---

**FLOWCHART VERSION:** 1.0  
**DIAGRAMS CREATED:** April 10, 2026  
**PURPOSE:** Visual reference for deployment and architecture understanding
