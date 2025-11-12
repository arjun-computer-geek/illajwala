# Illajwala VisitNow Platform – Master Product Requirements & Delivery Plan

## 0. Document Purpose
- **Audience:** Founders, product leads, engineering, design, QA, GTM, and ops teams collaborating across the Admin Console, Doctor Hub, and Patient Platform.
- **Objective:** Establish a single source of truth for vision, scope, architecture, delivery roadmap, and operational playbooks for the Illajwala VisitNow appointment-booking SaaS suite. This complements product-specific PRDs and aligns cross-team dependencies.
- **Change control:** Track revisions in repo history. Each release train should log updates (scope decisions, new integrations) in `docs/changelog.md` (to be created in future work).

---

## 1. Vision & North Star
- **Vision:** Seamlessly connect patients with verified doctors through a trustworthy, real-time marketplace that handles discovery, scheduling, consultation, and post-visit workflows end-to-end.
- **North Star Metric:** Percentage of booked appointments that complete successfully with ≥4★ patient rating and no operational escalations.
- **Supporting KPIs:**
  - Patient acquisition & conversion (search → booking → completion).
  - Provider activation & retention (onboarded → actively publishing slots).
  - Appointment lifecycle health (cancellations, reschedules, no-shows).
  - Revenue metrics (GMV, commissions, payouts accuracy).
  - Operational efficiency (time-to-onboard doctor, ticket SLA adherence).

---

## 2. Product Pillars & Personas
| Pillar | Primary Persona | Key Jobs-to-be-Done | Success Signal |
| --- | --- | --- | --- |
| **illajwala-patient (Web/Mobile Web)** | Patients & caregivers | Discover doctors, compare options, book appointments, manage dependants, handle payments, review experiences. | Booking completed in ≤5 minutes with clear follow-up. |
| **illajwala-doctor (Clinic Portal)** | Doctors, clinic admins, staff | Publish availability, manage queues, conduct consultations, issue prescriptions, reconcile earnings. | Clinic operates daily schedule with <10 min avg wait. |
| **illajwala-admin (Admin Console)** | Internal operations | Verify doctors, manage marketplace policies, monitor KPIs, resolve escalations, manage payouts, configure notifications. | Providers onboarded <48h, escalations resolved within SLA. |

**Secondary Personas:** Finance analyst (payout reconciliation), Marketing manager (SEO & campaigns), Support agent (ticket handling), Compliance officer (audit readiness).

---

## 3. Market & Business Requirements
1. **Multi-tenant readiness:** Architecture must support future white-label offerings for partner hospitals/marketplaces with isolated data and branding.
2. **Regulatory compliance:** HIPAA/PDP, e-prescription norms, GDPR-like data rights (export/delete). Maintain audit logs for provider credentialing and patient data access.
3. **Monetization models (roadmap-aware):**
   - Commission per appointment (default).
   - Subscription tiers for clinics (advanced analytics, telehealth).
   - Premium patient features (priority slots, concierge support).
4. **Geographic rollout:** Start with metro cities (Phase 1), expand to Tier-2 (Phase 2) with localization (languages, payment anchors).

---

## 4. Scope & Feature Alignment (Cross-Product)

### 4.1 End-to-End Appointment Flow
1. **Doctor onboarding** (`Admin Console`) → Verified provider profile published.
2. **Availability setup** (`Doctor Hub`) → Slots exposed to `Patient Platform`.
3. **Patient discovery & booking** (`Patient Platform`) → Payment (if required) → Confirmation.
4. **Real-time notifications** (shared service) to patient, doctor, admin ops.
5. **Consultation execution** (`Doctor Hub`) → Notes/prescriptions synced back to patient.
6. **Post-visit feedback** (`Patient Platform`) → Analytics & quality monitoring (`Admin Console`).

### 4.2 Shared Services & Components
- **Identity & Access:** Central auth service with RBAC, OAuth2 tokens, MFA support. Shared user directory for patients & staff with scoped tokens.
- **Scheduling Engine:** Availability, slot inventory, conflict resolution, waitlist (roadmap).
- **Payments & Ledger:** Payment initiation, webhook handling, refunds, payout reconciliation.
- **Notification Orchestrator:** Template library, channel routing (email/SMS/WhatsApp/push), localization.
- **Analytics Pipeline:** Event schema, data ingestion, warehousing, dashboards, alerting.
- **Document Storage:** Secure storage for credentials, prescriptions, invoices, consents.
- **Integration Layer:** API gateway + domain services, event bus for decoupled communication.

### 4.3 Non-Functional Alignment
- **Performance SLAs:** Search API <300ms; dashboard data <2s; real-time updates <5s.
- **Availability:** 99.5%+ for patient booking APIs; 99.7% for doctor/admin apps during business hours.
- **Security:** Zero-trust networking, encryption, audit trails, periodic pen-tests.
- **Accessibility:** WCAG 2.1 AA baseline across web apps.
- **Observability:** Centralized logging (ELK/OpenSearch), tracing (OpenTelemetry), metrics (Prometheus/Grafana).

---

## 5. Solution Architecture Overview

