import type { AppointmentStatus, AppointmentPaymentStatus } from '@illajwala/types';

export const statusLabels: Record<AppointmentStatus, string> = {
  'pending-payment': 'Pending payment',
  confirmed: 'Confirmed',
  'checked-in': 'Checked in',
  'in-session': 'In session',
  completed: 'Completed',
  cancelled: 'Cancelled',
  'no-show': 'No show',
};

export const statusVariants: Record<
  AppointmentStatus,
  'outline' | 'secondary' | 'default' | 'destructive'
> = {
  'pending-payment': 'outline',
  confirmed: 'secondary',
  'checked-in': 'secondary',
  'in-session': 'secondary',
  completed: 'default',
  cancelled: 'destructive',
  'no-show': 'destructive',
};

export const statusFilterOptions: Array<{ value: AppointmentStatus | 'all'; label: string }> = [
  { value: 'all', label: 'All statuses' },
  { value: 'pending-payment', label: 'Pending payment' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'checked-in', label: 'Checked in' },
  { value: 'in-session', label: 'In session' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'no-show', label: 'No show' },
];

export const paymentStatusLabels: Record<AppointmentPaymentStatus, string> = {
  pending: 'Pending',
  authorized: 'Authorized',
  captured: 'Captured',
  failed: 'Failed',
};

export const amountFromMinor = (amount?: number | null) =>
  typeof amount === 'number' && Number.isFinite(amount) ? (amount / 100).toFixed(2) : undefined;

export const formatDateLabel = (value: string) =>
  new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));

export const formatTimeLabel = (value: string) =>
  new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
