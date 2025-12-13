# Operation Management Backend - Setup & Installation Guide

This guide will help you set up and run the Operation Management Platform backend on your local machine or production server.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Database Setup](#database-setup)
4. [Email Configuration](#email-configuration)
5. [Running the Application](#running-the-application)
6. [Testing](#testing)
7. [Production Deployment](#production-deployment)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **PostgreSQL** (v14 or higher) - [Download](https://www.postgresql.org/download/)
- **npm** or **yarn** (comes with Node.js)
- **Git** (optional, for cloning the repository)

### Verify Installation

```bash
node --version  # Should show v18.0.0 or higher
npm --version   # Should show 9.0.0 or higher
psql --version  # Should show PostgreSQL 14.x or higher
```

---

## Installation

### Step 1: Navigate to Backend Directory

```bash
cd office_management/backend
```

### Step 2: Install Dependencies

```bash
npm install
```

This will install all required packages including:
- Express.js (web framework)
- Sequelize (ORM)
- JWT (authentication)
- Nodemailer (emails)
- And many more...

---

## Database Setup

### Step 1: Create PostgreSQL Database

#### Option A: Using psql Command Line

```bash
# Login to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE office_management;

# Create user (optional, if you want a dedicated user)
CREATE USER operation_user WITH PASSWORD 'your_secure_password';

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE office_management TO operation_user;

# Exit
\q
```

#### Option B: Using pgAdmin GUI

1. Open pgAdmin
2. Right-click on "Databases" → "Create" → "Database"
3. Name: `office_management`
4. Click "Save"

### Step 2: Run Database Schema

```bash
# Login to the database
psql -U postgres -d office_management

# Run the schema file
\i database/schema.sql

# Verify tables were created
\dt

# Exit
\q
```

You should see all tables created:
- users
- departments
- leave_requests
- leave_balances
- holidays
- expenses
- payroll
- inventory
- projects
- tasks
- notifications

### Step 3: Verify Default Data

The schema includes default data:
- 5 departments (IT, HR, Finance, Operations, Sales)
- 1 admin user (email: `admin@elisrun.com`, password: `Admin@123`)
- Sample holidays for 2025

---

## Email Configuration

### Option 1: Gmail (For Development/Testing)

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate App Password**:
   - Go to Google Account → Security
   - Enable 2-Step Verification
   - Go to App Passwords
   - Select "Mail" and "Other" (custom name: "Operation Management")
   - Copy the 16-character password

3. **Update .env file** (see next section)

### Option 2: AWS SES (For Production)

1. **Set up AWS SES**:
   - Go to AWS Console → SES
   - Verify your domain or email address
   - Move out of sandbox mode (to send to any email)
   - Get your SMTP credentials

2. **Update .env file** with AWS credentials

### Option 3: Other SMTP Services

You can use any SMTP service like:
- SendGrid
- Mailgun
- Postmark
- Microsoft 365
- Custom SMTP server

---

## Environment Configuration

### Step 1: Create .env File

```bash
# Copy the example file
cp .env.example .env
```

### Step 2: Edit .env File

Open `.env` in your favorite editor and update these values:

```env
# Server Configuration
NODE_ENV=development
PORT=5000
HOST=localhost

# Database Configuration (Update these!)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=office_management
DB_USER=postgres
DB_PASSWORD=your_postgres_password_here
DATABASE_URL=postgresql://postgres:your_postgres_password_here@localhost:5432/office_management

# JWT Configuration (IMPORTANT: Change these in production!)
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long
JWT_REFRESH_SECRET=your-super-secret-refresh-key-minimum-32-characters-long
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Email Configuration - Gmail (For Development)
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-16-char-app-password
EMAIL_FROM=noreply@elisrun.com
EMAIL_FROM_NAME=Elisrun Technologies

# OR Email Configuration - AWS SES (For Production)
# AWS_ACCESS_KEY_ID=your-aws-access-key
# AWS_SECRET_ACCESS_KEY=your-aws-secret-key
# AWS_REGION=us-east-1
# AWS_SES_REGION=us-east-1

# File Upload Configuration
MAX_FILE_SIZE=5242880
ALLOWED_FILE_TYPES=image/jpeg,image/png,application/pdf

# CORS Configuration
CORS_ORIGIN=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=debug

# Cron Jobs (Set to false to disable automated tasks)
ENABLE_CRON_JOBS=true

# Application URLs
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:5000
```

**Security Notes:**
- ⚠️ **Never commit .env file to Git!** (It's already in .gitignore)
- Use strong, random secrets for JWT in production
- Change default admin password after first login

---

## Running the Application

### Development Mode (with hot reload)

```bash
npm run dev
```

You should see:
```
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   🚀 Operation Management API Server                         ║
║                                                               ║
║   Environment: development                                    ║
║   Port:        5000                                          ║
║   Host:        localhost                                     ║
║   Database:    office_management                          ║
║                                                               ║
║   API URL:     http://localhost:5000/api                     ║
║   Health:      http://localhost:5000/health                  ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝

✓ Database connection established successfully
✓ Database models synchronized
✓ Birthday notifications cron job started (Daily at 9:00 AM)
✓ Work anniversary notifications cron job started (Daily at 9:00 AM)
✓ Notification cleanup cron job started (Weekly on Sunday at 2:00 AM)
✓ Pending approval reminders cron job started (Daily at 10:00 AM)
All cron jobs started successfully
```

### Production Mode

```bash
# Build TypeScript
npm run build

# Start server
npm start
```

---

## Testing

### 1. Test Health Endpoint

```bash
curl http://localhost:5000/health
```

Expected response:
```json
{
  "status": "success",
  "message": "Server is running",
  "timestamp": "2025-11-17T...",
  "environment": "development"
}
```

### 2. Test Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@elisrun.com",
    "password": "Admin@123"
  }'
```

Expected response:
```json
{
  "status": "success",
  "message": "Login successful",
  "data": {
    "user": { ... },
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

### 3. Test Authenticated Endpoint

```bash
# Save the token from login response
TOKEN="your_access_token_here"

curl http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

### 4. Using Postman

1. **Import Collection**:
   - Create a new collection in Postman
   - Set base URL: `http://localhost:5000/api`

2. **Set up Environment**:
   - Create variable: `baseUrl` = `http://localhost:5000/api`
   - Create variable: `token` = (will be set after login)

3. **Test Authentication Flow**:
   - Login → Copy accessToken
   - Set token in environment
   - Test other endpoints with token in Authorization header

---

## Production Deployment

### 1. Build Application

```bash
npm run build
```

This creates a `dist/` folder with compiled JavaScript.

### 2. Set Environment Variables

```bash
export NODE_ENV=production
export PORT=5000
export DATABASE_URL=postgresql://user:pass@host:5432/dbname
export JWT_SECRET=your-production-secret-key
# ... set all other environment variables
```

### 3. Using PM2 (Process Manager)

```bash
# Install PM2 globally
npm install -g pm2

# Start application
pm2 start dist/index.js --name operation-mgmt-api

# View logs
pm2 logs operation-mgmt-api

# Monitor
pm2 monit

# Restart
pm2 restart operation-mgmt-api

# Stop
pm2 stop operation-mgmt-api

# Auto-start on system boot
pm2 startup
pm2 save
```

### 4. Using Docker (Recommended)

Create `Dockerfile`:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 5000
CMD ["npm", "start"]
```

Build and run:
```bash
docker build -t operation-mgmt-api .
docker run -p 5000:5000 --env-file .env operation-mgmt-api
```

### 5. AWS Deployment

#### Option A: Elastic Beanstalk

1. Install EB CLI
2. Initialize: `eb init`
3. Deploy: `eb create production-env`

#### Option B: EC2

1. Launch EC2 instance (Ubuntu/Amazon Linux)
2. Install Node.js and PostgreSQL
3. Clone repository
4. Follow installation steps
5. Use PM2 to manage process
6. Set up Nginx as reverse proxy

---

## Troubleshooting

### Issue: "Cannot connect to database"

**Solution:**
1. Verify PostgreSQL is running: `sudo service postgresql status`
2. Check database credentials in `.env`
3. Verify database exists: `psql -U postgres -l`
4. Check firewall rules

### Issue: "Port 5000 is already in use"

**Solution:**
```bash
# Find process using port 5000
lsof -i :5000

# Kill the process
kill -9 <PID>

# Or use a different port in .env
PORT=5001
```

### Issue: "Email not sending"

**Solution:**
1. Check Gmail app password is correct
2. Verify 2FA is enabled on Gmail
3. Check email logs: `tail -f logs/all.log`
4. Test email service manually:
   ```bash
   # In Node REPL
   node
   > const {sendEmail} = require('./dist/services/email.service')
   > sendEmail({to: 'test@example.com', subject: 'Test', html: '<h1>Test</h1>'})
   ```

### Issue: "JWT token expired"

**Solution:**
- Use the refresh token endpoint to get a new access token
- Implement automatic token refresh in frontend

### Issue: "Cron jobs not running"

**Solution:**
1. Check `ENABLE_CRON_JOBS=true` in `.env`
2. Verify timezone is set correctly in `cron.service.ts`
3. Check logs for cron job execution

### Issue: "Sequelize model sync errors"

**Solution:**
1. Drop and recreate database (⚠️ WARNING: Deletes all data!)
   ```bash
   psql -U postgres
   DROP DATABASE office_management;
   CREATE DATABASE office_management;
   \q
   ```
2. Run schema file again
3. Restart application

---

## Useful Commands

### Database

```bash
# Backup database
pg_dump -U postgres office_management > backup.sql

# Restore database
psql -U postgres office_management < backup.sql

# View database size
psql -U postgres -c "SELECT pg_size_pretty(pg_database_size('office_management'));"
```

### Application

```bash
# View logs
tail -f logs/all.log          # All logs
tail -f logs/error.log        # Error logs only

# Check TypeScript errors
npm run lint

# Format code
npm run lint:fix
```

### Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

---

## Next Steps

1. **Change default admin password** after first login
2. **Create employee accounts** via the API
3. **Upload holiday calendar** for the year
4. **Configure AWS S3** for file storage (optional)
5. **Set up frontend** application
6. **Configure backup** strategy for database
7. **Set up monitoring** (e.g., AWS CloudWatch, Datadog)

---

## Support

For issues and questions:
- **Email**: it@elisrun.com
- **Documentation**: `/backend/API_DOCUMENTATION.md`
- **Internal**: Contact IT Department

---

**Last Updated**: November 2025
**Version**: 1.0.0
