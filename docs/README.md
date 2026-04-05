# VisionDesk

A comprehensive optician management platform with a modern, modular architecture.

## Project Structure

```
VisionDesk/
├── apps/
│   ├── api/                    # Backend API (Express + Prisma + MySQL)
│   ├── optician-web/           # Optician Web App (React + Vite + TypeScript)
│   ├── superadmin-web/         # Superadmin Web App (React + Vite + TypeScript)
│   └── mobile/                 # Mobile App (React Native + Expo)
```

## Tech Stack

### Backend API
- **Runtime**: Node.js with Express
- **Language**: TypeScript
- **Database**: MySQL with Prisma ORM
- **Authentication**: JWT with bcryptjs
- **Validation**: Zod

### Optician Web App
- **Framework**: React 18 with Vite
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **State Management**: Zustand
- **Data Fetching**: TanStack Query
- **Forms**: React Hook Form with Zod
- **Routing**: React Router v6
- **Icons**: Lucide React

### Superadmin Web App
- **Framework**: React 18 with Vite
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **State Management**: Zustand
- **Data Fetching**: TanStack Query
- **Forms**: React Hook Form with Zod
- **Routing**: React Router v6
- **Icons**: Lucide React

### Mobile App
- **Framework**: React Native with Expo
- **Language**: TypeScript
- **State Management**: Zustand
- **Data Fetching**: TanStack Query
- **Navigation**: React Navigation

## Getting Started

### Prerequisites
- Node.js 18+
- MySQL 8.0+
- npm or yarn

### Backend Setup

1. Navigate to the API directory:
   ```bash
   cd apps/api
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env` file:
   ```env
   DATABASE_URL="mysql://root:@localhost:3306/visiondesk"
   JWT_SECRET="your-super-secret-jwt-key"
   JWT_EXPIRES_IN="7d"
   ```

4. Create the database:
   ```sql
   CREATE DATABASE visiondesk;
   ```

5. Run Prisma migrations:
   ```bash
   npx prisma migrate dev
   ```

6. Seed the database:
   ```bash
   npm run seed
   ```

7. Start the development server:
   ```bash
   npm run dev
   ```

The API will be available at `http://localhost:3001`

### Frontend Setup (Optician Web App)

1. Navigate to the frontend directory:
   ```bash
   cd apps/optician-web
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

The app will be available at `http://localhost:5173`

### Superadmin Web App Setup

1. Navigate to the superadmin directory:
   ```bash
   cd apps/superadmin-web
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

The app will be available at `http://localhost:5174`

### Mobile App Setup

1. Navigate to the mobile directory:
   ```bash
   cd apps/mobile
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start Expo:
   ```bash
   npx expo start
   ```

See `apps/mobile/README.md` for detailed configuration instructions.

## Demo Credentials

### Optician Web App / Mobile App
- **Email**: admin@visiondesk.com
- **Password**: admin123

### Superadmin Web App
- **Email**: superadmin@visiondesk.com
- **Password**: superadmin123

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Clients
- `GET /api/clients` - List clients
- `POST /api/clients` - Create client
- `GET /api/clients/:id` - Get client
- `PUT /api/clients/:id` - Update client
- `DELETE /api/clients/:id` - Delete client

### Orders
- `GET /api/orders` - List orders
- `POST /api/orders` - Create order
- `GET /api/orders/:id` - Get order
- `PUT /api/orders/:id` - Update order
- `PATCH /api/orders/:id/status` - Update order status

### Frames
- `GET /api/frames` - List frames
- `POST /api/frames` - Create frame
- `GET /api/frames/:id` - Get frame
- `PUT /api/frames/:id` - Update frame
- `DELETE /api/frames/:id` - Delete frame

### Lenses
- `GET /api/lenses` - List lenses
- `POST /api/lenses` - Create lens
- `GET /api/lenses/:id` - Get lens
- `PUT /api/lenses/:id` - Update lens
- `DELETE /api/lenses/:id` - Delete lens

### Atelier
- `GET /api/atelier/jobs` - List atelier jobs
- `GET /api/atelier/jobs/:id` - Get job
- `PUT /api/atelier/jobs/:id` - Update job
- `PATCH /api/atelier/jobs/:id/status` - Update job status

### Panorama
- `GET /api/panorama/active-scene` - Get active panorama scene
- `GET /api/panorama/hotspots` - List hotspots
- `POST /api/panorama/hotspots` - Create hotspot
- `PUT /api/panorama/hotspots/:id` - Update hotspot
- `DELETE /api/panorama/hotspots/:id` - Delete hotspot

### Desk
- `GET /api/desk/summary` - Get dashboard summary
- `GET /api/desk/recent-orders` - Get recent orders
- `GET /api/desk/low-stock` - Get low stock items
- `GET /api/desk/atelier-queue` - Get atelier queue

### Superadmin
- `POST /api/superadmin/auth/login` - Superadmin login
- `GET /api/superadmin/auth/me` - Get current superadmin
- `GET /api/superadmin/dashboard/summary` - Platform dashboard
- `GET /api/superadmin/shops` - List all shops
- `GET /api/superadmin/shops/:id` - Get shop details
- `POST /api/superadmin/shops` - Create shop
- `PUT /api/superadmin/shops/:id` - Update shop
- `PATCH /api/superadmin/shops/:id/status` - Toggle shop status
- `GET /api/superadmin/users` - List all platform users
- `GET /api/superadmin/users/:id` - Get user details
- `PATCH /api/superadmin/users/:id/status` - Toggle user status
- `GET /api/superadmin/activity-logs` - List all activity logs
- `GET /api/superadmin/settings` - Get platform settings
- `PUT /api/superadmin/settings` - Update platform settings

## Features

### Panorama Home Page
- Interactive 360° panorama view of the optical shop
- Clickable hotspots to navigate to different modules
- Customizable hotspot positions and labels

### Client Management
- Full CRUD operations for clients
- Prescription history tracking
- Order history per client

### Order Management
- Create and track optical orders
- Status workflow (Draft → Confirmed → In Atelier → Ready → Delivered)
- Automatic atelier job creation

### Atelier (Workshop)
- Job queue management
- Technician assignment
- Status tracking (Pending → In Progress → Blocked → Ready)

### Inventory Management
- Frame and lens stock tracking
- Low stock alerts
- Stock movement history

### Supplier Management
- Supplier database
- Contact information

## License

MIT
