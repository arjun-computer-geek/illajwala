'use strict';

import { Types } from 'mongoose';
// TODO: Replace with inter-service communication
import { ClinicModel } from '../../models/clinic.model';
import { DoctorModel } from '../../models/doctor.model';
import { AppointmentModel } from '../../models/appointment.model';
import type { ClinicMetrics } from '@illajwala/types';

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

const toRupees = (amountInMinorUnits: number | null | undefined): number => {
  if (!amountInMinorUnits || Number.isNaN(amountInMinorUnits)) {
    return 0;
  }
  return Math.round((amountInMinorUnits / 100) * 100) / 100;
};

export const getClinicMetrics = async (
  tenantId: string,
  clinicId?: string,
): Promise<ClinicMetrics[]> => {
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);

  const clinicFilter: Record<string, unknown> = { tenantId };
  if (clinicId && Types.ObjectId.isValid(clinicId)) {
    clinicFilter._id = new Types.ObjectId(clinicId);
  }

  const clinics = await ClinicModel.find(clinicFilter).select('_id name').lean();

  const metrics: ClinicMetrics[] = [];

  for (const clinic of clinics) {
    const clinicObjectId = clinic._id as Types.ObjectId;

    // Count active doctors for this clinic
    const activeDoctors = await DoctorModel.countDocuments({
      tenantId,
      reviewStatus: 'active',
      $or: [{ primaryClinicId: clinicObjectId }, { clinicIds: clinicObjectId }],
    });

    // Count appointments today for this clinic
    const appointmentsToday = await AppointmentModel.countDocuments({
      tenantId,
      clinic: clinicObjectId,
      scheduledAt: { $gte: todayStart, $lte: todayEnd },
    });

    // Calculate revenue today for this clinic
    const revenueAggregation = await AppointmentModel.aggregate<{ total: number }>([
      {
        $match: {
          tenantId,
          clinic: clinicObjectId,
          'payment.status': 'captured',
          'payment.capturedAt': { $gte: todayStart, $lte: todayEnd },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$payment.amount' },
        },
      },
    ]);

    const revenueToday = toRupees(revenueAggregation[0]?.total ?? 0);

    // Determine clinic status
    // Active: has active doctors and recent appointments
    // Pending: created but no active doctors yet
    // Suspended: no active doctors and no recent activity (simplified logic)
    let status: 'active' | 'pending' | 'suspended' = 'pending';
    if (activeDoctors > 0) {
      status = 'active';
    } else {
      const recentAppointments = await AppointmentModel.countDocuments({
        tenantId,
        clinic: clinicObjectId,
        scheduledAt: { $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) },
      });
      if (recentAppointments === 0) {
        status = 'suspended';
      }
    }

    metrics.push({
      clinicId: String(clinic._id),
      clinicName: clinic.name,
      activeDoctors,
      appointmentsToday,
      revenueToday,
      status,
    });
  }

  return metrics;
};
