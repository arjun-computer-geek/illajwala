## Sprint 0 Scope (Weeks 0-2)

- **Platform foundations**  
  - Stabilize PNPM workspace configs, shared TypeScript/ESLint presets, and `.env` loading utilities across apps and services.  
  - Stand up local development stack (MongoDB, Redis, Mailhog) with Docker Compose and document bootstrap steps.

- **Identity service**  
  - Finalize environment loader, Mongo connection, and configuration schema.  
  - Flesh out core modules (`auth`, `patients`, `doctors`) with request validation, JWT issuance/refresh, and error handling.  
  - Provide seed scripts for demo tenants and users.

- **Patient web (illajwala.com)**  
  - Polish existing landing/search pages to match PRD hero and value propositions.  
  - Wire auth pages to identity-service endpoints via `packages/api-client`; add optimistic states and surface errors per PRD.  
  - Implement account dashboard skeleton (appointments list with mocked data fed from identity-service stub).

- **Doctor web (*.illajwala.com)**  
  - Implement subdomain-aware middleware (`clinic` query propagation).  
  - Build authentication shell (login/register) tied to the identity-service.  
  - Add availability management placeholder (weekly schedule form, persists to mocked service until appointment-service is ready).

- **Admin web (admin.illajwala.com)**  
  - Scaffold navigation layout (dashboard, providers, clinics, approvals).  
  - Implement provider review queue consuming identity-service seed data, including status transitions and notes.  
  - Add activity log table sourced from mocked analytics feed.

- **Shared packages**  
  - Extend `packages/types` with zod schemas for auth, provider profile, appointment, and export TypeScript types for reuse.  
  - Enhance `packages/api-client` with tenant-aware axios instance and auth token refresh hooks.  
  - Flesh out `packages/ui` with shadcn components and shared theme tokens used by all apps.

- **Quality & Ops**  
  - Set up GitHub Action for lint/test on pull requests.  
  - Document sprint deliverables and acceptance criteria in sync with `illajwala_master_prd.md`.

