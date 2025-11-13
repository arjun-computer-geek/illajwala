import { FilterQuery } from "mongoose";
import { StatusCodes } from "http-status-codes";
import {
  DoctorModel,
  type DoctorDocument,
  type DoctorReviewStatus,
} from "./doctor.model";
import type {
  CreateDoctorInput,
  DoctorAvailabilityParams,
  UpdateDoctorInput,
  DoctorReviewActionInput,
  DoctorAddNoteInput,
  DoctorProfileUpdateInput,
} from "./doctor.schema";
import { AppointmentModel } from "../appointments/appointment.model";
import { AppError } from "../../utils/app-error";

export const createDoctor = async (payload: CreateDoctorInput) => DoctorModel.create(payload);

export const updateDoctor = async (id: string, payload: UpdateDoctorInput) =>
  DoctorModel.findByIdAndUpdate(id, payload, { new: true });

export const updateDoctorProfile = async (id: string, payload: DoctorProfileUpdateInput) => {
  const doctor = await DoctorModel.findById(id);
  if (!doctor) {
    throw AppError.from({ statusCode: StatusCodes.NOT_FOUND, message: "Doctor not found" });
  }

  if (payload.onboardingChecklist) {
    doctor.onboardingChecklist = {
      ...doctor.onboardingChecklist,
      ...payload.onboardingChecklist,
    };
  }

  const assignablePayload = { ...payload } as Partial<DoctorDocument> & {
    onboardingChecklist?: never;
  };
  delete (assignablePayload as Record<string, unknown>).onboardingChecklist;

  Object.assign(doctor, assignablePayload);
  doctor.lastReviewedAt = new Date();

  await doctor.save();
  return doctor;
};
export const getDoctorById = async (id: string) => DoctorModel.findById(id);

export const listDoctorSpecialties = async () => {
  const specialties = await DoctorModel.distinct("specialization");
  return specialties.sort((a, b) => a.localeCompare(b));
};

const shouldUpdateApprovedAt = (status: DoctorReviewStatus) =>
  status === "approved" || status === "active";

export const reviewDoctor = async (id: string, payload: DoctorReviewActionInput) => {
  const doctorExists = await DoctorModel.findById(id);

  if (!doctorExists) {
    throw AppError.from({ statusCode: StatusCodes.NOT_FOUND, message: "Doctor not found" });
  }

  const setFields: Record<string, unknown> = {
    reviewStatus: payload.status,
    lastReviewedAt: new Date(),
  };

  if (shouldUpdateApprovedAt(payload.status)) {
    setFields.approvedAt = new Date();
  }

  if (payload.onboardingChecklist) {
    for (const [key, value] of Object.entries(payload.onboardingChecklist)) {
      setFields[`onboardingChecklist.${key}`] = value;
    }
  }

  const updateOps: Record<string, unknown> = {
    $set: setFields,
  };

  if (payload.note) {
    updateOps.$push = {
      reviewNotes: {
        message: payload.note,
        author: payload.author,
        status: payload.status,
        createdAt: new Date(),
      },
    };
  }

  const updatedDoctor = await DoctorModel.findByIdAndUpdate(id, updateOps, {
    new: true,
    runValidators: true,
  });

  return updatedDoctor;
};

export const addDoctorReviewNote = async (id: string, payload: DoctorAddNoteInput) => {
  const doctor = await DoctorModel.findByIdAndUpdate(
    id,
    {
      $push: {
        reviewNotes: {
          message: payload.message,
          author: payload.author,
          status: payload.status,
          createdAt: new Date(),
        },
      },
      $set: {
        lastReviewedAt: new Date(),
      },
    },
    { new: true, runValidators: true }
  );

  if (!doctor) {
    throw AppError.from({ statusCode: StatusCodes.NOT_FOUND, message: "Doctor not found" });
  }

  return doctor;
};

