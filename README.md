# Illajwala VisitNow Platform

A multi-tenant healthcare appointment booking platform connecting patients with verified healthcare providers.

## Overview

Illajwala VisitNow enables seamless patient-doctor interactions from discovery to follow-up, with support for:
- Multi-clinic scheduling
- Waitlist management
- Payment processing
- Real-time notifications
- Telehealth consultations

## Tech Stack

- **Frontend:** Next.js 15+, React 18+, TypeScript, Tailwind CSS
- **Backend:** Node.js 20, Express.js 5, TypeScript
- **Database:** MongoDB (Mongoose)
- **Cache:** Redis (ioredis)
- **Queue:** BullMQ
- **Hosting:** Vercel (frontend), Render (backend)

## Quick Start

### Prerequisites

- Node.js 20 LTS
- PNPM 9.x
- Docker Desktop

### Setup

1. **Clone and install:**
   ```bash
   git clone <repository-url>
   cd illajwala
   pnpm install
   ```

2. **Start infrastructure:**
   ```bash
   cd infra
   docker compose up -d
   ```

3. **Initialize MongoDB:**
   ```bash
   docker exec -it illajwala-mongodb mongosh --eval "rs.initiate({_id: 'rs0', members: [{ _id: 0, host: 'illajwala-mongodb:27017' }]})"
   ```

4. **Configure environment:**
   ```bash
   cd services/identity-service
   cp env.sample .env
   # Edit .env with your configuration
   ```

5. **Seed database:**
   ```bash
   pnpm db:seed
   ```

6. **Start development:**
   ```bash
   # From repo root
   pnpm dev
   ```

### Development URLs

- Patient App: http://localhost:3000
- Doctor App: http://localhost:3001
- Admin App: http://localhost:3002
- API: http://localhost:4000/api
- Mailhog UI: http://localhost:8025

### Default Credentials

- **Patient:** arjun.patel@example.com / patient123
- **Admin:** ops@illajwala.com / admin123

## Project Structure

```
illajwala/
├── apps/              # Next.js frontend applications
│   ├── patient/      # Patient-facing app
│   ├── doctor/       # Doctor/clinic app
│   └── admin/        # Admin console
├── services/         # Backend services
│   ├── identity-service/    # Main API service
│   └── messaging-service/   # Messaging service
├── packages/         # Shared packages
│   ├── ui/           # Shared UI components
│   ├── types/        # TypeScript definitions
│   ├── api-client/   # API client utilities
│   └── utils/       # Shared utilities
├── infra/            # Infrastructure configs
│   └── docker-compose.yml
├── docs/             # Documentation
└── scripts/          # Development scripts
```

## Available Scripts

### Root Level

- `pnpm dev` - Start all services in parallel
- `pnpm build` - Build all packages
- `pnpm lint` - Lint all packages
- `pnpm format:write` - Format all code
- `pnpm validate:env` - Validate environment setup
- `pnpm db:seed` - Seed database with sample data
- `pnpm db:reset` - Reset database (WARNING: deletes all data)

### Service Level

- `pnpm dev:identity` - Start identity service
- `pnpm dev:patient` - Start patient app
- `pnpm dev:doctor` - Start doctor app
- `pnpm dev:admin` - Start admin app

## Documentation

- [Local Development Guide](./docs/local-development.md)
- [Development Guide](./docs/DEVELOPMENT.md)
- [Contributing Guide](./docs/CONTRIBUTING.md)
- [API Documentation](./docs/API.md)
- [Architecture Overview](./docs/ARCHITECTURE.md)
- [Master PRD](./illajwala_master_prd.md)

## Features

### Patient Features
- Doctor search and discovery
- Appointment booking
- Waitlist enrollment
- Appointment history
- Profile management

### Doctor Features
- Schedule management
- Availability publishing
- Appointment queue
- Waitlist management
- Patient management

### Admin Features
- Doctor onboarding and verification
- Clinic management
- Analytics dashboard
- Waitlist oversight
- System configuration

## Multi-Tenant Architecture

The platform uses a shared database with tenant isolation:
- All data includes `tenantId` for isolation
- JWT tokens include tenant context
- All queries filter by tenant
- Subdomain routing for clinic-specific access

## Development

### Code Quality

- **Pre-commit Hooks:** Automatically run ESLint and Prettier
- **TypeScript:** Strict mode enabled
- **Linting:** ESLint with TypeScript rules
- **Formatting:** Prettier with consistent config

### Adding Features

1. Create a feature branch
2. Implement changes
3. Run linter and formatter
4. Test locally
5. Commit (pre-commit hooks will run)
6. Create pull request

See [Contributing Guide](./docs/CONTRIBUTING.md) for details.

## Environment Variables

### Identity Service

Required environment variables (see `services/identity-service/env.sample`):

- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - JWT signing secret
- `REFRESH_JWT_SECRET` - Refresh token secret
- `REDIS_URL` - Redis connection URL
- `CLIENT_ORIGINS` - Allowed CORS origins

### Frontend Apps

- `NEXT_PUBLIC_API_BASE_URL` - API base URL

## Troubleshooting

### Port Already in Use

```bash
# Find process using port (Windows)
netstat -ano | findstr :3000

# Kill process
taskkill /PID [pid] /F
```

### Docker Issues

```bash
cd infra
docker compose down -v
docker compose up -d
```

### Database Reset

```bash
# Reset database
pnpm db:reset

# Reseed
pnpm db:seed
```

## License

MIT

## Support

For questions or issues, please refer to the documentation or create an issue in the repository.

