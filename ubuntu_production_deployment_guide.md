# Production Deployment Guide: FastAPI + Next.js on Digital Ocean

## Overview

This guide covers deploying a FastAPI backend and Next.js frontend on a single Digital Ocean VM with:

- **Backend**: `app.thegoatmedia.co`
- **Frontend**: `mastermind.thegoatmedia.co`
- **AI/Scripting API**: External FastAPI service (currently hardcoded to `161.35.235.176:8000`)
- Production-ready setup with SSL, reverse proxy, and CI/CD

## Prerequisites

- Digital Ocean account
- Domain `thegoatmedia.co` with DNS management access
- GitHub repository with your code
- Basic knowledge of Linux commands

## Step 1: Digital Ocean VM Setup

### 1.1 Create Droplet

1. Create a new droplet on Digital Ocean
2. Choose Ubuntu 22.04 LTS
3. Select at least 2GB RAM, 1 CPU (recommended: 4GB RAM, 2 CPU for production)
4. Add your SSH key
5. Create the droplet

### 1.2 Initial Server Setup

```bash
# Connect to your server
ssh root@your_server_ip

# Update system
apt update && apt upgrade -y

# Setup ubuntu user (if not already exists)
usermod -aG sudo ubuntu
ufw allow OpenSSH
ufw enable

# Switch to ubuntu user
su - ubuntu
```

## Step 2: Install Required Software

### 2.1 Install Node.js and npm

```bash
# Install Node.js 20.x (LTS) - Required for Prisma compatibility
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version  # Should be v20.x.x or higher
npm --version
```

### 2.2 Install Python and pip

```bash
sudo apt install python3 python3-pip python3-venv -y
python3 --version
```

### 2.3 Install PM2 (Process Manager)

```bash
sudo npm install -g pm2
```

### 2.4 Install Nginx

```bash
sudo apt install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 2.5 Install Database (PostgreSQL)

```bash
# Update package list
sudo apt update

# Install PostgreSQL and additional contrib package
sudo apt install postgresql postgresql-contrib -y

# Check PostgreSQL version (should be 14.x for Ubuntu 22.04)
sudo -u postgres psql -c "SELECT version();"

# Start and enable PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Check service status
sudo systemctl status postgresql
```

#### 2.5.1 Configure PostgreSQL

```bash
# Switch to postgres user and access PostgreSQL prompt
sudo -u postgres psql

# Inside PostgreSQL prompt, run these commands:
# Create database for your application
CREATE DATABASE goat_mastermind;

# Create a dedicated user for your application
CREATE USER goat_user WITH PASSWORD 'your_secure_password_here';

# Grant all privileges on the database to the user
GRANT ALL PRIVILEGES ON DATABASE goat_mastermind TO goat_user;

# Grant additional permissions needed for Prisma
ALTER USER goat_user CREATEDB;
ALTER USER goat_user WITH SUPERUSER;

# Exit PostgreSQL prompt
\q
```

#### 2.5.2 Configure PostgreSQL for Remote Connections (Optional)

```bash
# Edit PostgreSQL configuration to allow connections
sudo nano /etc/postgresql/14/main/postgresql.conf

# Find and uncomment/modify this line:
# listen_addresses = 'localhost'
# Change to:
# listen_addresses = '*'  # For all interfaces, or specify specific IPs

# Edit pg_hba.conf for authentication
sudo nano /etc/postgresql/14/main/pg_hba.conf

# Add this line before other rules (for local development):
# host    all             all             127.0.0.1/32            md5
# host    all             all             ::1/128                 md5

# Restart PostgreSQL to apply changes
sudo systemctl restart postgresql
```

#### 2.5.3 Test Database Connection

```bash
# Test connection with the new user
psql -h localhost -U goat_user -d goat_mastermind -W

# Inside the database, you can run:
# \l  -- List all databases
# \dt -- List all tables (will be empty initially)
# \q  -- Quit
```

#### 2.5.4 Secure PostgreSQL Installation

```bash
# Set password for postgres system user (optional but recommended)
sudo passwd postgres