export const searchDoctors = async ({
  query,
  specialization,
  city,
  consultationMode,
  page = 1,
  pageSize = 20,
  featured,
  sort,
}: {
  query?: string | undefined;
  specialization?: string | undefined;
  city?: string | undefined;
  consultationMode?: string | undefined;
  page?: number | undefined;
  pageSize?: number | undefined;
  featured?: boolean | undefined;
  sort?: "rating" | "fee" | "experience" | undefined;
}) => {
  const filter: FilterQuery<DoctorDocument> = {};

  if (query) {
    filter.$text = { $search: query };
  }
  if (specialization) {
    filter.specialization = specialization;
  }
  if (city) {
    filter["clinicLocations.city"] = city;
  }
  if (consultationMode) {
    filter.consultationModes = consultationMode;
  }
  if (featured) {
    filter.rating = { $gte: 4.5 };
    filter.totalReviews = { $gte: 50 };
  }

  const sortMap: Record<"rating" | "fee" | "experience", 1 | -1> = {
    rating: -1,
    fee: 1,
    experience: -1,
  };

  const sortKey = sort ?? "rating";
  const sortConfig: Record<string, 1 | -1> = {};

  if (sortKey === "experience") {
    sortConfig.experienceYears = sortMap[sortKey];
    sortConfig.rating = -1;
  } else if (sortKey === "fee") {
    sortConfig.fee = sortMap[sortKey];
    sortConfig.rating = -1;
  } else {
    sortConfig.rating = sortMap[sortKey];
    sortConfig.totalReviews = -1;
  }

  const [items, total] = await Promise.all([
    DoctorModel.find(filter)
      .sort(sortConfig)
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean(),
    DoctorModel.countDocuments(filter),
  ]);

  return { items, total };
};

const defaultSlots = ["09:00", "10:00", "11:00", "14:00", "15:30", "17:00", "19:00"];

const startOfDay = (date: Date) => {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
};

const addDays = (date: Date, amount: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
};

type AvailabilitySlot = {
  start: string;
  end: string;
  available: boolean;
};

type AvailabilityDay = {
  date: string;
  slots: AvailabilitySlot[];
};

export type DoctorAvailability = {
  doctorId: string;
  modes: DoctorDocument["consultationModes"];
  days: AvailabilityDay[];
  nextAvailableSlot: string | null;
};

export const getDoctorAvailability = async (
  id: string,
  params: DoctorAvailabilityParams
): Promise<DoctorAvailability | null> => {
  const doctor = await DoctorModel.findById(id).lean();
  if (!doctor) {
    return null;
  }

  const totalDays = Math.max(1, Math.min(params.days ?? 7, 30));
  const today = startOfDay(new Date());
  const end = addDays(today, totalDays);

  const appointments = await AppointmentModel.find({
    doctor: id,
    scheduledAt: { $gte: today, $lt: end },
    status: { $ne: "cancelled" },
  })
    .select("scheduledAt")
    .lean();

  const bookedSlots = new Set<string>(appointments.map((appt) => appt.scheduledAt.toISOString()));
  const days: AvailabilityDay[] = [];
  const now = new Date();
  let nextAvailableSlot: string | null = null;

  for (let dayIndex = 0; dayIndex < totalDays; dayIndex += 1) {
    const slotDate = addDays(today, dayIndex);
    const slots: AvailabilitySlot[] = [];

    for (const time of defaultSlots) {
      const [hours, minutes] = time.split(":").map(Number);
      const slotStart = new Date(slotDate);
      slotStart.setHours(hours, minutes, 0, 0);
      const slotEnd = new Date(slotStart);
      slotEnd.setMinutes(slotEnd.getMinutes() + 30);

      const key = slotStart.toISOString();
      const available = slotStart > now && !bookedSlots.has(key);

      if (available && !nextAvailableSlot) {
        nextAvailableSlot = key;
      }

      slots.push({
        start: key,
        end: slotEnd.toISOString(),
        available,
      });
    }

    days.push({
      date: slotDate.toISOString(),
      slots,
    });
  }

  return {
    doctorId: doctor._id.toString(),
    modes: doctor.consultationModes,
    days,
    nextAvailableSlot,
  };
};

