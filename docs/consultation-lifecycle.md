# Consultation Lifecycle – Sprint 3

This document captures how consultations progress across the Illajwala platform after Sprint 3. It focuses on the data model updates, doctor/patient experience, and the new messaging-service scaffold that will power notifications in later increments.

## 1. End-to-End Flow

1. **Booking confirmed**  
   - Appointment enters `confirmed` or `pending-payment` (same as Sprint 2).  
   - Patient dashboard shows the booking with payment status and upcoming steps.

2. **Patient checks in**  
   - Doctor/admin marks the appointment `checked-in` (manually for now).  
   - Consultation metadata records the first `startedAt` timestamp.

3. **Consultation in session**  
   - Doctor moves status to `in-session` and begins capturing notes, vitals, attachments.  
   - `consultation.startedAt` defaults to the first active status if missing.

4. **Completion / No-show**  
   - Doctor completes the visit (`completed`) or flags a `no-show`.  
   - `consultation.endedAt` is auto-filled when closing the visit.  
   - Follow-up actions and visit notes are saved for patient visibility.

5. **Notifications**  
   - Identity service emits events to `services/messaging-service`.  
   - Messaging worker dispatches patient emails (SMTP configurable, console fallback) for each lifecycle status.  
   - Follow-up actions from visit summaries are included in the notification body.

## 2. Data Model Updates

- `AppointmentStatus` now includes: `checked-in`, `in-session`, `no-show`.  
- `appointment.consultation` sub-document stores:  
  - `startedAt`, `endedAt` (timestamps)  
  - `notes`, `followUpActions[]`, `vitals[]`, `attachments[]`  
  - `lastEditedBy` for audit trails
- Shared types (`packages/types/src/appointments.ts`) mirror the new schema so all apps receive the extended metadata.

## 3. Frontend Touchpoints

### Patient Web (`apps/patient`)
- Appointments list shows visit summaries and follow-up instructions when available.  
- Patients receive email notifications for status changes even when logged out.  
- Future work: enable telehealth join links and downloadable attachments.

### Doctor Hub (`apps/doctor`)
- New consultation queue (`ConsultationQueue`) surfaces daily visits with live status badges.  
- Doctors can check-in patients, start sessions, capture notes/follow-ups, complete visits, or mark no-shows via inline dialogs.  
- Availability planner remains for slot editing while queue handles real-time visit view.

### Admin Console (`apps/admin`)
- Bookings table includes new statuses and manual override actions.  
- Admins can mark checked-in, in-session, no-show to keep ops synchronized.

## 4. Messaging Service

- Located at `services/messaging-service/`.  
- Uses BullMQ + Redis queue `consultation-events`.  
- `consultation.worker.ts` invokes the email dispatcher (`nodemailer`), falling back to console logs when SMTP is absent.  
- `ConsultationEvent` types (shared in `packages/types/src/events.ts`) cover status transitions, participants, and visit metadata.

## 5. Next Steps / TODO

- Wire real-time updates (websocket/SSE) so doctor and patient apps reflect consultations instantly.  
- Extend messaging worker with SMS/WhatsApp providers and expose resend endpoints for ops.  
- Build dedicated visit workspace (timer, vitals capture, prescription uploads) atop the new APIs.  
- Create automated + manual QA plans covering booking → completion → notification flow.

Document owner: Platform team. Update as consultation logic or messaging capabilities evolve.


