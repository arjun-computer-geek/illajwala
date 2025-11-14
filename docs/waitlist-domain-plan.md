# Sprint 5 – Waitlist Domain & API Blueprint

## 1. Objectives
- Introduce a tenant-aware waitlist system that captures patient interest when no appointment slots are available, enforces clinic-specific caps, and preserves prioritisation rules.
- Provide REST APIs for creating, listing, and promoting waitlist entries across patient, doctor, and admin experiences.
- Connect waitlist lifecycle events to messaging workflows for notifications and nudges.
- Expose analytics and operational signals (depth, ageing, conversions) to the admin dashboard.

## 2. Domain Model

### 2.1 Core Schema (`WaitlistEntry`)
- `tenantId` (string, required) – aligns with new multi-tenant enforcement.
- `clinicId` (ObjectId → `Clinic`) – supports multi-location context.
- `doctorId` (ObjectId → `Doctor`) – optional if patient joins a general clinic waitlist.
- `patientId` (ObjectId → `Patient`) – primary requester.
- `status`: enum `<"active","invited","promoted","expired","cancelled">`.
- `priorityScore` (number) – computed ranking (time waited, patient priority, subscription tier).
- `requestedWindow`: optional start/end datetimes or day-part preferences.
- `notes`: free-form support notes.
- `metadata`: JSON blob (e.g. referral source, symptoms).
- `audit`: array of actions (createdBy, action, notes, timestamp) to drive admin/concierge tools.
- `expiresAt`: scheduled auto-expiry for stale entries.
- `createdAt` / `updatedAt`.

**Indexes**
- `{ tenantId: 1, clinicId: 1, status: 1, priorityScore: -1, createdAt: 1 }` – fetching queues.
- `{ tenantId: 1, patientId: 1, status: 1 }` – show patient waitlist history.
- TTL index on `expiresAt` for auto-cleanup.

### 2.2 Supporting Config (`WaitlistPolicy`)
- `tenantId`, `clinicId`.
- `maxQueueSize`, `autoExpiryHours`, `autoPromoteBufferMinutes`.
- `priorityWeights` (JSON: waitTime, membershipLevel, chronicCondition flags).
- `notificationTemplateOverrides`.
- RESTful endpoints: `GET/PUT /tenants/:tenantId/clinics/:clinicId/waitlist-policy`.

### 2.3 Derived Metrics (stored per clinic/day)
- `queueDepth`, `avgWaitMinutes`, `promotionsToday`, `expiredCount`, `conversionRate`.
- Feeds admin dashboard rollups and trending charts.

## 3. API Surface (Identity Service)

| Endpoint | Method | Role(s) | Description |
|----------|--------|---------|-------------|
| `/waitlists` | `POST` | `patient`/`admin` | Join waitlist: validates tenant+clinic capacity, deduplicates active entry. |
| `/waitlists` | `GET` | `admin` | Filter by clinic, doctor, status; supports pagination + sorting by priority. |
| `/waitlists/:id` | `PATCH` | `admin`/`staff` | Update status (`cancelled`, `promoted`), edit notes or requested windows. |
| `/waitlists/:id/promote` | `POST` | `admin`/`doctor` | Atomically convert to appointment: acquires slot lock, creates appointment, updates waitlist status, emits event. |
| `/patients/:patientId/waitlists` | `GET` | `patient` | Show active & recent entries for account portal. |
| `/appointments/:id/waitlist/invite` | `POST` | `admin` | Send invite notification for upcoming vacancy (status → `invited`). |

**Request Guards**
- Use `requireTenantId` to enforce tenant isolation.
- Validate clinic membership/role via existing RBAC (admin vs doctor vs patient).
- Rate-limit patient submissions to prevent spam (future: `rateLimitMiddleware`).

## 4. Business Rules

1. **Joining Waitlist**
   - Ensure patient has no active entry for same clinic/doctor.
   - Respect clinic policy `maxQueueSize`; return `409` if full.
   - Calculate `priorityScore = f(waitMinutes, patientTier, requestedWindow, chronicConditions)`.
   - Send confirmation notification (`waitlist.joined` event).

2. **Promotion Flow**
   - Acquire redis slot lock (`acquireSlotLock(tenantId, doctorId, scheduledAt, ttl)`).
   - Create appointment (existing `createAppointment` with tenant injection).
   - Mark waitlist entry `promoted` with `promotedAppointmentId`.
   - Publish event `waitlist.promoted` with metadata (clinic/team consumption).

