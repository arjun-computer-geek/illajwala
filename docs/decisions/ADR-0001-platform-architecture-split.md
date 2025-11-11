# ADR-0001 – Illajwala Platform Architecture Split
- **Date:** 2025-11-11
- **Status:** Accepted
- **Context:** The VisitNow platform currently comprises three separate applications (`illajwala-patient`, `illajwala-doctor`, `illajwala-admin`) with duplicated UI components and inconsistent API contracts. As we expand into a multi-tenant SaaS offering, we need a scalable architecture that enables rapid iteration, clear ownership boundaries, and shared infrastructure (identity, scheduling, payments, notifications). The existing state hinders cross-product velocity, increases maintenance cost, and complicates compliance and observability.
- **Decision:** Adopt a modular platform architecture with:
  1. **Shared packages** (`packages/`) for UI, types, utilities, and configuration managed via a monorepo toolchain (Turborepo/Yarn workspaces).
  2. **Domain-aligned backend services** (`services/`) for identity, providers, appointments, payments, messaging, and analytics. Each service exposes REST/GraphQL APIs and publishes domain events.
  3. **API gateways/BFFs** per client app (patient, doctor, admin) to tailor responses, handle caching, and enforce RBAC.
  4. **Shared platform services** for notifications, observability, and document storage.
  5. **Infrastructure-as-code** for consistent environment provisioning across dev/staging/prod.
- **Alternatives Considered:**
  - **Single monolith API:** Faster initial delivery but risks slow deployments, difficulty scaling teams, and entangled responsibilities.
  - **Fully decoupled microservices per feature:** High autonomy but overkill at current scale; increases operational complexity without clear benefit.
  - **Frontends-only monorepo with separate backend repos:** Improves UI reuse but still leaves backend contracts fragmented.
- **Consequences:**
  - Requires upfront investment in repository restructuring, CI/CD pipelines, and shared tooling.
  - Enables clearer ownership boundaries, faster reuse of components, and easier compliance audits.
  - Facilitates future white-labeling and regional deployments.
  - Demands governance (coding standards, API versioning) to avoid sprawl.
- **Follow-up Actions:**
  - Stand up `packages/` and `services/` directories with scaffolding.
  - Author technical design for shared identity service (Phase 0 deliverable).
  - Update CI/CD pipelines to handle monorepo builds and caching.
  - Document service contracts using shared OpenAPI specs.
- **Related Documents:**
  - `MASTER-PRD.md` (platform blueprint)
  - `docs/changelog.md` (record future decisions/releases)
*** End Patch

