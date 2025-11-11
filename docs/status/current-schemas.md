# Current Data Model Inventory (Legacy State)

_Last updated: 2025-11-11_

## Overview
- **illajwala-patient/server** and **illajwala-doctor/server** each use their own MongoDB database (Mongoose models) with overlapping entities such as `Patient`, `Doctor`, and `Appointment`.
- No dedicated backend exists yet for `illajwala-admin`.
- Schemas diverge between patient and doctor services (e.g., appointment status enums, doctor details, authentication fields).
- Goal: consolidate these models into the shared MongoDB cluster described in `docs/status/mongo-data-model.md` while preserving necessary document structures.

## illajwala-patient/server Models
| Collection | Key Fields | Notes |
| --- | --- | --- |
| `Patient` | `name`, `email`, `phone`, `passwordHash`, `dateOfBirth`, `gender`, `medicalHistory[]`, `dependents[]` | `dependents` embedded sub-document; unique indexes on `email`, `phone`. |
| `Doctor` | `name`, `email`, `phone`, `specialization`, `about`, `languages[]`, `consultationModes[]`, `fee`, `clinicLocations[]`, `experienceYears`, `rating`, `totalReviews` | `clinicLocations` embedded (name, address, city, lat/long). Text index on `name`, `specialization`. |
| `Appointment` | `patient`, `doctor`, `scheduledAt`, `mode`, `reasonForVisit`, `status (pending/confirmed/completed/cancelled)`, `notes` | Indexes on `(doctor, scheduledAt)` and `(patient, scheduledAt)`. |

## illajwala-doctor/server Models
| Collection | Key Fields | Notes |
| --- | --- | --- |
| `Doctor` | `name`, `email`, `phone`, `specialization`, `passwordHash`, `role (doctor/staff/admin)` | Authentication-focused; differs from patient-facing doctor profile. |
| `Patient` | `name`, `email`, `phone`, `age`, `gender`, `chronicConditions[]`, `riskLevel`, `lastVisit`, `carePlans[]` | `carePlans` embedded (title, summary, updatedAt); text index on `name/email/phone`. |
| `Appointment` | `doctor`, `patient`, `scheduledAt`, `mode`, `status (pending/confirmed/completed/cancelled/no-show)`, `reasonForVisit`, `notes` | Adds `no-show` status. |
| `Availability` | `doctor`, `slotDuration`, `bufferMinutes`, flags (`isTelehealthEnabled`, etc.), `slots[]` with (`day`, `start`, `end`, `mode`) | Ensures unique doc per doctor. |
| `Conversation` | `doctor`, `patient`, `subject`, `unreadCount`, `messages[]` (`sender`, `body`, `sentAt`, `attachments`, `readAt`) | Supports internal/patient chat; indexes on `(doctor, updatedAt)` and `(patient, updatedAt)`. |

> Additional validation schemas exist (`*.schema.ts`) that define request payloads but mirror the models above.

## Gaps & Considerations
- **Duplicate representations:** `Doctor` and `Patient` entities exist in both services with different attributes. Need canonical profile + authentication separation in shared cluster.
- **Embedded documents:** `dependents`, `clinicLocations`, and `slots` use nested arrays. Decide which remain embedded vs separate collections when migrating.
- **Status enums:** Align appointment status values across apps (`no-show`, `rescheduled`, etc.).
- **Availability & scheduling:** Currently clinic-managed only in doctor service. Patient service reads `Doctor` data directly; future design should rely on shared availability collections.
- **Admin requirements:** No data models yet for credentialing, compliance, or support; plan for these in provider/support databases.

## Next Steps
1. Finalize canonical collection schemas and validation rules (see `docs/status/mongo-data-model.md`).
2. Plan migration scripts to backfill existing patient/doctor data into shared databases.
3. Implement shared service layer to mediate access and enforce RBAC.
4. Decommission legacy databases once parity and cutover verification complete.

