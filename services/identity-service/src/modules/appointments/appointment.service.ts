import { StatusCodes } from "http-status-codes";
import { AppointmentModel } from "./appointment.model";
import type {
  CreateAppointmentInput,
  UpdateAppointmentStatusInput,
} from "./appointment.schema";
import type { AuthenticatedRequest } from "../../middlewares/auth";
import { AppError } from "../../utils/app-error";

type Requester = AuthenticatedRequest["user"];

export const createAppointment = async (payload: CreateAppointmentInput, requester?: Requester) => {
  if (requester?.role === "patient" && requester.id !== payload.patientId) {
    throw AppError.from({
      statusCode: StatusCodes.FORBIDDEN,
      message: "You can only book appointments for your own profile",
    });
  }

  const appointment = await AppointmentModel.create({
    patient: payload.patientId,
    doctor: payload.doctorId,
    scheduledAt: payload.scheduledAt,
    mode: payload.mode,
    reasonForVisit: payload.reasonForVisit,
  });

  await appointment.populate([
    { path: "patient", select: "name email phone" },
    { path: "doctor", select: "name specialization consultationModes fee clinicLocations" },
  ]);

  return appointment;
};

export const listAppointments = async ({
  page = 1,
  pageSize = 20,
  patientId,
  doctorId,
  requester,
}: {
  page?: number;
  pageSize?: number;
  patientId?: string;
  doctorId?: string;
  requester?: Requester;
}) => {
  const filter: Record<string, unknown> = {};
  if (patientId) {
    filter.patient = patientId;
  }
  if (doctorId) {
    filter.doctor = doctorId;
  }
  if (requester?.role === "patient") {
    filter.patient = requester.id;
  }
  if (requester?.role === "doctor") {
    filter.doctor = requester.id;
  }

  const [items, total] = await Promise.all([
    AppointmentModel.find(filter)
      .populate("patient", "name email phone")
      .populate("doctor", "name specialization consultationModes fee clinicLocations")
      .sort({ scheduledAt: 1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize),
    AppointmentModel.countDocuments(filter),
  ]);

  return { items, total };
};

export const updateAppointmentStatus = async (
  id: string,
  payload: UpdateAppointmentStatusInput,
  requester?: Requester
) => {
  if (requester?.role === "patient") {
    throw AppError.from({
      statusCode: StatusCodes.FORBIDDEN,
      message: "Patients cannot modify appointment status",
    });
  }

  return AppointmentModel.findByIdAndUpdate(
    id,
    { status: payload.status, notes: payload.notes },
    { new: true }
  )
    .populate("patient", "name email phone")
    .populate("doctor", "name specialization consultationModes fee clinicLocations");
};

