# PRODUCTION-READY INTERNAL SUPPORT CRM SYSTEM
## Complete Implementation Prompt for Claude Code

**Project Version:** 1.0  
**Target Environment:** Local + AWS  
**Database Options:** SQL Server Express + MongoDB (Switchable)  
**Storage:** MinIO (Local)  
**Knowledge Level Required:** ZERO - No coding knowledge needed

---

## 🎯 PROJECT OVERVIEW

Build a complete, production-ready Support CRM system that:
- ✅ Consolidates Freshdesk, Salesforce, and Zoho CRM features
- ✅ Works 100% locally on any machine
- ✅ Supports deployment to AWS (EC2, RDS, S3)
- ✅ Uses either SQL Server Express OR MongoDB (user can switch in Admin Panel)
- ✅ Stores files in MinIO (self-hosted or S3-compatible)
- ✅ Has ZERO hardcoded configurations (all in Admin Settings)
- ✅ Imports data from Freshdesk exports
- ✅ Requires no coding knowledge to operate
- ✅ Has intuitive Admin Panel for all settings

---

## 🏗️ SYSTEM ARCHITECTURE

### Technology Stack (Non-Negotiable)

**Frontend:**
- React 18 with TypeScript
- Vite (build tool)
- Tailwind CSS + shadcn/ui (UI components)
- TanStack Query (data fetching)
- Zustand (state management)
- **NO hardcoded API URLs or database connections**

**Backend:**
- FastAPI (Python 3.11+)
- Dual Database Support (SQL Server Express + MongoDB)
- Celery + RabbitMQ (async tasks)
- Redis (caching)
- **ALL configuration via Admin Panel**

**Storage:**
- MinIO (S3-compatible object storage)
- Local storage or AWS S3

**Infrastructure:**
- Docker Compose (for local development)
- Docker (containerization)
- Can be deployed to AWS EC2 with RDS/MongoDB Atlas

---

## 📋 PART 1: DATABASE CONFIGURATION (NO HARDCODING)

### Requirement: Multi-Database Support

#### Database Option 1: SQL Server Express (Windows/Linux)
```
Connection String Format (stored in Admin Panel):
Server=<admin-configured-server>
Database=<admin-configured-database>
User ID=<admin-configured-user>
Password=<admin-configured-password>
```

#### Database Option 2: MongoDB (Local or Remote)
```
Connection String Format (stored in Admin Panel):
mongodb://<admin-configured-user>:<admin-configured-password>@<admin-configured-host>:<admin-configured-port>/<admin-configured-database>
```

### Implementation Requirements:

1. **Admin Settings Panel** (Frontend)
   - Simple toggle: "Use SQL Server" vs "Use MongoDB"
   - Text fields for database connection strings
   - "Test Connection" button that validates connection
   - "Save Configuration" button
   - Display current database status
   - Show last successful connection time

2. **Backend Configuration Manager**
   - Single configuration file in `/config/database_config.json` (stores admin-configured values)
   - On startup, load configuration from this file
   - Environment variables as fallback (for local development)
   - API endpoints to read/update configuration (protected by admin authentication)

3. **Database Abstraction Layer**
   - Create interface that works with BOTH databases
   - SQLAlchemy for SQL Server
   - PyMongo/Motor for MongoDB
   - Single query interface that works regardless of selected database

---

## 📦 PART 2: LOCAL DEPLOYMENT SETUP

### Requirements: Everything runs on user's machine

#### Docker Compose for Local Development
```yaml
Services Required:
1. PostgreSQL (for session/cache metadata - read-only from main DB)
2. Redis (caching layer)
3. RabbitMQ (async task queue)
4. MinIO (local file storage)
5. FastAPI Backend
6. React Frontend
7. MongoDB (optional, if user chooses MongoDB)
```

**Key Requirement:** User can install and run everything with:
```bash
docker-compose up
```

#### Local Installation Guide (for non-Docker users)

1. **SQL Server Express Installation**
   - Provide step-by-step installer guide (Windows/Linux)
   - Point to official Microsoft download page
   - Instructions to create database and user

2. **MongoDB Installation** (Alternative)
   - Provide step-by-step installer guide
   - Point to official MongoDB download
   - Instructions to create database and user

3. **MinIO Installation** (File Storage)
   - Standalone executable
   - Simple start command
   - Default credentials (admin can change in panel)