3. **Invitation Flow**
   - When manual invite triggered or auto selection: set status `invited`.
   - Enqueue message (`waitlist.invited`) with respond-by deadline.
   - Cron/worker monitors invites; auto-expire after policy window, revert to `active`.

4. **Auto Expiry**
   - Worker runs hourly: transitions `active` entries older than policy threshold to `expired`; logs audit and emits event for analytics.

5. **Cancellation**
   - Patients can cancel via portal; admin can cancel on behalf; append audit entry.

## 5. Messaging Service Integration

### Queues / Events
- **New topic**: `waitlist-events` (BullMQ queue).
  - Payload now carries tenant, clinic, doctor, patient contact info, and notification preferences so downstream workers can respect opt-ins.
  - Subscribe workers for email/SMS/WhatsApp templates: `waitlist_joined`, `waitlist_invited`, `waitlist_promoted`, `waitlist_expired`, `waitlist_cancelled`.
- Reuse `notification-resend` infrastructure with templates keyed per event and tenant override support; ship sensible defaults with the service.
- Implement throttling per tenant (extend `MSG-241`) to avoid spam bursts.

### Templates
- Provide default templates with placeholders: `{patientName}`, `{doctorName}`, `{clinicName}`, `{respondBy}`.
- Tie into patient notification preferences (extend `PatientNotificationPreferences` with `waitlistReminders` flag).
- Workers enforce `waitlistReminders` plus channel-specific toggles (email/SMS/WhatsApp) before dispatching.

## 6. Frontend Touchpoints

### Patient App
- `search` results: if slot full, CTA `Join Waitlist` → POST `/waitlists`.
- `account/appointments`: new `Waitlist` tab showing status timeline.
- Toast/inline messages on promotion or expiration.

### Doctor App
- Dashboard queue: section above consultation list summarising `active`, `invited`, `promoted`.
- Actions: `Promote to Appointment`, `Invite`, `Cancel`.
- Display policy info (max queue, ageing).

### Admin App
- Ops dashboard tiles: waitlist depth, average wait, expired entries.
- Waitlist oversight panel: filter by clinic, review active/invited entries, adjust queue policy, and monitor average wait time.
- Config page: manage `WaitlistPolicy`, define scoring weights, toggles for auto-invite.
- Audit log integration: show history from `audit` array.

## 7. Analytics & Reporting
- Extend analytics service to aggregate waitlist stats by clinic/day.
  - New collection: `waitlist_metrics` or compute on-demand via aggregation pipeline with helper indexes.
- Expose SSE stream updates (`/realtime/dashboard`) to include waitlist counters for live tiles.
- Add metrics to k6/chaos plans (PLT-201).

## 8. Implementation Phases

1. **Schema & Service Layer**
   - Create Mongoose model + policy model.
   - Service functions: `enqueueWaitlist`, `listWaitlist`, `promoteWaitlistEntry`, `expireWaitlistEntries`.
   - Unit tests covering duplicates, capacity, promotion, expiry.

2. **API Endpoints & Controllers**
   - Wire routes with validation schemas.
   - Integrate with existing slot lock + appointment service.
   - Add audit logging helper.

3. **Messaging Workers**
   - Queue manager updates to register `waitlist-events`.
   - Implement worker sending notifications (can stub for MVP).

4. **Frontend Hooks + UI**
   - Patient join flow + account view.
   - Doctor dashboard queue view.
   - Admin oversight + policy forms (initial read-only list if time-constrained).

5. **Analytics & Dashboards**
   - Extend analytics service endpoints for waitlist metrics.
   - Update admin dashboards to fetch new series.

6. **QA & Load Tests**
   - Playwright: join/promotion/cancel flows per role.
   - k6 scenario simulating high churn + slot promotions.

## 9. Open Questions / Follow-ups
- Membership tiers or chronic condition data source? (Need to confirm where to derive priority insights.)
- Should waitlist allow anonymous email-only submissions? (Current assumption: authenticated patients.)
- Handling multi-slot openings (group sessions)? Future iteration.
- Need concurrency guard when multiple admins attempt promotion; ensure slot lock + transaction semantics cover this.
- Localization requirements for templates? Assume reusing messaging i18n scaffolding.

---

This blueprint can now drive backlog tickets for schema work, API implementation, messaging integration, and UI tasks across sprint 5. Please review/adjust scoring rules and policy defaults before execution.+

