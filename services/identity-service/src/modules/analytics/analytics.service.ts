"use strict";

import type { OpsAnalyticsSeries, OpsMetricsSummary } from "@illajwala/types";
import { AppointmentModel } from "../appointments/appointment.model";
import { DoctorModel } from "../doctors/doctor.model";

const startOfDay = (value: Date): Date => {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
};

const endOfDay = (value: Date): Date => {
  const date = new Date(value);
  date.setHours(23, 59, 59, 999);
  return date;
};

const addDays = (value: Date, days: number): Date => {
  const date = new Date(value);
  date.setDate(date.getDate() + days);
  return date;
};

const formatDateKey = (value: Date): string => value.toISOString().slice(0, 10);

const toRupees = (amountInMinorUnits: number | null | undefined): number => {
  if (!amountInMinorUnits || Number.isNaN(amountInMinorUnits)) {
    return 0;
  }
  return Math.round((amountInMinorUnits / 100) * 100) / 100;
};

export const getOpsMetricsSummary = async (tenantId: string): Promise<OpsMetricsSummary> => {
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);

  const [
    activeConsultations,
    waitingAppointments,
    todaysTotalAppointments,
    todaysNoShows,
    revenueAggregation,
    clinicsActive,
    clinicsPending,
    clinicsNeedingInfo,
  ] = await Promise.all([
    AppointmentModel.countDocuments({ tenantId, status: "in-session" }),
    AppointmentModel.find({ tenantId, status: "checked-in" }).select("scheduledAt").lean(),
    AppointmentModel.countDocuments({
      tenantId,
      scheduledAt: { $gte: todayStart, $lte: todayEnd },
    }),
    AppointmentModel.countDocuments({
      tenantId,
      status: "no-show",
      scheduledAt: { $gte: todayStart, $lte: todayEnd },
    }),
    AppointmentModel.aggregate<{ _id: string; total: number }>([
      {
        $match: {
          tenantId,
          "payment.status": "captured",
          "payment.capturedAt": { $gte: todayStart, $lte: todayEnd },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$payment.amount" },
        },
      },
    ]),
    DoctorModel.countDocuments({ tenantId, reviewStatus: "active" }),
    DoctorModel.countDocuments({ tenantId, reviewStatus: { $in: ["pending", "needs-info", "approved"] } }),
    DoctorModel.countDocuments({ tenantId, reviewStatus: "needs-info" }),
  ]);

  const waitingPatients = waitingAppointments.length;
  const averageWaitTime =
    waitingPatients === 0
      ? 0
      : Math.round(
          waitingAppointments.reduce((total, appointment) => {
            const scheduledAt = new Date(appointment.scheduledAt);
            const diffInMinutes = Math.max(0, (now.getTime() - scheduledAt.getTime()) / 60000);
            return total + diffInMinutes;
          }, 0) / waitingPatients
        );

  const noShowRate =
    todaysTotalAppointments === 0 ? 0 : Math.round((todaysNoShows / todaysTotalAppointments) * 100);

  const revenueToday = toRupees(revenueAggregation[0]?.total ?? 0);

  return {
    activeConsultations,
    waitingPatients,
    averageWaitTime,
    noShowRate,
    revenueToday,
    clinicsActive,
    clinicsPending,
    alertsOpen: clinicsNeedingInfo + todaysNoShows,
  };
};

export const getOpsAnalyticsSeries = async (tenantId: string): Promise<OpsAnalyticsSeries> => {
  const today = startOfDay(new Date());
  const days = 14;
  const rangeStart = addDays(today, -1 * (days - 1));
  const rangeEnd = endOfDay(today);

  const [consultationAggregation, revenueAggregation] = await Promise.all([
    AppointmentModel.aggregate<{
      _id: string;
      completed: number;
      noShow: number;
      total: number;
    }>([
      {
        $match: {
          tenantId,
          scheduledAt: { $gte: rangeStart, $lte: rangeEnd },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$scheduledAt" },
          },
          completed: {
            $sum: {
              $cond: [{ $eq: ["$status", "completed"] }, 1, 0],
            },
          },
          noShow: {
            $sum: {
              $cond: [{ $eq: ["$status", "no-show"] }, 1, 0],
            },
          },
          total: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    AppointmentModel.aggregate<{ _id: string; total: number }>([
      {
        $match: {
          tenantId,
          "payment.status": "captured",
          "payment.capturedAt": { $gte: rangeStart, $lte: rangeEnd },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$payment.capturedAt" },
          },
          total: { $sum: "$payment.amount" },
        },
      },
      { $sort: { _id: 1 } },
    ]),
  ]);

  const consultationMap = new Map<string, { completed: number; noShow: number; total: number }>();
  for (const entry of consultationAggregation) {
    consultationMap.set(entry._id, {
      completed: entry.completed,
      noShow: entry.noShow,
      total: entry.total,
    });
  }

  const revenueMap = new Map<string, number>();
  for (const entry of revenueAggregation) {
    revenueMap.set(entry._id, toRupees(entry.total));
  }

  const consultationPoints: { date: string; value: number }[] = [];
  const revenuePoints: { date: string; value: number }[] = [];
  const noShowPoints: { date: string; value: number }[] = [];

  for (let offset = 0; offset < days; offset += 1) {
    const currentDate = addDays(rangeStart, offset);
    const key = formatDateKey(currentDate);
    const consultationData = consultationMap.get(key);
    const revenueValue = revenueMap.get(key) ?? 0;

    consultationPoints.push({
      date: key,
      value: consultationData?.completed ?? 0,
    });

    revenuePoints.push({
      date: key,
      value: revenueValue,
    });

    const totalForDay = consultationData?.total ?? 0;
    const noShowForDay = consultationData?.noShow ?? 0;
    const noShowRate = totalForDay === 0 ? 0 : Math.round((noShowForDay / totalForDay) * 100);
    noShowPoints.push({
      date: key,
      value: noShowRate,
    });
  }

  return {
    consultations: [
      {
        label: "Consultations",
        color: "#2563eb",
        points: consultationPoints,
      },
    ],
    revenue: [
      {
        label: "Revenue",
        color: "#22c55e",
        points: revenuePoints,
      },
    ],
    noShow: [
      {
        label: "No-show rate",
        color: "#f97316",
        points: noShowPoints,
      },
    ],
  };
};


