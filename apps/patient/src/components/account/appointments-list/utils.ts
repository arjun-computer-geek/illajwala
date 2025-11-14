import type { Appointment } from '@/types/api';

type ExtendedAppointment = Appointment & {
  feedback?: {
    rating?: number;
    comments?: string;
    submittedAt?: string;
  };
  telehealth?: {
    joinUrl?: string;
    url?: string;
    startUrl?: string;
    passcode?: string;
  };
};

export type { ExtendedAppointment };

export const sortAppointmentsBySchedule = (appointments: ExtendedAppointment[]) =>
  [...appointments].sort(
    (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
  );

export const upsertAppointment = (
  appointments: ExtendedAppointment[],
  incoming: ExtendedAppointment,
) => {
  const next = appointments.filter((appointment) => appointment._id !== incoming._id);
  next.push(incoming);
  return sortAppointmentsBySchedule(next);
};

export const removeAppointment = (appointments: ExtendedAppointment[], appointmentId: string) =>
  appointments.filter((appointment) => appointment._id !== appointmentId);

export const deriveTelehealthLink = (appointment: ExtendedAppointment) =>
  appointment.telehealth?.joinUrl ??
  appointment.telehealth?.url ??
  appointment.telehealth?.startUrl ??
  null;
