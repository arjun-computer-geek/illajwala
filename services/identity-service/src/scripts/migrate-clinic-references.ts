import { connectDatabase, disconnectDatabase } from "../config/database";
import { ClinicModel } from "../modules/clinics/clinic.model";
import { DoctorModel } from "../modules/doctors/doctor.model";
import { PatientModel } from "../modules/patients/patient.model";
import { AppointmentModel } from "../modules/appointments/appointment.model";
import { Types } from "mongoose";

/**
 * Migration script to backfill clinic references for existing data.
 *
 * This script:
 * 1. Creates a default clinic for each tenant if none exists
 * 2. Assigns doctors to clinics based on their clinicLocations
 * 3. Assigns patients to clinics (default clinic for now)
 * 4. Assigns appointments to clinics based on doctor's primary clinic
 *
 * Usage:
 *   pnpm --filter @illajwala/identity-service migrate:clinics
 *
 * Safety:
 *   - Only updates records that don't already have clinic references
 *   - Creates default clinics with safe defaults
 *   - Logs all changes for audit
 */

interface MigrationStats {
  clinicsCreated: number;
  doctorsUpdated: number;
  patientsUpdated: number;
  appointmentsUpdated: number;
  errors: Array<{ type: string; id: string; error: string }>;
}

const createDefaultClinic = async (tenantId: string): Promise<Types.ObjectId | null> => {
  const existing = await ClinicModel.findOne({ tenantId });
  if (existing) {
    console.info(`  ✓ Default clinic already exists for tenant ${tenantId}: ${existing.name}`);
    return existing._id as Types.ObjectId;
  }

  const defaultClinic = await ClinicModel.create({
    tenantId,
    name: "Main Clinic",
    slug: `main-clinic-${tenantId.toLowerCase().replace(/[^a-z0-9]/g, "-")}`,
    timezone: "Asia/Kolkata",
    address: null,
    city: null,
    phone: null,
    email: null,
    capacity: {},
    waitlistOverrides: {},
  });

  console.info(`  ✓ Created default clinic for tenant ${tenantId}: ${defaultClinic.name} (${defaultClinic._id})`);
  return defaultClinic._id as Types.ObjectId;
};

