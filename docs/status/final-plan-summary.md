# Illajwala Platform Plan – Node.js + Mongo + Next.js

## Tech Stack Overview
- **Frontend:** Next.js (TypeScript) for patient, doctor, and admin portals (each in its own git submodule).
- **Backend Services:** Node.js/TypeScript (Express/Fastify) domain services for identity, provider, scheduling, payments, messaging, analytics.
- **Database:** MongoDB Atlas shared cluster with domain-specific databases (see `docs/status/mongo-data-model.md`).
- **Supporting Components:** Redis for caching/queues, S3-compatible storage for documents, third-party payment gateway (Razorpay/PhonePe), notification providers (email/SMS/WhatsApp).

## Submodule Alignment
- Retain existing git submodules: `illajwala-patient`, `illajwala-doctor`, `illajwala-admin`.
- Shared assets publish as private npm packages (`@illajwala/ui`, `@illajwala/types`, `@illajwala/api-client`); document usage in each README.
- Shared services live in `shared-services/` (or dedicated repos) with consistent CI/CD templates; apps consume via REST/GraphQL APIs.
- Keep environment configs (`.env.example`) synchronized across submodules referencing the shared Mongo cluster and service endpoints.

## Architecture Highlights
- API gateway/BFF per app enforces RBAC and routes to domain services.
- MongoDB cluster segmented by domain to isolate permissions while maintaining single source of truth.
- Event-driven notifications and analytics via messaging service (Kafka/NATS optional roadmap).
- Runbooks, ADRs, and status docs stored centrally (`docs/`) for cross-team visibility.

## Current Documentation Map
- `MASTER-PRD.md` – Product vision, roadmap, and implementation playbook.
- `docs/status/monorepo-restructure-plan.md` – Shared Mongo integration phases and milestones.
- `docs/status/mongo-data-model.md` – Canonical Mongo databases and collections.
- `docs/status/current-schemas.md` – Legacy Mongoose models inventory.
- `docs/status/phase-0-backlog.md` – Immediate backlog for foundation work.
- `docs/runbooks/*.md` – Operational procedures (incident response, release management).
- `docs/meetings/*.md` – Decision agendas/comparisons (identity provider).

## Next Immediate Actions
1. Kick off Phase 0 backlog (design system audit, npm registry setup, auth scaffold).
2. Provision shared MongoDB staging cluster and update service configs.
3. Finalize identity provider decision (see meeting agenda & vendor comparison) and implement auth service skeleton.
4. Start publishing shared packages and update submodules to consume them.
5. Populate changelog with Phase 0 initiation entry.

> Keep status updates in `docs/status/weekly-report-YYYY-MM-DD.md` (create on first sprint). Any new decisions should reference ADR-0001 and add supplementary ADRs when warranted.

