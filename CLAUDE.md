# Quick Start Guide for Claude

This guide will help you get the Operation Management Platform running in under 10 minutes.

## Prerequisites

- Node.js v18+ installed
- PostgreSQL 14+ installed
- Git installed

## Step 1: Database Setup (2 minutes)

```bash
# Open PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE office_management;

# Exit PostgreSQL
\q

# Run the schema
psql -U postgres -d office_management -f backend/database/schema.sql
```

## Step 2: Backend Setup (3 minutes)

```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env and update these required fields:
# DB_HOST=localhost
# DB_PORT=5432
# DB_NAME=office_management
# DB_USER=postgres
# DB_PASSWORD=your_postgres_password
# JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
# JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production

# Start backend server
npm run dev
```

Backend will run at: `http://localhost:5000`

## Step 3: Frontend Setup (2 minutes)

```bash
# Open new terminal
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# The defaults should work fine:
# VITE_API_URL=http://localhost:5000/api
# VITE_APP_NAME=Elisrun Operation Management
# VITE_ENV=development

# Start frontend server
npm run dev
```

Frontend will run at: `http://localhost:3000`

## Step 4: Login and Test

1. Open browser: `http://localhost:3000`
2. Login with default admin credentials:
   - **Email**: `admin@elisrun.com`
   - **Password**: `Admin@123`

## Default Users (from schema.sql)

| Email | Password | Role |
|-------|----------|------|
| admin@elisrun.com | Admin@123 | Admin |
| john.doe@elisrun.com | Password@123 | Manager |
| jane.smith@elisrun.com | Password@123 | Employee |

## Quick Test Checklist

- [ ] Login successfully
- [ ] View dashboard with stats
- [ ] Check leave balance
- [ ] Apply for leave
- [ ] View holidays calendar
- [ ] Check profile page
- [ ] Change password
- [ ] Logout

## Troubleshooting

### Backend won't start
- Check if PostgreSQL is running: `sudo systemctl status postgresql`
- Verify database exists: `psql -U postgres -l | grep office_management`
- Check .env file has correct database credentials

### Frontend won't start
- Check if backend is running at `http://localhost:5000`
- Verify .env file exists in frontend folder
- Clear node_modules: `rm -rf node_modules && npm install`

### Login fails
- Check backend logs for errors
- Verify database has seed data: `psql -U postgres -d office_management -c "SELECT * FROM users;"`
- Ensure JWT secrets are set in backend .env

### CORS errors
- Verify backend CORS_ORIGIN in .env matches frontend URL
- Check backend is running on port 5000

## Email Configuration (Optional)

To enable email notifications:

### Using Gmail (Development)
```env
# In backend/.env
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-specific-password
EMAIL_FROM=your-email@gmail.com
```

### Using AWS SES (Production)
```env
# In backend/.env
EMAIL_SERVICE=ses
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_SES_REGION=us-east-1
EMAIL_FROM=noreply@yourdomain.com
```

## Next Steps

- Customize branding in `frontend/src/components/layout/DashboardLayout.tsx`
- Add company holidays via API or database
- Configure email service for notifications
- Set up proper environment variables for production
- Deploy to AWS

## Project Structure

```
office_management/
├── backend/              # Node.js + Express API
│   ├── src/
│   ├── database/
│   └── .env
├── frontend/             # React + TypeScript
│   ├── src/
│   └── .env
├── README.md            # Full documentation
├── PROJECT_COMPLETE.md  # Feature summary
└── CLAUDE.md           # This quick start guide
```

## Support

- API Documentation: `/backend/API_DOCUMENTATION.md`
- Setup Guide: `/backend/SETUP_GUIDE.md`
- Frontend Guide: `/frontend/README.md`

---

**Built with Claude Code**
Version 1.0.0 - Phase 1 Complete
