# 🚀 Deployment Guide: Goat Scripting App

Complete step-by-step guide to deploy your Next.js application on a Digital Ocean Ubuntu VM.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Server Setup](#server-setup)
3. [Software Installation](#software-installation)
4. [Database Configuration](#database-configuration)
5. [Application Deployment](#application-deployment)
6. [Process Management](#process-management)
7. [Reverse Proxy Setup](#reverse-proxy-setup)
8. [SSL Configuration](#ssl-configuration)
9. [Security & Firewall](#security--firewall)
10. [Monitoring & Maintenance](#monitoring--maintenance)
11. [Troubleshooting](#troubleshooting)

---

## Prerequisites

- Digital Ocean Ubuntu 22.04 LTS droplet (minimum 2GB RAM recommended)
- Domain name (optional but recommended)
- SSH key for secure access
- Basic knowledge of Linux command line

---

## Server Setup

### 1. Create Digital Ocean Droplet

1. **Log into Digital Ocean**
2. **Create new droplet:**
   - Image: Ubuntu 22.04 LTS
   - Plan: Basic (2GB RAM / 1 vCPU / 50GB SSD recommended)
   - Authentication: SSH keys (recommended) or Password
   - Add your SSH key during creation

### 2. Initial Server Configuration

```bash
# Connect to your server
ssh root@your_server_ip

# Update system packages
apt update && apt upgrade -y

# Create a new user for deployment
adduser deploy
usermod -aG sudo deploy

# Copy SSH keys to new user
rsync --archive --chown=deploy:deploy ~/.ssh /home/deploy

# Switch to deploy user
su - deploy
```

---

## Software Installation

### 1. Install Node.js 20

```bash
# Remove any existing Node.js installations to avoid conflicts
sudo apt remove nodejs npm libnode-dev -y
sudo apt autoremove -y

# Install Node.js 20 via NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version  # Should show v20.x.x
npm --version   # Should show 10.x.x
```

### 2. Install Global Dependencies

```bash
# Install PM2 for process management
sudo npm install -g pm2

# Install tsx for TypeScript execution (needed for seed script)
sudo npm install -g tsx

# Optional: Install dotenv-cli for environment management
sudo npm install -g dotenv-cli
```

### 3. Install Git (if not already installed)

```bash
sudo apt install git -y
```

---

## Database Configuration

### 1. Install PostgreSQL

```bash
# Install PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Start and enable PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Check PostgreSQL status
sudo systemctl status postgresql
```

### 2. Create Database and User

```bash
# Switch to postgres user and open psql
sudo -u postgres psql

# In PostgreSQL shell, run these commands:
CREATE DATABASE goat_scripting;
CREATE USER goat_user WITH ENCRYPTED PASSWORD 'your_secure_password_here';
GRANT ALL PRIVILEGES ON DATABASE goat_scripting TO goat_user;
GRANT ALL ON SCHEMA public TO goat_user;

-- List databases to verify
\l

-- Exit PostgreSQL
\q
```

### 3. Test Database Connection

```bash
# Test connection with new user
psql -U goat_user -h localhost -d goat_scripting -c "SELECT version();"
```

---

## Application Deployment

### 1. Clone Repository

```bash
# Navigate to home directory
cd /home/deploy

# Clone your repository (replace with your actual repository URL)
git clone https://github.com/leroypinto1977/goat-mastermind-ui.git
cd goat-mastermind-ui

# Check repository contents
ls -la
```

### 2. Install Dependencies

```bash
# Install Node.js dependencies
npm install

# If you encounter any permission issues
sudo chown -R deploy:deploy /home/deploy/goat-mastermind-ui
```

### 3. Environment Configuration

Create production environment file:

```bash
# Create .env file for production
nano .env
```

Add the following content (update values as needed):

```bash
# Database - Update with your actual values
DATABASE_URL="postgresql://goat_user:your_secure_password_here@localhost:5432/goat_scripting"

# NextAuth.js - Update with your domain or server IP
NEXTAUTH_URL="https://yourdomain.com"  # or http://your_server_ip:3000
NEXTAUTH_SECRET="pC5KenTgJt3mVgecux/dFDEgAwlb5hwX07fghNxIGMo="
AUTH_TRUST_HOST=true

# Admin Setup
INITIAL_ADMIN_EMAIL="admin@goat.com"
INITIAL_ADMIN_PASSWORD="admin123!"
```

### 4. Generate Secure NextAuth Secret

```bash
# Generate a new secure secret
openssl rand -base64 32

# Copy the output and replace NEXTAUTH_SECRET in your .env file
```

### 5. Database Setup

```bash
# Generate Prisma client
npm run db:generate

# Push database schema to PostgreSQL
npm run db:push

# Seed the database (creates initial admin user)
npm run db:seed
```

### 6. Build Application

```bash
# Build the Next.js application for production
npm run build

# Verify build was successful
ls -la .next
```

---

## Process Management

### 1. Create PM2 Ecosystem Configuration

```bash
# Create PM2 ecosystem file
nano ecosystem.config.js
```

Add the following content:

```javascript
module.exports = {
  apps: [
    {
      name: "goat-scripting",
      script: "npm",
      args: "start",
      cwd: "/home/deploy/goat-mastermind-ui",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      instances: 1,
      exec_mode: "fork",
      watch: false,
      max_memory_restart: "1G",
      error_file: "./logs/err.log",
      out_file: "./logs/out.log",
      log_file: "./logs/combined.log",
      time: true,
      restart_delay: 1000,
      max_restarts: 5,
      min_uptime: "10s",
    },
  ],
};
```

### 2. Start Application with PM2

```bash
# Create logs directory
mkdir -p logs

# Start the application
pm2 start ecosystem.config.js

# Check application status
pm2 status

# View logs
pm2 logs goat-scripting

# Save PM2 configuration
pm2 save

# Setup PM2 to start on system boot
pm2 startup
# Follow the instructions provided by the command above
```

---

## Reverse Proxy Setup

### 1. Install Nginx

```bash
sudo apt install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 2. Create Nginx Configuration

```bash
# Create site configuration
sudo nano /etc/nginx/sites-available/goat-scripting
```

Add the following configuration:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;  # Replace with your domain or server IP

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeout settings
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Handle static files
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Cache static files
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### 3. Enable Site Configuration

```bash
# Test Nginx configuration
sudo nginx -t

# Enable the site
sudo ln -s /etc/nginx/sites-available/goat-scripting /etc/nginx/sites-enabled/

# Remove default site (optional)
sudo rm /etc/nginx/sites-enabled/default

# Restart Nginx
sudo systemctl restart nginx

# Check Nginx status
sudo systemctl status nginx
```

---

## SSL Configuration

### 1. Install Certbot

```bash
# Install snapd (if not already installed)
sudo apt install snapd

# Install certbot via snap
sudo snap install core; sudo snap refresh core
sudo snap install --classic certbot

# Create symbolic link
sudo ln -s /snap/bin/certbot /usr/bin/certbot
```

### 2. Obtain SSL Certificate

```bash
# Get SSL certificate for your domain
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Follow the prompts:
# - Enter your email address
# - Agree to terms of service
# - Choose whether to share email with EFF
# - Choose redirect option (recommended: 2 for redirect HTTP to HTTPS)
```

### 3. Test SSL Renewal

```bash
# Test automatic renewal
sudo certbot renew --dry-run

# Setup automatic renewal (already included in most installations)
sudo systemctl status snap.certbot.renew.timer
```

---

## Security & Firewall

### 1. Configure UFW Firewall

```bash
# Install UFW (if not already installed)
sudo apt install ufw -y

# Set default policies
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow SSH (important - don't lock yourself out!)
sudo ufw allow OpenSSH

# Allow HTTP and HTTPS
sudo ufw allow 'Nginx Full'

# Enable firewall
sudo ufw enable

# Check firewall status
sudo ufw status verbose
```

### 2. Secure SSH Configuration (Optional but Recommended)

```bash
# Edit SSH configuration
sudo nano /etc/ssh/sshd_config

# Make these changes:
# PermitRootLogin no
# PasswordAuthentication no  # Only if you have SSH keys setup
# Port 2222  # Optional: change default SSH port

# Restart SSH service
sudo systemctl restart ssh

# If you changed the SSH port, update firewall:
# sudo ufw allow 2222/tcp
```

### 3. Install and Configure Fail2Ban

```bash
# Install fail2ban
sudo apt install fail2ban -y

# Start and enable fail2ban
sudo systemctl start fail2ban
sudo systemctl enable fail2ban

# Check status
sudo fail2ban-client status
```

---

## Monitoring & Maintenance

### 1. Database Backup Setup

Create backup script:

```bash
nano /home/deploy/backup-db.sh
```

Add the following content:

```bash
#!/bin/bash
BACKUP_DIR="/home/deploy/backups"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="goat_scripting"
DB_USER="goat_user"
DB_PASSWORD="your_secure_password_here"

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Create database backup
PGPASSWORD=$DB_PASSWORD pg_dump -U $DB_USER -h localhost $DB_NAME > $BACKUP_DIR/backup_$DATE.sql

# Compress backup
gzip $BACKUP_DIR/backup_$DATE.sql

# Keep only last 7 days of backups
find $BACKUP_DIR -name "backup_*.sql.gz" -type f -mtime +7 -delete

echo "Database backup completed: backup_$DATE.sql.gz"
```

Make script executable and setup cron job:

```bash
# Make script executable
chmod +x /home/deploy/backup-db.sh

# Test the backup script
./backup-db.sh

# Add to crontab for daily backups at 2 AM
crontab -e

# Add this line:
0 2 * * * /home/deploy/backup-db.sh >> /home/deploy/backup.log 2>&1
```

### 2. Application Update Script

Create update script:

```bash
nano /home/deploy/update-app.sh
```

Add the following content:

```bash
#!/bin/bash
echo "🚀 Starting application update..."

cd /home/deploy/goat-mastermind-ui

# Pull latest changes
echo "📥 Pulling latest changes..."
git pull origin main

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Run database migrations (if any)
echo "🗃️ Running database migrations..."
npm run db:push

# Rebuild application
echo "🔨 Building application..."
npm run build

# Restart PM2 application
echo "🔄 Restarting application..."
pm2 restart goat-scripting

# Check application status
echo "✅ Application status:"
pm2 status goat-scripting

echo "🎉 Application update completed!"
```

Make script executable:

```bash
chmod +x /home/deploy/update-app.sh
```

### 3. System Monitoring Commands

```bash
# Monitor application logs
pm2 logs goat-scripting

# Monitor system resources
pm2 monit

# Check application status
pm2 status

# View Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Check system resources
htop  # or top
df -h  # disk usage
free -h  # memory usage
```

---

## Troubleshooting

### Common Issues and Solutions

#### 1. Application Won't Start

```bash
# Check PM2 logs
pm2 logs goat-scripting

# Check if port 3000 is available
sudo netstat -tlnp | grep 3000

# Restart application
pm2 restart goat-scripting
```

#### 2. Database Connection Issues

```bash
# Test database connection
psql -U goat_user -h localhost -d goat_scripting -c "SELECT version();"

# Check PostgreSQL status
sudo systemctl status postgresql

# Restart PostgreSQL
sudo systemctl restart postgresql
```

#### 3. Nginx Issues

```bash
# Test Nginx configuration
sudo nginx -t

# Check Nginx logs
sudo tail -f /var/log/nginx/error.log

# Restart Nginx
sudo systemctl restart nginx
```

#### 4. SSL Certificate Issues

```bash
# Check certificate status
sudo certbot certificates

# Renew certificates manually
sudo certbot renew

# Check renewal timer
sudo systemctl status snap.certbot.renew.timer
```

#### 5. Permission Issues

```bash
# Fix ownership of application files
sudo chown -R deploy:deploy /home/deploy/goat-mastermind-ui

# Fix npm permissions
sudo chown -R deploy:deploy ~/.npm
```

### Environment Variables Not Loading

```bash
# Check if .env file exists and has correct content
cat .env

# Test loading environment variables
export $(cat .env | xargs)
echo $DATABASE_URL

# Verify Prisma can see environment variables
npx prisma validate
```

---

## Quick Reference Commands

### Application Management

```bash
pm2 status                          # Check application status
pm2 restart goat-scripting         # Restart application
pm2 stop goat-scripting            # Stop application
pm2 start goat-scripting           # Start application
pm2 logs goat-scripting            # View application logs
pm2 monit                          # Monitor resources
```

### Database Management

```bash
npm run db:push                     # Update database schema
npm run db:seed                     # Seed database
npm run db:studio                   # Open Prisma Studio
sudo -u postgres psql goat_scripting  # Access database directly
```

### System Management

```bash
sudo systemctl restart nginx       # Restart Nginx
sudo systemctl restart postgresql  # Restart PostgreSQL
sudo ufw status                    # Check firewall status
sudo fail2ban-client status       # Check fail2ban status
```

### Logs and Monitoring

```bash
tail -f logs/combined.log          # Application logs
sudo tail -f /var/log/nginx/error.log  # Nginx error logs
sudo journalctl -u nginx -f       # Nginx system logs
```

---

## Final Steps

### 1. Test Your Deployment

1. **Access your application:**
   - HTTP: `http://yourdomain.com` or `http://your_server_ip`
   - HTTPS: `https://yourdomain.com` (if SSL configured)

2. **Test admin login:**
   - Email: `admin@goat.com` (or your configured email)
   - Password: `admin123!` (or your configured password)

3. **Verify all features work:**
   - User registration
   - Password reset functionality
   - Admin dashboard
   - Database operations

### 2. Security Checklist

- [ ] Changed default admin password
- [ ] Configured firewall (UFW)
- [ ] SSL certificate installed and working
- [ ] Fail2ban configured
- [ ] Database backups scheduled
- [ ] Non-root user created for deployment
- [ ] SSH key authentication enabled
- [ ] Strong database passwords set

### 3. Monitoring Setup

- [ ] PM2 monitoring active
- [ ] Database backups working
- [ ] Log rotation configured
- [ ] SSL auto-renewal tested
- [ ] Application update script created

---

## Support and Maintenance

### Regular Maintenance Tasks

1. **Weekly:**
   - Check application logs for errors
   - Monitor system resources
   - Review security logs

2. **Monthly:**
   - Update system packages: `sudo apt update && sudo apt upgrade`
   - Review database backups
   - Check SSL certificate expiration

3. **As Needed:**
   - Deploy application updates using update script
   - Monitor and optimize database performance
   - Review and update security configurations

### Getting Help

- **Application Logs:** `pm2 logs goat-scripting`
- **System Logs:** `sudo journalctl -xe`
- **Nginx Logs:** `sudo tail -f /var/log/nginx/error.log`
- **Database Logs:** `sudo tail -f /var/log/postgresql/postgresql-*.log`

---

_Last updated: September 2025_
_For the latest version of this guide, check the project repository._
