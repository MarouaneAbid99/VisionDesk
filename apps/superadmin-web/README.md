# VisionDesk Superadmin Web App

Platform administration console for VisionDesk.

## Tech Stack

- **React 18** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **React Router** for navigation
- **TanStack Query** for data fetching
- **React Hook Form** + **Zod** for forms
- **Zustand** for state management
- **Lucide React** for icons

## Getting Started

### Prerequisites

- Node.js 18+
- Backend API running on port 3001

### Installation

```bash
cd apps/superadmin-web
npm install
```

### Development

```bash
npm run dev
```

The app will be available at `http://localhost:5174`

### Build

```bash
npm run build
```

## Demo Credentials

- **Email:** superadmin@visiondesk.com
- **Password:** superadmin123

## Features

- **Dashboard** - Platform overview with KPIs and recent activity
- **Shops Management** - Create, view, activate/deactivate shops
- **Users Management** - View and manage users across all shops
- **Activity Logs** - Global activity monitoring
- **Settings** - Platform-wide configuration

## API Endpoints

All endpoints are prefixed with `/api/superadmin`:

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/login` | Superadmin login |
| GET | `/auth/me` | Get current user |
| GET | `/dashboard/summary` | Dashboard stats |
| GET | `/shops` | List shops |
| GET | `/shops/:id` | Shop details |
| POST | `/shops` | Create shop |
| PUT | `/shops/:id` | Update shop |
| PATCH | `/shops/:id/status` | Toggle shop status |
| GET | `/users` | List users |
| GET | `/users/:id` | User details |
| PATCH | `/users/:id/status` | Toggle user status |
| GET | `/activity-logs` | List activity logs |
| GET | `/settings` | Get platform settings |
| PUT | `/settings` | Update platform settings |
