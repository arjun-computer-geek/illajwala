# Inter-Service Communication and Platform Enhancements

## Overview

This plan implements inter-service communication infrastructure, removes duplicate modules from identity-service, adds frontend file upload capabilities, establishes event bus infrastructure, and enhances consultation documentation.

## Architecture Context

Current state:

- Multiple services exist (identity-service, appointment-service, payment-service, provider-service, analytics-service, storage-service, messaging-service)
- Identity-service contains duplicate modules for appointments, payments, analytics, doctors, and clinics
- Services currently communicate via direct database access or BullMQ queues
- Storage service exists with presigned URL endpoints but frontend lacks upload components
- Event bus infrastructure needed for better scalability and decoupling

## Implementation Plan

### Phase 1: Inter-Service HTTP Communication Infrastructure

**1.1 Create Service Client Package**

- Create `packages/service-client` for service-to-service HTTP communication
- Implement HTTP client with retry logic, circuit breaker, and timeout handling
- Add service discovery mechanism (environment-based service URLs)
- Support authentication forwarding (JWT token propagation)
- Add request/response logging and error handling

**Files:**

- `packages/service-client/src/client.ts` - Base HTTP client
- `packages/service-client/src/clients/appointment.client.ts` - Appointment service client
- `packages/service-client/src/clients/payment.client.ts` - Payment service client
- `packages/service-client/src/clients/provider.client.ts` - Provider service client
- `packages/service-client/src/clients/analytics.client.ts` - Analytics service client
- `packages/service-client/src/clients/storage.client.ts` - Storage service client
- `packages/service-client/src/config.ts` - Service URL configuration
- `packages/service-client/package.json` - Package dependencies

**1.2 Update Services to Use Service Clients**

- Replace direct database access with HTTP calls in identity-service
- Update appointment-service to accept inter-service requests
- Update payment-service to accept inter-service requests
- Update provider-service to accept inter-service requests
- Update analytics-service to accept inter-service requests
- Add service authentication middleware for inter-service requests

### Phase 2: Event Bus Infrastructure

**2.1 Event Bus Setup (NATS)**

- Add NATS to docker-compose.yml for local development
- Create `packages/event-bus` package for event publishing/subscribing
- Implement event publisher with retry logic and error handling
- Implement event subscriber with message acknowledgment
- Add event schemas and validation using Zod
- Support multiple event types: consultation, payment, waitlist, appointment

**Files:**

- `infra/docker-compose.yml` - Add NATS service
- `packages/event-bus/src/publisher.ts` - Event publisher
- `packages/event-bus/src/subscriber.ts` - Event subscriber
- `packages/event-bus/src/events.ts` - Event type definitions
- `packages/event-bus/src/config.ts` - NATS configuration
- `packages/event-bus/package.json` - Package dependencies

**2.2 Migrate from BullMQ to Event Bus**

- Replace BullMQ queues with NATS event bus
- Update consultation event publisher to use NATS
- Update waitlist event publisher to use NATS
- Update payment event publisher to use NATS
- Update messaging-service to subscribe to events from NATS
- Update analytics-service to subscribe to events from NATS

**Files:**

- `services/identity-service/src/modules/events/consultation-events.publisher.ts` - Use NATS
- `services/identity-service/src/modules/events/waitlist-events.publisher.ts` - Use NATS
- `services/payment-service/src/modules/payments/payments.controller.ts` - Publish payment events
- `services/messaging-service/src/modules/workers/*.ts` - Subscribe to NATS events
- `services/analytics-service/src/modules/events/*.ts` - Subscribe to NATS events

### Phase 3: Remove Duplicate Modules from Identity-Service

**3.1 Migrate Appointments Module**

- Update identity-service to use appointment-service client instead of local module
- Remove `services/identity-service/src/modules/appointments/` directory
- Update routes to proxy requests to appointment-service
- Update realtime routes to use appointment-service client
- Migrate appointment-related database queries to appointment-service

**Files:**

- `services/identity-service/src/modules/routes/index.ts` - Remove appointment routes
- `services/identity-service/src/modules/realtime/realtime.router.ts` - Use appointment client
- `services/appointment-service/src/modules/appointments/*` - Ensure all endpoints exist

**3.2 Migrate Payments Module**

- Update identity-service to use payment-service client instead of local module
- Remove `services/identity-service/src/modules/payments/` directory
- Update webhook handler to forward to payment-service
- Migrate payment-related logic to payment-service

**Files:**

- `services/identity-service/src/modules/routes/index.ts` - Remove payment routes
- `services/payment-service/src/modules/payments/payments.controller.ts` - Add webhook endpoint
- `services/payment-service/src/modules/payments/payments.service.ts` - Add payment update logic

**3.3 Migrate Analytics Module**

- Update identity-service to use analytics-service client instead of local module
- Remove `services/identity-service/src/modules/analytics/` directory
- Update routes to proxy requests to analytics-service
- Remove duplicate models from analytics-service (already exist)

**Files:**

- `services/identity-service/src/modules/routes/index.ts` - Remove analytics routes
- `services/analytics-service/src/modules/analytics/*` - Ensure all endpoints exist

**3.4 Migrate Doctors and Clinics Modules**

- Update identity-service to use provider-service client instead of local modules
- Remove `services/identity-service/src/modules/doctors/` directory
- Remove `services/identity-service/src/modules/clinics/` directory
- Update routes to proxy requests to provider-service
- Update appointment service to use provider-service client for doctor/clinic data

**Files:**

