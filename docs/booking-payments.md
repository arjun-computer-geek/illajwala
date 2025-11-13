# Booking & Payments Runbook – Sprint 2

This document captures the end-to-end booking and payment flow as delivered in Sprint 2, along with API references, UI touchpoints, QA scenarios, and follow-ups for future work.

## 1. Flow Overview

1. **Patient selects a slot** in the doctor profile page (`apps/patient`) using real-time availability.
2. **Appointment creation** (`POST /appointments`) validates slot availability, locks the slot in Redis, and persists the appointment in MongoDB.
3. **Payment intent** is generated for paid consultations via Razorpay (order amount = doctor fee × 100).
4. **Checkout** happens in the patient web app using Razorpay Checkout; payment confirmation is posted back to the identity-service.
5. **Webhook handler** listens for Razorpay events and reconciles appointment status if needed.
6. **Admin console** displays bookings, payment metadata, and allows manual overrides.

## 2. Backend APIs

### 2.1 Appointment APIs (`services/identity-service`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/appointments` | `POST` | Create appointment, return Razorpay order when payment required. |
| `/appointments` | `GET` | List appointments (filters: doctor, patient, status). |
| `/appointments/:id/status` | `PATCH` | Admin/doctor updates status (`pending-payment`, `confirmed`, `completed`, `cancelled`). |
| `/appointments/:id/confirm-payment` | `POST` | Patient posts Razorpay payment signature for verification. |
| `/appointments/:id/payment` | `PATCH` | Admin overrides payment status (`pending`, `authorized`, `captured`, `failed`). |

**Slot locking:** `slot-lock.service.ts` uses Redis to guarantee single booking per time slot.

### 2.2 Payment APIs

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/payments/intent` | `POST` | Generates Razorpay order via `razorpay.client.ts`. |
| `/payments/webhook` | `POST` | Consumes Razorpay webhooks, updates payment + appointment states. |

Webhook verification uses Razorpay signature headers; handlers are idempotent through order/ payment IDs.

## 3. Frontend Touchpoints

### Patient Web (`apps/patient`)
- **Doctor profile (`DoctorBookingForm`)**: loads availability, collects slot + mode, initiates booking.
- **Razorpay integration**: lazy-loads checkout script, confirms payment, and handles failure states.
- **My Appointments (`AppointmentsList`)**: shows live status, payment metadata, and pending actions.

### Admin Console (`apps/admin`)
- **Bookings table**: fetches `/appointments`, displays payment status, allows manual overrides.
- **Provider dashboards**: surface basic metrics for captured vs pending payments.

## 4. QA Checklist

- [ ] Booking succeeds for paid and free consultations; slot is locked and released correctly.
- [ ] Razorpay checkout completes, signature verification sets appointment status to `confirmed`.
- [ ] Failed or dismissed payment keeps appointment `pending-payment` with retry banner.
- [ ] Webhook retry is idempotent; duplicate events do not corrupt payment history.
- [ ] Admin override (`PATCH /appointments/:id/payment`) updates history trail and status badges.
- [ ] Patient list reflects live status after payment or manual override (React Query revalidation).

## 5. Metrics & Logging

- **Mongo indices** on `doctor/scheduledAt` & `status` for dashboard queries.
- **Payment history** stored under `appointment.payment.history` to audit all gateway events.
- **Console + server logs** track Razorpay failures and webhook signature errors.

## 6. Follow-ups (queued for Sprint 3+)

- Support reschedule/cancel flows with pro-rated refunds.
- Expose payment receipt download from patient portal.
- Add reporting endpoints for payout reconciliation and ledger export.
- Integrate messaging service for booking/payout notifications automatically.

Document owner: Platform team. Update this runbook whenever booking or payment logic changes.


