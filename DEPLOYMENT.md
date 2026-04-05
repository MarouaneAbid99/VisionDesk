# VisionDesk Production Deployment Guide

## Table of Contents
1. [Deployment Architecture](#part-1-deployment-architecture)
2. [Environment Preparation](#part-2-environment-preparation)
3. [Build & Deploy Commands](#part-3-build--deploy-commands)
4. [Release Checklist](#part-4-release-checklist)
5. [Final Report](#part-5-final-report)

---

# PART 1: DEPLOYMENT ARCHITECTURE

## Recommended Production Stack

| Component | Platform | Domain/URL |
|-----------|----------|------------|
| **API Backend** | Render.com (Web Service) | `api.visiondesk.ma` |
| **Optician Web** | Vercel | `app.visiondesk.ma` |
| **Superadmin Web** | Vercel | `admin.visiondesk.ma` |
| **Database** | PlanetScale / Railway MySQL | (internal connection string) |
| **Mobile App** | Expo EAS | Play Store / APK distribution |
| **File Storage** | Render Disk / Cloudinary / S3 | `api.visiondesk.ma/uploads` |

## Domain Structure

```
visiondesk.ma (landing page - optional)
├── api.visiondesk.ma      → API Backend (Render)
├── app.visiondesk.ma      → Optician Web App (Vercel)
├── admin.visiondesk.ma    → Superadmin Web App (Vercel)
└── Mobile App             → Points to api.visiondesk.ma/api
```

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENTS                                  │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ Optician Web │  │ Superadmin   │  │ Mobile App (Android) │  │
│  │ (Vercel)     │  │ (Vercel)     │  │ (Expo EAS)           │  │
│  │ app.vd.ma    │  │ admin.vd.ma  │  │                      │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────┘  │
│         │                 │                      │              │
│         └─────────────────┼──────────────────────┘              │
│                           │                                      │
│                           ▼                                      │
│              ┌────────────────────────┐                         │
│              │   API Backend          │                         │
│              │   (Render.com)         │                         │
│              │   api.visiondesk.ma    │                         │
│              │   - Express.js         │                         │
│              │   - Prisma ORM         │                         │
│              │   - JWT Auth           │                         │
│              └───────────┬────────────┘                         │
│                          │                                       │
│              ┌───────────┴───────────┐                          │
│              │                       │                          │
│              ▼                       ▼                          │
│   ┌──────────────────┐    ┌──────────────────┐                 │
│   │ MySQL Database   │    │ File Storage     │                 │
│   │ (PlanetScale/    │    │ (Render Disk /   │                 │
│   │  Railway)        │    │  Cloudinary)     │                 │
│   └──────────────────┘    └──────────────────┘                 │
└─────────────────────────────────────────────────────────────────┘
```

## CORS Configuration

The API must allow these origins in production:

```javascript
const allowedOrigins = [
  'https://app.visiondesk.ma',      // Optician Web
  'https://admin.visiondesk.ma',    // Superadmin Web
  // Mobile apps have no origin (null)
];
```

## Static Files Strategy

### Option A: Render Disk (Simple)
- Mount a persistent disk on Render
- Files stored at `/uploads` served via Express static
- Pros: Simple, no external service
- Cons: Single instance, disk size limits

### Option B: Cloudinary (Recommended for Scale)
- Upload images to Cloudinary
- Store URLs in database
- Pros: CDN, transformations, scalable
- Cons: Additional service, cost

### Option C: AWS S3 + CloudFront
- Upload to S3 bucket
- Serve via CloudFront CDN
- Pros: Highly scalable, enterprise-grade
- Cons: More complex setup

**Recommendation**: Start with Render Disk, migrate to Cloudinary when needed.

---

# PART 2: ENVIRONMENT PREPARATION

## API Backend (.env.production)

```bash
# Database
DATABASE_URL="mysql://user:password@host:3306/visiondesk?ssl={"rejectUnauthorized":true}"

# Authentication
JWT_SECRET="generate-a-64-char-random-string-here"
JWT_EXPIRES_IN="7d"

# Server
PORT=3001
NODE_ENV=production

# CORS - comma-separated allowed origins
CORS_ORIGINS="https://app.visiondesk.ma,https://admin.visiondesk.ma"

# File uploads
UPLOAD_DIR="/var/data/uploads"
MAX_FILE_SIZE="10mb"

# Logging
LOG_LEVEL="info"
```

### Generate JWT Secret
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## Optician Web (.env.production)

```bash
# API URL - in production, use full URL
VITE_API_URL=https://api.visiondesk.ma/api

# App info
VITE_APP_NAME=VisionDesk
VITE_APP_VERSION=1.0.0
```

## Superadmin Web (.env.production)

```bash
# API URL
VITE_API_URL=https://api.visiondesk.ma/api

# App info
VITE_APP_NAME=VisionDesk Admin
```

## Mobile App (eas.json - production profile)

```json
{
  "build": {
    "production": {
      "autoIncrement": true,
      "android": {
        "buildType": "app-bundle",
        "gradleCommand": ":app:bundleRelease"
      },
      "env": {
        "APP_ENV": "production",
        "EXPO_PUBLIC_API_URL": "https://api.visiondesk.ma/api"
      }
    }
  }
}
```

## Database Setup (PlanetScale Example)

1. Create database on PlanetScale
2. Get connection string from dashboard
3. Format: `mysql://user:pass@host/db?ssl={"rejectUnauthorized":true}`
4. Run migrations via Prisma

---

# PART 3: BUILD & DEPLOY COMMANDS

## API Backend (Render.com)

### Local Build Test
```bash
cd apps/api
npm install
npx prisma generate
npm run build
npm start
```

### Render Configuration

**Build Command:**
```bash
npm install && npx prisma generate && npm run build
```

**Start Command:**
```bash
npm start
```

**Environment Variables (set in Render dashboard):**
- `DATABASE_URL`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `NODE_ENV=production`
- `CORS_ORIGINS`

### Database Migration (Run Once)
```bash
# From local machine with production DATABASE_URL
cd apps/api
DATABASE_URL="production-url" npx prisma migrate deploy
```

### Seed Production Data (Optional)
```bash
DATABASE_URL="production-url" npx tsx prisma/seed.ts
```

---

## Optician Web (Vercel)

### Local Build Test
```bash
cd apps/optician-web
npm install
npm run build
```

### Vercel Configuration

**vercel.json** (create in apps/optician-web):
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### Deploy Commands
```bash
cd apps/optician-web

# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy preview
vercel

# Deploy production
vercel --prod
```

### Environment Variables (Vercel Dashboard)
- `VITE_API_URL=https://api.visiondesk.ma/api`

---

## Superadmin Web (Vercel)

### Local Build Test
```bash
cd apps/superadmin-web
npm install
npm run build
```

### vercel.json (create in apps/superadmin-web):
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### Deploy Commands
```bash
cd apps/superadmin-web
vercel --prod
```

---

## Mobile App (Expo EAS)

### Prerequisites
```bash
npm install -g eas-cli
eas login
```

### Update eas.json for Production
```json
{
  "build": {
    "production": {
      "autoIncrement": true,
      "android": {
        "buildType": "app-bundle"
      },
      "env": {
        "APP_ENV": "production",
        "EXPO_PUBLIC_API_URL": "https://api.visiondesk.ma/api"
      }
    }
  }
}
```

### Build Commands

**Preview APK (Internal Testing):**
```bash
cd apps/mobile
eas build --profile preview --platform android
```

**Production AAB (Play Store):**
```bash
cd apps/mobile
eas build --profile production --platform android
```

**Submit to Play Store:**
```bash
eas submit --platform android
```

### iOS (Future)
```bash
# Requires Apple Developer Account
eas build --profile production --platform ios
eas submit --platform ios
```

---

# PART 4: RELEASE CHECKLIST

## Pre-Deployment

### Database
- [ ] Production database created (PlanetScale/Railway)
- [ ] Connection string secured
- [ ] SSL enabled
- [ ] Migrations ready to deploy
- [ ] Backup strategy defined

### Security
- [ ] JWT_SECRET generated (64+ chars, random)
- [ ] All secrets in environment variables (not in code)
- [ ] CORS origins configured correctly
- [ ] Rate limiting enabled
- [ ] HTTPS enforced on all endpoints

### API
- [ ] Build succeeds locally
- [ ] All routes tested
- [ ] Error handling verified
- [ ] Logging configured
- [ ] Health check endpoint working (`/api/health`)

### Web Apps
- [ ] Build succeeds locally
- [ ] API URL configured correctly
- [ ] No hardcoded localhost URLs
- [ ] SPA routing configured (vercel.json rewrites)
- [ ] Assets optimized

### Mobile
- [ ] EXPO_PUBLIC_API_URL set to production
- [ ] App icons and splash configured
- [ ] Version numbers updated
- [ ] EAS build succeeds

## Deployment Steps

### Step 1: Database
- [ ] Create production database
- [ ] Run `prisma migrate deploy`
- [ ] Verify tables created
- [ ] Seed initial data if needed

### Step 2: API Backend
- [ ] Deploy to Render
- [ ] Set environment variables
- [ ] Verify health check: `curl https://api.visiondesk.ma/api/health`
- [ ] Test auth endpoint

### Step 3: Web Apps
- [ ] Deploy Optician Web to Vercel
- [ ] Deploy Superadmin Web to Vercel
- [ ] Configure custom domains
- [ ] Verify login works

### Step 4: Mobile
- [ ] Build production APK/AAB
- [ ] Test on real device
- [ ] Submit to Play Store (if ready)

## Post-Deployment

### Verification
- [ ] All apps accessible
- [ ] Login/logout works
- [ ] Data persists correctly
- [ ] File uploads work
- [ ] Mobile connects to API

### Monitoring
- [ ] Error tracking configured (Sentry optional)
- [ ] Uptime monitoring (UptimeRobot optional)
- [ ] Log access verified

### Backup
- [ ] Database backup scheduled
- [ ] Backup restoration tested

---

# PART 5: FINAL REPORT

## Recommended Deployment Architecture

| Service | Platform | Cost Estimate |
|---------|----------|---------------|
| API | Render.com (Starter) | $7/month |
| Database | PlanetScale (Hobby) | Free |
| Optician Web | Vercel (Hobby) | Free |
| Superadmin Web | Vercel (Hobby) | Free |
| Mobile Builds | Expo EAS | Free (30 builds/month) |
| **Total** | | **~$7/month** |

## Production Environment Checklist

| Variable | App | Required |
|----------|-----|----------|
| `DATABASE_URL` | API | ✅ |
| `JWT_SECRET` | API | ✅ |
| `JWT_EXPIRES_IN` | API | ✅ |
| `NODE_ENV` | API | ✅ |
| `CORS_ORIGINS` | API | ✅ |
| `VITE_API_URL` | Web Apps | ✅ |
| `EXPO_PUBLIC_API_URL` | Mobile | ✅ |

## Exact Deploy Commands Summary

```bash
# 1. Database Migration
cd apps/api
DATABASE_URL="prod-url" npx prisma migrate deploy

# 2. API (via Render dashboard or CLI)
# Build: npm install && npx prisma generate && npm run build
# Start: npm start

# 3. Optician Web
cd apps/optician-web
vercel --prod

# 4. Superadmin Web
cd apps/superadmin-web
vercel --prod

# 5. Mobile
cd apps/mobile
eas build --profile production --platform android
```

## Risks & Blockers

| Risk | Severity | Mitigation |
|------|----------|------------|
| Database connection issues | High | Test connection before deploy |
| CORS misconfiguration | Medium | Verify origins match exactly |
| File upload path issues | Medium | Use absolute paths, verify disk mount |
| Mobile API URL mismatch | Medium | Double-check eas.json env vars |
| JWT secret exposure | Critical | Never commit to git, use env vars only |
| SSL certificate issues | Medium | Use platform-provided SSL |

## Safest Next Deployment Step

**Recommended order:**

1. **Database First** - Create PlanetScale/Railway database, run migrations
2. **API Second** - Deploy to Render, verify health check
3. **Web Apps Third** - Deploy to Vercel, test login
4. **Mobile Last** - Build with production API URL, test thoroughly

**Start with:**
```bash
# Create database on PlanetScale (free tier)
# Get connection string
# Run migrations:
cd apps/api
DATABASE_URL="your-planetscale-url" npx prisma migrate deploy
```

---

## Quick Reference: Platform Links

- **Render.com**: https://render.com
- **Vercel**: https://vercel.com
- **PlanetScale**: https://planetscale.com
- **Railway**: https://railway.app
- **Expo EAS**: https://expo.dev

---

*Document generated for VisionDesk v1.0.0 production deployment*
