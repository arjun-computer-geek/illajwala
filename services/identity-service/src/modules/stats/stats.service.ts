import { DoctorModel } from "../doctors/doctor.model";
import { AppointmentModel } from "../appointments/appointment.model";
import { PatientModel } from "../patients/patient.model";

type OverviewTotals = {
  doctors: number;
  patients: number;
  appointments: number;
  specialties: number;
  cities: number;
};

type OverviewRatings = {
  averageRating: number | null;
};

export type PlatformOverview = {
  totals: OverviewTotals;
  ratings: OverviewRatings;
};

const roundTo = (value: number, fractionDigits: number) =>
  Number.parseFloat(value.toFixed(fractionDigits));

export const getPlatformOverview = async (): Promise<PlatformOverview> => {
  const [totalDoctors, totalPatients, totalAppointments, specialties, averageRatingAgg, cityAgg] =
    await Promise.all([
      DoctorModel.countDocuments(),
      PatientModel.countDocuments(),
      AppointmentModel.countDocuments(),
      DoctorModel.distinct("specialization"),
      DoctorModel.aggregate<{ averageRating: number }>([
        { $match: { rating: { $ne: null } } },
        {
          $group: {
            _id: null,
            averageRating: { $avg: "$rating" },
          },
        },
      ]),
      DoctorModel.aggregate<{ totalCities: number }>([
        { $unwind: { path: "$clinicLocations", preserveNullAndEmptyArrays: false } },
        {
          $group: {
            _id: "$clinicLocations.city",
          },
        },
        {
          $group: {
            _id: null,
            totalCities: { $sum: 1 },
          },
        },
      ]),
    ]);

  const averageRating = averageRatingAgg[0]?.averageRating ?? null;
  const totalCities = cityAgg[0]?.totalCities ?? 0;

  return {
    totals: {
      doctors: totalDoctors,
      patients: totalPatients,
      appointments: totalAppointments,
      specialties: specialties.length,
      cities: totalCities,
    },
    ratings: {
      averageRating: averageRating === null ? null : roundTo(averageRating, 2),
    },
  };
};