4. **Backend Python Setup**
   - Python 3.11+ required
   - `pip install -r requirements.txt`
   - Run: `python main.py`

5. **Frontend Setup**
   - Node.js 18+ required
   - `npm install`
   - Run: `npm run dev`

---

## ☁️ PART 3: AWS DEPLOYMENT

### Requirements: One-click deployment to AWS

#### Supported AWS Services:
- **Database:** RDS (SQL Server or MongoDB Atlas)
- **Storage:** S3 (instead of MinIO)
- **Compute:** EC2 (or Elastic Beanstalk)
- **Cache:** ElastiCache (instead of Redis)

#### Implementation:
1. **Admin Panel "Deployment Settings"**
   - Dropdown: "Local" vs "AWS"
   - AWS credentials input (Access Key, Secret Key, Region)
   - Option to switch between local MinIO and AWS S3
   - Deployment button with progress tracking

2. **Deployment Script**
   - Single script that handles AWS setup
   - Creates EC2 instance
   - Sets up RDS database
   - Configures S3 bucket
   - Deploys application

---

## 🔧 PART 4: ADMIN SETTINGS PANEL

### Complete Admin Panel Requirements (No coding needed)

The Admin Panel is the SINGLE PLACE where all configuration happens:

#### Tab 1: Database Configuration
```
Database Type: [SQL Server ▼] [Test Connection] [Save]
Status: ● Connected
Last Sync: 2 minutes ago

SQL Server Settings (if selected):
├─ Server: [__________________]
├─ Database Name: [__________________]
├─ Username: [__________________]
├─ Password: [__________________] [Show/Hide]
└─ Port: [1433        ]

MongoDB Settings (if selected):
├─ Connection String: [______________________________________]
├─ Database Name: [__________________]
└─ [Parse URL]

⚠️ Changing databases will require data migration. Continue? [Yes/No]
```

#### Tab 2: Email Configuration
```
SMTP Server: [__________________]
SMTP Port: [587        ]
SMTP Username: [__________________]
SMTP Password: [__________________] [Show/Hide]
From Email: [__________________]
From Name: [__________________]
[Test Email] [Save]
```

#### Tab 3: File Storage Configuration
```
Storage Type: [Local MinIO ▼] [AWS S3 ▼]

If MinIO Selected:
├─ MinIO Server URL: [http://localhost:9000]
├─ Access Key: [__________________]
├─ Secret Key: [__________________] [Show/Hide]
├─ Bucket Name: [__________________]
└─ [Test Connection]

If S3 Selected:
├─ AWS Access Key: [__________________]
├─ AWS Secret Key: [__________________] [Show/Hide]
├─ Region: [us-east-1 ▼]
├─ Bucket Name: [__________________]
└─ [Test Connection]

Current Storage: ● MinIO
Used Space: 2.3 GB / 1 TB
[Manage Buckets] [Backup Now]
```

#### Tab 4: API Configuration
```
API Base URL: [http://localhost:8000/api/v1]
Timezone: [UTC ▼]
Session Timeout (minutes): [30]
Max File Upload Size (MB): [100]
Enable Debug Mode: [ ] Checkbox
[Save] [Reset to Defaults]
```

#### Tab 5: Integration Configuration
```
Freshdesk API Configuration:
├─ Enable Freshdesk Import: [ ] Checkbox
├─ Freshdesk API Key: [__________________] [Show/Hide]
├─ Freshdesk Domain: [your-domain.freshdesk.com]
└─ [Test Connection] [Start Import Wizard]

Slack Integration:
├─ Enable Slack Notifications: [ ] Checkbox
├─ Slack Bot Token: [__________________] [Show/Hide]
└─ Slack Channel: [#support]

Calendar Integration:
├─ Enable Calendar Sync: [ ] Checkbox
├─ Calendar Provider: [Google ▼]
└─ Calendar ID: [__________________]

[Save]
```

#### Tab 6: User Management (Admin Only)
```
Total Users: 5
Active Users: 4

[+ Add New User] [Export Users]

User List:
┌─────────────────────────────────────────┐
│ Name        │ Email            │ Role   │ Action
├─────────────────────────────────────────┤
│ Admin User  │ admin@company... │ Admin  │ [Edit] [Delete]
│ Agent 1     │ agent1@company.. │ Agent  │ [Edit] [Delete]
│ Agent 2     │ agent2@company.. │ Agent  │ [Edit] [Delete]
└─────────────────────────────────────────┘
```