# Create a backup directory
sudo mkdir -p /var/backups/postgresql
sudo chown postgres:postgres /var/backups/postgresql
```

### 2.6 Install Certbot for SSL

```bash
sudo apt install certbot python3-certbot-nginx -y
```

## Step 3: DNS Configuration

Configure your DNS records to point to your server IP:

```
A record: app.thegoatmedia.co → your_server_ip
A record: mastermind.thegoatmedia.co → your_server_ip
```

## Step 4: Application Setup

### 4.1 Clone Your Repositories

```bash
cd /home/ubuntu
mkdir apps && cd apps

# Clone your repositories
git clone https://github.com/yourusername/your-fastapi-backend.git backend
git clone https://github.com/yourusername/your-nextjs-frontend.git frontend
```

### 4.2 FastAPI Backend Setup

```bash
cd /home/ubuntu/apps/backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Install gunicorn for production
pip install gunicorn uvicorn[standard]

# Create environment file
nano .env
# Add your production environment variables
```

### 4.3 Next.js Frontend Setup

```bash
cd /home/ubuntu/apps/frontend

# Create environment file first
cp .env.example .env.local
# or create manually:
nano .env.local

# Add your database connection string (replace 'your_secure_password_here' with actual password):
# DATABASE_URL="postgresql://goat_user:your_secure_password_here@localhost:5432/goat_mastermind?schema=public"
#
# Admin user credentials for seeding (change these for production):
# INITIAL_ADMIN_EMAIL="admin@yourdomain.com"
# INITIAL_ADMIN_PASSWORD="your_secure_admin_password"
#
# NextAuth.js configuration:
# NEXTAUTH_URL="https://mastermind.thegoatmedia.co"
# NEXTAUTH_SECRET="your_nextauth_secret_key"

# Install dependencies
npm install

# Setup database (this runs db:push, db:generate, and db:seed)
npm run db:setup

# Build the application (uses Next.js with Turbopack)
npm run build
```

### 4.4 Database Initialization and Seeding

````bash
```bash
cd /home/ubuntu/apps/frontend

# Your package.json already includes excellent database management scripts and all required dependencies:
# Dependencies: @prisma/client, prisma, bcryptjs, @types/bcryptjs
# Scripts:
# - "db:generate": "npx prisma generate"
# - "db:push": "npx prisma db push"
# - "db:seed": "npx tsx scripts/seed.ts"
# - "db:setup": "npm run db:push && npm run db:generate && npm run db:seed"
# - "db:reset": "npx prisma db push --force-reset && npm run db:seed"
# - "db:studio": "npx prisma studio"

# Use the comprehensive db:setup script (does everything in one command)
echo "🔄 Setting up database (push + generate + seed)..."
npm run db:setup# Verify the setup was successful
echo "✅ Verifying database setup..."
psql -h localhost -U goat_user -d goat_mastermind -c "SELECT email, name, role FROM \"User\" WHERE role = 'ADMIN';"
````

#### 4.4.1 Available Database Scripts

Your package.json provides these convenient database management commands:

```bash
# Individual operations:
npm run db:generate    # Generate Prisma client
npm run db:push       # Push schema to database
npm run db:seed       # Run seed script
npm run db:studio     # Open Prisma Studio
npm run db:migrate    # Run migrations (dev)

# Combined operations:
npm run db:setup      # Complete setup: push + generate + seed
npm run db:reset      # Reset database and re-seed
```

#### 4.4.2 Environment Variables for Seeding

Ensure your `.env.local` file contains the admin credentials:

```bash
nano /home/ubuntu/apps/frontend/.env.local

# Add these lines (customize as needed):
INITIAL_ADMIN_EMAIL="admin@yourdomain.com"
INITIAL_ADMIN_PASSWORD="your_secure_admin_password"
```

#### 4.4.3 Verify Seeding Success

```bash
# Check if admin user was created
psql -h localhost -U goat_user -d goat_mastermind -W

# Inside PostgreSQL, run:
# SELECT id, email, name, role, status, "createdAt" FROM "User" WHERE role = 'ADMIN';
# SELECT COUNT(*) FROM "AuditLog" WHERE action = 'ADMIN_CREATED';
# \q

# Or use Prisma Studio to browse the database:
npm run db:studio
# Opens on http://localhost:5555 (access via SSH tunnel if needed)
```

