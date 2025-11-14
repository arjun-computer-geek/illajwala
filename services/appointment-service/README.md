# Appointment Service

Appointment and waitlist service for the Illajwala platform.

## Environment Variables

```env
NODE_ENV=development
PORT=4002
MONGODB_URI=mongodb://127.0.0.1:27017/illajwala
REDIS_URL=redis://127.0.0.1:6379
JWT_SECRET=your-jwt-secret
CLIENT_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:3002
```

## Development

```bash
pnpm dev
```

## Build

```bash
pnpm build
pnpm start
```
