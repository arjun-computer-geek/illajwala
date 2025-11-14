import type { Appointment } from '@illajwala/types';

export const formatTimeRange = (scheduledAt: string) =>
  new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' }).format(
    new Date(scheduledAt),
  );

export const statusBadgeVariant: Partial<
  Record<Appointment['status'], 'default' | 'secondary' | 'outline' | 'destructive'>
> = {
  confirmed: 'secondary',
  'checked-in': 'secondary',
  'in-session': 'default',
  completed: 'default',
  cancelled: 'destructive',
  'no-show': 'destructive',
};

export const statusCopy: Record<Appointment['status'], string> = {
  'pending-payment': 'Pending payment',
  confirmed: 'Confirmed',
  'checked-in': 'Checked in',
  'in-session': 'In session',
  completed: 'Completed',
  cancelled: 'Cancelled',
  'no-show': 'No show',
};

export const emptyCopy: Record<
  'today' | 'upcoming' | 'completed',
  { title: string; description: string }
> = {
  today: {
    title: 'All set for today',
    description: 'Your confirmed and active consultations will appear here once patients check in.',
  },
  upcoming: {
    title: 'No upcoming consults',
    description:
      'Once bookings are confirmed, they will show up with reminders and patient summaries.',
  },
  completed: {
    title: 'No recent visits logged',
    description: 'Closing a consultation will place the visit summary here for quick access.',
  },
};