## Step 5: PM2 Configuration

### 5.1 FastAPI PM2 Configuration

Create `/home/ubuntu/apps/backend/ecosystem.config.js`:

```javascript
module.exports = {
  apps: [
    {
      name: "fastapi-backend",
      script: "./venv/bin/gunicorn",
      args: "-w 4 -k uvicorn.workers.UvicornWorker app:app --bind 0.0.0.0:8000 --timeout 120 --keep-alive 2 --max-requests 1000 --max-requests-jitter 50",
      cwd: "/home/ubuntu/apps/backend",
      interpreter: "none", // Don't use Node.js interpreter
      env: {
        PYTHONPATH: "/home/ubuntu/apps/backend",
        PATH: "/home/ubuntu/apps/backend/venv/bin:/usr/local/bin:/usr/bin:/bin",
      },
      error_file: "/home/ubuntu/.pm2/logs/fastapi-backend-error.log",
      out_file: "/home/ubuntu/.pm2/logs/fastapi-backend-out.log",
      log_file: "/home/ubuntu/.pm2/logs/fastapi-backend.log",
    },
  ],
};
```

### 5.2 Next.js PM2 Configuration

Create `/home/ubuntu/apps/frontend/ecosystem.config.js`:

```javascript
module.exports = {
  apps: [
    {
      name: "nextjs-frontend",
      script: "npm",
      args: "start",
      cwd: "/home/ubuntu/apps/frontend",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
        HOST: "0.0.0.0",
      },
    },
  ],
};
```

### 5.3 Start Applications

```bash
# Start FastAPI backend
cd /home/ubuntu/apps/backend
pm2 start ecosystem.config.js

# Start Next.js frontend
cd /home/ubuntu/apps/frontend
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save
pm2 startup
```

## Step 6: Nginx Configuration

### 6.1 Backend Nginx Configuration

Create `/etc/nginx/sites-available/app.thegoatmedia.co`:

