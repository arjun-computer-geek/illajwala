'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Skeleton } from '@illajwala/ui';
import type { AppointmentPaymentStatus, AppointmentStatus } from '@illajwala/types';
import { toast } from 'sonner';
import {
  appointmentsApi,
  type UpdateAppointmentStatusPayload,
  type UpdateAppointmentPaymentPayload,
} from '../../lib/api/appointments';
import { useAdminAuth } from '../../hooks/use-auth';
import { AppointmentRow, type AppointmentWithPatient } from './bookings-table/appointment-row';
import { BookingsTableHeader } from './bookings-table/bookings-table-header';
import { statusLabels, paymentStatusLabels } from './bookings-table/utils';

export const BookingsTable = () => {
  const { admin } = useAdminAuth();
  const [appointments, setAppointments] = useState<AppointmentWithPatient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | 'all'>('all');

  const fetchAppointments = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await appointmentsApi.list(
        statusFilter === 'all'
          ? { pageSize: 20 }
          : {
              pageSize: 20,
              status: statusFilter,
            },
      );
      setAppointments(response.data as AppointmentWithPatient[]);
    } catch (error) {
      console.error('[admin] Failed to fetch appointments', error);
      toast.error('Unable to load bookings', {
        description: 'Please try again or check the identity-service.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    void fetchAppointments();
  }, [fetchAppointments]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchAppointments();
    setIsRefreshing(false);
  };

  const applyStatusUpdate = useCallback(
    async (appointment: AppointmentWithPatient, payload: UpdateAppointmentStatusPayload) => {
      try {
        setProcessingId(appointment._id);
        const updated = await appointmentsApi.updateStatus(appointment._id, payload);
        setAppointments((current) =>
          current.map((item) =>
            item._id === updated._id ? (updated as AppointmentWithPatient) : item,
          ),
        );
        toast.success('Appointment updated', {
          description: `Status set to ${statusLabels[payload.status]}`,
        });
      } catch (error) {
        console.error('[admin] Failed to update appointment status', error);
        toast.error('Unable to update appointment', {
          description: 'Please retry. If the issue persists, contact the platform team.',
        });
      } finally {
        setProcessingId(null);
      }
    },
    [],
  );

  const handleManualStatus = useCallback(
    (appointment: AppointmentWithPatient, status: AppointmentStatus) => {
      const defaultNote =
        status === 'confirmed'
          ? `Manual confirmation by ${admin?.name ?? admin?.email ?? 'Admin'}`
          : status === 'checked-in'
            ? `Marked checked-in by ${admin?.name ?? admin?.email ?? 'Admin'}`
            : status === 'in-session'
              ? `Marked in-session by ${admin?.name ?? admin?.email ?? 'Admin'}`
              : status === 'cancelled'
                ? `Manual cancellation by ${admin?.name ?? admin?.email ?? 'Admin'}`
                : status === 'no-show'
                  ? `Marked no-show by ${admin?.name ?? admin?.email ?? 'Admin'}`
                  : undefined;

      const note =
        typeof window !== 'undefined'
          ? window.prompt('Add an optional note for this manual action:', defaultNote ?? '')
          : defaultNote;

      if (note === null) {
        return;
      }

      void applyStatusUpdate(appointment, {
        status,
        notes: note?.trim() ? note.trim() : undefined,
      });
    },
    [admin?.email, admin?.name, applyStatusUpdate],
  );

  const applyPaymentUpdate = useCallback(
    async (appointment: AppointmentWithPatient, payload: UpdateAppointmentPaymentPayload) => {
      try {
        setProcessingId(appointment._id);
        const updated = await appointmentsApi.updatePayment(appointment._id, payload);
        setAppointments((current) =>
          current.map((item) =>
            item._id === updated._id ? (updated as AppointmentWithPatient) : item,
          ),
        );
        toast.success('Payment status updated', {
          description: `Payment marked ${paymentStatusLabels[payload.status]}`,
        });
      } catch (error) {
        console.error('[admin] Failed to update payment status', error);
        toast.error('Unable to update payment status', {
          description: 'Please retry. If this persists, contact the platform team.',
        });
      } finally {
        setProcessingId(null);
      }
    },
    [],
  );

  const handleManualPayment = useCallback(
    (appointment: AppointmentWithPatient, status: AppointmentPaymentStatus) => {
      const defaultNote =
        status === 'captured'
          ? `Payment marked captured by ${admin?.name ?? admin?.email ?? 'Admin'}`
          : status === 'failed'
            ? `Payment marked failed by ${admin?.name ?? admin?.email ?? 'Admin'}`
            : undefined;

      const note =
        typeof window !== 'undefined'
          ? window.prompt('Add an optional note for this payment action:', defaultNote ?? '')
          : defaultNote;

      if (note === null) {
        return;
      }

      void applyPaymentUpdate(appointment, {
        status,
        notes: note?.trim() ? note.trim() : undefined,
      });
    },
    [admin?.email, admin?.name, applyPaymentUpdate],
  );

  const handlePaymentUpdate = useCallback(
    (appointment: AppointmentWithPatient, status: AppointmentPaymentStatus) => {
      handleManualPayment(appointment, status);
    },
    [],
  );

  const handleStatusUpdate = useCallback(
    (appointment: AppointmentWithPatient, status: AppointmentStatus) => {
      handleManualStatus(appointment, status);
    },
    [],
  );

  const appointmentsContent = useMemo(() => {
    if (isLoading) {
      return (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-24 rounded-lg" />
          ))}
        </div>
      );
    }

    if (appointments.length === 0) {
      return (
        <div className="rounded-lg border border-border bg-muted/20 p-6 text-sm text-muted-foreground">
          No appointments found for the selected filters.
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {appointments.map((appointment) => (
          <AppointmentRow
            key={appointment._id}
            appointment={appointment}
            isProcessing={processingId === appointment._id}
            onPaymentUpdate={handlePaymentUpdate}
            onStatusUpdate={handleStatusUpdate}
          />
        ))}
      </div>
    );
  }, [appointments, isLoading, processingId, handlePaymentUpdate, handleStatusUpdate]);

  return (
    <Card className="rounded-lg border border-border bg-card shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle className="text-sm font-semibold uppercase tracking-[0.3em] text-muted-foreground">
              Booking oversight
            </CardTitle>
            <CardDescription>
              Track appointments, payment outcomes, and perform manual overrides.
            </CardDescription>
          </div>
          <BookingsTableHeader
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            isRefreshing={isRefreshing}
            onRefresh={handleRefresh}
          />
        </div>
      </CardHeader>
      <CardContent>{appointmentsContent}</CardContent>
    </Card>
  );
};
