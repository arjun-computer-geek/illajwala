import {
  appointmentStatusSchema,
  consultationModeSchema,
} from "@illajwala/types";
import type {
  ApiResponse,
  Appointment,
  AppointmentStatus,
  BookAppointmentPayload,
  ClinicLocation,
  ConsultationMode,
  Dependent,
  Doctor,
  DoctorAuthResponse,
  LoginPatientInput,
  PaginatedResponse,
  PatientAuthResponse,
  PatientProfile,
  RegisterPatientInput,
} from "@illajwala/types";

export { appointmentStatusSchema, consultationModeSchema };

export type {
  ApiResponse,
  Appointment,
  AppointmentStatus,
  BookAppointmentPayload,
  ClinicLocation,
  ConsultationMode,
  Dependent,
  Doctor,
  DoctorAuthResponse,
  PaginatedResponse,
  PatientAuthResponse,
  PatientProfile,
} from "@illajwala/types";

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

export type RegisterPatientPayload = RegisterPatientInput;
export type LoginPatientPayload = LoginPatientInput;

