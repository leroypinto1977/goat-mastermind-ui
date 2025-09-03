# Production Deployment Guide: FastAPI + Next.js on Amazon Linux 2023

## Overview
This guide covers deploying a FastAPI backend and Next.js frontend on an Amazon Linux 2023 instance with:
- **Backend**: `app.thegoatmedia.co`
- **Frontend**: `mastermind.thegoatmedia.co`
- Production-ready setup with SSL, reverse proxy, and CI/CD

## Prerequisites
- AWS account with EC2 access
- Domain `thegoatmedia.co` with DNS management access
- GitHub repository with your code
- Basic knowledge of Linux commands

## Step 1: AWS EC2 Instance Setup

### 1.1 Create EC2 Instance
1. Launch a new EC2 instance
2. Choose Amazon Linux 2023 AMI
3. Select at least t3.small (2GB RAM, 2 vCPU) for production
4. Configure security group:
   - SSH (22) from your IP
   - HTTP (80) from anywhere
   - HTTPS (443) from anywhere
5. Add your SSH key pair
6. Launch the instance

### 1.2 Initial Server Setup
```bash
# Connect to your server
ssh ec2-user@your_server_ip

# Update system
sudo dnf update -y

# Create a deploy user
sudo useradd -m deploy
sudo usermod -aG wheel deploy

# Set password for deploy user (optional)
sudo passwd deploy

# Add deploy user to sudoers
echo 'deploy ALL=(ALL) NOPASSWD:ALL' | sudo tee /etc/sudoers.d/deploy

# Switch to deploy user
sudo su - deploy
```

## Step 2: Install Required Software

### 2.1 Install Node.js and npm
```bash
# Install Node.js 18.x using dnf
sudo dnf install nodejs npm -y

# If you need a specific version, use NodeSource repository
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo dnf install nodejs -y

# Verify installation
node --version
npm --version
```

### 2.2 Install Python and pip
```bash
# Python 3 is usually pre-installed on Amazon Linux 2023
python3 --version

# Install pip and development tools
sudo dnf install python3-pip python3-devel gcc -y

# Install virtualenv
pip3 install virtualenv --user
```

### 2.3 Install PM2 (Process Manager)
```bash
sudo npm install -g pm2
```

### 2.4 Install Nginx
```bash
sudo dnf install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx

# Check nginx status
sudo systemctl status nginx
```

### 2.5 Install Certbot for SSL
```bash
# Install EPEL repository first
sudo dnf install epel-release -y

# Install certbot and nginx plugin
sudo dnf install certbot python3-certbot-nginx -y
```

## Step 3: DNS Configuration

Configure your DNS records to point to your EC2 instance's public IP:

```
A record: app.thegoatmedia.co → your_ec2_public_ip
A record: mastermind.thegoatmedia.co → your_ec2_public_ip
```

## Step 4: Application Setup

### 4.1 Clone Your Repositories
```bash
cd /home/deploy
mkdir apps && cd apps

# Clone your repositories
git clone https://github.com/yourusername/your-fastapi-backend.git backend
git clone https://github.com/yourusername/your-nextjs-frontend.git frontend
```

### 4.2 FastAPI Backend Setup
```bash
cd /home/deploy/apps/backend

# Create virtual environment (using virtualenv since we installed it via pip)
python3 -m virtualenv venv
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
cd /home/deploy/apps/frontend

# Install dependencies
npm install

# Build the application
npm run build
```

## Step 5: PM2 Configuration

### 5.1 FastAPI PM2 Configuration
Create `/home/deploy/apps/backend/ecosystem.config.js`:
```javascript
module.exports = {
  apps: [{
    name: 'fastapi-backend',
    script: 'venv/bin/gunicorn',
    args: '-w 4 -k uvicorn.workers.UvicornWorker main:app --bind 127.0.0.1:8000',
    cwd: '/home/deploy/apps/backend',
    env: {
      NODE_ENV: 'production'
    }
  }]
}
```

### 5.2 Next.js PM2 Configuration
Create `/home/deploy/apps/frontend/ecosystem.config.js`:
```javascript
module.exports = {
  apps: [{
    name: 'nextjs-frontend',
    script: 'npm',
    args: 'start',
    cwd: '/home/deploy/apps/frontend',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
}
```

### 5.3 Start Applications
```bash
# Start FastAPI backend
cd /home/deploy/apps/backend
pm2 start ecosystem.config.js

# Start Next.js frontend
cd /home/deploy/apps/frontend
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

## Step 8: Firewall Configuration (Using firewalld)

```bash
# Amazon Linux 2023 uses firewalld instead of ufw
sudo systemctl start firewalld
sudo systemctl enable firewalld

# Allow HTTP and HTTPS traffic
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --permanent --add-service=ssh

# Reload firewall rules
sudo firewall-cmd --reload

# Check firewall status
sudo firewall-cmd --list-all
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
/home/deploy/.pm2/logs/*.log {
    daily
    missingok
    rotate 7
    compress
    notifempty
    create 0644 deploy deploy
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
Create `/home/deploy/monitor.sh`:
```bash
#!/bin/bash
# Basic health check script
LOG_FILE="/home/deploy/health.log"
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
chmod +x /home/deploy/monitor.sh

# Edit crontab
crontab -e
# Add: */5 * * * * /home/deploy/monitor.sh