### 5.1 High-Level Diagram (Narrative)
1. **Client Applications:**
   - `patient-web` (Next.js), `doctor-web` (Next.js), `admin-console` (Next.js or React).
2. **API Gateway / BFFs:**
   - Patient API Gateway (handles content caching, personalization).
   - Doctor API Gateway (handles websocket updates, queue ops).
   - Admin API Gateway (RBAC enforcement).
3. **Domain Services (Node.js/Express + PostgreSQL):**
   - `identity-service` (users, auth, sessions).
   - `provider-service` (doctor profiles, credentials, services).
   - `appointment-service` (slots, bookings, lifecycle events).
   - `payment-service` (transactions, payouts).
   - `messaging-service` (notifications & chat).
   - `analytics-service` (events, dashboards).
4. **Shared Infrastructure:**
   - Databases (PostgreSQL with logical replication per tenant).
   - Redis (session cache, rate limiting, queue).
   - Message broker (Kafka/NATS) for domain events.
   - Object storage (S3/GCS) for documents.
   - Telehealth integration (3rd-party SDK or self-hosted WebRTC).
   - Observability stack (Grafana/Loki/Tempo).

### 5.2 Data Model (Core Entities)
- **User:** base identity, roles (patient, dependant, doctor, staff, admin).
- **Provider:** doctor profile, clinic associations, services, licenses.
- **Clinic:** address, facilities, operating hours, staff list.
- **Slot:** provider, clinic, start/end, capacity, availability status.
- **Appointment:** booking details, patient/dependant, payment status, state machine.
- **Payment:** transaction metadata, gateway references, ledger entries.
- **Review:** rating, tags, comments, moderation status.
- **Notification:** template, channel, delivery status.
- **SupportTicket:** issue type, linked entities, SLA metrics.

### 5.3 API Strategy
- **REST + GraphQL hybrid:** REST for transactional flows; GraphQL (or tRPC) for dashboard aggregation. Document OpenAPI specs per service (`/docs/openapi`).
- **Versioning:** Semantic versioning of APIs; use feature flags for incremental rollout.
- **Event-Driven Integrations:** Publish domain events (`appointment.booked`, `doctor.verified`) to broker for asynchronous workflows (notifications, analytics).

---

## 6. Delivery Roadmap (24-Week Baseline)

| Phase | Weeks | Theme | Key Deliverables |
| --- | --- | --- | --- |
| **Phase 0** | 0-2 | Foundation | Shared design system, monorepo setup, CI/CD pipelines, environment provisioning, core auth scaffolding. |
| **Phase 1** | 3-6 | Provider Onboarding & Discovery | Admin onboarding workflow MVP, doctor availability setup, patient discovery search, shared data contracts. |
| **Phase 2** | 7-10 | Booking & Payments | Slot booking engine, payment integration, appointment dashboards (patient & doctor), notification triggers. |
| **Phase 3** | 11-14 | Consultation & Post-Visit | Telehealth integration MVP, doctor consultation workspace, patient document vault, review system. |
| **Phase 4** | 15-18 | Operations & Analytics | Admin SLA dashboards, support ticketing, financial reconciliation, enhanced analytics. |
| **Phase 5** | 19-22 | Automation & Scalability | Scheduler automation (reminders, renewals), waitlist, multi-location clinics, performance hardening. |
| **Phase 6** | 23-24 | Pilot & GA Prep | Pilot rollout, observability audit, security review, compliance sign-off, go-to-market collateral. |

> **Note:** Each phase culminates in a demo & retrospective. Maintain a rolling 2-sprint buffer for spillover items.

---

## 7. Implementation Playbook

### 7.1 Repository & Code Management
- Maintain three submodule apps (`illajwala-patient`, `illajwala-doctor`, `illajwala-admin`); keep their Git histories isolated.
- Publish shared UI components, types, and SDKs as private npm packages (e.g., `@illajwala/ui`, `@illajwala/api-client`) consumed by each submodule.
- Host shared Node.js services (identity, provider, scheduling, messaging, payments) in `shared-services/` workspace or dedicated repos with consistent tooling.
- Enforce conventional commits & changesets; automate semantic versioning for shared packages.
- Implement branch protection, PR templates (tests, security, docs), and dependency update cadence per repo.

### 7.2 Environment Strategy
- **Local:** Docker Compose runs MongoDB (Atlas local dev image/ReplicaSet), Redis (cache/queues), and shared services. Apps rely on `.env.local` with service URLs.
- **Dev/Staging:** Cloud-hosted (AWS/GCP) using Vercel/Netlify for Next.js fronts, Fly.io/Render/EC2 for Node services, MongoDB Atlas for database cluster.
- **Prod:** Primary region ap-south-1 with cross-region backups. Secrets managed via Vault/SSM; Terraform/Pulumi provisions services, networking, monitoring.

### 7.3 Testing Strategy
- **Unit Tests:** Jest/Vitest for frontend & backend packages.
- **Integration Tests:** Supertest/Playwright running against local containers.
- **E2E Tests:** Playwright/Cypress covering critical booking flows.
- **Contract Tests:** PACT or schemathesis to validate API compatibility across services.
- **Performance Tests:** k6/Gatling for booking API load; Web Vitals monitoring in CI.
- **Security Checks:** Dependency scanning (Snyk), ESLint/Prettier, ZAP dynamic scans before release.

