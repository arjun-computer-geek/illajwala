# Admin App

Next.js application for platform administrators to manage clinics, doctors, and system operations.

## Overview

The admin app provides:
- Doctor onboarding and verification
- Clinic management
- Analytics dashboard
- Waitlist oversight
- System configuration
- User management

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

The app runs on http://localhost:3002

## Features

### Doctor Onboarding

- Review doctor applications
- Verify credentials
- Approve/reject doctors
- Manage review workflow

### Clinic Management

- Create and manage clinics
- Configure clinic settings
- Set capacity limits
- Manage waitlist policies

### Analytics

- Platform metrics
- Appointment statistics
- Clinic performance
- Waitlist analytics

### Waitlist Oversight

- View all waitlist entries
- Monitor waitlist depth
- Configure policies
- Manage promotions

## Default Credentials

- **Email:** ops@illajwala.com
- **Password:** admin123

## Project Structure

```
admin/
├── src/
│   ├── app/                # Next.js app router pages
│   │   ├── page.tsx        # Dashboard
│   │   ├── auth/           # Authentication
│   │   └── dashboard/      # Dashboard pages
│   ├── components/         # React components
│   │   ├── dashboard/      # Dashboard components
│   │   ├── auth/           # Auth components
│   │   └── layout/         # Layout components
│   ├── lib/                # Utilities
│   │   ├── api/            # API client
│   │   └── utils.ts
│   └── hooks/              # Custom hooks
└── package.json
```

## Development

### Adding Features

1. Create components in `src/components/`
2. Add API client methods in `src/lib/api/`
3. Use React Query for data fetching
4. Follow existing patterns

## License

MIT

