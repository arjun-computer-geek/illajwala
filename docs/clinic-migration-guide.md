# Clinic Migration Guide

This guide covers the migration process for introducing clinic entities and backfilling clinic references across the illajwala platform.

## Overview

Sprint 5 introduces a first-class `Clinic` entity to support multi-clinic operations. This migration ensures all existing data (doctors, patients, appointments) is properly associated with clinic records.

## Prerequisites

- MongoDB database access
- Node.js and pnpm installed
- Environment variables configured (see `services/identity-service/env.sample`)

## Migration Steps

### 1. Backup Database

**⚠️ Always backup your database before running migrations.**

```bash
# MongoDB backup example
mongodump --uri="mongodb://localhost:27017/illajwala" --out=./backup-$(date +%Y%m%d)
```

### 2. Run Migration Script

The migration script will:
- Create default clinics for each tenant
- Assign doctors to clinics based on their `clinicLocations`
- Assign patients to default clinics
- Assign appointments to clinics based on their doctor's primary clinic

```bash
cd services/identity-service
pnpm migrate:clinics
```

### 3. Verify Migration

After migration completes, verify the results:

```javascript
// MongoDB shell queries
// Check clinics created
db.clinics.countDocuments()

// Check doctors with clinic assignments
db.doctors.countDocuments({ primaryClinicId: { $exists: true, $ne: null } })

// Check patients with clinic assignments
db.patients.countDocuments({ primaryClinicId: { $exists: true, $ne: null } })

// Check appointments with clinic assignments
db.appointments.countDocuments({ clinic: { $exists: true, $ne: null } })
```

### 4. Review Migration Logs

The migration script outputs detailed logs:
- Clinics created
- Doctors updated
- Patients updated
- Appointments updated
- Any errors encountered

Review the console output for any warnings or errors.

## Migration Behavior

### Clinic Creation

- **Default Clinic**: A "Main Clinic" is created for each tenant if no clinics exist
- **Location-Based Clinics**: If a doctor has `clinicLocations`, the script attempts to:
  1. Match existing clinics by name or city
  2. Create a new clinic from the location data if no match is found

### Doctor Assignment

- Doctors are assigned to clinics based on their `clinicLocations`
- If a doctor has no locations, they're assigned to the default clinic
- `primaryClinicId` and `clinicIds` are both set

### Patient Assignment

- All patients are initially assigned to the default clinic
- This can be updated later through the admin UI or API

### Appointment Assignment

- Appointments inherit the clinic from their associated doctor's `primaryClinicId`
- If a doctor has no primary clinic, the appointment remains unassigned (warning logged)

## Rollback

If you need to rollback the migration:

```javascript
// MongoDB shell - Remove clinic references (use with caution)
db.doctors.updateMany({}, { $unset: { primaryClinicId: "", clinicIds: "" } })
db.patients.updateMany({}, { $unset: { primaryClinicId: "" } })
db.appointments.updateMany({}, { $unset: { clinic: "" } })
db.clinics.deleteMany({})
```

**⚠️ Only rollback if absolutely necessary and after consulting with the team.**

## Post-Migration Tasks

1. **Review Clinic Data**: Use the admin UI to review and update clinic information
2. **Update Waitlist Policies**: Configure clinic-specific waitlist policies if needed
3. **Verify API Responses**: Ensure clinic data appears correctly in API responses
4. **Update Documentation**: Update any runbooks or documentation with clinic-aware workflows

## Troubleshooting

### Migration Fails Partway Through

The migration script is idempotent - you can safely re-run it. It only updates records that don't already have clinic references.

### Missing Clinic References

If some records remain without clinic references:
1. Check the migration logs for errors
2. Manually assign clinics through the admin UI
3. Re-run the migration script (it will skip already-assigned records)

### Performance Issues

For large datasets:
- The migration processes records in batches
- Consider running during off-peak hours
- Monitor database performance during migration

## Seed Data

For development/testing, use the seed script which now includes clinic creation:

```bash
pnpm seed
```

The seed script creates:
- Clinics from doctor locations
- Doctors with clinic assignments
- Patients with clinic assignments
- Appointments with clinic references

## Support

For issues or questions:
1. Check migration logs for specific errors
2. Review this guide
3. Consult the team lead or platform architect

