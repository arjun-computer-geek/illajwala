# Sprint 2 Plan – Booking & Payments (Weeks 7-10)

## 1. Objectives
- Deliver core booking flow (search → slot selection → confirmation) across patient web + backend.
- Integrate Razorpay sandbox for payment intent creation and webhook ingestion.
- Provide admin visibility into bookings and payouts.

## 2. Workstreams & Epics

### 2.1 Patient Web (apps/patient)
- **Booking flow UI**  
  - Doctor detail page → slot picker (real availability).  
  - Appointment summary + checkout page.  
  - Booking confirmation + status page.
- **My appointments**  
  - Transition from mocked list to live data (GET `/appointments`).  
  - Actions: cancel (pre cutoff), reschedule placeholder.

### 2.2 Identity / Appointment Service (services/identity-service)
- **Appointment creation API**  
  - `POST /appointments` with validation, slot locking (Redis).  
  - Support patient context (from JWT) + optional dependents.  
  - Status transitions: `pending-payment`, `confirmed`, `cancelled`.
- **Availability service**  
  - Generate slots per doctor (working hours) with cache/lock.  
  - Endpoint for patient front-end to fetch next 14 days.

### 2.3 Payment Integration
- **Payment intent**  
  - `POST /payments/intent` hitting Razorpay sandbox.  
  - Attach to appointment, store payment ID & status.
- **Webhook handling**  
  - Endpoint to receive Razorpay events (`payment.captured`, `payment.failed`).  
  - Update appointment status, log audit entries.
- **Admin payouts dashboard (summary)**  
  - Basic metrics (pending payments, captured, refunds).  
  - Link to detail page for future work.

### 2.4 Admin Console
- **Bookings table**  
  - List appointments with filters (status, doctor, date).  
  - Ability to manually mark payment status (fallback).  
  - Show payment metadata (Razorpay ID, amount).

## 3. Milestones
1. **Week 1**  
   - Appointment schema + APIs (slot locking).  
   - Patient booking UI wired to API (no payment yet).  
   - Admin bookings list (read-only).

2. **Week 2**  
   - Integrate Razorpay intent creation + frontend checkout flow.  
   - Implement webhook handler updating appointment/payment status.  
   - My appointments page using live data.

3. **Week 3**  
   - QA end-to-end booking & payment.  
   - Error handling (payment failure, cancellation).  
   - Documentation + staging smoke checklist.

## 4. Risks & Mitigations
- **Race conditions on slot booking**: Use Redis locks and check seat availability before confirming.  
- **Payment webhook reliability**: Implement idempotent handlers + signature verification.  
- **Razorpay sandbox quirks**: Provide manual fallback in admin UI for edge cases.

## 5. Definition of Done
- Patient can complete booking with payment in sandbox and see it in “My appointments”.  
- Appointment status reflects payment outcome; admins can review bookings.  
- Razorpay webhook events processed idempotently; audit trail recorded.  
- Documentation updated (`docs/booking-payments.md`) with API details, QA steps, and support runbook.

