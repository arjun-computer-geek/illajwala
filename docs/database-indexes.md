# Database Indexes Documentation

This document outlines all MongoDB indexes defined in the Illajwala VisitNow platform for optimal query performance.

## Overview

Indexes are critical for query performance, especially in a multi-tenant environment where queries are frequently filtered by `tenantId`. All indexes are defined in the Mongoose schema files within `services/identity-service/src/modules/`.

## Index Strategy

1. **Multi-tenant isolation**: All indexes include `tenantId` as the first field for efficient tenant-scoped queries
2. **Compound indexes**: Used for common query patterns (e.g., filtering by status and sorting by date)
3. **Unique constraints**: Applied where business logic requires uniqueness (e.g., email per tenant)
4. **TTL indexes**: Used for automatic document expiration (e.g., waitlist entries)

## Collections and Indexes

### Appointments (`AppointmentModel`)

**Location**: `services/identity-service/src/modules/appointments/appointment.model.ts`

| Index                                 | Fields                                      | Purpose                             |
| ------------------------------------- | ------------------------------------------- | ----------------------------------- |
| `tenantId_1_doctor_1_scheduledAt_1`   | `tenantId`, `doctor`, `scheduledAt`         | Doctor's appointment list queries   |
| `tenantId_1_patient_1_scheduledAt_-1` | `tenantId`, `patient`, `scheduledAt` (desc) | Patient's appointment history       |
| `tenantId_1_status_1_scheduledAt_-1`  | `tenantId`, `status`, `scheduledAt` (desc)  | Status-filtered appointment queries |
| `tenantId_1_clinic_1_scheduledAt_1`   | `tenantId`, `clinic`, `scheduledAt`         | Clinic-level appointment queries    |

**Query Patterns Optimized**:

- List appointments for a doctor (sorted by time)
- Patient appointment history
- Filter appointments by status
- Clinic appointment reports

### Patients (`PatientModel`)

**Location**: `services/identity-service/src/modules/patients/patient.model.ts`

| Index                         | Fields              | Purpose                 |
| ----------------------------- | ------------------- | ----------------------- |
| `tenantId_1_email_1` (unique) | `tenantId`, `email` | Unique email per tenant |
| `tenantId_1_phone_1` (unique) | `tenantId`, `phone` | Unique phone per tenant |

**Query Patterns Optimized**:

- Patient lookup by email (with tenant isolation)
- Patient lookup by phone (with tenant isolation)
- Duplicate prevention

### Doctors (`DoctorModel`)

**Location**: `services/identity-service/src/modules/doctors/doctor.model.ts`

| Index                           | Fields                                 | Purpose                       |
| ------------------------------- | -------------------------------------- | ----------------------------- |
| `tenantId_1`                    | `tenantId`                             | General tenant-scoped queries |
| `tenantId_1_specialization_1`   | `tenantId`, `specialization`           | Filter by specialty           |
| `name_text_specialization_text` | `name` (text), `specialization` (text) | Full-text search              |
| `tenantId_1_reviewStatus_1`     | `tenantId`, `reviewStatus`             | Provider review queue         |
| `tenantId_1_primaryClinicId_1`  | `tenantId`, `primaryClinicId`          | Clinic-doctor relationships   |
| `tenantId_1_email_1` (unique)   | `tenantId`, `email`                    | Unique email per tenant       |
| `tenantId_1_phone_1` (unique)   | `tenantId`, `phone`                    | Unique phone per tenant       |

**Query Patterns Optimized**:

- Doctor search by name/specialty
- Filter doctors by specialization
- Provider review queue (pending/approved)
- Clinic-doctor associations

### Clinics (`ClinicModel`)

**Location**: `services/identity-service/src/modules/clinics/clinic.model.ts`

| Index                        | Fields             | Purpose                |
| ---------------------------- | ------------------ | ---------------------- |
| `tenantId_1_slug_1` (unique) | `tenantId`, `slug` | Unique slug per tenant |
| `tenantId_1_name_1`          | `tenantId`, `name` | Clinic name lookups    |
| `tenantId_1_city_1`          | `tenantId`, `city` | City-based filtering   |

