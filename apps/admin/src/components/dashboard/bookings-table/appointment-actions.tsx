'use client';

import React from 'react';
import { Button } from '@illajwala/ui';
import type { AppointmentStatus, AppointmentPaymentStatus } from '@illajwala/types';
import { CreditCard, XCircle, AlertCircle, Clock, PlayCircle, Ban } from 'lucide-react';
import type { AppointmentWithPatient } from './appointment-row';

type AppointmentActionsProps = {
  appointment: AppointmentWithPatient;
  paymentStatus: AppointmentPaymentStatus;
  isProcessing: boolean;
  onPaymentUpdate: (appointment: AppointmentWithPatient, status: AppointmentPaymentStatus) => void;
  onStatusUpdate: (appointment: AppointmentWithPatient, status: AppointmentStatus) => void;
};

export const AppointmentActions = React.memo(
  ({
    appointment,
    paymentStatus,
    isProcessing,
    onPaymentUpdate,
    onStatusUpdate,
  }: AppointmentActionsProps) => {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          className="gap-2 rounded-full px-4 text-xs"
          onClick={() => onPaymentUpdate(appointment, 'captured')}
          disabled={isProcessing || paymentStatus === 'captured'}
        >
          <CreditCard className="h-3.5 w-3.5" />
          Mark payment captured
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="gap-2 rounded-full px-4 text-xs"
          onClick={() => onPaymentUpdate(appointment, 'failed')}
          disabled={isProcessing || paymentStatus === 'failed'}
        >
          <AlertCircle className="h-3.5 w-3.5" />
          Mark payment failed
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="gap-2 rounded-full px-4 text-xs"
          onClick={() => onStatusUpdate(appointment, 'checked-in')}
          disabled={isProcessing || appointment.status === 'checked-in'}
        >
          <Clock className="h-3.5 w-3.5" />
          Mark checked in
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="gap-2 rounded-full px-4 text-xs"
          onClick={() => onStatusUpdate(appointment, 'in-session')}
          disabled={isProcessing || appointment.status === 'in-session'}
        >
          <PlayCircle className="h-3.5 w-3.5" />
          Mark in session
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="gap-2 rounded-full px-4 text-xs"
          onClick={() => onStatusUpdate(appointment, 'no-show')}
          disabled={isProcessing || appointment.status === 'no-show'}
        >
          <Ban className="h-3.5 w-3.5" />
          Mark no-show
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="gap-2 rounded-full px-4 text-xs"
          onClick={() => onStatusUpdate(appointment, 'cancelled')}
          disabled={isProcessing || appointment.status === 'cancelled'}
        >
          <XCircle className="h-3.5 w-3.5" />
          Cancel appointment
        </Button>
      </div>
    );
  },
);

AppointmentActions.displayName = 'AppointmentActions';
