export type ConsultationMode = "clinic" | "telehealth" | "home-visit";

export type ClinicLocation = {
  name: string;
  address?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
};

export type Doctor = {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  specialization: string;
  about?: string;
  languages?: string[];
  consultationModes?: ConsultationMode[];
  fee?: number;
  rating?: number;
  totalReviews?: number;
  clinicLocations?: ClinicLocation[];
  experienceYears?: number;
  profileImageUrl?: string;
};

export type Appointment = {
  _id: string;
  doctor: Doctor;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  scheduledAt: string;
  mode: ConsultationMode;
  reasonForVisit?: string;
  notes?: string;
};

export type Dependent = {
  name: string;
  relationship: string;
  dateOfBirth?: string;
  gender?: "male" | "female" | "other";
};

export type PatientProfile = {
  _id: string;
  name: string;
  email: string;
  phone: string;
  dateOfBirth?: string;
  gender?: "male" | "female" | "other";
  medicalHistory?: string[];
  dependents: Dependent[];
};

export type ApiResponse<T> = {
  data: T;
  message?: string;
};

export type PaginatedResponse<T> = {
  data: T[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
};

export type PatientAuthResponse = {
  token: string;
  patient: PatientProfile;
};

export type DoctorAuthResponse = {
  token: string;
  doctor: Doctor;
};

export type DoctorAvailabilitySlot = {
  start: string;
  end: string;
  available: boolean;
};

export type DoctorAvailabilityDay = {
  date: string;
  slots: DoctorAvailabilitySlot[];
};

export type DoctorAvailability = {
  doctorId: string;
  modes: ConsultationMode[];
  days: DoctorAvailabilityDay[];
  nextAvailableSlot: string | null;
};

export type StatsOverview = {
  totals: {
    doctors: number;
    patients: number;
    appointments: number;
    specialties: number;
    cities: number;
  };
  ratings: {
    averageRating: number | null;
  };
};

export type RegisterPatientPayload = {
  name: string;
  email: string;
  phone: string;
  password: string;
};

export type LoginPatientPayload = {
  email: string;
  password: string;
};

export type BookAppointmentPayload = {
  doctorId: string;
  patientId: string;
  scheduledAt: string;
  mode: ConsultationMode;
  reasonForVisit?: string;
};

