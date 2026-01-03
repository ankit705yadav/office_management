# Railway Deployment Guide

This guide explains how to deploy the Office Management Platform on Railway.

## Prerequisites

- A Railway account (https://railway.app)
- Git repository with this codebase

## Architecture

The deployment consists of 3 services:
1. **PostgreSQL Database** - Managed by Railway
2. **Backend API** - Node.js/Express server
3. **Frontend** - React SPA served by Express

## Deployment Steps

### Step 1: Create a New Project on Railway

1. Go to https://railway.app/dashboard
2. Click "New Project"
3. Select "Deploy from GitHub repo" and connect your repository

### Step 2: Add PostgreSQL Database

1. In your project, click "New" → "Database" → "PostgreSQL"
2. Railway will automatically provision a PostgreSQL instance
3. The `DATABASE_URL` environment variable will be automatically available

### Step 3: Deploy Backend

1. Click "New" → "GitHub Repo" → Select your repo
2. Configure the service:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`

3. Add environment variables (Settings → Variables):
   ```
   NODE_ENV=production
   PORT=5000
   JWT_SECRET=<generate-secure-random-string-min-32-chars>
   JWT_REFRESH_SECRET=<generate-another-secure-random-string>
   CORS_ORIGIN=https://<your-frontend-domain>.railway.app
   FRONTEND_URL=https://<your-frontend-domain>.railway.app
   ENABLE_CRON_JOBS=true
   ```

4. Link the database:
   - Go to Variables → "Add Reference"
   - Select the PostgreSQL service
   - Add `DATABASE_URL`

### Step 4: Deploy Frontend

1. Click "New" → "GitHub Repo" → Select your repo
2. Configure the service:
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`

3. Add environment variables:
   ```
   VITE_API_URL=https://<your-backend-domain>.railway.app/api
   ```

### Step 5: Initialize Database

After deployment, you need to run the schema:

1. Connect to your Railway PostgreSQL database
2. Run the schema file:
   ```bash
   psql $DATABASE_URL -f backend/database/schema.sql
   ```

Or use Railway CLI:
```bash
railway run psql $DATABASE_URL -f backend/database/schema.sql
```

### Step 6: Configure Domains

1. Go to each service → Settings → Networking
2. Click "Generate Domain" to get a Railway subdomain
3. Or add your custom domain

## Environment Variables Reference

### Backend (Required)
| Variable | Description |
|----------|-------------|
| `NODE_ENV` | Set to `production` |
| `DATABASE_URL` | PostgreSQL connection string (auto-provided by Railway) |
| `JWT_SECRET` | Secret for JWT access tokens (min 32 chars) |
| `JWT_REFRESH_SECRET` | Secret for JWT refresh tokens (min 32 chars) |
| `CORS_ORIGIN` | Frontend URL for CORS |
| `FRONTEND_URL` | Frontend URL for emails/redirects |

### Backend (Optional)
| Variable | Description |
|----------|-------------|
| `AWS_ACCESS_KEY_ID` | AWS access key for S3 uploads |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key |
| `AWS_S3_BUCKET` | S3 bucket name |
| `FIREBASE_PROJECT_ID` | Firebase project for push notifications |
| `ENABLE_CRON_JOBS` | Enable background jobs (`true`/`false`) |

### Frontend
| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend API URL |

## Default Login Credentials

After seeding the database:
- **Admin**: admin@company.com / Admin@123
- **Manager**: john.doe@company.com / Admin@123
- **Employee**: jane.smith@company.com / Admin@123

## Troubleshooting

### Database Connection Issues
- Ensure `DATABASE_URL` is properly linked from PostgreSQL service
- Check if the database has been initialized with schema.sql

### CORS Errors
- Verify `CORS_ORIGIN` matches the exact frontend URL (including https://)
- Check for trailing slashes

### Build Failures
- Check Railway build logs for specific errors
- Ensure all dependencies are in package.json

## Monitoring

- View logs: Railway Dashboard → Service → Deployments → View Logs
- Health check: Backend exposes `/health` endpoint

## Scaling

Railway automatically handles scaling, but you can:
1. Upgrade your plan for more resources
2. Add more replicas in service settings
