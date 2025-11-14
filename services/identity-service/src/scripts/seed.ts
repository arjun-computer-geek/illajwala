import { connectDatabase, disconnectDatabase } from "../config/database";
import { ClinicModel } from "../modules/clinics/clinic.model";
import { DoctorModel } from "../modules/doctors/doctor.model";
import { PatientModel } from "../modules/patients/patient.model";
import { AppointmentModel } from "../modules/appointments/appointment.model";
import { AdminModel } from "../modules/admins/admin.model";
import { hashPassword } from "../utils/password";
import { Types } from "mongoose";

const DEFAULT_TENANT_ID = "demo-clinic";

const sampleDoctors = [
  {
    name: "Dr. Aisha Verma",
    email: "aisha.verma@illajwala.com",
    phone: "+911100000001",
    specialization: "Cardiology",
    about:
      "Senior interventional cardiologist specialising in coronary artery disease, preventive cardiology, and heart failure management.",
    languages: ["English", "Hindi"],
    consultationModes: ["clinic", "telehealth"],
    fee: 1500,
    reviewStatus: "active",
    onboardingChecklist: {
      kycComplete: true,
      payoutSetupComplete: true,
      telehealthReady: true,
    },
    reviewNotes: [
      {
        message: "Credentials verified and clinic walkthrough complete.",
        author: "Priya Sharma",
        status: "approved",
      },
    ],
    approvedAt: new Date(),
    clinicLocations: [
      {
        name: "illajwala Heart Institute",
        address: "12 Residency Road, Bengaluru, Karnataka 560025",
        city: "Bengaluru",
        latitude: 12.9716,
        longitude: 77.5946,
      },
    ],
    experienceYears: 12,
    rating: 4.9,
    totalReviews: 182,
  },
  {
    name: "Dr. Rahul Kulkarni",
    email: "rahul.kulkarni@illajwala.com",
    phone: "+911100000002",
    specialization: "Dermatology",
    about:
      "Board-certified dermatologist with expertise in chronic skin conditions, paediatric dermatology, and tele-dermatology triage.",
    languages: ["English", "Marathi", "Hindi"],
    consultationModes: ["clinic", "telehealth", "home-visit"],
    fee: 900,
    reviewStatus: "approved",
    onboardingChecklist: {
      kycComplete: true,
      payoutSetupComplete: false,
      telehealthReady: true,
    },
    reviewNotes: [
      {
        message: "Approved pending payout verification call.",
        author: "Anil Kapoor",
        status: "approved",
      },
      {
        message: "Awaiting Razorpay statement upload.",
        author: "Anil Kapoor",
        status: "needs-info",
      },
    ],
    clinicLocations: [
      {
        name: "Skin Renewal Clinic",
        address: "88 Colaba Causeway, Mumbai, Maharashtra 400005",
        city: "Mumbai",
        latitude: 18.9218,
        longitude: 72.8331,
      },
    ],
    experienceYears: 9,
    rating: 4.7,
    totalReviews: 132,
  },
  {
    name: "Dr. Neha Srinivasan",
    email: "neha.srinivasan@illajwala.com",
    phone: "+911100000003",
    specialization: "Pediatrics",
    about:
      "Paediatrician focused on preventative care, vaccination programs, and respiratory illnesses for infants and young children.",
    languages: ["English", "Tamil"],
    consultationModes: ["clinic"],
    fee: 700,
    reviewStatus: "needs-info",
    onboardingChecklist: {
      kycComplete: false,
      payoutSetupComplete: false,
      telehealthReady: false,
    },
    reviewNotes: [
      {
        message: "Requesting updated medical license copy (expires next month).",
        author: "Rohit Mehra",
        status: "needs-info",
      },
    ],
    clinicLocations: [
      {
        name: "Happy Kids Care",
        address: "44 Cathedral Road, Chennai, Tamil Nadu 600086",
        city: "Chennai",
        latitude: 13.0604,
        longitude: 80.2496,
      },
    ],
    experienceYears: 7,
    rating: 4.8,
    totalReviews: 156,
  },
];

const samplePatient = {
  name: "Arjun Patel",
  email: "arjun.patel@example.com",
  phone: "+919876543210",
  password: "patient123",
  medicalHistory: ["Hypertension"],
  dependents: [
    {
      name: "Riya Patel",
      relationship: "Daughter",
    },
  ],
};

const sampleAdmin = {
  name: "Illajwala Admin",
  email: "ops@illajwala.com",
  password: "admin123",
};