### 7.4 DevOps & Observability
- GitHub Actions (or Azure DevOps) pipeline: lint → test → build → deploy.
- Feature flag service (LaunchDarkly/ConfigCat) for controlled rollout.
- Centralized logging (structured JSON). Alerts on P0 incidents, SLA breaches.
- On-call rotation defined for backend & frontend teams; runbooks stored in `docs/runbooks/`.

---

## 8. Backlog Structure & Workstream Breakdown

### 8.1 Epics Overview
1. **E1: Identity & Access Management**
2. **E2: Provider Onboarding & Credentialing**
3. **E3: Scheduling & Availability**
4. **E4: Patient Discovery & Search**
5. **E5: Booking & Payments**
6. **E6: Appointment Lifecycle & Notifications**
7. **E7: Consultation Tooling & Telehealth**
8. **E8: Post-Visit & Feedback**
9. **E9: Analytics & Reporting**
10. **E10: Operations & Support**
11. **E11: Platform Infrastructure & Observability**

### 8.2 Sample Feature Backlog (Phase 1 Focus)
- **Admin Console**
  - Provider application intake UI.
  - Document checklist module.
  - Reviewer assignment & notes.
  - Publish provider profile API endpoint.
- **Doctor Hub**
  - Calendar setup wizard.
  - Slot template CRUD.
  - Availability API integration.
- **Patient Platform**
  - Search landing page with filters.
  - Doctor profile page.
  - Slot selection component.
- **Shared Services**
  - Provider service (REST endpoints + shared Mongo collections).
  - Slot service with conflict detection.
  - Seed scripts for sample data.

Maintain backlog in Linear/Jira with cross-repo tags; include dependency fields referencing upstream services.

---

## 9. Data Governance & Compliance
- Implement data classification (PII, PHI, financial).
- Define retention & deletion policies per entity; automate anonymization after retention period.
- Consent management: track consents per patient; allow download/deletion requests within SLA.
- Audit logging: store immutable logs (append-only) with tamper detection.
- Disaster recovery: nightly backups, point-in-time restore, quarterly DR drills.

---

## 10. Operational Playbooks
- **Incident Response:** 4-tier severity, on-call escalation matrix, post-mortem template.
- **Release Management:** Bi-weekly release train with feature flags; hotfix protocol.
- **Support Workflow:** Patient tickets (L1), doctor tickets (L2), escalate to product/engineering (L3). Document in knowledge base (Confluence/Notion).
- **Training & Enablement:** Provide sandbox accounts, training videos, certification checklist for staff.

---

## 11. Future Enhancements (Roadmap Considerations)
- Mobile apps (React Native/Flutter) for patient & doctor experiences.
- AI-powered triage & recommendations (symptom checker, best doctor match).
- Insurance integrations (eligibility checks, cashless claims).
- EMR/HMS integrations for hospital partners.
- Loyalty & subscription programs.
- Marketplace insights for pharma/labs partnerships.

---

## 12. Open Questions & Assumptions
1. Telehealth vendor vs. in-house WebRTC? (Decision needed by Phase 3 start.)
2. Payment gateway selection (Razorpay vs PhonePe) and settlement timelines.
3. Initial geographies & languages for MVP launch.
4. Data residency requirements for non-India markets.
5. Business model validation for clinic subscriptions.
6. Legal review cadence and compliance sign-offs for new markets.

Maintain answers in `docs/decisions/ADR-xxxx.md` using Architecture Decision Records.

---

## 13. Definition of Done (Platform MVP)
- All Phase 2 deliverables operational end-to-end in staging with automated regression suite.
- Cross-product data consistency validated (Doctor Hub ↔ Patient Platform ↔ Admin Console).
- Security & compliance checklist signed by legal/compliance.
- Monitoring dashboards live with alert thresholds tuned.
- Training materials produced for clinics and support teams.
- Pilot clinics onboarded with satisfied NPS ≥4.2 and low issue rate (<5% escalations).

---

## 14. Continuity Checklist
To ensure seamless continuation if work pauses:
- Keep `MASTER-PRD.md` updated per sprint with change log section.
- Document sprint outcomes in `docs/status/weekly-report-YYYY-MM-DD.md`.
- Maintain API schemas in shared `packages/types` with version tags.
- Ensure feature flags have documented owners & removal criteria.
- Track pending decisions with owners & due dates; avoid tribal knowledge.
- Back up environment configuration and credentials in secure vault with rotation schedule.

---

## 15. Next Actions (Immediate)
1. Spin up `docs/` folders for change log, decisions, runbooks.
2. Align team on repository restructuring (shared packages).
3. Create initial ADR for architecture split (services vs monolith).
4. Kick off Phase 0 tasks: design system alignment, CI/CD bootstrap, auth scaffold.
5. Review open questions with stakeholders; schedule decision meetings.

---

> **Document steward:** Product/Engineering lead (assign owner). Update cadence: at least once per release phase or after major decision.

