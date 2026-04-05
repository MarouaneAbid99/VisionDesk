# VisionDesk Mobile App

A React Native mobile application for opticians and staff to manage daily operations.

## Tech Stack

- **Framework**: React Native with Expo
- **Language**: TypeScript
- **Navigation**: React Navigation (Bottom Tabs + Native Stack)
- **State Management**: Zustand
- **Data Fetching**: TanStack Query
- **Forms**: React Hook Form with Zod validation
- **HTTP Client**: Axios
- **Secure Storage**: Expo Secure Store

## Features

### Implemented Screens

1. **Login** - JWT authentication with secure token storage
2. **Panorama Home** - Interactive home with hotspots and summary cards
3. **Desk Summary** - Dashboard with stats, recent orders, atelier queue, low stock alerts
4. **Clients List** - Searchable client list with pagination
5. **Client Details** - Full client profile with prescriptions and order history
6. **Orders List** - Filterable order list by status
7. **Order Details** - Complete order view with client, products, pricing
8. **Atelier Jobs** - Workshop job queue with quick status updates
9. **Frames Stock** - Frame inventory with low stock filtering
10. **Lenses Stock** - Lens inventory with low stock filtering

### Navigation Structure

```
├── Auth Stack
│   └── Login Screen
└── Main Tab Navigator
    ├── Home (Panorama)
    ├── Clients
    │   ├── Clients List
    │   └── Client Detail
    ├── Orders
    │   ├── Orders List
    │   └── Order Detail
    ├── Atelier
    │   └── Atelier Jobs
    └── Stock
        ├── Frames Tab
        └── Lenses Tab
```

## Getting Started

### Prerequisites

- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- Expo Go app on your mobile device (for testing)
- Backend API running on localhost:3001

### Installation

1. Navigate to the mobile app directory:
   ```bash
   cd apps/mobile
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

4. Scan the QR code with Expo Go (Android) or Camera app (iOS)

### API Configuration

The app connects to the backend API. **You must configure the API URL before running on a physical device.**

#### Step 1: Find your local IP address

- **Windows**: Open Command Prompt and run `ipconfig`. Look for "IPv4 Address" (e.g., `192.168.1.100`)
- **macOS**: Open Terminal and run `ipconfig getifaddr en0`
- **Linux**: Run `hostname -I` or `ip addr`

#### Step 2: Update `app.json`

Edit `apps/mobile/app.json` and set your IP:

```json
{
  "expo": {
    "extra": {
      "apiUrl": "http://192.168.1.100:3001/api"
    }
  }
}
```

Replace `192.168.1.100` with your actual local IP address.

#### Default Values

| Environment | API URL |
|-------------|---------|
| Android Emulator | `http://10.0.2.2:3001/api` (default) |
| iOS Simulator | `http://localhost:3001/api` |
| Physical Device | `http://YOUR_LOCAL_IP:3001/api` |

#### Troubleshooting

- Ensure your phone and computer are on the **same WiFi network**
- Ensure the backend API is running: `cd apps/api && npm run dev`
- Check that port 3001 is not blocked by firewall
- Restart Expo after changing `app.json`

### Demo Credentials

After seeding the backend database:

- **Email**: admin@visiondesk.com
- **Password**: admin123

## Project Structure

```
apps/mobile/
├── App.tsx                    # Main entry point
├── app.json                   # Expo configuration
├── package.json               # Dependencies
├── tsconfig.json              # TypeScript config
├── babel.config.js            # Babel config with aliases
└── src/
    ├── components/
    │   └── ui/                # Reusable UI components
    │       ├── Badge.tsx
    │       ├── Button.tsx
    │       ├── Card.tsx
    │       ├── EmptyState.tsx
    │       ├── Input.tsx
    │       └── LoadingScreen.tsx
    ├── navigation/            # Navigation configuration
    │   ├── types.ts           # Navigation type definitions
    │   ├── AuthNavigator.tsx
    │   ├── MainNavigator.tsx
    │   ├── HomeNavigator.tsx
    │   ├── ClientsNavigator.tsx
    │   ├── OrdersNavigator.tsx
    │   ├── AtelierNavigator.tsx
    │   ├── StockNavigator.tsx
    │   └── RootNavigator.tsx
    ├── screens/               # Screen components
    │   ├── auth/
    │   │   └── LoginScreen.tsx
    │   ├── home/
    │   │   └── PanoramaScreen.tsx
    │   ├── desk/
    │   │   └── DeskScreen.tsx
    │   ├── clients/
    │   │   ├── ClientsListScreen.tsx
    │   │   └── ClientDetailScreen.tsx
    │   ├── orders/
    │   │   ├── OrdersListScreen.tsx
    │   │   └── OrderDetailScreen.tsx
    │   ├── atelier/
    │   │   └── AtelierJobsScreen.tsx
    │   └── stock/
    │       ├── FramesListScreen.tsx
    │       └── LensesListScreen.tsx
    ├── services/              # API service layer
    │   ├── api.ts             # Axios instance with auth
    │   ├── auth.ts
    │   ├── panorama.ts
    │   ├── desk.ts
    │   ├── clients.ts
    │   ├── orders.ts
    │   ├── atelier.ts
    │   └── stock.ts
    ├── store/                 # Zustand stores
    │   └── authStore.ts
    ├── theme/                 # Design system
    │   ├── colors.ts
    │   ├── spacing.ts
    │   └── typography.ts
    ├── types/                 # TypeScript types
    │   └── index.ts
    └── utils/                 # Utility functions
        └── format.ts
```

## API Endpoints Used

- `POST /api/auth/login` - User authentication
- `GET /api/auth/me` - Get current user
- `GET /api/panorama/active-scene` - Get panorama with hotspots
- `GET /api/desk/summary` - Dashboard statistics
- `GET /api/desk/recent-orders` - Recent orders
- `GET /api/desk/low-stock` - Low stock alerts
- `GET /api/desk/atelier-queue` - Atelier job queue
- `GET /api/clients` - List clients
- `GET /api/clients/:id` - Client details
- `GET /api/orders` - List orders
- `GET /api/orders/:id` - Order details
- `GET /api/atelier/jobs` - List atelier jobs
- `PATCH /api/atelier/jobs/:id/status` - Update job status
- `GET /api/frames` - List frames
- `GET /api/lenses` - List lenses

## Development Notes

### Running on Android Emulator

The app uses `10.0.2.2` as the default API URL for Android emulators (maps to host localhost).

### Running on iOS Simulator

Use `localhost` or your machine's IP address.

### Running on Physical Device

1. Ensure your phone and computer are on the same network
2. Update `apiUrl` in `app.json` to your computer's local IP
3. Restart the Expo server

## What's Next

Features not implemented in this MVP:

- Create/Edit client forms
- Create/Edit order forms
- Offline mode
- Push notifications
- Advanced analytics
- Supplier management
- Settings screen
- Dark mode toggle

## License

MIT
