# ADR-0001 – Illajwala Platform Architecture Split
- **Date:** 2025-11-11
- **Status:** Accepted
- **Context:** The VisitNow platform currently comprises three separate applications (`illajwala-patient`, `illajwala-doctor`, `illajwala-admin`) with duplicated UI components and inconsistent API contracts. As we expand into a multi-tenant SaaS offering, we need a scalable architecture that enables rapid iteration, clear ownership boundaries, and shared infrastructure (identity, scheduling, payments, notifications). The existing state hinders cross-product velocity, increases maintenance cost, and complicates compliance and observability.
- **Decision:** Adopt a modular platform architecture that:
  1. Maintains independent repositories via git submodules for patient, doctor, and admin applications while introducing shared SDKs published through an internal package registry.
  2. Establishes domain-aligned Node.js services (identity, providers, appointments, payments, messaging, analytics) deployed independently but backed by a shared MongoDB cluster (separate databases/collections per domain) with centralized access controls.
  3. Provides API gateways/BFFs per client app (patient, doctor, admin) to tailor responses, enforce RBAC, and mediate access to shared services and data.
  4. Centralizes platform capabilities—notifications, observability, document storage, analytics—through shared services accessible from all apps.
  5. Uses infrastructure-as-code for consistent provisioning across dev/staging/prod, including MongoDB Atlas (or equivalent) configuration, secrets management, and automated seeding.
- **Alternatives Considered:**
  - **Single monolith API + database:** Simplifies deployment but creates a bottleneck for team autonomy and complicates phased rollouts.
  - **Fully decoupled microservices with isolated databases:** Maximizes isolation but increases operational burden (data duplication, distributed transactions).
  - **Full monorepo with shared packages/services:** Eases dependency management but conflicts with existing submodule setup and team workflow.
- **Consequences:**
  - Requires governance for shared Mongo collections, index management, and schema validations (e.g., using Zod/JOI/Mongoose).
  - Demands publication/versioning of shared SDKs to keep submodule apps in sync.
  - Enables clearer ownership boundaries and reuse while respecting existing repo arrangement.
  - Facilitates future white-labeling and regional deployments via centralized services and data.
- **Follow-up Actions:**
  - Publish shared type definitions and service clients to an internal registry.
  - Define canonical collection schemas, validation layers, and indexing strategy for the shared Mongo cluster.
  - Implement shared service endpoints enforcing RBAC over consolidated data.
  - Update CI/CD pipelines in each repo to run schema validation tests and integration suites against the shared services.
- **Related Documents:**
  - `MASTER-PRD.md` (platform blueprint)
  - `docs/changelog.md` (record future decisions/releases)
*** End Patch