**Query Patterns Optimized**:

- Clinic lookup by slug
- Search clinics by name
- Filter clinics by city

### Waitlist Entries (`WaitlistModel`)

**Location**: `services/identity-service/src/modules/waitlists/waitlist.model.ts`

| Index                     | Fields                                                         | Purpose                    |
| ------------------------- | -------------------------------------------------------------- | -------------------------- |
| `tenantId`                | `tenantId`                                                     | Tenant-scoped queries      |
| `patientId`               | `patientId`                                                    | Patient waitlist lookups   |
| `status`                  | `status`                                                       | Status filtering           |
| `priorityScore`           | `priorityScore`                                                | Priority-based sorting     |
| `expiresAt`               | `expiresAt`                                                    | TTL for auto-expiration    |
| `waitlist_queue_lookup`   | `tenantId`, `clinicId`, `status`, `priorityScore`, `createdAt` | Queue ordering queries     |
| `waitlist_patient_status` | `tenantId`, `patientId`, `status`                              | Patient's waitlist entries |
| `waitlist_expiry_ttl`     | `expiresAt` (TTL)                                              | Automatic expiry cleanup   |

**Query Patterns Optimized**:

- Waitlist queue ordering (by priority, status, creation time)
- Patient's active waitlist entries
- Auto-expiration of expired entries
- Doctor's waitlist console queries

### Waitlist Policies (`WaitlistPolicyModel`)

**Location**: `services/identity-service/src/modules/waitlists/waitlist.model.ts`

| Index                             | Fields                 | Purpose                      |
| --------------------------------- | ---------------------- | ---------------------------- |
| `waitlist_policy_unique` (unique) | `tenantId`, `clinicId` | One policy per clinic/tenant |

**Query Patterns Optimized**:

- Policy lookup by clinic
- Policy uniqueness enforcement

### Notification Audit (`NotificationAuditModel`)

**Location**: `services/identity-service/src/modules/notifications/notification.model.ts`

| Index                     | Fields                         | Purpose              |
| ------------------------- | ------------------------------ | -------------------- |
| `tenantId_1_createdAt_-1` | `tenantId`, `createdAt` (desc) | Recent notifications |

**Query Patterns Optimized**:

- Recent notification history
- Audit trail queries

## Performance Considerations

### Index Maintenance

- **Index creation**: Indexes are created automatically when models are first loaded
- **Index monitoring**: Use MongoDB's `explain()` to verify index usage
- **Index size**: Monitor index sizes; compound indexes can be large

### Query Optimization Tips

1. **Always include `tenantId`** in queries for multi-tenant isolation
2. **Use compound indexes** for queries that filter and sort
3. **Avoid full collection scans** by ensuring indexes match query patterns
4. **Monitor slow queries** using MongoDB's profiler

### Missing Indexes

If you notice slow queries, check:

1. Are all query fields covered by an index?
2. Is the index order matching the query pattern?
3. Are there any full collection scans in the query plan?

## Adding New Indexes

When adding a new index:

1. **Define in schema**: Add index definition in the Mongoose schema file
2. **Document here**: Update this document with the new index
3. **Test performance**: Verify the index improves query performance
4. **Monitor in production**: Watch for index usage and size

Example:

```typescript
// In model file
Schema.index({ tenantId: 1, newField: 1 }, { name: 'index_name' });
```

## Index Naming Convention

- Use descriptive names: `waitlist_queue_lookup`
- Include key fields: `tenantId_1_status_1_createdAt_-1`
- For unique indexes: `waitlist_policy_unique`

## TTL Indexes

TTL (Time-To-Live) indexes automatically delete documents after a specified time:

- **Waitlist expiry**: `expiresAt` field with TTL index removes expired entries automatically
- **Partial filter**: Only applies to documents with `expiresAt` set

## Future Optimizations

Consider adding indexes for:

- Appointment search by reason/notes (if full-text search needed)
- Analytics queries (date range + aggregation)
- Real-time query patterns (frequently accessed data)