#### Tab 7: Backup & Recovery
```
Last Backup: 2 hours ago
Next Backup: In 4 hours

Backup Schedule: [Every 6 hours ▼]

Backup Location: [Local (./backups) ▼] [AWS S3 ▼]
[Backup Now] [Restore From Backup] [Delete Old Backups]

Recent Backups:
1. backup-2025-04-10-14-30.zip (2.4 GB)
2. backup-2025-04-10-08-15.zip (2.3 GB)
3. backup-2025-04-10-02-00.zip (2.2 GB)
```

#### Tab 8: Deployment Settings
```
Environment: [Local ▼] [AWS ▼]

If AWS Selected:
├─ AWS Region: [us-east-1 ▼]
├─ AWS Access Key: [__________________] [Show/Hide]
├─ AWS Secret Key: [__________________] [Show/Hide]
├─ EC2 Instance Type: [t3.medium ▼]
├─ RDS Database Type: [SQL Server ▼] [MongoDB Atlas ▼]
└─ RDS Instance Class: [db.t3.small ▼]

[Test AWS Credentials] [Deploy to AWS] [Manage Deployments]

Deployment Status:
● Local: Running
○ AWS: Not Deployed
```

#### Tab 9: System Health
```
System Status: ✓ All Systems Healthy

Components:
├─ Database: ✓ Connected (123ms)
├─ MinIO Storage: ✓ Connected (45ms)
├─ Email Server: ✓ Connected (120ms)
├─ Redis Cache: ✓ Connected (12ms)
└─ API Backend: ✓ Running

Logs:
[Last 100 entries ▼]
2025-04-10 14:35:22 [INFO] User login: admin@company.com
2025-04-10 14:34:15 [INFO] Ticket #1234 created
2025-04-10 14:30:00 [INFO] Backup completed successfully
[Download Logs] [Clear Logs]
```

#### Tab 10: About/Help
```
Application: Internal Support CRM
Version: 1.0.0
Build: 2025-04-10
License: Internal Use

Support Documentation:
[Quick Start Guide] [API Documentation] [Video Tutorials]
[Contact Support] [Report Bug]
```

---

## 📥 PART 5: FRESHDESK DATA IMPORT

### Requirement: Import wizard accessible from Admin Panel

#### Import Wizard (Step-by-Step UI)

**Step 1: Connect to Freshdesk**
```
Enter your Freshdesk credentials:
Freshdesk Domain: [your-domain.freshdesk.com]
API Key: [__________________] [Show/Hide] [Get API Key Help]
[Next >] [Cancel]
```

**Step 2: Select Data to Import**
```
What data do you want to import?
☑ Tickets (all tickets and replies)
☑ Contacts (customers and companies)
☑ Email Templates
☑ Custom Fields Mapping
☑ Agent Accounts

☐ Categories
☐ Products
☐ Email Channels

[Next >] [Back] [Cancel]
```

**Step 3: Map Fields**
```
Map Freshdesk Fields to CRM Fields:

Freshdesk Ticket Status → CRM Status
├─ open → [open ▼]
├─ pending → [pending ▼]
├─ resolved → [resolved ▼]
└─ closed → [closed ▼]

Freshdesk Priority → CRM Priority
├─ low → [low ▼]
├─ medium → [medium ▼]
├─ high → [high ▼]
└─ urgent → [urgent ▼]

[Auto-Map All] [Next >] [Back] [Cancel]
```

**Step 4: Review & Confirm**
```
Import Summary:
├─ Tickets to Import: 1,234
├─ Contacts to Import: 567
├─ Email Templates: 23
├─ Custom Fields: 15
└─ Total Data Size: ~45 MB

Estimated Import Time: 5-10 minutes
Target Database: SQL Server (CRM_Production)

⚠️ This action cannot be undone. Create a backup first?
[Create Backup First] [Continue]
[Back] [Cancel]
```

**Step 5: Import Progress**
```
Importing data from Freshdesk...

Progress: ████████░░ 45%
Current Task: Importing contacts (245/567)
Time Elapsed: 2:35
Estimated Time Remaining: 3:15

[Pause] [Cancel]

✓ 1,234 tickets imported
✓ 245/567 contacts imported
○ Email templates pending
```

