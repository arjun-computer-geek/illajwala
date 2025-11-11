# Shared Services API Exposure Plan

## Goals
- Provide a consistent contract for patient, doctor, and admin applications to interact with the unified database via domain services.
- Define ownership, authentication, and interface expectations per service.
- Support phased rollout while existing submodule backends migrate towards shared services.

## Service Catalog
| Service | Responsibility | Primary Consumers | Ownership |
| --- | --- | --- | --- |
| **Identity Service** | Authentication, session management, RBAC token issuance, password resets, MFA hooks | All apps, internal services | Platform/Security |
| **Provider Service** | Provider profiles, clinics, credentials, availability templates, staff management | Doctor app (manage), Patient app (read), Admin (review) | Provider squad |
| **Patient Service** | Patient profiles, dependants, preferences | Patient app (manage), Doctor app (read), Admin (support) | Patient squad |
| **Scheduling Service** | Slot generation, appointment lifecycle, waitlist | Patient app (book), Doctor app (fulfill), Admin (override) | Scheduling squad |
| **Payment Service** | Payment initiation, status webhooks, payouts ledger | Patient app (checkout), Admin (finance), Doctor app (reconcile) | Finance squad |
| **Messaging Service** | Conversations, notifications hand-off, templates | Patient/Doctor apps (chat), Admin (broadcast) | Communication squad |
| **Support Service** | Tickets, escalations, audit trail | Admin (primary), Patient & Doctor (self-service) | Support ops |
| **Analytics Service** | Aggregated metrics, reports, dashboards | Admin (ops), Doctor app (insights), Patient (history) | Data squad |

## Interface Strategy
- **Protocol:** RESTful JSON APIs with OpenAPI 3 specs; select endpoints exposed via GraphQL for dashboard aggregation (Doctor/Admin).
- **Authentication:** OAuth2 Client Credentials for service-to-service; OAuth2 Authorization Code / PKCE for user flows. Tokens include role scopes.
- **Versioning:** Prefix with `/v1`, adopt semantic versioning. Introduce `/v2` for breaking changes while maintaining older versions for deprecation window.
- **Transport Security:** HTTPS only. Mutual TLS for internal services where feasible.

## Service Boundaries & Key Endpoints

### Identity Service (`identity-service`)
- `/v1/auth/login` – password + MFA challenge.
- `/v1/auth/token/refresh` – refresh tokens.
- `/v1/auth/password` – reset/update flows.
- `/v1/users/{id}` – retrieve identity data with role mapping.
- `/v1/users/{id}/roles` – assign/revoke roles (admin scoped).
- Publishes events: `user.created`, `role.updated`, `user.suspended`.

### Provider Service (`provider-service`)
- `/v1/providers` – create/update provider profile (doctor app), list (admin/patient with filters).
- `/v1/providers/{id}/clinics` – manage clinic roster.
- `/v1/providers/{id}/credentials` – CRUD credentials (admin review).
- `/v1/providers/{id}/availability` – manage templates; delegated to scheduling for slot generation.
- `/v1/providers/search` – patient discovery API (supports geospatial & filters).
- Events: `provider.approved`, `clinic.updated`, `credential.expiring`.

### Patient Service (`patient-service`)
- `/v1/patients` – create/update by patient app; admin read with elevated scope.
- `/v1/patients/{id}/dependants` – manage dependants.
- `/v1/patients/{id}/preferences` – notification, communication, language.
- `/v1/patients/{id}/history` – aggregated appointment documents via analytics service.
- Events: `patient.created`, `patient.updated`.

### Scheduling Service (`scheduling-service`)
- `/v1/slots/search` – aggregated availability for patient search.
- `/v1/appointments` – create (patient/admin), update status (doctor/admin).
- `/v1/appointments/{id}/reschedule` – enforce policies.
- `/v1/appointments/{id}/timeline` – status history (for audit & notifications).
- `/v1/waitlist` – manage waitlist entries (future).
- Events: `appointment.booked`, `appointment.status_changed`, `appointment.cancelled`.

### Payment Service (`payment-service`)
- `/v1/payments/session` – initiate payment (returns gateway token).
- `/v1/payments/{id}` – status, refunds.
- `/v1/payouts` – provider settlements & reconciliation export.
- Webhooks: `/v1/webhooks/gateway` to process gateway callbacks.
- Events: `payment.captured`, `payment.failed`, `payout.generated`.

### Messaging Service (`messaging-service`)
- `/v1/conversations` – list/create conversation threads.
- `/v1/conversations/{id}/messages` – send/receive messages with attachments.
- `/v1/notifications/send` – orchestrate transactional notifications (calls template service).
- `/v1/templates` – manage notification templates (admin only).
- Events: `message.sent`, `notification.delivered`, `notification.failed`.

### Support Service (`support-service`)
- `/v1/tickets` – create from patient/doctor apps; admin triage.
- `/v1/tickets/{id}/events` – log comments, status changes.
- `/v1/tickets/search` – filtered view for support dashboards.
- Events: `ticket.created`, `ticket.resolved`, `ticket.escalated`.

### Analytics Service (`analytics-service`)
- `/v1/dashboards/{key}` – aggregated metrics with caching.
- `/v1/reports/export` – CSV/PDF exports.
- `/v1/events` – ingest domain events for tracking (fallback if using warehouse CDC).
- Events: publishes derived metrics updates (`analytics.kpi_breach`).

## Security & Governance
- Each service registers scopes (e.g., `appointment:write`, `provider:review`). Clients request minimal scopes.
- RBAC rules defined in `identity-service` and enforced by API gateway (Kong/Apigee candidate).
- Implement rate limiting per client and per user to prevent abuse.
- Use JSON Schema validation and response contracts; include contract tests between services.

## Deployment & Environments
- Services deployed as independent Node.js/TypeScript projects under `shared-services/`.
- Docker images tagged per release; stored in private registry.
- CI pipeline for each submodule triggers dependent service build/test when API contracts change (via Changesets + OpenAPI diff).
- Staging environment integrates all services against staging database; smoke tests run nightly.

## Observability
- Standard logging structure (`request_id`, `user_id`, `service`, `latency_ms`, `status_code`).
- Metrics exported via Prometheus (QPS, p95 latency, error rate).
- Distributed tracing with OpenTelemetry; propagate trace headers through gateway.
- Alerts per service on SLA breaches; escalate using incident runbook.

## Migration Approach
1. Stand up services alongside existing backends; expose read-only endpoints first.
2. Migrate patient app to consume shared scheduling read APIs while writes remain in legacy Mongo (dual write).
3. Transition writes to shared services once data parity validated; perform cut-over with feature flags.
4. Decommission legacy Mongo collections post backfill & verification.

## Open Actions
- Author OpenAPI specs for each service (`shared-services/<service>/openapi.yaml`).
- Decide on API gateway tooling (Kong, AWS API Gateway, or custom BFF).
- Define package publishing process for shared TypeScript clients.
- Align error handling format (problem+json) across services.
- Integrate service health checks into release management runbook.

