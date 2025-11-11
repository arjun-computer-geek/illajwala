# Meeting Agenda – Identity Provider Decision

- **Date/Time:** TBD (Phase 0, Week 1)
- **Duration:** 60 minutes
- **Facilitator:** Platform Lead
- **Participants:** Security lead, Patient Platform lead, Doctor Hub lead, Admin Console lead, DevOps/SRE, Product manager.
- **Goal:** Decide on the preferred identity provider approach for the Illajwala VisitNow platform (managed IDaaS vs self-hosted) and define immediate next steps.

## Pre-Reads
- `MASTER-PRD.md` – Sections 5.1 (Solution Architecture) & 7.3 (Testing Strategy).
- `docs/decisions/ADR-0001-platform-architecture-split.md`.
- Vendor comparison matrix (draft) – to be prepared by Security lead.
- Compliance requirements summary (HIPAA/PDP, regional mandates).

## Agenda
1. **Context & Objectives (5 min)**
   - Recap platform requirements for authentication & RBAC.
   - Highlight timeline dependencies (Phase 0 deliverables).
2. **Current State Assessment (10 min)**
   - Review existing auth implementations in patient/doctor/admin apps.
   - Identify pain points (token handling, session management, MFA gaps).
3. **Options Overview (20 min)**
   - **Option A:** Managed IDaaS (Auth0/Cognito/Azure AD B2C).
   - **Option B:** Self-hosted (Keycloak/Supertokens).
   - For each: cost, scalability, integration effort, compliance posture, vendor lock-in.
4. **Risk & Compliance Review (10 min)**
   - Data residency, audit logging, MFA, password policies.
   - Disaster recovery and SLA considerations.
5. **Discussion & Q&A (10 min)**
   - Address open questions, integration constraints, multi-tenant needs.
6. **Decision & Next Steps (5 min)**
   - Capture decision owner, chosen option, immediate tasks.
   - Assign follow-up actions (POC setup, timeline confirmation, ADR update if required).

## Expected Outcomes
- Consensus on preferred identity provider approach.
- List of blockers/assumptions that must be validated.
- Task owners for proof-of-concept and integration plan.
- Draft timeline for implementation and migration.

## Notes Template
- **Decision:** ...
- **Rationale:** ...
- **Action Items:** ...
- **Risks:** ...

> Store meeting notes in `docs/meetings/identity-provider-decision-notes-YYYY-MM-DD.md` after session.

