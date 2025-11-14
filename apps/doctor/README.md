# Doctor App

Next.js application for doctors and clinics to manage schedules, appointments, and patients.

## Overview

The doctor app provides:
- Schedule management
- Availability publishing
- Appointment queue
- Waitlist management
- Patient management
- Profile management

## Tech Stack

- **Framework:** Next.js 15+ (App Router)
- **Language:** TypeScript
- **UI:** React 18+, Tailwind CSS
- **State:** React Query (TanStack Query)
- **Forms:** React Hook Form
- **Components:** shadcn/ui

## Getting Started

### Prerequisites

- Node.js 20 LTS
- PNPM 9.x
- Running identity service

### Installation

```bash
# Install dependencies
pnpm install
```

### Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api
```

### Running

```bash
# Development mode
pnpm dev
```

The app runs on http://localhost:3001

## Features

### Schedule Management

- Create and edit availability slots
- Set consultation modes
- Manage multiple clinic locations
- Block/unblock time slots

### Appointment Queue

- View upcoming appointments
- Real-time appointment updates
- Appointment status management
- Patient information

### Waitlist Management

- View waitlist entries
- Promote patients from waitlist
- Manage waitlist priorities
- Send invitations

## Multi-Tenant Subdomain Support

The app supports clinic-specific subdomains:
- `clinic-name.illajwala.com` → Clinic-specific dashboard
- Subdomain extracted from hostname
- Tenant context automatically set

## Project Structure

```
doctor/
├── src/
│   ├── app/                # Next.js app router pages
│   │   ├── page.tsx        # Dashboard
│   │   ├── auth/           # Authentication
│   │   └── profile/        # Profile management
│   ├── components/         # React components
│   │   ├── dashboard/      # Dashboard components
│   │   ├── availability/   # Schedule management
│   │   └── layout/         # Layout components
│   ├── lib/                # Utilities
│   │   ├── api/            # API client
│   │   └── tenant.ts       # Tenant utilities
│   └── hooks/              # Custom hooks
└── package.json
```

## Development

### Tenant Context

The app automatically extracts tenant context from:
1. Subdomain (for clinic-specific access)
2. JWT token (for user authentication)

### Adding Features

1. Create components in `src/components/`
2. Add API client methods in `src/lib/api/`
3. Use React Query for data fetching
4. Follow existing patterns

## License

MIT

