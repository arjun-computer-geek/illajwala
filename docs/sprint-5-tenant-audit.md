# Tenant Context Audit – Sprint 5

Date: 2025-11-13  
Owner: GPT-5 Codex

## Goal
Inventory existing identity-service & frontend code paths to understand how tenant context (`tenantId`, `clinicId`) is (or is not) persisted prior to Sprint 5 multi-clinic work.

## Findings

- **JWT & Auth Middleware**
  - `services/identity-service/src/utils/jwt.ts` signs tokens with `{ sub, role }` only.
  - `services/identity-service/src/middlewares/auth.ts` hydrates `req.user` with `id` and `role`; tenant/scoped identifiers are absent.
  - No server-side usage of the `X-Tenant-Id` header; requests ignore tenant context even though the frontend sets it.

- **Models Without Tenant Affinity**
  - Core collections (`Patient`, `Doctor`, `Appointment`, `NotificationAudit`) lack a tenant/clinic field.
    ```56:68:services/identity-service/src/modules/patients/patient.model.ts
    notificationPreferences: {
      emailReminders: { type: Boolean, default: defaultNotificationPreferences.emailReminders },
      smsReminders: { type: Boolean, default: defaultNotificationPreferences.smsReminders },
      whatsappReminders: { type: Boolean, default: defaultNotificationPreferences.whatsappReminders },
    },
    ```
    ```80:159:services/identity-service/src/modules/appointments/appointment.model.ts
    const AppointmentSchema = new Schema<AppointmentDocument>(
      {
        patient: { type: Schema.Types.ObjectId, ref: "Patient", required: true },
        doctor: { type: Schema.Types.ObjectId, ref: "Doctor", required: true },
        scheduledAt: { type: Date, required: true },
        ...
      },
    ```
    ```21:48:services/identity-service/src/modules/notifications/notification.model.ts
    const NotificationAuditSchema = new Schema<NotificationAuditDocument>(
      {
        channel: {
          type: String,
          enum: ["email", "sms", "whatsapp"],
          required: true,
        },
    ```
  - Doctors currently embed `clinicLocations` inside the doctor document (`services/identity-service/src/modules/doctors/doctor.model.ts`). There is no standalone `Clinic` entity, making clinic-based tenancy hard.

- **Services & Queries**
  - Service methods (e.g., `listAppointments`, `DoctorModel.findById`, patient lookups) do not filter by tenant ID, so data is globally accessible once authenticated.
  - Slot locking (`slot-lock.service.ts`) namespaces locks only by doctorId + datetime, not clinic/tenant.

- **Frontend State**
  - `apps/doctor/src/lib/api-client.ts` and `apps/patient/src/lib/api-client.ts` set `X-Tenant-Id` headers, but since backend ignores them, multi-tenant separation is ineffective.
  - UX text references waitlists and multi-clinic support but no real functionality or gating exists yet.

- **Messaging Service**
  - Resend worker (`services/messaging-service/src/modules/workers/notification-resend.worker.ts`) and queue manager handle notifications without tenant metadata, meaning operational tooling cannot yet scope by clinic.

## Gaps to Address in Sprint 5

1. **Schema Updates**
   - Add `tenantId` (and `clinicId` where appropriate) to patient, doctor, appointment, notification, and derived collections.
   - Create a dedicated `Clinic` collection with slug/tenant metadata and reference it from doctors & appointments.

2. **Auth Propagation**
   - Inject `tenantId` into JWT payloads and `AuthenticatedRequest`.
   - Parse `X-Tenant-Id` headers (or derive from user context) and enforce on all queries/mutations.

3. **Service Enforcement**
   - Update repository queries to include tenant filters.
   - Extend slot locking, event publishing, and analytics aggregation to remain tenant-scoped.

4. **Migration Strategy**
   - Provide scripts/backfill for existing seed data.
   - Design feature-flagged rollout to avoid downtime (dual-read or default tenant fallback during migration).

5. **Messaging & Analytics**
   - Include tenant metadata when publishing events/notifications to support waitlist-specific automation in Sprint 5.

## Next Steps

1. Draft schema migration plan (fields, indexes, backfill order) and review with stakeholders.
2. Update authentication utilities to carry tenant context end-to-end (tokens, middleware, API clients).
3. Implement clinic/tenant enforcement in high-traffic paths (appointments CRUD, notifications) and add regression tests.
4. Coordinate with messaging-service for tenant-aware routing once backend schema lands.


