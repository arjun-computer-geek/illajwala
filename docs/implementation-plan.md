# Illajwala Platform – Implementation Plan

## 1. Objectives
- Translate the master PRD into an incremental delivery roadmap.
- Establish a PNPM-powered monorepo housing all apps, backend services, and shared packages.
- Deliver a production-ready MVP that covers onboarding, booking, payments, and notifications for multiple tenants.

## 2. Phased Delivery (24 Weeks)
| Phase | Weeks | Key Deliverables |
|-------|-------|------------------|
| 0 | 0-2 | Monorepo bootstrap, CI/CD scaffolding, identity-service baseline, shared UI system. |
| 1 | 3-6 | Provider onboarding flows, admin panels for verification, doctor directory. |
| 2 | 7-10 | Patient booking flow, payments integration, slot management. |
| 3 | 11-14 | Consultation management, visit notes, messaging hooks. |
| 4 | 15-18 | Operational tooling, analytics dashboards, notification templates. |
| 5 | 19-22 | Performance hardening, waitlist, multi-clinic enhancements. |
| 6 | 23-24 | Pilot readiness, compliance audit, launch checklist. |

## 3. Workstreams & Initial Action Items

### Monorepo & Tooling
- [ ] Configure root `package.json` with PNPM workspaces (`apps/*`, `services/*`, `packages/*`, `infra/*`).
- [ ] Set up shared TypeScript config, ESLint, Prettier baseline.
- [ ] Add Git hooks (Husky) and lint-staged (Phase 0 stretch).

### Frontend Apps (Next.js 15/16 + App Router)
- `apps/patient`: patient discovery, booking, account flows.
- `apps/doctor`: schedule management, availability publishing, staff roles.
- `apps/admin`: onboarding workflows, verification, analytics snapshots.
- Shared UI library in `packages/ui` derived from patient prototype (shadcn + Tailwind theme).

### Backend Services (Node.js + Express + MongoDB)
- `identity-service`: auth, RBAC, tenant-aware sessions, JWT issuance.
- `provider-service`: doctor/clinic profile management, onboarding lifecycle.
- `appointment-service`: slots, bookings, locking via Redis.
- `payment-service`: Razorpay integration, ledger, webhook handling.
- `messaging-service`: transactional email/SMS/WhatsApp dispatch (Phase 3 onwards).
- `analytics-service`: event ingestion and dashboard APIs (Phase 4 onwards).

### Shared Packages
- `packages/types`: zod + TypeScript schemas shared across frontends/services.
- `packages/api-client`: Axios-based clients with tenant-aware headers.
- `packages/utils`: logging, config, queue helpers.

### Infrastructure
- Docker Compose for local dev (MongoDB, Redis, mailhog).
- Terraform scaffolding targeting Render + Vercel + Cloudflare.
- GitHub Actions workflows for lint/test/build/deploy (incremental rollout).

## 4. Immediate Next Steps (Sprint 0)
1. Finalize repository structure and workspace configuration.
2. Extract reusable UI/theme assets from `illajwala-patient_old_unfinished_code/patient-web`.
3. Scaffold `apps/patient` with landing, search, auth placeholders.
4. Initialize `services/identity-service` with Express app and Mongo connection.
5. Define shared environment loader and TypeScript configs across projects.

## 5. Dependencies & References
- **Design assets:** `illajwala-patient_old_unfinished_code/patient-web/public/logo.png`, `globals.css` theme tokens.
- **API schemas:** Reuse zod validators from server prototype under `services`.
- **Brand guidelines:** Colors from Tailwind theme; refine typography later.

## 6. Risks & Mitigations
- **Scope creep:** Anchor features to PRD phases; enforce change control.
- **Multi-tenant complexity:** Centralize tenant context handling in middleware and shared packages.
- **Security/compliance:** Introduce static analysis, secret scanning, and document data retention from the outset.
- **Resource contention:** Sequence service development to unblock frontend teams early (identity + provider first).