# Alternative: Add to system cron
echo "*/5 * * * * deploy /home/deploy/monitor.sh" | sudo tee -a /etc/crontab
```

## Step 11: GitHub Actions CI/CD

### 11.1 Backend Deployment Workflow
Create `.github/workflows/deploy-backend.yml` in your backend repository:

```yaml
name: Deploy FastAPI Backend

on:
  push:
    branches: [ main ]

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
          cd /home/deploy/apps/backend
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
    branches: [ main ]

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
          cd /home/deploy/apps/frontend
          git pull origin main
          npm ci
          npm run build
          pm2 restart nextjs-frontend
```

### 11.3 GitHub Secrets Setup
Add these secrets to your GitHub repository settings:
- `HOST`: Your EC2 instance's public IP address
- `USERNAME`: `deploy`
- `SSH_KEY`: Your private SSH key content (the one that matches your EC2 key pair)

## Step 12: Backup Strategy

### 12.1 Database Backup (if using)
Create `/home/deploy/backup.sh`:
```bash
#!/bin/bash
BACKUP_DIR="/home/deploy/backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup database (example for PostgreSQL)
# pg_dump your_db > $BACKUP_DIR/db_backup_$DATE.sql

# Backup application files
tar -czf $BACKUP_DIR/apps_backup_$DATE.tar.gz /home/deploy/apps

# Keep only last 7 days of backups
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
```

### 12.2 Add to Cron
```bash
# Edit user crontab
crontab -e
# Add: 0 2 * * * /home/deploy/backup.sh

# Or add to system cron
echo "0 2 * * * deploy /home/deploy/backup.sh" | sudo tee -a /etc/crontab
```

## Step 13: Environment Variables Management

### 13.1 Backend Environment Variables
Create `/home/deploy/apps/backend/.env`:
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
Create `/home/deploy/apps/frontend/.env.production`:
```env
NEXT_PUBLIC_API_URL=https://app.thegoatmedia.co
NEXT_PUBLIC_ENVIRONMENT=production
```

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
  apps: [{
    name: 'nextjs-frontend',
    script: 'npm',
    args: 'start',
    cwd: '/home/deploy/apps/frontend',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
}
```

## Troubleshooting

### Common Issues
1. **Applications not accessible**: Check firewall and nginx configuration
2. **SSL issues**: Verify DNS records and certificate installation
3. **PM2 applications crashing**: Check logs with `pm2 logs`
4. **High memory usage**: Consider upgrading your droplet or optimizing applications

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

## Additional Amazon Linux 2023 Considerations

### SELinux Configuration
Amazon Linux 2023 has SELinux enabled by default. You may need to configure it:

```bash
# Check SELinux status
sestatus

# If you encounter permission issues, you can temporarily set to permissive
sudo setenforce 0

# For permanent change (not recommended for production)
sudo sed -i 's/SELINUX=enforcing/SELINUX=permissive/' /etc/selinux/config

# Better approach: Configure SELinux policies for nginx
sudo setsebool -P httpd_can_network_connect 1
sudo setsebool -P httpd_can_network_relay 1
```

### System Service Management
Amazon Linux 2023 uses systemd. You can optionally create systemd services instead of using PM2:

#### Create FastAPI Service (Alternative to PM2)
```bash
sudo tee /etc/systemd/system/fastapi-backend.service > /dev/null <<EOF
[Unit]
Description=FastAPI Backend
After=network.target

[Service]
Type=exec
User=deploy
Group=deploy
WorkingDirectory=/home/deploy/apps/backend
Environment=PATH=/home/deploy/apps/backend/venv/bin
ExecStart=/home/deploy/apps/backend/venv/bin/gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app --bind 127.0.0.1:8000
ExecReload=/bin/kill -s HUP \$MAINPID
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF

# Enable and start the service
sudo systemctl daemon-reload
sudo systemctl enable fastapi-backend
sudo systemctl start fastapi-backend
```

### Package Management Differences
```bash
# Amazon Linux 2023 uses dnf instead of apt
# Install additional packages if needed
sudo dnf install git wget curl htop -y

# Install development tools group
sudo dnf groupinstall "Development Tools" -y
```

## Conclusion

This setup provides a production-ready deployment on Amazon Linux 2023 with:
- ✅ SSL/HTTPS encryption
- ✅ Reverse proxy with Nginx
- ✅ Process management with PM2
- ✅ Automated deployments with GitHub Actions
- ✅ Basic monitoring and health checks
- ✅ Security hardening
- ✅ Backup strategy
- ✅ Firewalld configuration
- ✅ SELinux compatibility

Your applications should now be accessible at:
- **Backend**: https://app.thegoatmedia.co
- **Frontend**: https://mastermind.thegoatmedia.co

**Amazon Linux 2023 Specific Notes:**
- Uses `dnf` package manager instead of `apt`
- Uses `firewalld` instead of `ufw`
- SELinux is enabled by default
- Python 3 is pre-installed
- systemd service management available as PM2 alternative

Remember to regularly update your system with `sudo dnf update` and monitor your applications for security patches.