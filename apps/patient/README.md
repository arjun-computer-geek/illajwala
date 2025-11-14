# Patient App

Next.js application for patients to discover doctors, book appointments, and manage their healthcare.

## Overview

The patient app provides:
- Doctor search and discovery
- Appointment booking
- Waitlist enrollment
- Appointment history
- Profile management
- Notification preferences

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

# Production build
pnpm build
pnpm start
```

The app runs on http://localhost:3000

## Features

### Doctor Search

- Search by specialization
- Filter by location, availability
- View doctor profiles and ratings
- Check availability calendar

### Appointment Booking

- Select date and time
- Choose consultation mode (clinic/telehealth)
- Add reason for visit
- Complete payment
- Join waitlist if slots full

### Account Management

- View appointment history
- Manage profile
- Update notification preferences
- View waitlist status

## Project Structure

```
patient/
├── src/
│   ├── app/                # Next.js app router pages
│   │   ├── page.tsx        # Home page
│   │   ├── search/         # Doctor search
│   │   ├── doctors/        # Doctor details
│   │   ├── auth/           # Authentication
│   │   └── account/        # Account management
│   ├── components/         # React components
│   │   ├── layout/         # Layout components
│   │   ├── doctor/         # Doctor-related components
│   │   ├── search/         # Search components
│   │   └── ui/             # UI components
│   ├── lib/                # Utilities
│   │   ├── api/            # API client
│   │   └── utils.ts
│   └── hooks/              # Custom hooks
└── package.json
```

## Development

### Adding New Pages

1. Create page in `src/app/[route]/page.tsx`
2. Add navigation if needed
3. Implement data fetching with React Query

### Adding Components

1. Create component in `src/components/`
2. Use shared UI components from `packages/ui`
3. Follow existing patterns

## License

MIT
