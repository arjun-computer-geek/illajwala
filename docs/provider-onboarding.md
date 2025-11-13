# Provider Onboarding Lifecycle – Sprint 1

This document captures the current provider (doctor + clinic) onboarding workflow after Sprint 1, including API touchpoints, UI flows, and QA scenarios.

## 1. Lifecycle Overview

1. **Provider record created**  
   - Admin creates or imports a doctor via `POST /api/doctors`.  
   - Default status: `pending`, no review notes, onboarding checklist flags set to false.

2. **Admin review & credential checks**  
   - Admins review submissions in the dashboard.  
   - Actions available:  
     - `needs-info`: requests more data with note (stored in Mongo).  
     - `approved`: credentials verified; doctor ready for activation.  
     - `active`: clinic live and discoverable.  
   - API: `POST /api/doctors/:id/review`  
     ```json
     {
       "status": "needs-info",
       "note": "Please upload renewed medical license.",
       "author": "Priya Sharma"
     }
     ```
   - Notes log stored in `reviewNotes[]` with timestamps/author.  
   - `POST /api/doctors/:id/notes` supports additional comments without status change.

3. **Doctor self-service updates**  
   - Doctor signs in, updates profile via `PATCH /api/doctors/me/profile`.  
   - Fields: bio, languages, consultation modes, fee, experience, primary clinic, profile image, optional checklist updates.  
   - Successful update refreshes `lastReviewedAt`.

4. **Activation**  
   - Once checklist flags (`kycComplete`, `payoutSetupComplete`, `telehealthReady`) are true and review status is `approved`, admin marks provider `active`.  
   - `approvedAt` timestamp recorded automatically.

## 2. API Reference

### 2.1 Admin endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/doctors` | `POST` | Create doctor (admin only) |
| `/api/doctors/:id/review` | `POST` | Update review status + optional note |
| `/api/doctors/:id/notes` | `POST` | Append review note |
| `/api/doctors/:id` | `PATCH` | Update doctor fields (admin) |

Request schema excerpts (see `services/identity-service/src/modules/doctors/doctor.schema.ts`):
```ts
status: z.enum(["pending", "needs-info", "approved", "active"])
note?: string
onboardingChecklist?: { kycComplete?: boolean; payoutSetupComplete?: boolean; telehealthReady?: boolean }
```

### 2.2 Doctor endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/doctors/me/profile` | `PATCH` | Update authenticated doctor profile |
| `/api/doctors/:id` | `GET` | Fetch doctor data (used by dashboard/profile) |

## 3. UI Touchpoints

### Admin Console (`apps/admin`)
- **Provider Review Queue**:  
  - Lists doctors from `/api/doctors`.  
  - Shows review status, onboarding checklist, last note.  
  - Actions trigger API calls (`reviewDoctor`, `addReviewNote`).  
  - Refresh button re-fetches data.

- **Status badges** use new fields:
  - `reviewStatus`, `reviewNotes`, `onboardingChecklist`, `lastReviewedAt`.

### Doctor Hub (`apps/doctor`)
- **Dashboard**:  
  - Link to `/profile` for self-service edits.  
  - Displays updated clinic info pulled from session state.

- **Profile Page**:  
  - React Hook Form validated via `profileSchema`.  
  - On submit: `doctorProfileApi.updateProfile`.  
  - Updates local store (`useDoctorAuthStore`) so UI reflects changes immediately.

## 4. QA Checklist

### 4.1 Admin console
- [ ] Login as admin (`ops@illajwala.com` / `admin123`).
- [ ] Confirm review queue loads seeded doctors with correct status.
- [ ] Trigger “Request info” → enter note → verify toast, status change, note recorded.
- [ ] Approve doctor → check badge updates, `lastReviewedAt` updated (via logs/db).
- [ ] Mark active → verify button disabled afterwards.
- [ ] Add note via “Add note” → confirm appended in notes log.
- [ ] Refresh queue → ensure persistence.

### 4.2 Doctor hub
- [ ] Login as seeded doctor (e.g. `aisha.verma@illajwala.com`).
- [ ] Visit `/profile`; update bio, languages, consultation modes, fee, clinic address.  
  - Submit; expect success toast.  
  - Navigate back to `/dashboard`; ensure data updated.
- [ ] Attempt invalid URL in profile image → expect validation error.

### 4.3 API / Data validation
- [ ] `POST /api/doctors/:id/review` rejects unauthenticated or non-admin requests.
- [ ] Review action without note allowed except when prompting for info (prompt ensures entry).
- [ ] `PATCH /api/doctors/me/profile` rejects non-doctor roles.
- [ ] MongoDB documents include updated `reviewNotes`, `onboardingChecklist`, and timestamps.

## 5. Open Items / Next Sprint Leads
- Integrate real evidence/document uploads (object storage) to replace placeholder prompts.
- Hook review events to messaging-service (notifications to doctor/admin).
- Add pagination/filtering to review queue.
- Build analytics cards using new status fields.

---

Document owner: Platform team. Update this doc whenever provider lifecycle logic changes.