```nginx
server {
    listen 80;
    server_name app.thegoatmedia.co;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 6.2 Frontend Nginx Configuration

Create `/etc/nginx/sites-available/mastermind.thegoatmedia.co`:

```nginx
server {
    listen 80;
    server_name mastermind.thegoatmedia.co;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 6.3 Enable Sites

```bash
sudo ln -s /etc/nginx/sites-available/app.thegoatmedia.co /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/mastermind.thegoatmedia.co /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

## Step 7: SSL Setup with Let's Encrypt

```bash
# Get SSL certificates for both domains
sudo certbot --nginx -d app.thegoatmedia.co
sudo certbot --nginx -d mastermind.thegoatmedia.co

# Test automatic renewal
sudo certbot renew --dry-run
```

## Step 8: Firewall Configuration

```bash
sudo ufw allow 'Nginx Full'
sudo ufw allow 22
sudo ufw status
```

## Step 9: Security Hardening

### 9.1 Update Nginx for Security

Add to both Nginx server blocks:

```nginx
# Security headers
add_header X-Frame-Options DENY;
add_header X-Content-Type-Options nosniff;
add_header X-XSS-Protection "1; mode=block";
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";

# Hide Nginx version
server_tokens off;
```

### 9.2 Setup Log Rotation

```bash
sudo nano /etc/logrotate.d/pm2-deploy
```

Add:

```
/home/ubuntu/.pm2/logs/*.log {
    daily
    missingok
    rotate 7
    compress
    notifempty
    create 0644 ubuntu ubuntu
}
```

## Step 10: Monitoring Setup

### 10.1 PM2 Monitoring

```bash
# Install PM2 monitoring
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7

# Monitor applications
pm2 monit
```

### 10.2 Basic System Monitoring Script

Create `/home/ubuntu/monitor.sh`:

```bash
#!/bin/bash
# Basic health check script
LOG_FILE="/home/ubuntu/health.log"
DATE=$(date '+%Y-%m-%d %H:%M:%S')

# Check if applications are running
if pm2 list | grep -q "online"; then
    echo "$DATE - Applications are running" >> $LOG_FILE
else
    echo "$DATE - ERROR: Some applications are down" >> $LOG_FILE
    pm2 restart all
fi

# Check disk space
DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 80 ]; then
    echo "$DATE - WARNING: Disk usage is ${DISK_USAGE}%" >> $LOG_FILE
fi
```

Make it executable and add to cron:

```bash
chmod +x /home/ubuntu/monitor.sh
crontab -e
# Add: */5 * * * * /home/ubuntu/monitor.sh
```

## Step 11: GitHub Actions CI/CD

### 11.1 Backend Deployment Workflow

Create `.github/workflows/deploy-backend.yml` in your backend repository:

```yaml
name: Deploy FastAPI Backend

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Deploy to server
        uses: appleboy/ssh-action@v0.1.7
        with:
          host: ${{ secrets.HOST }}
          username: ${{ secrets.USERNAME }}
          key: ${{ secrets.SSH_KEY }}
          script: |
            cd /home/ubuntu/apps/backend
            git pull origin main
            source venv/bin/activate
            pip install -r requirements.txt
            pm2 restart fastapi-backend
```

### 11.2 Frontend Deployment Workflow

Create `.github/workflows/deploy-frontend.yml` in your frontend repository:

```yaml
name: Deploy Next.js Frontend

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Deploy to server
        uses: appleboy/ssh-action@v0.1.7
        with:
          host: ${{ secrets.HOST }}
          username: ${{ secrets.USERNAME }}
          key: ${{ secrets.SSH_KEY }}
          script: |
            cd /home/ubuntu/apps/frontend
            git pull origin main
            npm ci
            npm run db:setup
            npm run build
            pm2 restart nextjs-frontend
```

### 11.3 GitHub Secrets Setup

Add these secrets to your GitHub repository settings:

- `HOST`: Your server IP address
- `USERNAME`: `ubuntu`
- `SSH_KEY`: Your private SSH key content

## Step 12: Backup Strategy

### 12.1 Database Backup Strategy

Create `/home/ubuntu/backup.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/home/ubuntu/backups"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="goat_mastermind"
DB_USER="goat_user"

mkdir -p $BACKUP_DIR

# Backup PostgreSQL database
echo "Starting database backup..."
PGPASSWORD="your_secure_password_here" pg_dump -h localhost -U $DB_USER -d $DB_NAME > $BACKUP_DIR/db_backup_$DATE.sql

# Check if backup was successful
if [ $? -eq 0 ]; then
    echo "Database backup completed: db_backup_$DATE.sql"
    gzip $BACKUP_DIR/db_backup_$DATE.sql
else
    echo "Database backup failed!"
fi

# Backup application files
echo "Starting application backup..."
tar -czf $BACKUP_DIR/apps_backup_$DATE.tar.gz /home/ubuntu/apps

# Keep only last 7 days of backups
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup process completed."
```

#### 12.1.1 Database Restore Script

Create `/home/ubuntu/restore.sh`:

```bash
#!/bin/bash
if [ -z "$1" ]; then
    echo "Usage: ./restore.sh backup_file.sql.gz"
    echo "Available backups:"
    ls -la /home/ubuntu/backups/*.sql.gz
    exit 1
fi

BACKUP_FILE="$1"
DB_NAME="goat_mastermind"
DB_USER="goat_user"

echo "Restoring database from $BACKUP_FILE..."

# Extract the backup if it's compressed
if [[ $BACKUP_FILE == *.gz ]]; then
    gunzip -c "$BACKUP_FILE" | PGPASSWORD="your_secure_password_here" psql -h localhost -U $DB_USER -d $DB_NAME
else
    PGPASSWORD="your_secure_password_here" psql -h localhost -U $DB_USER -d $DB_NAME < "$BACKUP_FILE"
fi

echo "Database restore completed."
```

#### 12.1.2 Database Maintenance Script

Create `/home/ubuntu/db_maintenance.sh`:

```bash
#!/bin/bash
DB_NAME="goat_mastermind"
DB_USER="goat_user"
LOG_FILE="/home/ubuntu/db_maintenance.log"
DATE=$(date '+%Y-%m-%d %H:%M:%S')

echo "$DATE - Starting database maintenance" >> $LOG_FILE

# Analyze database for better query performance
echo "$DATE - Running ANALYZE" >> $LOG_FILE
PGPASSWORD="your_secure_password_here" psql -h localhost -U $DB_USER -d $DB_NAME -c "ANALYZE;" >> $LOG_FILE 2>&1

# Vacuum database to reclaim space
echo "$DATE - Running VACUUM" >> $LOG_FILE
PGPASSWORD="your_secure_password_here" psql -h localhost -U $DB_USER -d $DB_NAME -c "VACUUM;" >> $LOG_FILE 2>&1

# Check database size
DB_SIZE=$(PGPASSWORD="your_secure_password_here" psql -h localhost -U $DB_USER -d $DB_NAME -t -c "SELECT pg_size_pretty(pg_database_size('$DB_NAME'));")
echo "$DATE - Database size: $DB_SIZE" >> $LOG_FILE

echo "$DATE - Database maintenance completed" >> $LOG_FILE
```

Make scripts executable:

```bash
chmod +x /home/ubuntu/backup.sh
chmod +x /home/ubuntu/restore.sh
chmod +x /home/ubuntu/db_maintenance.sh
```

### 12.2 Add to Cron

```bash
crontab -e

# Add these lines:
# Daily backup at 2 AM
0 2 * * * /home/ubuntu/backup.sh

# Weekly database maintenance on Sunday at 3 AM
0 3 * * 0 /home/ubuntu/db_maintenance.sh

# Weekly log cleanup
0 4 * * 0 find /home/ubuntu -name "*.log" -mtime +30 -delete
```

## Step 13: Environment Variables Management

### 13.1 Backend Environment Variables

Create `/home/ubuntu/apps/backend/.env`:

```env
# Database
DATABASE_URL=your_database_url

# Security
SECRET_KEY=your_secret_key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# CORS
FRONTEND_URL=https://mastermind.thegoatmedia.co

# Other production variables
DEBUG=False
ENVIRONMENT=production
```

### 13.2 Frontend Environment Variables

Create `/home/ubuntu/apps/frontend/.env.local`:

````env
Create `/home/ubuntu/apps/frontend/.env.local`:

```env
# Database (must match your PostgreSQL setup)
DATABASE_URL="postgresql://goat_user:your_secure_password_here@localhost:5432/goat_mastermind?schema=public"

# Admin user credentials for database seeding
INITIAL_ADMIN_EMAIL="admin@goat.com"
INITIAL_ADMIN_PASSWORD="admin123!"

# NextAuth.js
NEXTAUTH_URL=https://mastermind.thegoatmedia.co
NEXTAUTH_SECRET=your_nextauth_secret_key

# API Configuration
NEXT_PUBLIC_API_URL=https://app.thegoatmedia.co
NEXT_PUBLIC_ENVIRONMENT=production

# Scripting Agent API (External FastAPI service)
NEXT_PUBLIC_SCRIPTING_API_URL="http://15.206.158.83:8000"

# Email Configuration (Resend)
RESEND_API_KEY="your_resend_api_key"
RESEND_FROM_EMAIL="GOAT Mastermind <noreply@yourdomain.com>"

# Other application-specific variables
AUTH_TRUST_HOST=true
````

````

Create `/home/ubuntu/apps/frontend/.env.production` for build-time variables:

```env
NEXT_PUBLIC_API_URL=https://app.thegoatmedia.co
NEXT_PUBLIC_ENVIRONMENT=production
````

## Step 14: Useful Commands

### Application Management

```bash
# View application logs
pm2 logs

# Restart applications
pm2 restart all

# Stop applications
pm2 stop all

# View application status
pm2 status

# View system resources
pm2 monit
```

### Nginx Management

```bash
# Test configuration
sudo nginx -t

# Reload configuration
sudo nginx -s reload

# Restart nginx
sudo systemctl restart nginx

# View logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### SSL Certificate Management

```bash
# Renew certificates
sudo certbot renew

# Check certificate status
sudo certbot certificates
```

### Database Management (PostgreSQL)

```bash
# Connect to database
psql -h localhost -U goat_user -d goat_mastermind -W

# Check PostgreSQL service status
sudo systemctl status postgresql

# Restart PostgreSQL
sudo systemctl restart postgresql

# View PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-14-main.log

# Check database connections
sudo -u postgres psql -c "SELECT * FROM pg_stat_activity WHERE datname = 'goat_mastermind';"

# Check database size
sudo -u postgres psql -c "SELECT pg_size_pretty(pg_database_size('goat_mastermind'));"

# Backup database manually
pg_dump -h localhost -U goat_user goat_mastermind > backup_$(date +%Y%m%d).sql

# Restore database from backup
psql -h localhost -U goat_user -d goat_mastermind < backup_file.sql

# Monitor active connections
sudo -u postgres psql -c "SELECT count(*) FROM pg_stat_activity;"

# Kill long-running queries (if needed)
sudo -u postgres psql -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'goat_mastermind' AND state = 'active' AND query_start < NOW() - INTERVAL '1 hour';"

# Prisma and Database Management
cd /home/ubuntu/apps/frontend

# Use your convenient npm scripts:
npm run db:setup      # Complete setup: push + generate + seed
npm run db:generate   # Generate Prisma client only
npm run db:push       # Push schema to database
npm run db:seed       # Run seed script only
npm run db:studio     # Open Prisma Studio (port 5555)
npm run db:migrate    # Run migrations (development)
npm run db:reset      # Reset database and re-seed

# Check admin users
psql -h localhost -U goat_user -d goat_mastermind -c "SELECT email, name, role, status, \"createdAt\" FROM \"User\" WHERE role = 'ADMIN';"
```

## Step 15: Performance Optimization

### 15.1 Nginx Optimization

Add to `/etc/nginx/nginx.conf`:

```nginx
http {
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 10240;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/x-javascript
        application/xml+rss
        application/javascript
        application/json;

    # Buffer sizes
    client_body_buffer_size 128k;
    client_max_body_size 10m;
    client_header_buffer_size 1k;
    large_client_header_buffers 4 4k;
    output_buffers 1 32k;
    postpone_output 1460;
}
```

### 15.2 PM2 Cluster Mode (Optional)

For better performance, you can run Next.js in cluster mode:

```javascript
// Update frontend/ecosystem.config.js
module.exports = {
  apps: [
    {
      name: "nextjs-frontend",
      script: "npm",
      args: "start",
      cwd: "/home/ubuntu/apps/frontend",
      instances: "max",
      exec_mode: "cluster",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
        HOST: "0.0.0.0",
      },
    },
  ],
};
```

## Troubleshooting

### Common Issues

1. **Applications not accessible**: Check firewall and nginx configuration
2. **SSL issues**: Verify DNS records and certificate installation
3. **PM2 applications crashing**: Check logs with `pm2 logs`
4. **High memory usage**: Consider upgrading your droplet or optimizing applications

### Node.js and Prisma Issues

#### Issue: `SyntaxError: Unexpected token '?'` during npm install

This error occurs when using an older Node.js version with Prisma. The nullish coalescing operator (`??`) requires Node.js 14+.

**Solution:**

```bash
# Check current Node.js version
node --version

# If version is below 14, update Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clear npm cache and reinstall
cd /home/ubuntu/apps/frontend
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

#### Issue: Prisma Client not generated

**Solution:**

```bash
cd /home/ubuntu/apps/frontend
npx prisma generate
npm run build
```

#### Issue: Database connection errors

**Solution:**

```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Test database connection
cd /home/ubuntu/apps/frontend
npx prisma db pull

# If connection fails, verify .env.local file:
cat .env.local | grep DATABASE_URL
```

#### Issue: Migration errors

**Solution:**

````bash
#### Issue: Migration errors

**Solution:**
```bash
# Reset database (WARNING: This will delete all data)
cd /home/ubuntu/apps/frontend
npx prisma migrate reset

# Or apply migrations manually
npx prisma migrate deploy
````

#### Issue: Seeding errors

**Solution:**

```bash
cd /home/ubuntu/apps/frontend

# Check if seed script exists
if [ -f scripts/seed.ts ]; then
    echo "✅ Seed script found at scripts/seed.ts"
else
    echo "❌ Seed script not found. Please ensure scripts/seed.ts exists"
fi

# Use your package.json scripts for troubleshooting:
npm run db:generate    # Regenerate Prisma client
npm run db:push       # Push schema changes
npm run db:seed       # Run seed script only

# For complete reset (WARNING: Deletes all data):
npm run db:reset

# Check environment variables
echo "DATABASE_URL: $(grep DATABASE_URL .env.local)"
echo "ADMIN EMAIL: $(grep INITIAL_ADMIN_EMAIL .env.local)"

# Open database browser for inspection
npm run db:studio     # Opens on localhost:5555
```

#### Issue: "Admin user already exists" during seeding

This is expected behavior on subsequent deployments. The seed script checks for existing admin users.

**Verification:**

```bash
# Check existing admin users (use correct table name: users, not "User")
psql -h localhost -U goat_user -d goat_mastermind -c "SELECT email, name, role, status FROM users WHERE role = 'ADMIN';"
```

````

### PostgreSQL Issues

#### Issue: "FATAL: password authentication failed"

**Solution:**

```bash
# Reset password for database user
sudo -u postgres psql
ALTER USER goat_user WITH PASSWORD 'your_new_password';
\q

# Update .env.local with new password
nano /home/ubuntu/apps/frontend/.env.local
````

#### Issue: "FATAL: database does not exist"

**Solution:**

```bash
# Create the database
sudo -u postgres createdb goat_mastermind -O goat_user

# Or through psql:
sudo -u postgres psql
CREATE DATABASE goat_mastermind OWNER goat_user;
\q
```

#### Issue: PostgreSQL service not starting

**Solution:**

```bash
# Check PostgreSQL status and logs
sudo systemctl status postgresql
sudo journalctl -u postgresql

# Check for configuration errors
sudo -u postgres /usr/lib/postgresql/14/bin/postgres --config-file=/etc/postgresql/14/main/postgresql.conf --check

# Restart PostgreSQL
sudo systemctl restart postgresql
```

#### Issue: Connection refused / Can't connect to database

**Solution:**

```bash
# Check if PostgreSQL is listening on the correct port
sudo netstat -tlnp | grep 5432

# Check PostgreSQL configuration
sudo nano /etc/postgresql/14/main/postgresql.conf
# Ensure: listen_addresses = 'localhost'

# Check authentication configuration
sudo nano /etc/postgresql/14/main/pg_hba.conf
# Ensure local connections are allowed

# Restart after changes
sudo systemctl restart postgresql
```

#### Issue: Disk space full / Database corruption

**Solution:**

```bash
# Check disk usage
df -h

# Check database size
sudo -u postgres psql -c "SELECT pg_size_pretty(pg_database_size('goat_mastermind'));"

# Clean up old logs
sudo find /var/log/postgresql -name "*.log" -mtime +7 -delete

# Vacuum full (reclaims space but requires downtime)
sudo -u postgres psql -d goat_mastermind -c "VACUUM FULL;"
```

### Health Checks

```bash
# Check if applications are running
curl -I https://app.thegoatmedia.co/health
curl -I https://mastermind.thegoatmedia.co

# Check nginx status
sudo systemctl status nginx

# Check PM2 processes
pm2 status
```

## Conclusion

This setup provides a production-ready deployment with:

- ✅ SSL/HTTPS encryption
- ✅ Reverse proxy with Nginx
- ✅ Process management with PM2
- ✅ Automated deployments with GitHub Actions
- ✅ Basic monitoring and health checks
- ✅ Security hardening
- ✅ Backup strategy
- ✅ Scripting Agent AI integration

## Scripting Agent API Integration

### API Architecture

The Scripting Agent uses an external FastAPI backend for AI chat functionality with a proxy setup:

- **Frontend**: `mastermind.thegoatmedia.co` (Next.js)
- **Internal API Proxy**: `/api/scripting/*` (Next.js API routes)
- **External API Backend**: `http://15.206.158.83:8000` (FastAPI service)
- **Integration**: Located in `src/lib/chat-api.ts`

This proxy setup solves CORS issues and provides better error handling.

### API Proxy Routes

The application includes internal API routes that proxy to the external service:

```
GET  /api/scripting/health              -> http://15.206.158.83:8000/health
POST /api/scripting/chat                -> http://15.206.158.83:8000/chat
POST /api/scripting/chat-history/store  -> http://15.206.158.83:8000/chat-history/store
POST /api/scripting/chat-history/fetch  -> http://15.206.158.83:8000/chat-history/fetch
POST /api/scripting/chat-history/update -> http://15.206.158.83:8000/chat-history/update
```

### API Endpoints

The Scripting Agent integrates with these endpoints:

```typescript
// Health check
GET  /health

// Send chat message
POST /chat
Body: { message: string, chat_history: ChatMessage[] }

// Store new chat
POST /chat-history/store
Body: { user_id: string, chat_history: ChatMessage[] }

// Fetch user's chats
POST /chat-history/fetch
Body: { user_id: string }

// Update existing chat
POST /chat-history/update
Body: { user_id: string, chat_id: string, chat_history: ChatMessage[] }
```

### Frontend Integration Files

The Scripting Agent backend integration consists of:

1. **`src/lib/chat-api.ts`**: Main API client class with all endpoints
2. **`src/hooks/useChat.ts`**: React hook managing chat state and API calls
3. **`src/app/scripting-agent/page.tsx`**: Main UI component using the hook

### Configuration

The API endpoint is configured via environment variable in `.env.local`:

```bash
NEXT_PUBLIC_SCRIPTING_API_URL="http://15.206.158.83:8000"
```

This is referenced in `src/lib/chat-api.ts`:

```typescript
const API_BASE_URL =
  process.env.NEXT_PUBLIC_SCRIPTING_API_URL || "http://15.206.158.83:8000";
```

### To Update API URL

To change the Scripting Agent API URL:

```bash
cd /home/ubuntu/apps/frontend

# 1. Update environment variable in .env.local
nano .env.local

# Add or update:
NEXT_PUBLIC_SCRIPTING_API_URL="http://your-new-api-url:8000"

# 2. Rebuild and restart
npm run build
pm2 restart nextjs-frontend
```

### API Health Monitoring

The frontend automatically checks API connectivity:

```typescript
// Check if scripting API is accessible
const checkApiConnection = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    return response.ok;
  } catch (error) {
    return false;
  }
};
```

### Chat Persistence

- **Local State**: Chats are managed in React state for immediate UI updates
- **Backend Sync**: All chats are synchronized with the external API
- **User-Specific**: Chats are tied to the authenticated user's ID from NextAuth

### CORS and Timeout Handling

The system includes several fixes for common API issues:

1. **CORS Issues**: Resolved using Next.js API proxy routes
2. **Timeout Handling**: 30-second timeout with proper error messages
3. **Network Error Handling**: User-friendly error messages for connection issues
4. **Retry Logic**: Users get clear messages to try again

### Troubleshooting API Issues

If you encounter the error "I'm having trouble processing your request. Could you please try again?":

1. **Check API Connection**:

   ```bash
   curl http://15.206.158.83:8000/health
   ```

2. **Check Environment Variable**:

   ```bash
   echo $NEXT_PUBLIC_SCRIPTING_API_URL
   ```

3. **Check Logs**:

   ```bash
   pm2 logs nextjs-frontend
   ```

4. **Test Proxy Endpoint**:
   ```bash
   curl http://localhost:3000/api/scripting/health
   ```

Your applications should now be accessible at:

- **Backend**: https://app.thegoatmedia.co
- **Frontend**: https://mastermind.thegoatmedia.co

Remember to regularly update your system and applications for security patches.
