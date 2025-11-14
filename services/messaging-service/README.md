# Messaging Service

Service responsible for sending notifications (email, SMS, WhatsApp) for the Illajwala platform.

## Overview

The messaging service handles all outbound communications:
- Email notifications (SMTP)
- SMS notifications
- WhatsApp messages
- Queue management (BullMQ)
- Template rendering
- Delivery tracking

## Tech Stack

- **Runtime:** Node.js 20
- **Framework:** Express.js 5
- **Language:** TypeScript
- **Queue:** BullMQ
- **Templates:** Custom template engine

## Getting Started

### Prerequisites

- Node.js 20 LTS
- PNPM 9.x
- Redis (for BullMQ)

### Installation

```bash
# Install dependencies
pnpm install

# Copy environment file
cp env.sample .env

# Edit .env with your configuration
```

### Environment Variables

Required variables:

```env
NODE_ENV=development
PORT=4001
REDIS_URL=redis://localhost:6379
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASS=your-password
SMS_PROVIDER_API_KEY=your-api-key
WHATSAPP_API_KEY=your-api-key
```

### Running

```bash
# Development mode
pnpm dev

# Production build
pnpm build
pnpm start
```

## Features

### Notification Channels

- **Email:** SMTP-based email delivery
- **SMS:** SMS provider integration
- **WhatsApp:** WhatsApp Business API

### Queue Processing

- BullMQ for async job processing
- Retry logic for failed deliveries
- Dead letter queue for persistent failures

### Templates

- Template engine for dynamic content
- Support for variables and conditionals
- Multi-channel templates

## Project Structure

```
messaging-service/
├── src/
│   ├── app.ts              # Express app
│   ├── index.ts             # Entry point
│   ├── config/
│   │   └── env.ts           # Environment variables
│   ├── modules/
│   │   ├── notifications/   # Notification logic
│   │   ├── queues/          # Queue setup
│   │   └── workers/         # Background workers
│   └── types/
└── package.json
```

## Usage

### Sending Notifications

Notifications are typically triggered by events from the identity service:

1. Identity service publishes event to queue
2. Messaging service worker picks up job
3. Notification is sent via appropriate channel
4. Delivery status is tracked

### Notification Types

- Appointment confirmations
- Appointment reminders
- Waitlist promotions
- Payment receipts
- Password resets
- Welcome emails

## Development

### Adding New Templates

1. Create template in `src/modules/notifications/templates/`
2. Add template variables
3. Update template engine

### Testing

```bash
# Run tests (when implemented)
pnpm test
```

## License

MIT

