# Sprint 5 Plan – Scalability & Waitlist (Weeks 19-22)

## 1. Objectives
- **Tenant hardening:** persist and enforce `tenantId` / `clinicId` isolation across models, auth tokens, and API responses to unlock true multi-clinic support.
- **Advanced waitlist experience:** allow patients to join/resign waitlists, give doctors tools to promote candidates, and automate outreach through the messaging-service.
- **Performance & resilience:** introduce caching, rate controls, and load/regression testing so real-time ops continue to perform under growth.

## 2. Current State (Sprint 4 Snapshot)
- Frontends (`apps/patient`, `apps/doctor`, `apps/admin`) ship real-time dashboards, consultation workflows, and notification resend tooling. Waitlist references exist only in marketing copy (e.g. `apps/doctor/src/app/page.tsx`, `apps/doctor/src/components/availability/availability-planner.tsx`) with no data model behind them.
- The shared API client already forwards an `X-Tenant-Id` header (`packages/api-client/src/index.ts`), and doctor/patient shells set tenants client-side, but backend models (`services/identity-service/src/modules/*`) do not persist tenant context yet.
- `services/identity-service` handles all domain operations (appointments, analytics, notifications) with Redis-backed slot locking and SSE endpoints from Sprint 4, but there is no waitlist schema, queueing logic, or clinic-level quotas.
- `services/messaging-service` supports resend workflows and channel fallbacks, yet lacks templates/hooks dedicated to waitlist outreach or high-volume throttling.
- Observability foundations are in place (metrics endpoints, runbooks in `docs/ops-runbooks.md`), but systematic load tests, rate limiting, and caching strategies for provider search/catalog APIs remain TODOs.

## 3. Workstreams & Epics

### 3.1 Doctor Hub (`apps/doctor`)
- **DOC-501 – Waitlist management console:** extend `consultation-queue` UI to show waitlisted patients, allow manual promotion/deferral, and surface automated prioritisation rules. Wire to new `/appointments/:id/waitlist` endpoints.
- **DOC-502 – Multi-location schedule guardrails:** refactor `availability-planner.tsx` to respect per-clinic capacity limits and expose settings for waitlist length caps per location.
- **DOC-503 – Performance polish:** lazy-load real-time panels, introduce suspense fallbacks, and add optimistic updates when promoting waitlist entries to confirmed slots.

### 3.2 Patient Web (`apps/patient`)
- **PAT-421 – Join waitlist flows:** add CTA on full slot search results to join waitlist, capture preferred time windows, and show status in `account/appointments` screens.
- **PAT-422 – Notification preferences upgrade:** extend `notificationPreferences` UI to include waitlist-specific toggles (SMS/WhatsApp/email) and align with backend schema changes.
- **PAT-423 – Resilience & SEO:** cache popular doctor search queries client-side (React Query + stale-while-revalidate) and instrument real-time fallback to polling when SSE drops.

### 3.3 Admin Console (`apps/admin`)
- **ADM-331 – Multi-clinic operations dashboard:** enhance `dashboard` tiles with clinic-level rollups (occupancy, waitlist depth, SLA breaches) and filters.
- **ADM-332 – Waitlist oversight & SLAs:** add moderation tools within `notification-resend-panel.tsx` to trigger concierge outreach, override waitlist ordering, and log actions via audit API.
- **ADM-333 – Configuration surface:** create settings screens for defining global waitlist policies, rate limits, and clinic-specific thresholds.

### 3.4 Identity-Service Backend (`services/identity-service`)
- **API-510 – Tenant enforcement:** add `tenantId` to `Patient`, `Doctor`, `Appointment`, `Notification`, and related schemas; propagate through JWT claims, middleware, and query filters. Update `catchAsync` handlers to validate tenant context.
- **API-511 – Waitlist domain:** introduce `WaitlistEntry` schema, service layer (prioritisation rules, auto-expiry), and REST routes (`/waitlists`, `/appointments/:id/waitlist`). Integrate with Redis locks to prevent double-booking.
- **API-512 – Multi-clinic scheduling:** model `Clinic` entity (slug, timezone, capacity rules), migrate existing doctor `clinicLocations` array, and expose management APIs consumed by admin/doctor apps.
- **API-513 – Performance toolkit:** implement response caching for provider search/list endpoints (Redis), rate limiting middleware on high-volume routes, and expose metrics (cache hit rate, waitlist churn).
- **API-514 – Data migrations & backfill:** create migration scripts to populate tenant/clinic references for seed data and ensure backward compatibility with existing fixtures.

