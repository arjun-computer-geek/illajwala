'use client';

import React from 'react';
import { Badge } from '@illajwala/ui';
import type { Appointment, AppointmentPaymentStatus } from '@illajwala/types';
import {
  statusLabels,
  statusVariants,
  paymentStatusLabels,
  amountFromMinor,
  formatDateLabel,
  formatTimeLabel,
} from './utils';
import { AppointmentActions } from './appointment-actions';

export type AppointmentWithPatient = Appointment & {
  patient?: {
    name?: string;
    email?: string;
    phone?: string;
  };
};

type AppointmentRowProps = {
  appointment: AppointmentWithPatient;
  isProcessing: boolean;
  onPaymentUpdate: (appointment: AppointmentWithPatient, status: AppointmentPaymentStatus) => void;
  onStatusUpdate: (appointment: AppointmentWithPatient, status: Appointment['status']) => void;
};

export const AppointmentRow = React.memo(
  ({ appointment, isProcessing, onPaymentUpdate, onStatusUpdate }: AppointmentRowProps) => {
    const paymentAmount = amountFromMinor(appointment.payment?.amount);
    const scheduledDate = formatDateLabel(appointment.scheduledAt);
    const scheduledTime = formatTimeLabel(appointment.scheduledAt);
    const paymentStatus = appointment.payment?.status ?? 'pending';

    return (
      <div className="flex flex-col gap-4 rounded-lg border border-border bg-background/40 px-5 py-4 transition-colors hover:border-primary/40 hover:bg-background/60">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <p className="text-base font-semibold text-foreground">
              {appointment.doctor.name} · {appointment.doctor.specialization}
            </p>
            <p className="text-xs text-muted-foreground">
              Patient: {appointment.patient?.name ?? 'Unknown'} ·{' '}
              {appointment.patient?.email ?? '—'}
            </p>
            <p className="text-xs text-muted-foreground/80">
              {scheduledDate} at {scheduledTime} · Mode {appointment.mode}
            </p>
          </div>
          <Badge
            variant={statusVariants[appointment.status] ?? 'outline'}
            className="w-fit rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.32em]"
          >
            {statusLabels[appointment.status]}
          </Badge>
        </div>

        <div className="grid gap-3 text-xs text-muted-foreground sm:grid-cols-4">
          <div>
            <p className="font-medium text-foreground">Payment status</p>
            <p>{paymentStatusLabels[paymentStatus]}</p>
          </div>
          <div>
            <p className="font-medium text-foreground">Amount</p>
            <p>{paymentAmount ? `₹${paymentAmount}` : '—'}</p>
          </div>
          <div>
            <p className="font-medium text-foreground">Order ID</p>
            <p className="break-all text-[11px]">{appointment.payment?.orderId ?? '—'}</p>
          </div>
          <div>
            <p className="font-medium text-foreground">Payment ID</p>
            <p className="break-all text-[11px]">{appointment.payment?.paymentId ?? '—'}</p>
          </div>
        </div>

        {appointment.notes ? (
          <div className="rounded-lg border border-border bg-muted/20 p-3 text-xs text-muted-foreground">
            {appointment.notes}
          </div>
        ) : null}

        <AppointmentActions
          appointment={appointment}
          paymentStatus={paymentStatus}
          isProcessing={isProcessing}
          onPaymentUpdate={onPaymentUpdate}
          onStatusUpdate={onStatusUpdate}
        />
      </div>
    );
  },
);

AppointmentRow.displayName = 'AppointmentRow';