const migrateDoctors = async (tenantId: string, defaultClinicId: Types.ObjectId): Promise<MigrationStats> => {
  const stats: MigrationStats = {
    clinicsCreated: 0,
    doctorsUpdated: 0,
    patientsUpdated: 0,
    appointmentsUpdated: 0,
    errors: [],
  };

  const doctors = await DoctorModel.find({
    tenantId,
    $or: [{ primaryClinicId: { $exists: false } }, { primaryClinicId: null }],
  });

  console.info(`  Found ${doctors.length} doctors without clinic assignments`);

  for (const doctor of doctors) {
    try {
      let clinicId: Types.ObjectId | null = defaultClinicId;

      // If doctor has clinicLocations, try to match or create a clinic
      if (doctor.clinicLocations && doctor.clinicLocations.length > 0) {
        const firstLocation = doctor.clinicLocations[0];
        if (firstLocation) {
          const locationName = firstLocation.name || "Clinic";

          // Try to find existing clinic by name or city
          let matchedClinic = await ClinicModel.findOne({
            tenantId,
            $or: [{ name: { $regex: new RegExp(locationName, "i") } }, { city: firstLocation.city }],
          });

          if (!matchedClinic && firstLocation.city) {
            // Create clinic from location
            matchedClinic = await ClinicModel.create({
              tenantId,
              name: locationName,
              slug: `${locationName.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${tenantId.toLowerCase().replace(/[^a-z0-9]/g, "-")}`,
              timezone: "Asia/Kolkata",
              address: firstLocation.address,
              city: firstLocation.city,
              phone: null,
              email: null,
              capacity: {},
              waitlistOverrides: {},
            });
            stats.clinicsCreated++;
            console.info(`    ✓ Created clinic from location: ${matchedClinic.name}`);
          }

          if (matchedClinic) {
            clinicId = matchedClinic._id as Types.ObjectId;
          }
        }
      }

      // Update doctor with primary clinic
      doctor.primaryClinicId = clinicId;
      if (clinicId) {
        doctor.clinicIds = [clinicId];
      }
      await doctor.save();

      stats.doctorsUpdated++;
      console.info(`    ✓ Updated doctor ${doctor.name} (${doctor._id}) -> clinic ${clinicId}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      stats.errors.push({ type: "doctor", id: String(doctor._id), error: errorMessage });
      console.error(`    ✗ Failed to update doctor ${doctor._id}: ${errorMessage}`);
    }
  }

  return stats;
};

const migratePatients = async (tenantId: string, defaultClinicId: Types.ObjectId): Promise<MigrationStats> => {
  const stats: MigrationStats = {
    clinicsCreated: 0,
    doctorsUpdated: 0,
    patientsUpdated: 0,
    appointmentsUpdated: 0,
    errors: [],
  };

  const patients = await PatientModel.find({
    tenantId,
    $or: [{ primaryClinicId: { $exists: false } }, { primaryClinicId: null }],
  });

  console.info(`  Found ${patients.length} patients without clinic assignments`);

  for (const patient of patients) {
    try {
      // Assign to default clinic for now
      patient.primaryClinicId = defaultClinicId;
      await patient.save();

      stats.patientsUpdated++;
      if (stats.patientsUpdated % 100 === 0) {
        console.info(`    ✓ Updated ${stats.patientsUpdated} patients...`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      stats.errors.push({ type: "patient", id: String(patient._id), error: errorMessage });
      console.error(`    ✗ Failed to update patient ${patient._id}: ${errorMessage}`);
    }
  }

  return stats;
};

const migrateAppointments = async (tenantId: string): Promise<MigrationStats> => {
  const stats: MigrationStats = {
    clinicsCreated: 0,
    doctorsUpdated: 0,
    patientsUpdated: 0,
    appointmentsUpdated: 0,
    errors: [],
  };

  const appointments = await AppointmentModel.find({
    tenantId,
    $or: [{ clinic: { $exists: false } }, { clinic: null }],
  }).populate("doctor", "primaryClinicId");

  console.info(`  Found ${appointments.length} appointments without clinic assignments`);

  for (const appointment of appointments) {
    try {
      const doctor = appointment.doctor as { primaryClinicId?: Types.ObjectId | null } | null;
      const clinicId = doctor?.primaryClinicId ?? null;

      if (clinicId) {
        appointment.clinic = clinicId;
        await appointment.save();
        stats.appointmentsUpdated++;
        if (stats.appointmentsUpdated % 100 === 0) {
          console.info(`    ✓ Updated ${stats.appointmentsUpdated} appointments...`);
        }
      } else {
        console.warn(`    ⚠ Appointment ${appointment._id} has no clinic (doctor ${appointment.doctor} has no primary clinic)`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      stats.errors.push({ type: "appointment", id: String(appointment._id), error: errorMessage });
      console.error(`    ✗ Failed to update appointment ${appointment._id}: ${errorMessage}`);
    }
  }

  return stats;
};

const mergeStats = (stats1: MigrationStats, stats2: MigrationStats): MigrationStats => ({
  clinicsCreated: stats1.clinicsCreated + stats2.clinicsCreated,
  doctorsUpdated: stats1.doctorsUpdated + stats2.doctorsUpdated,
  patientsUpdated: stats1.patientsUpdated + stats2.patientsUpdated,
  appointmentsUpdated: stats1.appointmentsUpdated + stats2.appointmentsUpdated,
  errors: [...stats1.errors, ...stats2.errors],
});

const migrate = async () => {
  await connectDatabase();

  console.info("🔄 Starting clinic reference migration...\n");

  const allStats: MigrationStats = {
    clinicsCreated: 0,
    doctorsUpdated: 0,
    patientsUpdated: 0,
    appointmentsUpdated: 0,
    errors: [],
  };

  // Get all unique tenant IDs
  const tenants = await DoctorModel.distinct("tenantId");
  console.info(`Found ${tenants.length} tenant(s) to migrate\n`);

  for (const tenantId of tenants) {
    console.info(`📋 Processing tenant: ${tenantId}`);

    try {
      // Step 1: Ensure default clinic exists
      const defaultClinicId = await createDefaultClinic(tenantId);
      if (!defaultClinicId) {
        console.error(`  ✗ Failed to create default clinic for tenant ${tenantId}`);
        continue;
      }

      // Step 2: Migrate doctors
      console.info(`  Migrating doctors...`);
      const doctorStats = await migrateDoctors(tenantId, defaultClinicId);
      allStats.clinicsCreated += doctorStats.clinicsCreated;
      allStats.doctorsUpdated += doctorStats.doctorsUpdated;
      allStats.errors.push(...doctorStats.errors);

      // Step 3: Migrate patients
      console.info(`  Migrating patients...`);
      const patientStats = await migratePatients(tenantId, defaultClinicId);
      allStats.patientsUpdated += patientStats.patientsUpdated;
      allStats.errors.push(...patientStats.errors);

      // Step 4: Migrate appointments
      console.info(`  Migrating appointments...`);
      const appointmentStats = await migrateAppointments(tenantId);
      allStats.appointmentsUpdated += appointmentStats.appointmentsUpdated;
      allStats.errors.push(...appointmentStats.errors);

      console.info(`  ✓ Completed tenant ${tenantId}\n`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`  ✗ Failed to process tenant ${tenantId}: ${errorMessage}`);
      allStats.errors.push({ type: "tenant", id: tenantId, error: errorMessage });
    }
  }

  // Print summary
  console.info("📊 Migration Summary:");
  console.info(`  Clinics created: ${allStats.clinicsCreated}`);
  console.info(`  Doctors updated: ${allStats.doctorsUpdated}`);
  console.info(`  Patients updated: ${allStats.patientsUpdated}`);
  console.info(`  Appointments updated: ${allStats.appointmentsUpdated}`);
  console.info(`  Errors: ${allStats.errors.length}`);

  if (allStats.errors.length > 0) {
    console.error("\n❌ Errors encountered:");
    for (const error of allStats.errors) {
      console.error(`  - ${error.type} ${error.id}: ${error.error}`);
    }
  }

  if (allStats.errors.length === 0) {
    console.info("\n✅ Migration completed successfully!");
  } else {
    console.warn("\n⚠️  Migration completed with errors. Review the errors above.");
  }
};

migrate()
  .catch((error) => {
    console.error("❌ Migration failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectDatabase();
    process.exit();
  });

