# Sprint 3 Plan – Consultation Lifecycle (Weeks 11-14)

## 1. Objectives
- Orchestrate consultations from check-in to completion with visit notes and outcomes.
- Equip doctors with an in-session workspace and visit documentation tools.
- Expose patients to pre/post-visit guidance, join links, and visit summaries.
- Lay the groundwork for messaging service triggers (email/SMS reminders).

## 2. Workstreams & Epics

### 2.1 Doctor Hub (`apps/doctor`)
- **Consultation queue**: Today/Upcoming views with filters (status, clinic, virtual vs in-person).
- **Visit workspace**: Start session, record vitals, track elapsed time, and mark outcomes.
- **Visit notes & attachments**: Rich text editor with templates; upload stubs (S3 integration deferred).

### 2.2 Patient Web (`apps/patient`)
- **Enhanced appointments**: Display join links, pre-visit instructions, and countdown timers.
- **Visit summaries**: Surface published notes, prescriptions, and follow-up actions.
- **Feedback capture**: Prompt for ratings/comments after completion (storage placeholder).

### 2.3 Identity / Appointment Service (`services/identity-service`)
- Extend appointment schema with consultation lifecycle states (`checked-in`, `in-session`, `completed`, `no-show`).
- Persist consultation metadata: `startedAt`, `endedAt`, `notes`, `attachments`.
- Expose endpoints for doctors to transition states, save notes, and fetch visit history.
- Emit domain events (outbox pattern) for messaging hooks.

### 2.4 Messaging Service (new module)
- Scaffold `services/messaging-service` with event consumer, template registry, and provider abstraction.
- Implement reminder triggers: pre-visit SMS/email, join link reminders, post-visit summary delivery.
- Provide manual resend endpoints for ops/admin tooling.

### 2.5 Admin Console (`apps/admin`)
- **Consultation monitor**: Real-time dashboard of ongoing/overdue visits, with manual override.
- **Analytics MVP**: Aggregate daily visits, completion rates, and average duration cards.

## 3. Milestones
1. **Week 1**
   - Schema migrations + consultation status endpoints.
   - Doctor queue UI scaffolded against mocked data.
   - Messaging service bootstrap with event contracts.
2. **Week 2**
   - Visit workspace + notes editor wired to backend.
   - Patient portal enhancements (join links, visit summaries).
   - Messaging service sends reminders/receipts (stub transport).
3. **Week 3**
   - E2E QA (patient + doctor + admin flows).
   - Update documentation (`docs/consultation-lifecycle.md`, playbooks, QA checklist).
   - Sprint review & backlog grooming for telehealth + note attachments integration.

## 4. Risks & Mitigations
- **State drift between clients** → combine optimistic updates with periodic revalidation / SSE.
- **Notification delivery reliability** → queue retries + dead-letter design, log correlation IDs.
- **PHI and compliance** → enforce RBAC on notes/attachments, encrypt storage references, audit access.
- **Time constraints for new service** → keep messaging transport mocked; schedule production integration in Sprint 4.

## 5. Definition of Done
- Doctors manage consultations through all lifecycle states with persisted visit notes.
- Patients receive email notifications and can review visit summaries/follow-ups in the portal.
- Messaging service consumes generated events and dispatches templated notifications.
- Documentation updated (APIs, UX flows, QA checklist, support runbook) and demo recorded.

## 6. Completion Summary
- ✅ Consultation lifecycle statuses, visit notes, and follow-up actions persisted via `identity-service`.  
- ✅ Doctor hub queue offers actionable controls (check-in, start, complete, no-show) with inline summary editor.  
- ✅ Messaging service now emits patient emails for status changes (SMTP configurable, console fallback).  
- ✅ Documentation refreshed (`consultation-lifecycle.md`) reflecting new flows and notification wiring.  
- ⏳ Deferred to Sprint 4: real-time UI updates (SSE/websocket), telehealth join links/countdowns, analytics dashboard, SMS/WhatsApp notifications, dedicated visit workspace UI.  
- 📋 QA: manual walkthrough recorded in team doc; automated coverage scheduled for next sprint alongside real-time features.