- `services/identity-service/src/modules/routes/index.ts` - Remove doctor/clinic routes
- `services/provider-service/src/modules/doctors/*` - Ensure all endpoints exist
- `services/provider-service/src/modules/clinics/*` - Ensure all endpoints exist

### Phase 4: Frontend File Upload Components

**4.1 Create File Upload Hook**

- Create `packages/ui/src/hooks/use-file-upload.ts` hook
- Implement presigned URL generation flow
- Handle file upload to R2 using presigned URL
- Add upload progress tracking
- Add error handling and retry logic
- Support multiple file uploads

**Files:**

- `packages/ui/src/hooks/use-file-upload.ts` - File upload hook
- `packages/ui/src/lib/storage-client.ts` - Storage service client for frontend

**4.2 Create File Upload Component**

- Create `packages/ui/src/components/file-upload.tsx` component
- Support drag-and-drop file upload
- Display upload progress
- Show file previews
- Support file deletion
- Add file type and size validation

**Files:**

- `packages/ui/src/components/file-upload.tsx` - File upload component
- `packages/ui/src/components/file-upload-preview.tsx` - File preview component
- `packages/ui/src/index.ts` - Export new components

**4.3 Integrate File Upload in Doctor App**

- Update consultation workspace to use file upload component
- Connect file upload to storage-service
- Link uploaded files to appointment consultation
- Display uploaded files in consultation notes
- Add file download functionality

**Files:**

- `apps/doctor/src/components/dashboard/consultation-workspace/attachments-section.tsx` - Use file upload component
- `apps/doctor/src/lib/api/storage.ts` - Storage service API client
- `apps/doctor/src/components/dashboard/consultation-workspace.tsx` - Integrate file upload

**4.4 Add File Upload to Patient App**

- Add file upload capability for patient profile documents
- Add file upload for appointment-related documents
- Display uploaded files in appointment history

**Files:**

- `apps/patient/src/components/appointments/appointment-details.tsx` - Add file display
- `apps/patient/src/lib/api/storage.ts` - Storage service API client

### Phase 5: Enhanced Consultation Documentation

**5.1 Update Consultation Data Model**

- Enhance consultation schema with structured fields
- Add support for vitals capture (blood pressure, temperature, etc.)
- Add support for prescription management
- Add support for follow-up appointment scheduling
- Add support for referral management

**Files:**

- `packages/types/src/appointments.ts` - Update consultation types
- `services/appointment-service/src/modules/appointments/appointment.model.ts` - Update schema
- `services/appointment-service/src/modules/appointments/appointment.schema.ts` - Update validation

**5.2 Create Consultation Documentation UI**

- Create consultation notes editor with rich text support
- Create vitals capture form
- Create prescription management UI
- Create follow-up appointment scheduler
- Create referral management UI

**Files:**

- `apps/doctor/src/components/dashboard/consultation-workspace/vitals-section.tsx` - Vitals capture
- `apps/doctor/src/components/dashboard/consultation-workspace/prescription-section.tsx` - Prescriptions
- `apps/doctor/src/components/dashboard/consultation-workspace/follow-up-section.tsx` - Follow-ups
- `apps/doctor/src/components/dashboard/consultation-workspace/referral-section.tsx` - Referrals

**5.3 Update Consultation Documentation**

- Update `docs/consultation-lifecycle.md` with enhanced features
- Document vitals capture workflow
- Document prescription management workflow
- Document follow-up appointment workflow
- Document referral management workflow
- Add API documentation for consultation endpoints

**Files:**

- `docs/consultation-lifecycle.md` - Enhanced documentation
- `docs/API.md` - Update consultation API documentation

## Implementation Order

1. **Phase 1.1** - Create service client package (foundation for all phases)
2. **Phase 2.1** - Set up event bus infrastructure (foundation for event-driven architecture)
3. **Phase 1.2** - Update services to use service clients
4. **Phase 2.2** - Migrate from BullMQ to event bus
5. **Phase 3** - Remove duplicate modules from identity-service (requires Phase 1)
6. **Phase 4** - Frontend file upload components (can proceed in parallel)
7. **Phase 5** - Enhanced consultation documentation (can proceed in parallel)

## Dependencies

- **Phase 1.1** → **Phase 1.2, Phase 3** (service clients needed)
- **Phase 2.1** → **Phase 2.2** (event bus needed)
- **Phase 1.2** → **Phase 3** (service clients must be integrated)
- **Phase 4** → Storage service (already exists)
- **Phase 5** → Appointment service (already exists)

## Configuration Updates

**Environment Variables:**

- Add service URLs to all services (APPOINTMENT_SERVICE_URL, PAYMENT_SERVICE_URL, etc.)
- Add NATS connection URL (NATS_URL)
- Add storage service URL (STORAGE_SERVICE_URL)

**Docker Compose:**

- Add NATS service to `infra/docker-compose.yml`
- Update service health checks

## Testing Strategy

- Unit tests for service clients
- Unit tests for event bus publisher/subscriber
- Integration tests for inter-service communication
- Integration tests for event bus
- E2E tests for file upload flow
- E2E tests for consultation documentation flow

## Migration Strategy

1. Implement service clients and event bus alongside existing code
2. Gradually migrate services to use new infrastructure
3. Keep duplicate modules in identity-service until migration is complete
4. Remove duplicate modules only after all services are migrated
5. Update frontend to use new service endpoints
6. Update API documentation

## Risk Mitigation

- **Service availability:** Implement circuit breakers and fallbacks
- **Event delivery:** Implement event acknowledgment and retry logic
- **Data consistency:** Use eventual consistency model with event sourcing
- **Backward compatibility:** Maintain API compatibility during migration
- **Performance:** Monitor service latency and optimize as needed
