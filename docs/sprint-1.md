# Sprint 1 Plan – Provider Onboarding (Weeks 3-6)

## 1. Objectives
- Deliver the full provider onboarding journey (admin approval → doctor profile → clinic microsite readiness).
- Enable doctors to manage profile basics and upload essential credentials.
- Allow admins to advance providers through review states with auditable notes.

## 2. Workstreams & Epics

### 2.1 Admin Console
- **Provider queue enhancements**  
  - Persist review state changes to identity-service.  
  - Add filtering (status, speciality) and pagination.  
  - Surface credential checklist (documents received, pending items).  
  - Record reviewer notes and timeline entries.

- **Clinic launch playbooks**  
  - Checklist component (KYC, payout, telehealth readiness).  
  - Status badges that sync with backend states.

### 2.2 Doctor Hub
- **Profile management**  
  - UI for editing doctor profile, languages, consultation modes.  
  - Clinic location editor with validation.  
  - Credential upload placeholder (stubs for object storage).

- **Onboarding checklist**  
  - Show outstanding tasks (documents, payout info).  
  - Provide contextual tips and support links.

### 2.3 Identity Service
- **Provider lifecycle API**  
  - Add provider review status fields (`pending`, `needs-info`, `approved`, `active`).  
  - Endpoints for admin actions (approve, request-info, add-note).  
  - Endpoint for doctor profile updates with validation.

- **Audit trail & notifications hooks**  
  - Persist reviewer notes and change history.  
  - Emit events (placeholder) for messaging-service integration in later sprints.

## 3. Milestones
1. **Week 1:**  
   - Database schema updates for provider status + notes.  
   - Identity-service endpoints for admin/doctor actions.  
   - Admin console wired to real data (review queue + status transitions).

2. **Week 2:**  
   - Doctor hub profile editor & onboarding checklist.  
   - File upload stub (UI + API placeholder).  
   - Basic analytics (counts, status metrics) in admin dashboard.

3. **Week 3:**  
   - QA: E2E walkthrough from seed doctor → admin approval → activation.  
   - Docs: Update playbook, API reference, acceptance test checklist.

## 4. Risks & Mitigations
- **Schema changes impacting seeds:** Update `seed.ts` to match new fields; provide migration script.  
- **File upload integration delayed:** Start with object storage mock, scope real integration for Sprint 2.  
- **Manual state drift:** Implement optimistic UI + rollback handling; log all transitions server-side.

## 5. Definition of Done
- Admin can approve, reject (request-info), and activate providers with notes saved in MongoDB.  
- Doctor can edit profile and see onboarding checklist updates based on backend status.  
- Identity service validates all provider mutations and exposes audit log endpoints.  
- Updated documentation: API references, admin/doctor user guides, staging smoke test checklist.

