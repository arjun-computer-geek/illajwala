# Phase 0 Backlog – Foundation (Weeks 0-2)

## Objectives
- Align design systems across patient, doctor, and admin apps.
- Bootstrap monorepo tooling, CI/CD pipelines, and environment provisioning.
- Scaffold shared identity/authentication flows and baseline security practices.

## Workstreams & Tasks

### 1. Design System Alignment
- Audit existing UI components across web apps; catalogue reusable patterns.
- Establish shared token library (`@illajwala/ui`) with Tailwind configuration parity.
- Define typography, color, spacing, and accessibility guidelines.
- Create component migration plan (priority: buttons, inputs, forms, navigation).
- Deliver Figma (or equivalent) library linked to `@illajwala/ui` package.

### 2. Repository & Tooling Setup
- Restructure repo with `packages/` and `services/` directories per ADR-0001.
- Configure Turborepo/Yarn workspaces for shared builds and caching.
- Implement lint/test/build pipelines via GitHub Actions (or chosen CI).
- Set up commit linting, changesets, and pre-commit hooks.
- Document contribution guidelines and PR templates.

### 3. Authentication & Security Scaffold
- Choose identity provider approach (Auth0/Cognito vs self-hosted keycloak) and document decision.
- Implement shared auth service skeleton with JWT issuance & refresh token flow.
- Integrate auth guard in patient, doctor, admin apps (stubbed UI flows).
- Define RBAC roles & permission matrix; store in shared config.
- Establish secrets management strategy and baseline security checklist.

### 4. Infrastructure & Environments
- Author Terraform/Pulumi baseline for networking, databases, storage.
- Create Docker Compose for local development (Postgres, Redis, message broker).
- Set up dev/staging environment naming conventions and deployment targets.
- Configure observability stack scaffolding (logging, metrics, tracing instrumentation).

### 5. Program Management & Communication
- Stand up sprint rituals (planning, demo, retro) and tooling (Jira/Linear).
- Draft initial release calendar and status reporting cadence.
- Assign owners for each backlog item; capture in work tracking tool.
- Schedule stakeholder reviews for design system and auth decisions.

## Deliverables by End of Phase 0
- Shared design system repo/package with at least five core components aligned.
- Functioning monorepo toolchain with CI validating lint + test.
- Auth service skeleton deployed to dev environment; frontend apps using shared login stub.
- Infrastructure scripts provisioning dev environment end-to-end.
- Documented playbook for Phase 1 handoff (`docs/status/phase-1-plan.md` to be drafted next).

