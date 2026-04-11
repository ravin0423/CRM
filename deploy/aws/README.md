# AWS Deployment — Internal Support CRM

This directory contains Terraform modules that stand up the full CRM stack on
AWS. It is a starting-point scaffold: every resource is declared, but a human
operator still has to (a) create an S3 bucket + DynamoDB lock table for remote
state, (b) supply the variables in `terraform.tfvars`, and (c) run
`terraform apply` from their workstation.

## Topology

```
                            Route 53 (crm.example.com)
                                       |
                                       v
                         ┌────────────────────────────┐
                         │   Application LB (HTTPS)   │
                         └──────────────┬─────────────┘
                                        │
           ┌────────────────────────────┼────────────────────────────┐
           │                            │                            │
           v                            v                            v
   ┌──────────────┐             ┌──────────────┐             ┌──────────────┐
   │  EC2: API    │             │  EC2: Worker │             │  EC2: Front  │
   │  (FastAPI)   │             │  (Celery)    │             │  (nginx+vite)│
   └──────┬───────┘             └──────┬───────┘             └──────────────┘
          │                            │
          └────────────┬───────────────┘
                       │
     ┌─────────────────┼───────────────────────┬──────────────────┐
     v                 v                       v                  v
┌──────────┐   ┌───────────────┐   ┌────────────────────┐   ┌──────────┐
│ RDS SQL  │   │ ElastiCache   │   │  Amazon MQ         │   │   S3     │
│ Server   │   │ Redis         │   │  (RabbitMQ)        │   │ Bucket   │
│ Express  │   │               │   │                    │   │ (files)  │
└──────────┘   └───────────────┘   └────────────────────┘   └──────────┘
```

## Files

- `main.tf` — provider, locals, data sources
- `variables.tf` — all input variables (required + defaults)
- `vpc.tf` — VPC, 2 public + 2 private subnets across 2 AZs, IGW, NAT GW
- `security_groups.tf` — SGs for ALB, app, worker, RDS, Redis, MQ
- `ec2.tf` — launch templates + ASGs for API, Worker, Frontend
- `rds.tf` — RDS SQL Server Express instance (private subnets)
- `elasticache.tf` — Redis single-node cluster
- `mq.tf` — Amazon MQ (RabbitMQ) single-instance broker
- `s3.tf` — S3 bucket for attachments (server-side encrypted)
- `alb.tf` — Application Load Balancer + listener + target groups
- `route53.tf` — Route 53 A record (optional; set `dns_zone_id` var)
- `iam.tf` — EC2 instance profile allowing S3 read/write on the bucket
- `outputs.tf` — ALB DNS name, RDS endpoint, Redis endpoint, S3 bucket
- `terraform.tfvars.example` — copy to `terraform.tfvars` and edit

## Bootstrap checklist

1. Install Terraform ≥ 1.6 and the AWS CLI. Configure credentials:
   ```
   aws configure
   ```
2. Create a remote-state bucket once, out-of-band:
   ```
   aws s3 mb s3://crm-terraform-state-<your-suffix>
   aws dynamodb create-table \
     --table-name crm-terraform-locks \
     --attribute-definitions AttributeName=LockID,AttributeType=S \
     --key-schema AttributeName=LockID,KeyType=HASH \
     --billing-mode PAY_PER_REQUEST
   ```
3. Copy and edit `terraform.tfvars.example` → `terraform.tfvars`. At minimum
   set `aws_region`, `db_admin_password`, `mq_admin_password`, and the SSH
   `key_name` of a keypair that already exists in your account.
4. Initialise and plan:
   ```
   terraform init \
     -backend-config="bucket=crm-terraform-state-<your-suffix>" \
     -backend-config="key=crm/prod/terraform.tfstate" \
     -backend-config="region=us-east-1" \
     -backend-config="dynamodb_table=crm-terraform-locks"
   terraform plan -out tfplan
   ```
5. Review the plan carefully, then:
   ```
   terraform apply tfplan
   ```
6. The output will print the ALB DNS name. Open
   `http://<alb-dns-name>/admin/database` and follow the Admin Panel — paste
   the RDS endpoint, S3 bucket, Redis URL and MQ URL from the Terraform
   outputs into the relevant tabs. Click **Test Connection** on each tab
   before saving.

## What the scaffold intentionally does NOT do

- **It does not bootstrap the application code onto the EC2 instances.** Use
  the `user_data.sh.tpl` file as a starting point — it pulls the Docker image
  tag you set in `terraform.tfvars`, runs `docker compose up -d`, and waits
  for `/health` to return `ok`.
- **It does not create an ACM certificate or attach HTTPS listeners.** The
  ALB is created with an HTTP listener on :80; swap in ACM + a :443 listener
  once you own a domain.
- **It does not enable RDS Multi-AZ or automated cross-region backups.**
  Both are one-line flips in `rds.tf` — left off to keep the default cost
  envelope under ~$150/month.

## Cost expectations (us-east-1, on-demand)

| Resource                         | Est. monthly |
|----------------------------------|-------------:|
| 2× t3.small (API + Worker)       |        ~$30  |
| 1× t3.micro (Frontend nginx)     |         ~$8  |
| RDS db.t3.small SQL Server Exp.  |        ~$50  |
| ElastiCache cache.t3.micro       |        ~$12  |
| Amazon MQ mq.t3.micro            |        ~$18  |
| ALB                              |        ~$18  |
| NAT Gateway + data               |        ~$35  |
| S3 (low volume)                  |         ~$1  |
| **Total**                        |    **~$172** |

Drop the NAT Gateway by switching private subnets to VPC endpoints for
S3 / SSM / ECR if you need to trim further.