**Step 6: Import Complete**
```
✓ Import Completed Successfully!

Summary:
├─ ✓ 1,234 tickets imported
├─ ✓ 567 contacts imported
├─ ✓ 23 email templates imported
├─ ✓ 15 custom fields mapped
└─ ✓ All data verified

Import took 8 minutes 23 seconds

What's next?
[View Imported Data] [Verify Data Quality] [Close]
```

---

## 🛠️ PART 6: CORE FEATURES REQUIRED

### Mandatory Features (Non-Negotiable)

#### 1. Support Tickets Module
```
✓ Create tickets from web, email, API
✓ Ticket status workflow (open → pending → resolved → closed)
✓ Automatic ticket routing to agents
✓ SLA tracking and enforcement
✓ Ticket comments and replies
✓ Internal notes (not visible to customers)
✓ File attachments
✓ Custom fields (defined by admin in settings)
✓ Bulk actions (update status, assign, etc.)
✓ Ticket search and filtering
✓ Email notifications
```

#### 2. CRM Module
```
✓ Contact management (customers, companies)
✓ Deal pipeline (prospecting → negotiation → won/lost)
✓ Activity tracking (calls, meetings, emails)
✓ Contact enrichment
✓ Activity history and timeline
✓ Contact segmentation and tagging
✓ Sales forecasting by deal stage
✓ Custom fields per contact
```

#### 3. Knowledge Base
```
✓ Create and publish articles
✓ WYSIWYG editor
✓ Full-text search
✓ Article categories and tags
✓ Article versioning
✓ View count and helpfulness tracking
✓ Public customer portal
✓ Markdown support
```

#### 4. AI Chatbot (Self-Hosted)
```
✓ LLM-powered responses
✓ Knowledge base integration (RAG)
✓ Intent classification
✓ Sentiment analysis
✓ Auto-escalation to human agents
✓ Conversation history
✓ Admin dashboard for chatbot analytics
```

#### 5. Workflows & Automation
```
✓ Create automation rules (if-then-else)
✓ Triggers: ticket created, status changed, etc.
✓ Actions: email, update field, assign, etc.
✓ Scheduled tasks
✓ Webhook support
✓ Email templates
```

#### 6. Analytics & Reporting
```
✓ Agent performance metrics
✓ Ticket metrics (resolution time, response time, etc.)
✓ Customer satisfaction (CSAT)
✓ Trend analysis
✓ Custom report builder
✓ Export to CSV/PDF
✓ Dashboards
```

---

## 🚀 PART 7: INSTALLATION & DEPLOYMENT INSTRUCTIONS

### For Non-Technical User: Complete Step-by-Step Guide

#### Option A: Local Installation (Easiest)

**Requirements Check:**
```
☐ 4GB RAM available
☐ 100GB free disk space
☐ Windows 10+ / macOS 10.15+ / Ubuntu 18.04+
☐ Internet connection
```

**Installation Steps:**

1. **Install Docker** (1 click installer)
   - Download from: https://www.docker.com/products/docker-desktop
   - Run installer
   - Restart computer
   - Done!

2. **Download Application Files**
   - Download ZIP from GitHub
   - Extract to: `C:\Users\YourName\crm-system` (Windows) or `~/crm-system` (Mac/Linux)

3. **Start Everything** (1 command)
   ```bash
   cd ~/crm-system
   docker-compose up
   ```

4. **First Access**
   - Open browser: http://localhost:3000
   - Default login: admin@company.com / password123
   - **IMPORTANT:** Change password immediately!

5. **Configure Everything in Admin Panel**
   - Go to Settings (gear icon)
   - Enter database credentials
   - Enter email settings
   - Enter MinIO storage settings
   - Done!

#### Option B: AWS Deployment (Click & Wait)

**Prerequisites:**
```
☐ AWS Account (free tier available)
☐ Credit card for AWS billing
```

**Deployment Steps:**

1. **Enter AWS Credentials in Admin Panel**
   - Deployment Tab → AWS
   - Enter AWS Access Key
   - Enter AWS Secret Key
   - Select Region
   - Click "Deploy to AWS"

2. **Wait 10-15 minutes**
   - System automatically:
     - Creates EC2 instance
     - Sets up RDS database
     - Configures S3 storage
     - Deploys application
     - Creates backups

3. **Access Your Application**
   - Email with public URL will be sent
   - Same admin panel as local version
   - Same features work identically