### 3.5 Messaging-Service (`services/messaging-service`)
- **MSG-240 – Waitlist notification workflows:** add templates and worker jobs for notifying patients when promoted, sending periodic nudges, and expiring stale responses. Ensure audit logging ties into admin actions.
- **MSG-241 – Throttling & DLQ polish:** introduce per-tenant rate limits, structured DLQ monitoring for bursty waitlist events, and Grafana dashboards for waitlist-specific metrics.

### 3.6 Platform & QA
- **PLT-201 – Load & chaos testing:** script k6 scenarios covering peak booking + waitlist churn, and add chaos experiments (Redis outage simulation) to validate fallback logic.
- **PLT-202 – Infrastructure-as-code updates:** extend `infra/docker-compose.yml` & Terraform with Redis cluster sizing knobs, queue topics for waitlist, and environment variables for new features.
- **QA-180 – Regression automation:** expand Playwright suites to cover waitlist enrolment/promotion, tenant-isolated access control, and rate limit error states.

## 4. Milestones
1. **Week 1 – Foundations**
   - Tenant IDs persisted end-to-end for patients, doctors, appointments.
   - Waitlist schema + basic CRUD API live behind feature flag.
   - Patient/doctor UIs show placeholder waitlist panels fed by mocked data.
2. **Week 2 – Experience Integration**
   - Promotion flow from waitlist → appointment confirmation with messaging hooks.
   - Admin clinic dashboard showing per-clinic KPIs and waitlist depth.
   - Rate limiting + cache layer verified in staging load tests.
3. **Week 3 – Hardening & QA**
   - Automated waitlist notifications and nudges deployed.
   - Multi-clinic configurations editable via admin console with audit logs.
   - k6 + Playwright suites passing; chaos exercises documented with mitigations.

## 5. Risks & Mitigations
- **Data migration complexity:** adding tenant/clinic IDs risks downtime. Mitigate via background migration scripts, feature flags, and dual-read logic during rollout.
- **Waitlist prioritisation fairness:** unclear rules could erode trust. Define scoring rubric (time waited, patient priority, subscription tier) and expose overrides/audit logs.
- **Performance regressions:** new caching/rate limiting layers may cause stale data or throttling errors. Introduce thorough staging load tests and monitor with feature flags + circuit breakers.
- **Messaging noise:** aggressive waitlist nudges may spam users. Implement quiet hours, preference toggles, and dynamic throttling caps per channel.

## 6. Definition of Done
- Tenant-aware access control enforced across APIs, queries, and JWT issuance.
- Waitlist end-to-end journey (join, manage, promote, notify) available for doctor, patient, and admin personas with audit trails.
- Clinic-level capacity, waitlist policies, and analytics configurable via admin console and honoured in scheduling logic.
- Performance benchmarks documented with load-test artefacts; alerts configured for cache saturation, waitlist backlog, and rate-limit breaches.
- Documentation updated (`docs/ops-runbooks.md`, `docs/consultation-lifecycle.md`, new waitlist playbooks) alongside sprint demo notes.

## 7. Kickoff Checklist
- Confirm schema migration plan and coordinate maintenance windows with data stakeholders.
- Update `.env` templates for new Redis namespaces, rate limit configs, and messaging templates.
- Align squads on waitlist scoring rules, clinic governance policies, and QA acceptance criteria.
- Refresh sprint board columns (`Backlog`, `In Progress`, `Code Review`, `QA`, `Done`) and limit WIP to protect critical-path backend work.


