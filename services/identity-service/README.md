# Identity Service

Main backend service for the Illajwala platform, handling authentication, user management, appointments, payments, and more.

## Overview

The identity service is the core API service that provides:
- Authentication & authorization (JWT)
- User management (patients, doctors, admins)
- Clinic management
- Appointment booking system
- Waitlist management
- Payment processing (Razorpay)
- Analytics & metrics

## Tech Stack

- **Runtime:** Node.js 20
- **Framework:** Express.js 5
- **Language:** TypeScript
- **Database:** MongoDB (Mongoose)
- **Cache:** Redis (ioredis)
- **Queue:** BullMQ
- **Validation:** Zod

## Getting Started

### Prerequisites

- Node.js 20 LTS
- PNPM 9.x
- MongoDB (via Docker or Atlas)
- Redis (via Docker or Upstash)

### Installation

```bash
# Install dependencies
pnpm install

# Copy environment file
cp env.sample .env

# Edit .env with your configuration
```

### Environment Variables

Required variables (see `env.sample`):

```env
NODE_ENV=development
PORT=4000
MONGODB_URI=mongodb://root:root@localhost:27017/illajwala_dev?replicaSet=rs0
JWT_SECRET=your-secret-key
REFRESH_JWT_SECRET=your-refresh-secret
JWT_EXPIRY=1d
REFRESH_JWT_EXPIRY=7d
CLIENT_URL=http://localhost:3000
CLIENT_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:3002
REDIS_URL=redis://localhost:6379
RAZORPAY_KEY_ID=rzp_test_xxx
RAZORPAY_KEY_SECRET=your_secret
RAZORPAY_WEBHOOK_SECRET=webhook_secret
RAZORPAY_CURRENCY=INR
APPOINTMENT_PAYMENT_TIMEOUT_MINUTES=15
```

### Running

```bash
# Development mode (with hot reload)
pnpm dev

# Production build
pnpm build
pnpm start
```

## API Endpoints

See [API Documentation](../../docs/API.md) for complete endpoint reference.

### Health Check

```http
GET /api/health
```

### Authentication

- `POST /api/auth/register` - Register patient
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `POST /api/auth/refresh` - Refresh token

### Resources

- `/api/patients` - Patient management
- `/api/doctors` - Doctor profiles
- `/api/clinics` - Clinic management
- `/api/appointments` - Appointment booking
- `/api/waitlists` - Waitlist management
- `/api/payments` - Payment processing
- `/api/admin` - Admin operations

## Database Scripts

### Seed Database

```bash
pnpm seed
```

Creates sample data:
- Clinics
- Doctors
- Patient (arjun.patel@example.com / patient123)
- Admin (ops@illajwala.com / admin123)
- Sample appointments

### Reset Database

```bash
pnpm reset
```

**WARNING:** This deletes all data in the database!

### Migrations

```bash
# Run clinic migration
pnpm migrate:clinics
```

## Project Structure

```
identity-service/
├── src/
│   ├── app.ts              # Express app setup
│   ├── index.ts            # Entry point
│   ├── config/             # Configuration
│   │   ├── database.ts     # MongoDB connection
│   │   ├── env.ts          # Environment variables
│   │   └── redis.ts        # Redis connection
│   ├── middlewares/        # Express middlewares
│   │   ├── auth.ts         # Authentication
│   │   ├── cache.ts        # Response caching
│   │   ├── error-handler.ts
│   │   ├── rate-limit.ts
│   │   └── validate-request.ts
│   ├── modules/            # Feature modules
│   │   ├── auth/           # Authentication
│   │   ├── patients/       # Patient management
│   │   ├── doctors/        # Doctor profiles
│   │   ├── clinics/        # Clinic management
│   │   ├── appointments/   # Appointments
│   │   ├── waitlists/      # Waitlist
│   │   ├── payments/      # Payments
│   │   ├── analytics/     # Analytics
│   │   └── ...
│   ├── scripts/            # Database scripts
│   │   ├── seed.ts
│   │   └── reset-db.ts
│   └── utils/              # Utilities
│       ├── jwt.ts
│       ├── password.ts
│       └── ...
└── package.json
```

## Key Features

### Multi-Tenant Support

- All models include `tenantId`
- All queries filter by tenant
- JWT tokens include tenant context
- Middleware enforces tenant isolation

### Authentication

- JWT-based authentication
- Access tokens (short-lived)
- Refresh tokens (long-lived, HTTP-only cookies)
- Role-based authorization

### Caching

- Redis caching for search/list endpoints
- Cache invalidation on updates
- Configurable TTL

### Rate Limiting

- Per-endpoint rate limits
- Redis-backed tracking
- Configurable thresholds

## Development

### Code Style

- ESLint for linting
- Prettier for formatting
- TypeScript strict mode

### Adding New Endpoints

1. Create route handler in `src/modules/[module]/[module].routes.ts`
2. Register route in `src/modules/routes/index.ts`
3. Add validation with Zod
4. Implement service logic
5. Add error handling

### Testing

```bash
# Run tests (when implemented)
pnpm test
```

## Monitoring

### Health Endpoint

```http
GET /api/health
```

Returns service health status.

### Metrics Endpoint

```http
GET /api/metrics
```

Returns Prometheus-compatible metrics.

## Security

- Input validation with Zod
- JWT token verification
- Tenant isolation enforcement
- Rate limiting
- CORS protection
- Helmet security headers

## License

MIT

