import { connectDatabase, disconnectDatabase } from '../config/database';
import { ClinicModel } from '../modules/clinics/clinic.model';
import { DoctorModel } from '../modules/doctors/doctor.model';
import { PatientModel } from '../modules/patients/patient.model';
import { AppointmentModel } from '../modules/appointments/appointment.model';
import { AdminModel } from '../modules/admins/admin.model';
import { WaitlistModel } from '../modules/waitlists/waitlist.model';

/**
 * Reset the database by dropping all collections
 * WARNING: This will delete all data!
 */
const resetDatabase = async () => {
  await connectDatabase();

  console.info('🗑️  Resetting database...');

  try {
    // Drop all collections
    await ClinicModel.collection.drop().catch(() => {
      // Collection might not exist
    });
    await DoctorModel.collection.drop().catch(() => {
      // Collection might not exist
    });
    await PatientModel.collection.drop().catch(() => {
      // Collection might not exist
    });
    await AppointmentModel.collection.drop().catch(() => {
      // Collection might not exist
    });
    await AdminModel.collection.drop().catch(() => {
      // Collection might not exist
    });
    await WaitlistModel.collection.drop().catch(() => {
      // Collection might not exist
    });

    console.info('✅ Database reset complete');
  } catch (error) {
    console.error('❌ Database reset failed:', error);
    throw error;
  }
};

resetDatabase()
  .catch((error) => {
    console.error('❌ Reset failed', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectDatabase();
    process.exit();
  });