const createSampleAppointments = async (
  patientId: string,
  doctorIds: string[],
  clinicIds: (Types.ObjectId | null)[]
) => {
  const upcomingDate = (daysFromNow: number, hour = 10) => {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    date.setHours(hour, 0, 0, 0);
    return date;
  };

  const appointmentPayloads = [
    {
      doctorIndex: 0,
      scheduledAt: upcomingDate(2, 9),
      mode: "clinic" as const,
      reasonForVisit: "Follow-up consultation for hypertension management.",
    },
    {
      doctorIndex: 1,
      scheduledAt: upcomingDate(4, 15),
      mode: "telehealth" as const,
      reasonForVisit: "Recurring eczema flare-up requiring tele-consult advice.",
    },
  ];

  for (const payload of appointmentPayloads) {
    const doctorId = doctorIds[payload.doctorIndex];
    const clinicId = clinicIds[payload.doctorIndex];
    if (!doctorId) {
      continue;
    }

    await AppointmentModel.findOneAndUpdate(
      {
        tenantId: DEFAULT_TENANT_ID,
        patient: patientId,
        doctor: doctorId,
        scheduledAt: payload.scheduledAt,
      },
      {
        $setOnInsert: {
          tenantId: DEFAULT_TENANT_ID,
          patient: patientId,
          doctor: doctorId,
          clinic: clinicId ?? undefined,
          scheduledAt: payload.scheduledAt,
          mode: payload.mode,
          reasonForVisit: payload.reasonForVisit,
          status: "confirmed",
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }
};

const seed = async () => {
  await connectDatabase();

  console.info("🌱 Seeding illajwala sample data...");

  // Create clinics from doctor locations
  const clinics: Array<{ _id: Types.ObjectId; name: string }> = [];
  for (const doctor of sampleDoctors) {
    if (doctor.clinicLocations && doctor.clinicLocations.length > 0) {
      const location = doctor.clinicLocations[0];
      if (location) {
        const clinicName = location.name || "Clinic";
        const clinicSlug = clinicName.toLowerCase().replace(/[^a-z0-9]/g, "-");

        const clinic = await ClinicModel.findOneAndUpdate(
          { tenantId: DEFAULT_TENANT_ID, slug: clinicSlug },
          {
            $setOnInsert: {
              tenantId: DEFAULT_TENANT_ID,
              name: clinicName,
              slug: clinicSlug,
              timezone: "Asia/Kolkata",
              address: location.address,
              city: location.city,
              phone: null,
              email: null,
              capacity: {},
              waitlistOverrides: {},
            },
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        clinics.push({ _id: clinic._id as Types.ObjectId, name: clinic.name });
      }
    }
  }

  // Create default clinic if none exist
  if (clinics.length === 0) {
    const defaultClinic = await ClinicModel.findOneAndUpdate(
      { tenantId: DEFAULT_TENANT_ID, slug: "main-clinic" },
      {
        $setOnInsert: {
          tenantId: DEFAULT_TENANT_ID,
          name: "Main Clinic",
          slug: "main-clinic",
          timezone: "Asia/Kolkata",
          address: null,
          city: null,
          phone: null,
          email: null,
          capacity: {},
          waitlistOverrides: {},
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    clinics.push({ _id: defaultClinic._id as Types.ObjectId, name: defaultClinic.name });
  }

  console.info(`✅ Upserted ${clinics.length} clinic(s)`);

  const doctors = [];
  const doctorClinicIds: (Types.ObjectId | null)[] = [];
  for (let i = 0; i < sampleDoctors.length; i++) {
    const doctor = sampleDoctors[i];
    if (!doctor) continue;

    let clinicId: Types.ObjectId | null = clinics[0]?._id ?? null;

    // Match doctor to clinic by location
    if (doctor.clinicLocations && doctor.clinicLocations.length > 0) {
      const firstLocation = doctor.clinicLocations[0];
      if (firstLocation) {
        const locationName = firstLocation.name || "";
        const matchedClinic = clinics.find((c) => c.name === locationName);
        if (matchedClinic) {
          clinicId = matchedClinic._id;
        }
      }
    }

    const upserted = await DoctorModel.findOneAndUpdate(
      { tenantId: DEFAULT_TENANT_ID, email: doctor.email },
      {
        $set: {
          ...doctor,
          tenantId: DEFAULT_TENANT_ID,
          primaryClinicId: clinicId,
          clinicIds: clinicId ? [clinicId] : [],
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    doctors.push(upserted);
    doctorClinicIds.push(clinicId);
  }
  console.info(`✅ Upserted ${doctors.length} doctors`);

  const passwordHash = await hashPassword(samplePatient.password);
  const defaultClinicId = clinics[0]?._id ?? null;
  const patient = await PatientModel.findOneAndUpdate(
    { tenantId: DEFAULT_TENANT_ID, email: samplePatient.email },
    {
      $set: {
        tenantId: DEFAULT_TENANT_ID,
        name: samplePatient.name,
        phone: samplePatient.phone,
        passwordHash,
        medicalHistory: samplePatient.medicalHistory,
        dependents: samplePatient.dependents,
        primaryClinicId: defaultClinicId,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  console.info(`✅ Patient ready: ${patient.name}`);

  await createSampleAppointments(
    patient.id,
    doctors.map((doc) => doc.id),
    doctorClinicIds
  );
  console.info("✅ Sample appointments ensured");

  const adminPasswordHash = await hashPassword(sampleAdmin.password);
  const admin = await AdminModel.findOneAndUpdate(
    { email: sampleAdmin.email },
    {
      $set: {
        tenantId: DEFAULT_TENANT_ID,
        name: sampleAdmin.name,
        email: sampleAdmin.email,
        passwordHash: adminPasswordHash,
        role: "admin",
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  console.info(`✅ Admin ready: ${admin.name}`);

  console.info("🎉 Seeding complete");
};

seed()
  .catch((error) => {
    console.error("❌ Seeding failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectDatabase();
    process.exit();
  });

