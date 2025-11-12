import { FilterQuery } from "mongoose";
import { DoctorModel, type DoctorDocument } from "./doctor.model";
import type {
  CreateDoctorInput,
  DoctorAvailabilityParams,
  UpdateDoctorInput,
} from "./doctor.schema";
import { AppointmentModel } from "../appointments/appointment.model";

export const createDoctor = async (payload: CreateDoctorInput) => DoctorModel.create(payload);

export const updateDoctor = async (id: string, payload: UpdateDoctorInput) =>
  DoctorModel.findByIdAndUpdate(id, payload, { new: true });

export const getDoctorById = async (id: string) => DoctorModel.findById(id);

export const listDoctorSpecialties = async () => {
  const specialties = await DoctorModel.distinct("specialization");
  return specialties.sort((a, b) => a.localeCompare(b));
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