---

## 📊 PART 8: DATABASE SCHEMA (AUTO-CREATED)

### Automatic Schema Creation

**Requirement:** On first startup, backend automatically creates all tables if they don't exist:

```
Tables to Create (Automatically):

1. users
   - id, email, password_hash, name, role, status, created_at

2. tickets
   - id, ticket_number, subject, description, status, priority
   - customer_id, agent_id, created_at, updated_at, resolved_at

3. ticket_comments
   - id, ticket_id, user_id, content, is_internal, created_at

4. contacts
   - id, email, phone, name, company, lifecycle_stage, created_at

5. deals
   - id, contact_id, name, amount, stage, probability, created_at

6. knowledge_articles
   - id, title, slug, content, status, views_count, created_at

7. workflows
   - id, name, trigger_type, conditions (JSON), actions (JSON)

8. chat_conversations
   - id, user_id, messages (JSON), created_at, resolved

9. admin_settings
   - id, setting_key, setting_value, updated_at
   (stores ALL configuration from admin panel)

10. audit_log
    - id, user_id, action, entity_type, entity_id, timestamp
```

---

## 🔐 PART 9: SECURITY REQUIREMENTS

### Built-In Security (No Configuration Needed)

```
✓ JWT Authentication (auto-implemented)
✓ Password hashing (bcrypt, automatic)
✓ SQL injection prevention (ORM, automatic)
✓ XSS protection (input sanitization, automatic)
✓ CSRF tokens (automatic)
✓ Rate limiting (100 requests/min per user, automatic)
✓ TLS/HTTPS support (with Let's Encrypt, automatic)
✓ Role-based access control (automatic)
✓ Audit logging of all actions (automatic)
✓ Encrypted database passwords (stored encrypted)
```

---

## 🧪 PART 10: TESTING BEFORE PRODUCTION

### Verification Checklist (Non-Technical)

Before deploying to production, verify:

```
☐ Database Connection: Test button in admin panel passes
☐ Email Settings: Test email sends successfully
☐ File Storage: Test upload/download in admin panel
☐ Create Test Ticket: Create ticket, should appear immediately
☐ Create Test Contact: Create contact, should be searchable
☐ Create Test Article: Create KB article, should be published
☐ Test Chatbot: Ask chatbot a question
☐ Test Workflow: Create automation rule, verify it triggers
☐ Test Import: Import small dataset from Freshdesk
☐ Backup: Create manual backup from admin panel
☐ Restore: Restore from backup (in test environment)
☐ Load Test: 10 simultaneous users login (should work smoothly)
```

---

## 📞 PART 11: SUPPORT & TROUBLESHOOTING

### Common Issues & Solutions (Built-In Help)

1. **"Cannot connect to database"**
   - Solution: Check database is running, verify credentials in Admin Panel > Database tab
   - Click "Test Connection" to debug

2. **"MinIO storage not working"**
   - Solution: Check MinIO is running, verify access key/secret in Admin Panel > Storage tab
   - Click "Test Connection" to debug

3. **"Emails not sending"**
   - Solution: Verify SMTP settings in Admin Panel > Email Configuration
   - Click "Test Email" button

4. **"Slow performance"**
   - Solution: Check system health in Admin Panel > System Health tab
   - May need to increase RAM or database resources

5. **"Import from Freshdesk failed"**
   - Solution: Run import again from Admin Panel > Integrations
   - Check Freshdesk API key is correct
   - Contact support if issue persists

---

## 🎓 PART 12: FEATURE ROADMAP & PRIORITIES

### Phase 1: Core System (Weeks 1-8) ✅ MUST HAVE

```
✓ Setup: Local deployment, Database selection, Admin Panel
✓ Tickets: Full ticket lifecycle, search, routing
✓ CRM: Contacts, deals, activities
✓ Email: SMTP integration, notifications
✓ Storage: MinIO integration, file uploads
```

### Phase 2: Advanced Features (Weeks 9-16) ✅ SHOULD HAVE

```
✓ Knowledge Base: Articles, search, public portal
✓ Workflows: Automation rules and triggers
✓ Analytics: Dashboards and reports
✓ Chatbot: AI-powered responses
✓ Freshdesk Import: Data migration wizard
```

### Phase 3: Enterprise Features (Weeks 17-24) ✅ NICE TO HAVE

