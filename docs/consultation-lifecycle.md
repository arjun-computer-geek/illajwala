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
  - `notes`, `followUpActions[]`, `followUps[]`, `vitals[]`, `attachments[]`, `prescriptions[]`, `referrals[]`
  - `lastEditedBy` for audit trails
- Shared types (`packages/types/src/appointments.ts`) mirror the new schema so all apps receive the extended metadata.

### 2.1 Vitals Capture

- Doctors can capture vital signs during consultations (blood pressure, heart rate, temperature, oxygen saturation, etc.)
- Common vitals are pre-configured with units and placeholders for quick entry
- Custom vitals can be added for specific measurements
- Vitals are stored in `consultation.vitals[]` array

### 2.2 Prescription Management

- Doctors can prescribe medications with:
  - Medication name (required)
  - Dosage (required)
  - Frequency (required)
  - Duration (optional)
  - Instructions (optional)
  - Refills (optional)
- Prescriptions are stored in `consultation.prescriptions[]` array
- Prescriptions are included in patient visit summaries

### 2.3 Referral Management

- Doctors can refer patients to:
  - Specialists (with specialty field)
  - Labs
  - Imaging centers
  - Therapy services
  - Other providers
- Referrals include:
  - Type (required)
  - Reason (required)
  - Provider name (optional)
  - Specialty (for specialist referrals)
  - Priority (routine, urgent, emergency)
  - Notes (optional)
- Referrals are stored in `consultation.referrals[]` array

### 2.4 Follow-up Actions

- Doctors can add structured follow-up actions with:
  - Action description (required)
  - Scheduled date/time (optional)
  - Priority (low, medium, high)
  - Completion status
- Follow-ups are stored in `consultation.followUps[]` array
- Legacy text-based follow-ups are still supported in `consultation.followUpActions[]`

## 3. Frontend Touchpoints

### Patient Web (`apps/patient`)

- Appointments list shows visit summaries and follow-up instructions when available.
- Patients receive email notifications for status changes even when logged out.
- Future work: enable telehealth join links and downloadable attachments.

### Doctor Hub (`apps/doctor`)

- New consultation queue (`ConsultationQueue`) surfaces daily visits with live status badges.
- Doctors can check-in patients, start sessions, capture notes/follow-ups, complete visits, or mark no-shows via inline dialogs.
- Consultation workspace includes:
  - **Session timer** - Tracks consultation duration
  - **Notes section** - Visit summary and follow-up actions
  - **Vitals section** - Capture vital signs with common vitals quick-add
  - **Attachments section** - Upload and manage consultation files
  - **Prescriptions section** - Manage medication prescriptions
  - **Referrals section** - Create referrals to specialists, labs, imaging, or therapy
- Availability planner remains for slot editing while queue handles real-time visit view.

### Admin Console (`apps/admin`)

- Bookings table includes new statuses and manual override actions.
- Admins can mark checked-in, in-session, no-show to keep ops synchronized.

## 4. Messaging Service

- Located at `services/messaging-service/`.
- Uses NATS event bus for subscribing to consultation, waitlist, and payment events.
- `consultation.worker.ts` subscribes to consultation events and invokes the email dispatcher (`nodemailer`), falling back to console logs when SMTP is absent.
- `waitlist.worker.ts` subscribes to waitlist events and sends notifications.
- `payment.worker.ts` subscribes to payment events (notification logic to be implemented).
- `ConsultationEvent`, `WaitlistEvent`, and `PaymentEvent` types (shared in `packages/types/src/events.ts`) cover status transitions, participants, and visit metadata.
- Events are published via NATS from identity-service and payment-service, and consumed by messaging-service and analytics-service.

## 5. Next Steps / TODO

- Wire real-time updates (websocket/SSE) so doctor and patient apps reflect consultations instantly.
- Extend messaging worker with SMS/WhatsApp providers and expose resend endpoints for ops.
- Build dedicated visit workspace (timer, vitals capture, prescription uploads) atop the new APIs.
- Create automated + manual QA plans covering booking → completion → notification flow.

Document owner: Platform team. Update as consultation logic or messaging capabilities evolve.
