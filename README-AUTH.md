# GOAT Mastermind - Authentication Setup Guide

This guide explains the comprehensive authentication system implemented in your Next.js application.

## Features

✅ **Admin-controlled authentication** - No public registration, only admins can create users
✅ **Single session per user** - Automatic logout when logging in from another device  
✅ **Admin dashboard** - Complete user management interface
✅ **Custom login page** - Branded authentication experience
✅ **Role-based access control** - Admin and User roles with different permissions
✅ **Audit logging** - Track all authentication and admin actions
✅ **Device tracking** - Monitor active sessions and devices

## Architecture Overview

### Authentication Flow
1. **NextAuth v5** with JWT strategy for session management
2. **Prisma** with PostgreSQL for data persistence
3. **bcryptjs** for password hashing
4. **Middleware** for route protection and role-based redirects

### Database Schema
- **Users** - Store user accounts with roles and status
- **Sessions** - Track active user sessions
- **Devices** - Monitor user devices and browsers
- **AuditLogs** - Log all system activities
- **Accounts/VerificationTokens** - NextAuth adapter tables

## Quick Setup

### 1. Environment Setup
Create a `.env.local` file:

```env
# Database (choose one)
DATABASE_URL="postgresql://username:password@localhost:5432/goat_scripting"
# OR for SQLite: DATABASE_URL="file:./dev.db"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-super-secret-key-here-generate-a-random-string"

# Admin Setup
INITIAL_ADMIN_EMAIL="admin@goatscripting.com"
INITIAL_ADMIN_PASSWORD="admin123!"
```

### 2. Database Setup
```bash
# Install dependencies
npm install

# Setup database and create admin
npm run db:setup
```

### 3. Start Development
```bash
npm run dev
```

## User Management

### Admin Functions
- ✅ Create new users with email/password
- ✅ Assign USER or ADMIN roles
- ✅ Suspend/activate user accounts
- ✅ Kill active user sessions
- ✅ Monitor device activity
- ✅ View audit logs

### Session Management
- ✅ Only one active session per user
- ✅ New login automatically terminates previous sessions
- ✅ Device tracking with browser/OS detection
- ✅ IP address logging

## Access Control

### Routes
- **Public**: `/auth/signin` - Login page
- **Protected**: `/` - Main dashboard (requires authentication)  
- **Protected**: `/scripting-agent` - Agent interface (requires authentication)
- **Admin Only**: `/admin` - Admin dashboard (requires ADMIN role)

### Middleware Protection
- Automatic redirects based on authentication status
- Role-based access control
- Session validation on protected routes

## Security Features

### Password Security
- bcrypt hashing with salt rounds of 12
- Minimum password requirements enforced in UI
- No password recovery (admin-managed system)

### Session Security  
- JWT tokens with 30-day expiration
- Secure HttpOnly cookies
- CSRF protection
- Single session enforcement

### Audit Logging
All activities are logged:
- User login/logout
- Account creation/modification
- Session termination
- Status changes
- Failed login attempts

## API Endpoints

### Admin APIs
- `GET /api/admin/users` - List all users
- `POST /api/admin/users` - Create new user
- `PATCH /api/admin/users/[id]` - Update user status
- `DELETE /api/admin/users/[id]/sessions` - Kill user sessions
- `GET /api/admin/devices` - List active devices
- `GET /api/admin/audit-logs` - View audit logs

### Authentication
- `POST /api/auth/[...nextauth]` - NextAuth endpoints
- Custom credential validation
- Session management

## Deployment Considerations

### Environment Variables
- Use strong, unique `NEXTAUTH_SECRET` in production
- Use secure database credentials
- Change default admin password immediately

### Database
- Use PostgreSQL for production
- Enable SSL connections
- Regular backups recommended
- Consider read replicas for scaling

### Security
- Enable HTTPS in production
- Use secure session settings
- Implement rate limiting on auth endpoints
- Monitor audit logs regularly

## Troubleshooting

### Common Issues
1. **Database Connection**: Verify DATABASE_URL format
2. **Auth Errors**: Check NEXTAUTH_SECRET and NEXTAUTH_URL
3. **Role Issues**: Ensure admin user exists with ADMIN role
4. **Session Problems**: Clear browser cookies and restart

### Development
- Enable NextAuth debug mode: `debug: true` in auth options
- Check Prisma logs for database queries
- Use browser dev tools for network debugging

## Customization

### Adding New Roles
1. Update `UserRole` enum in Prisma schema
2. Add role checks in middleware
3. Update admin dashboard UI
4. Migrate database

### Custom Fields
1. Add fields to User model in Prisma schema
2. Update auth options and API endpoints
3. Modify admin forms
4. Run database migration

This system provides enterprise-grade authentication with full admin control while maintaining security and user experience.
