# VisionDesk Recovery Guide

## Environment Requirements

### 1. Install Node.js
Download and install Node.js 18+ from: https://nodejs.org/
- Recommended: Node.js 20 LTS

### 2. Install MySQL
Since XAMPP was lost, you have two options:

**Option A: Reinstall XAMPP**
- Download from: https://www.apachefriends.org/
- Start MySQL from XAMPP Control Panel

**Option B: Install MySQL Standalone**
- Download MySQL 8.0 from: https://dev.mysql.com/downloads/mysql/
- Or use Docker: `docker run -d -p 3306:3306 -e MYSQL_ROOT_PASSWORD= -e MYSQL_ALLOW_EMPTY_PASSWORD=yes mysql:8`

### 3. Create Database
Once MySQL is running, create the database:
```sql
CREATE DATABASE visiondesk CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

---

## Setup Steps (After Node.js and MySQL are installed)

### Step 1: Install API Dependencies
```bash
cd apps/api
npm install
```

### Step 2: Generate Prisma Client
```bash
cd apps/api
npx prisma generate
```

### Step 3: Push Database Schema
```bash
cd apps/api
npx prisma db push
```

### Step 4: Seed Database
```bash
cd apps/api
npm run db:seed
```

### Step 5: Start API Server
```bash
cd apps/api
npm run dev
```
API will be available at: http://localhost:3001

### Step 6: Install & Start Optician Web App
```bash
cd apps/optician-web
npm install
npm run dev
```
App will be available at: http://localhost:5173

### Step 7: Install & Start Superadmin Web App
```bash
cd apps/superadmin-web
npm install
npm run dev
```
App will be available at: http://localhost:5174

### Step 8: Install & Start Mobile App
```bash
cd apps/mobile
npm install
npx expo start
```

---

## Demo Credentials

### Optician Web / Mobile
- Email: `admin@visiondesk.com`
- Password: `admin123`

### Superadmin Web
- Email: `superadmin@visiondesk.com`
- Password: `superadmin123`

---

## Environment Files

### API (.env) - Already configured
```
DATABASE_URL="mysql://root:@localhost:3306/visiondesk"
JWT_SECRET="visiondesk-super-secret-jwt-key-2024"
JWT_EXPIRES_IN="7d"
PORT=3001
NODE_ENV=development
```

### Mobile (.env) - Update IP if needed
```
EXPO_PUBLIC_API_URL=http://YOUR_LOCAL_IP:3001/api
```
Replace `YOUR_LOCAL_IP` with your machine's local IP for mobile device testing.

---

## Troubleshooting

### MySQL Connection Error
- Ensure MySQL is running on port 3306
- Check that root user has no password (or update DATABASE_URL)

### Prisma Client Error
Run: `npx prisma generate` in the api folder

### Port Already in Use
- API: Change PORT in .env
- Web apps: Vite will auto-increment ports

