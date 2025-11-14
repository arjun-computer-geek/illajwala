# Illajwala Platform Architecture

## Overview

Illajwala is a multi-tenant healthcare appointment booking platform built with a microservices architecture. The platform connects patients with healthcare providers for easy discovery, booking, and consultation management.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend Apps                          │
├──────────────┬──────────────┬───────────────────────────────┤
│   Patient    │    Doctor     │         Admin                  │
│  (Next.js)   │   (Next.js)   │       (Next.js)               │
└──────┬───────┴───────┬───────┴───────────────┬───────────────┘
       │               │                        │
       └───────────────┼────────────────────────┘
                       │
              ┌────────▼────────┐
              │   API Gateway  │
              │  (api.illajwala│
              │     .com)      │
              └────────┬────────┘
                       │
       ┌───────────────┼───────────────┐
       │               │               │
┌──────▼──────┐ ┌──────▼──────┐ ┌─────▼──────┐
│  Identity   │ │ Messaging   │ │  Future    │
│  Service    │ │  Service    │ │  Services  │
└──────┬──────┘ └──────┬──────┘ └────────────┘
       │               │
       └───────┬───────┘
               │
    ┌──────────┼──────────┐
    │          │          │
┌───▼───┐ ┌───▼───┐ ┌────▼────┐
│MongoDB│ │ Redis │ │Mailhog  │
│ Atlas │ │Upstash│ │  (Dev)  │
└───────┘ └───────┘ └─────────┘
```

## Technology Stack

### Frontend
- **Framework:** Next.js 15+ (App Router)
- **Language:** TypeScript
- **UI Library:** React 18+
- **Styling:** Tailwind CSS
- **State Management:** React Query (TanStack Query)
- **Forms:** React Hook Form
- **UI Components:** shadcn/ui

### Backend
- **Runtime:** Node.js 20 LTS
- **Framework:** Express.js 5
- **Language:** TypeScript
- **Database:** MongoDB (Mongoose)
- **Cache:** Redis (ioredis)
- **Queue:** BullMQ
- **Validation:** Zod

### Infrastructure
- **Frontend Hosting:** Vercel
- **Backend Hosting:** Render / Fly.io
- **Database:** MongoDB Atlas
- **Cache:** Upstash Redis
- **Storage:** Cloudflare R2
- **DNS:** Cloudflare
- **CI/CD:** GitHub Actions

## Multi-Tenant Architecture

### Tenant Isolation

The platform uses **shared database with tenant isolation**:

- Every document includes a `tenantId` field
- All queries filter by `tenantId`
- JWT tokens include tenant context
- Middleware enforces tenant isolation

### Subdomain Routing

- **Patient App:** `illajwala.com`
- **Doctor App:** `*.illajwala.com` (clinic subdomains)
- **Admin App:** `admin.illajwala.com`
- **API:** `api.illajwala.com`

Subdomain middleware extracts clinic context from the hostname.

## Core Services

### Identity Service

Main backend service handling:
- Authentication & authorization
- User management (patients, doctors, admins)
- Clinic management
- Appointment management
- Waitlist management
- Payment processing
- Analytics

**Location:** `services/identity-service/`

**Key Modules:**
- `auth/` - Authentication & JWT
- `patients/` - Patient management
- `doctors/` - Doctor profiles
- `clinics/` - Clinic management
- `appointments/` - Booking system
- `waitlists/` - Waitlist management
- `payments/` - Payment processing
- `analytics/` - Analytics & metrics

### Messaging Service

Handles all notifications:
- Email (SMTP)
- SMS
- WhatsApp
- Queue management (BullMQ)

**Location:** `services/messaging-service/`

## Data Models

### Core Entities

#### User
- Base user entity
- Roles: `patient`, `doctor`, `staff`, `admin`
- Authentication credentials
- Tenant association

#### Patient
- Medical history
- Dependents
- Notification preferences
- Primary clinic association

#### Doctor
- Specialization
- Credentials & verification
- Clinic associations
- Availability settings
- Review status

#### Clinic
- Name, slug, timezone
- Address & contact info
- Capacity settings
- Waitlist policies

#### Appointment
- Patient, doctor, clinic references
- Scheduled time
- Consultation mode (clinic/telehealth/home-visit)
- Status (pending, confirmed, completed, cancelled)
- Payment status

#### WaitlistEntry
- Patient, doctor, clinic references
- Priority score
- Preferred time window
- Status (pending, promoted, expired)

## Authentication & Authorization

### JWT Tokens

- **Access Token:** Short-lived (1 day), includes user info and tenant context
- **Refresh Token:** Long-lived (7 days), stored in HTTP-only cookie

### Token Payload

```typescript
{
  userId: string;
  email: string;
  role: 'patient' | 'doctor' | 'admin' | 'staff';
  tenantId: string;
  clinicId?: string; // For doctor/staff
}
```

### Authorization

- **Role-based:** Different permissions per role
- **Tenant-scoped:** All data access filtered by tenant
- **Resource-level:** Additional checks for ownership

## API Design

### RESTful Conventions

- `GET /api/resource` - List resources
- `GET /api/resource/:id` - Get resource
- `POST /api/resource` - Create resource
- `PUT /api/resource/:id` - Update resource
- `DELETE /api/resource/:id` - Delete resource

### Response Format

```typescript
{
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  message?: string;
}
```

## Caching Strategy

### Redis Usage

1. **Session Storage:** JWT refresh tokens
2. **Response Caching:** Provider search/list endpoints
3. **Slot Locking:** Prevent double-booking
4. **Rate Limiting:** Track request counts

### Cache Keys

- `session:{userId}` - User session
- `cache:doctors:list:{tenantId}:{query}` - Doctor search results
- `lock:slot:{doctorId}:{datetime}` - Slot booking lock
- `ratelimit:{endpoint}:{userId}` - Rate limit counter

## Event-Driven Architecture

### Event Bus (Future)

Planned integration with Kafka/NATS for:
- Appointment lifecycle events
- Waitlist promotions
- Notification triggers
- Analytics events

### Current Implementation

- Direct service calls
- BullMQ for async job processing
- Server-Sent Events (SSE) for real-time updates

## Security

### Data Protection

- **Encryption:** HTTPS/TLS for all communications
- **Secrets:** Environment variables, never committed
- **Input Validation:** Zod schemas for all inputs
- **SQL Injection:** Not applicable (MongoDB)
- **XSS Protection:** React's built-in escaping
- **CSRF Protection:** SameSite cookies

### Tenant Isolation

- Database-level filtering by `tenantId`
- JWT token validation
- Middleware enforcement
- Audit logging

## Performance

### Optimization Strategies

- **Database Indexing:** On `tenantId`, `email`, `clinicId`
- **Response Caching:** Redis for frequently accessed data
- **Code Splitting:** Frontend bundle optimization
- **Lazy Loading:** Heavy components loaded on demand
- **CDN:** Static assets via Cloudflare

### Scalability

- **Horizontal Scaling:** Stateless services
- **Database Sharding:** Future consideration
- **Caching Layer:** Redis for high-traffic endpoints
- **Queue Processing:** BullMQ for async jobs

## Monitoring & Observability

### Metrics

- Application metrics (Prometheus)
- Health check endpoints
- Performance monitoring
- Error tracking

### Logging

- Structured logging
- Error tracking
- Audit logs for sensitive operations

## Development Workflow

### Local Development

1. Start Docker services (MongoDB, Redis, Mailhog)
2. Initialize MongoDB replica set
3. Seed database with sample data
4. Start services with `pnpm dev`

### Code Quality

- **Linting:** ESLint
- **Formatting:** Prettier
- **Pre-commit Hooks:** Husky + lint-staged
- **Type Safety:** TypeScript strict mode

## Deployment

### Frontend (Vercel)

- Automatic deployments on push to `main`
- Preview deployments for PRs
- Wildcard subdomain routing

### Backend (Render)

- Manual or automatic deployments
- Environment variable management
- Health check monitoring

## Future Enhancements

- **Mobile Apps:** React Native
- **AI Recommendations:** Doctor matching engine
- **EMR Integration:** Electronic medical records
- **Telehealth:** WebRTC video consultations
- **Event Bus:** Kafka/NATS integration