```
✓ AWS Deployment: One-click AWS setup
✓ Advanced Analytics: Forecasting and trends
✓ Calendar Integration: Google/Outlook sync
✓ Slack Integration: Notifications and bot
✓ Custom Plugins: User-defined extensions
```

---

## ✅ FINAL CHECKLIST FOR DEVELOPER

When building this application, ensure:

### Code Quality Requirements
```
✓ NO hardcoded database credentials (use admin panel)
✓ NO hardcoded API URLs (use admin panel)
✓ NO hardcoded email settings (use admin panel)
✓ ALL configuration in /config/admin_settings.json or database
✓ Environment variables as fallback only
✓ Automatic database schema creation on startup
✓ Automatic admin user creation on first startup
```

### User Experience Requirements
```
✓ First-time user: Shows setup wizard automatically
✓ Admin panel: All settings accessible without code changes
✓ Intuitive UI: Non-technical user can operate completely
✓ Clear error messages: User knows what went wrong and how to fix
✓ Progress indicators: Long operations show status
✓ Confirmation dialogs: Destructive actions require confirmation
✓ Help text: Every setting has hover tooltip
```

### Deployment Requirements
```
✓ Local: Works with Docker Compose (docker-compose up)
✓ Local: Works standalone with manual setup
✓ AWS: One-click deployment from admin panel
✓ Database: Automatic migration between SQL Server and MongoDB
✓ Storage: Automatic file migration between MinIO and S3
✓ Backup: Automatic backups with restore capability
```

### Security Requirements
```
✓ All passwords stored encrypted
✓ All credentials encrypted in configuration
✓ JWT tokens with expiration
✓ Admin-only access to settings
✓ Audit log of all admin actions
✓ HTTPS/TLS support
✓ CORS properly configured
```

---

## 🎯 SUCCESS CRITERIA

The application is complete and ready for production when:

```
✅ Non-technical user can install and run locally in 15 minutes
✅ All configuration is accessible via Admin Panel (no code changes needed)
✅ Database can be switched between SQL Server and MongoDB via toggle
✅ Files are stored in MinIO (local) or S3 (AWS) via dropdown selection
✅ Freshdesk data imports successfully via wizard
✅ All 10 core features (tickets, CRM, KB, chatbot, etc.) work flawlessly
✅ One-click AWS deployment available
✅ System health dashboard shows all component status
✅ Backup and restore work correctly
✅ 100+ concurrent users supported
✅ Zero security vulnerabilities found in audit
✅ Complete documentation provided
✅ Video tutorials for each major feature
```

---

## 📝 IMPORTANT NOTES FOR DEVELOPER

1. **This person has ZERO coding knowledge.** Everything must be configurable via UI.
2. **No hardcoded values anywhere.** If it can be configured, it MUST be in admin panel.
3. **Local first.** Must work perfectly on user's machine before AWS support.
4. **Database agnostic.** User should be able to switch databases without restarting.
5. **Import matters.** Freshdesk import is critical for adoption. Must be bulletproof.
6. **Storage abstraction.** User should not care if using MinIO or S3. Should work identically.
7. **Clear instructions.** Non-technical user should follow written steps without confusion.
8. **Error messages.** Every error must clearly state what's wrong and how to fix it.
9. **Testing needed.** Include test data and test users for verification.
10. **Documentation crucial.** Video tutorials required for every feature.

---

## 🚀 BUILD INSTRUCTIONS FOR CLAUDE CODE

Use this prompt exactly as follows:

```
"Build a production-ready Internal Support CRM system according to the 
'PRODUCTION-READY INTERNAL SUPPORT CRM SYSTEM' specification provided above.

Key constraints:
1. NO hardcoded configurations - ALL settings in Admin Panel
2. Support BOTH SQL Server Express AND MongoDB (user selectable)
3. Local deployment with Docker Compose
4. AWS deployment option with one-click deployment
5. MinIO storage (or S3 for AWS)
6. Complete Freshdesk import wizard
7. Target audience: NON-TECHNICAL USERS
8. Automatic database schema creation
9. All requirements in PART 1-12 above

Start by scaffolding the project structure and explaining what will be built.
Ask for confirmation before proceeding with full implementation."
```

---

**VERSION:** 1.0  
**CREATED:** April 10, 2026  
**STATUS:** Ready for Development  
**COMPLEXITY:** Enterprise-Grade, Zero-Config for End Users
