# VisionDesk - ngrok Public Access Setup

## Quick Start

### 1. Start the Services

```bash
# Terminal 1: Start API
cd apps/api
npm run dev

# Terminal 2: Start Web App
cd apps/optician-web
npm run dev

# Terminal 3: Start Mobile (optional)
cd apps/mobile
npm run start
```

### 2. Start ngrok Tunnels

```bash
# Terminal 4: API tunnel
ngrok http 3001

# Terminal 5: Frontend tunnel (optional - only if you need public web access)
ngrok http 5173
```

### 3. Update Mobile App Environment

After starting ngrok for the API, copy the generated URL and update:

```bash
# Edit apps/mobile/.env
EXPO_PUBLIC_API_URL=https://YOUR_NGROK_SUBDOMAIN.ngrok-free.app/api
```

Then restart the mobile app:
```bash
cd apps/mobile
npm run start -- --clear
```

## Configuration Files

### API CORS (apps/api/src/index.ts)
- ✅ Allows `*.ngrok-free.app` domains
- ✅ Allows `*.ngrok.io` domains
- ✅ Allows `ngrok-skip-browser-warning` header

### Vite Server (apps/optician-web/vite.config.ts)
- ✅ `host: true` - Exposes server on 0.0.0.0
- ✅ Proxy configured for `/api`, `/panorama`, `/uploads`

### Mobile API Client (apps/mobile/src/services/api.ts)
- ✅ Uses `EXPO_PUBLIC_API_URL` environment variable
- ✅ Includes `ngrok-skip-browser-warning: 1` header

### Web API Client (apps/optician-web/src/lib/api.ts)
- ✅ Includes `ngrok-skip-browser-warning: 1` header

## Environment Files

### Local Development
```
apps/mobile/.env.local
apps/api/.env
```

### ngrok Public Access
```
apps/mobile/.env.ngrok
apps/api/.env.ngrok
```

To switch environments:
```bash
# For mobile
cp apps/mobile/.env.ngrok apps/mobile/.env

# For API (if needed)
cp apps/api/.env.ngrok apps/api/.env
```

## Troubleshooting

### 404 Error on ngrok URL
- Ensure the local server is running on the correct port
- Check that ngrok is tunneling to the right port

### CORS Errors
- The API now allows all ngrok domains automatically
- If issues persist, add your specific ngrok URL to `CORS_ORIGINS` in `.env`

### ngrok Browser Warning Page
- All API clients now include `ngrok-skip-browser-warning: 1` header
- This bypasses the ngrok interstitial page for API requests

### Mobile App Not Connecting
1. Ensure `EXPO_PUBLIC_API_URL` is set correctly in `.env`
2. Restart Expo with cache clear: `npm run start -- --clear`
3. Check that the ngrok tunnel is active

## Architecture

```
┌─────────────────┐     ┌─────────────────┐
│   Mobile App    │────▶│  ngrok tunnel   │
│   (Expo)        │     │  (API: 3001)    │
└─────────────────┘     └────────┬────────┘
                                 │
┌─────────────────┐              ▼
│   Web App       │────▶┌─────────────────┐
│   (Vite:5173)   │     │   API Server    │
└─────────────────┘     │   (localhost)   │
         │              └─────────────────┘
         ▼
┌─────────────────┐
│  ngrok tunnel   │
│  (Web: 5173)    │
└─────────────────┘
```

## URLs Summary

| Service | Local URL | ngrok URL |
|---------|-----------|-----------|
| API | http://localhost:3001 | https://xxx.ngrok-free.app |
| Web | http://localhost:5173 | https://yyy.ngrok-free.app |
| Mobile | Expo Go app | Uses API ngrok URL |
