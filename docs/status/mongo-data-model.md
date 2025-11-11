# Mongo Data Model Blueprint

## Overview
- Shared MongoDB Atlas cluster with dedicated databases per domain:
  - `visitnow_identity`
  - `visitnow_provider`
  - `visitnow_patient`
  - `visitnow_scheduling`
  - `visitnow_support`
- Each Node.js service owns write access to its domain database and exposes APIs/SDKs for other apps.
- Mongoose schemas (or Zod validation) enforce structure; MongoDB validators added for critical collections.

## Core Collections

### Identity (`visitnow_identity`)
| Collection | Purpose | Key Fields / Indexes |
| --- | --- | --- |
| `users` | Primary identities for patients, doctors, staff, admin | `_id:ObjectId`, `email`, `phone`, `passwordHash`, `status`, `roles[]`; indexes on `email`, `phone` (unique). |
| `sessions` | Refresh tokens, device metadata | `userId`, `refreshToken`, `expiresAt`, `deviceInfo`; TTL index on `expiresAt`. |
| `roleGrants` | Fine-grained role assignments | `userId`, `roleCode`, `tenantId`, `grantedBy`, `grantedAt`; compound index `(userId, roleCode)`. |

### Provider (`visitnow_provider`)
| Collection | Purpose | Key Fields / Indexes |
| --- | --- | --- |
| `providers` | Doctor profile & public details | `userId`, `displayName`, `specializations[]`, `languages[]`, `about`, `experienceYears`, `rating`, `status`; text index on `displayName`, `specializations`. |
| `clinics` | Clinic/telehealth locations | `providerId`, `name`, `address`, `geo` (GeoJSON point), `telehealth`, `contact`; 2dsphere index on `geo`. |
| `credentials` | Verification documents | `providerId`, `type`, `documentUrl`, `status`, `issuedOn`, `expiresOn`, `notes`; index on `(providerId, status)`. |
| `staffMembers` | Clinic staff accounts | `providerId`, `userId`, `role`, `permissions[]`; index on `(providerId)`. |

### Patient (`visitnow_patient`)
| Collection | Purpose | Key Fields / Indexes |
| --- | --- | --- |
| `patients` | Patient profile | `userId`, `fullName`, `dateOfBirth`, `gender`, `medicalHistory`, `primaryLanguage`; index on `userId`. |
| `dependants` | Linked dependants | `patientId`, `fullName`, `relationship`, `dateOfBirth`, `notes`; index `(patientId)`. |
| `preferences` | Notification & comms prefs | `patientId`, `channels`, `languages`, `consents`; index `(patientId)`. |

### Scheduling (`visitnow_scheduling`)
| Collection | Purpose | Key Fields / Indexes |
| --- | --- | --- |
| `availabilityTemplates` | Recurring schedules | `providerId`, `clinicId`, `slotDuration`, `bufferMinutes`, `slots[] (weekday, start, end, mode)`; index `(providerId)`. |
| `slots` | Materialized future slots (optional) | `providerId`, `clinicId`, `start`, `end`, `mode`, `status`; indexes on `(providerId, start)` and 2dsphere on location if needed. |
| `appointments` | Appointment lifecycle | `patientId`, `providerId`, `clinicId`, `serviceId`, `scheduledStart`, `scheduledEnd`, `status`, `channel`, `reason`, `notes`, `timeline[]`; indexes on `(providerId, scheduledStart)`, `(patientId, scheduledStart)`. |
| `waitlist` | Waitlist entries | `patientId`, `providerId`, `desiredRange`, `status`; index `(providerId, status)`. |

### Support & Messaging (`visitnow_support`)
| Collection | Purpose | Key Fields / Indexes |
| --- | --- | --- |
| `conversations` | Patient ↔ doctor/staff chat threads | `providerId`, `patientId`, `subject`, `unreadCountProvider`, `unreadCountPatient`, `messages[]`; index on `(providerId, updatedAt)` and `(patientId, updatedAt)`. |
| `notifications` | Delivery logs | `userId`, `templateKey`, `channel`, `status`, `meta`; index on `(userId, createdAt)`; TTL for temporary logs as needed. |
| `tickets` | Support ticketing | `ticketNumber`, `category`, `priority`, `status`, `participantIds`, `appointmentId`, `events[]`; index on `(status, priority)` and text on `ticketNumber`. |

## Cross-Cutting Concerns
- **Schemas & Validation:** Define Mongoose schemas per service; enforce MongoDB JSON Schema validators for critical collections.
- **Auditing:** Append-only `auditLogs` per database with `{actorId, action, entityType, entityId, payload, createdAt}`.
- **Data Access Pattern:** Services expose APIs/SDKs; other apps avoid direct collection access.
- **Backups & Retention:** Configure automated backups via Atlas, point-in-time recovery, and retention policies per compliance requirements.

## Migration Path
1. Map existing collection structures (documented in `docs/status/current-schemas.md`) to new canonical schema.
2. Introduce shared Mongo cluster in staging; update service env configs to use new connection URI.
3. Gradually refactor services to read/write via shared cluster while maintaining backward compatibility.
4. Backfill historical data and decommission standalone databases once parity verified.

## Next Steps
- Finalize collection-level JSON schemas and indexes.
- Update service repositories with shared Mongoose models or published TypeScript interfaces.
- Implement automated lint/test to validate schema consistency (e.g., schema snapshot tests).
- Document backup/restore and index management runbooks.

