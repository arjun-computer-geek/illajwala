# Sprint 4 Plan – Ops & Analytics (Weeks 15-18)

## 1. Objectives
- Deliver real-time operational visibility across doctor, patient, and admin apps.
- Expand notification channels (SMS/WhatsApp) and provide resend controls for support.
- Launch analytics dashboards for consultation throughput, no-show rates, and revenue insights.
- Harden the platform with monitoring, error alerting, and runbooks for on-call teams.

## 2. Workstreams & Epics

### 2.1 Doctor Hub (`apps/doctor`)
- **Live consultation workspace**  
  - Surface in-session timers, vitals capture, and attachment uploads (S3 stub).  
  - Stream real-time status updates via SSE/WebSockets.  
  - Provide quick actions for rescheduling and follow-up scheduling.
- **Operational alerts**  
  - In-app toasts/banners for upcoming patients, overdue consults, and messaging failures.

### 2.2 Patient Web (`apps/patient`)
- **Real-time updates & engagement**  
  - Deliver countdown timers and telehealth join links with SSE.  
  - Enable post-visit feedback and show visit summaries, prescriptions, and attachments.
- **Notification preferences**  
  - Allow patients to opt-in/out of SMS/email reminders and view notification history.

### 2.3 Admin Console (`apps/admin`)
- **Ops dashboard & analytics**  
  - Real-time tiles for current visits, wait times, no-show rate, payment exceptions.  
  - Historical charts (daily/weekly) for consultations, revenue, provider utilization.  
  - Manual notification resend/override controls with audit logging.
- **Alerts & escalation**  
  - Configure rules for overdue consults, missed payments, messaging failures.

### 2.4 Messaging Service (`services/messaging-service`)
- **Channel expansion**  
  - Integrate SMS/WhatsApp provider (mock + config via env).  
  - Introduce templating DSL and localization support.  
  - Implement resend endpoint with audit tracking.
- **Observability**  
  - Metrics (queue depth, processing latency) exported for Grafana.  
  - Dead-letter handling and retry policies for failed events.

### 2.5 Platform & Monitoring
- **Real-time infra**: Set up socket gateway (Next.js route or dedicated service) and reuse Redis Pub/Sub.
- **Logging & tracing**: Centralize logs with correlation IDs, enable distributed tracing (OpenTelemetry).
- **Runbooks & on-call**: Document incident response, escalation paths, and playbooks for common issues.

## 3. Milestones
1. **Week 1**  
   - Real-time consultation status streaming (doctor & patient apps).  
   - Messaging service SMS/WhatsApp integration (sandbox) with unified template system.  
   - Admin dashboard scaffolding with live tiles fed from SSE.
2. **Week 2**  
   - Doctor consultation workspace (timer, vitals, attachments) + patient feedback capture.  
   - Analytics charts (consultations, revenue, no-show rate) using aggregated endpoints.  
   - Notification resend UI + audit trail.
3. **Week 3**  
   - Observability rollout (metrics, logs, alerts) and messaging DLQ handling.  
   - End-to-end QA covering real-time flows, multi-channel notifications, analytics accuracy.  
   - Documentation & sprint review: ops runbooks, analytics usage guide, support checklist.

## 4. Risks & Mitigations
- **Real-time scalability** → Start with SSE, back with Redis pub/sub; fall back to polling when connection lost.  
- **Notification provider quotas** → Keep sandbox provider configurable, enforce rate limiting and DLQ.  
- **Data accuracy for analytics** → Validate aggregation pipelines with snapshot tests; reconcile with seed data.  
- **PHI handling in attachments** → Encrypt S3 keys, restrict access via signed URLs, audit every download.  
- **Operational complexity** → Automate runbooks and alert thresholds; schedule shadow-on-call before GA.

## 5. Definition of Done
- Real-time consultation updates flow through doctor/patient/admin apps with resilient fallbacks.  
- Multi-channel notifications (email + SMS/WhatsApp) delivered with resend controls and audit trails.  
- Admin analytics dashboard provides actionable metrics on consultations, revenue, and no-shows.  
- Monitoring, logs, and runbooks enable ops to respond to incidents within defined SLAs.  
- Documentation updated: ops & analytics playbooks, notification templates, QA checklist, sprint summary.

## 6. Kickoff Checklist
- **Scope & Owners**
  - Confirm DRIs for each epic (doctor, patient, admin, messaging/platform); record in sprint board.
  - Validate access to sandbox SMS/WhatsApp provider credentials and shared Redis instance.
- **Environment Readiness**
  - Refresh `.env` templates for doctor/patient/admin apps and messaging service with new keys.
  - Ensure feature flags for SSE/WebSocket beta and notification preferences exist in config service.
- **Delivery Cadence**
  - Stand up sprint board columns (`Backlog`, `In Progress`, `QA`, `Done`) and define WIP limits.
  - Align on daily standup agenda (real-time blockers, analytics data issues, messaging retries).

## 7. Initial Stories & Tasks

### 7.1 Doctor Hub (`apps/doctor`)
- Story: `DOC-401` – Implement SSE client hookup in consultation dashboard and surface session timer.
- Story: `DOC-402` – Capture vitals & attachments (stub to S3) with optimistic UI and validation.
- Task: Define Redis channel schema for consultation status events and map to UI state machine.
- Task: Draft alert scenarios (upcoming patient, overdue consult, messaging failure) with trigger logic.

### 7.2 Patient Web (`apps/patient`)
- Story: `PAT-365` – Render countdown timers and telehealth join CTA with SSE updates.
- Story: `PAT-366` – Post-visit feedback form with persistence and success toast.
- Task: Inventory visit summary data contract (prescriptions, attachments, clinician notes).
- Task: Design notification preference center (opt-in/out toggles, history table wiring).

### 7.3 Admin Console (`apps/admin`)
- Story: `ADM-278` – Scaffold live ops dashboard tiles with SSE feed and skeleton loading states.
- Story: `ADM-279` – Build historical charts (consultations, revenue, no-show) hitting aggregation API.
- Task: Define audit log schema for notification resend actions and integrate with RBAC guard.
- Task: Capture escalation rule requirements (thresholds, notification targets, override flow).

### 7.4 Messaging Service (`services/messaging-service`)
- Story: `MSG-190` – Integrate sandbox SMS/WhatsApp provider with templating & localization.
- Story: `MSG-191` – Expose resend endpoint with audit trail persistence and per-channel throttling.
- Task: Draft templating DSL spec (variables, language fallbacks) and document in repo.
- Task: Instrument queue depth/latency metrics and surface DLQ processing alerts.

### 7.5 Platform & Monitoring
- Story: `PLT-142` – Stand up SSE gateway backed by Redis pub/sub with reconnect fallback.
- Story: `PLT-143` – Implement distributed tracing baseline (OpenTelemetry collectors + exporters).
- Task: Create incident runbook skeletons (real-time outage, notification backlog, analytics mismatch).
- Task: Define alert thresholds and routing for messaging failures and overdue consults.

### 7.6 Cross-Team Alignment
- Task: Schedule discovery syncs (doctor/patient real-time alignment, analytics data ownership).
- Task: Publish weekly demo goals and acceptance criteria against sprint milestones.
- Task: Establish QA checklist template covering real-time flows, notifications, analytics validation.


