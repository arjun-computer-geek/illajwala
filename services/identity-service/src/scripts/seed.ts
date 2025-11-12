import { connectDatabase, disconnectDatabase } from "../config/database";
import { DoctorModel } from "../modules/doctors/doctor.model";
import { PatientModel } from "../modules/patients/patient.model";
import { AppointmentModel } from "../modules/appointments/appointment.model";
import { hashPassword } from "../utils/password";

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

const createSampleAppointments = async (patientId: string, doctorIds: string[]) => {
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
    if (!doctorId) {
      continue;
    }

    await AppointmentModel.findOneAndUpdate(
      {
        patient: patientId,
        doctor: doctorId,
        scheduledAt: payload.scheduledAt,
      },
      {
        $setOnInsert: {
          patient: patientId,
          doctor: doctorId,
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

  const doctors = [];
  for (const doctor of sampleDoctors) {
    const upserted = await DoctorModel.findOneAndUpdate(
      { email: doctor.email },
      { $set: doctor },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    doctors.push(upserted);
  }
  console.info(`✅ Upserted ${doctors.length} doctors`);

  const passwordHash = await hashPassword(samplePatient.password);
  const patient = await PatientModel.findOneAndUpdate(
    { email: samplePatient.email },
    {
      $set: {
        name: samplePatient.name,
        phone: samplePatient.phone,
        passwordHash,
        medicalHistory: samplePatient.medicalHistory,
        dependents: samplePatient.dependents,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  console.info(`✅ Patient ready: ${patient.name}`);

  await createSampleAppointments(
    patient.id,
    doctors.map((doc) => doc.id)
  );
  console.info("✅ Sample appointments ensured");

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

