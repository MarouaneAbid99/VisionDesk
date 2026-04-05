# VisionDesk Production Release Checklist

## Pre-Deployment Verification

### Database
- [ ] Production database created (PlanetScale/Railway/other)
- [ ] Connection string obtained and secured
- [ ] SSL/TLS enabled for database connection
- [ ] Database user has appropriate permissions
- [ ] Backup strategy defined and tested

### Security
- [ ] JWT_SECRET generated (64+ characters, cryptographically random)
- [ ] All secrets stored in environment variables (not in code)
- [ ] No hardcoded credentials in codebase
- [ ] CORS origins configured for production domains only
- [ ] Rate limiting enabled on API
- [ ] HTTPS enforced on all endpoints

### API Backend
- [ ] `npm run build` succeeds locally
- [ ] All API routes tested and working
- [ ] Error handling returns appropriate responses
- [ ] Logging configured for production (no sensitive data logged)
- [ ] Health check endpoint responds: `GET /api/health`
- [ ] File upload paths configured correctly

### Optician Web App
- [ ] `npm run build` succeeds locally
- [ ] `VITE_API_URL` configured for production
- [ ] No localhost URLs in production build
- [ ] SPA routing works (vercel.json configured)
- [ ] All pages load correctly
- [ ] Login/logout flow works

### Superadmin Web App
- [ ] `npm run build` succeeds locally
- [ ] `VITE_API_URL` configured for production
- [ ] No localhost URLs in production build
- [ ] SPA routing works (vercel.json configured)
- [ ] All admin functions work

### Mobile App
- [ ] `EXPO_PUBLIC_API_URL` set to production URL in eas.json
- [ ] App icons configured
- [ ] Splash screen configured
- [ ] Version numbers updated (app.config.js)
- [ ] EAS build succeeds for production profile
- [ ] App tested on real device with production API

---

## Deployment Steps

### Step 1: Database Setup
```bash
# 1. Create database on PlanetScale/Railway
# 2. Get connection string
# 3. Run migrations from local machine:
cd apps/api
DATABASE_URL="your-production-connection-string" npx prisma migrate deploy

# 4. (Optional) Seed initial data:
DATABASE_URL="your-production-connection-string" npx tsx prisma/seed.ts
```
- [ ] Database created
- [ ] Migrations applied successfully
- [ ] Tables verified in database
- [ ] Initial data seeded (if needed)

### Step 2: API Deployment (Render.com)
```bash
# Via Render Dashboard:
# 1. Create new Web Service
# 2. Connect GitHub repo
# 3. Set root directory: apps/api
# 4. Build command: npm install && npx prisma generate && npm run build
# 5. Start command: npm start
# 6. Add environment variables
```
- [ ] Render service created
- [ ] Environment variables set:
  - [ ] `DATABASE_URL`
  - [ ] `JWT_SECRET`
  - [ ] `JWT_EXPIRES_IN=7d`
  - [ ] `NODE_ENV=production`
  - [ ] `CORS_ORIGINS`
- [ ] Deploy successful
- [ ] Health check passes: `curl https://api.visiondesk.ma/api/health`
- [ ] Custom domain configured (if applicable)

### Step 3: Optician Web Deployment (Vercel)
```bash
cd apps/optician-web
vercel --prod
```
- [ ] Vercel project created
- [ ] Environment variable set: `VITE_API_URL=https://api.visiondesk.ma/api`
- [ ] Deploy successful
- [ ] Custom domain configured (if applicable)
- [ ] Login works with production API

### Step 4: Superadmin Web Deployment (Vercel)
```bash
cd apps/superadmin-web
vercel --prod
```
- [ ] Vercel project created
- [ ] Environment variable set: `VITE_API_URL=https://api.visiondesk.ma/api`
- [ ] Deploy successful
- [ ] Custom domain configured (if applicable)
- [ ] Superadmin login works

### Step 5: Mobile App Build
```bash
cd apps/mobile
eas build --profile production --platform android
```
- [ ] Production build successful
- [ ] APK/AAB downloaded and tested
- [ ] App connects to production API
- [ ] All features work on real device

---

## Post-Deployment Verification

### Functional Testing
- [ ] Optician Web: Login → Dashboard → All modules work
- [ ] Superadmin Web: Login → Shop management works
- [ ] Mobile App: Login → Panorama → Desk → All features work
- [ ] File uploads work (panorama images, etc.)
- [ ] Data persists correctly across sessions

### Cross-Platform Testing
- [ ] Web apps work on Chrome
- [ ] Web apps work on Firefox
- [ ] Web apps work on Safari
- [ ] Mobile app works on Android 10+
- [ ] Mobile app works on different screen sizes

### Performance
- [ ] API response times acceptable (<500ms)
- [ ] Web apps load in <3 seconds
- [ ] Mobile app responsive

### Monitoring (Optional but Recommended)
- [ ] Error tracking configured (Sentry)
- [ ] Uptime monitoring configured (UptimeRobot)
- [ ] Log access verified (Render logs)

---

## Rollback Plan

### If API fails:
1. Check Render logs for errors
2. Rollback to previous deploy in Render dashboard
3. Verify health check passes

### If Web Apps fail:
1. Check Vercel deployment logs
2. Rollback to previous deployment in Vercel dashboard
3. Verify pages load correctly

### If Mobile App fails:
1. Previous APK should still work
2. Build new version with fixes
3. Distribute updated APK

---

## Emergency Contacts

- **API Issues**: Check Render dashboard and logs
- **Web Issues**: Check Vercel dashboard and logs
- **Database Issues**: Check PlanetScale/Railway dashboard
- **Mobile Issues**: Check Expo EAS dashboard

---

## Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Developer | | | |
| QA | | | |
| Product Owner | | | |

---

*Checklist version: 1.0.0*
*Last updated: March 2026*
