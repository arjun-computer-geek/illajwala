# Analytics Service

Analytics and statistics service for the Illajwala platform.

## Overview

This service handles:

- Operations analytics (pulse, series)
- SLA metrics tracking
- Clinic metrics
- Platform overview statistics

## Port

Default port: `4004`

## Environment Variables

See `env.sample` for required environment variables.

## API Endpoints

### Analytics

- `GET /api/analytics/ops/pulse` - Get operations metrics summary
- `GET /api/analytics/ops/series` - Get operations analytics series (14 days)
- `GET /api/analytics/sla` - Get SLA metrics
- `GET /api/analytics/clinics/metrics` - Get clinic metrics

### Stats

- `GET /api/stats/overview` - Get platform overview statistics

## Health Checks

- `GET /health` - General health check
- `GET /health/ready` - Readiness probe
- `GET /health/live` - Liveness probe
- `GET /metrics` - Prometheus metrics

## Development

```bash
# Install dependencies
pnpm install

# Run in development mode
pnpm dev

# Build
pnpm build

# Start production server
pnpm start
```

## Notes

- This service currently reads directly from MongoDB collections (Appointment, Doctor, Clinic, Patient models)
- TODO: Replace direct model access with inter-service communication via HTTP calls or event bus
- Models are copied temporarily and should be replaced with service-to-service calls
