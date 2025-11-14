import { env } from '../../config/env';
import type { ConsultationEvent } from '../types/consultation-event';

type TemplateContextValue = string | number | undefined | null | string[];

type TemplateContext = Record<string, TemplateContextValue>;

const templatePattern = /{{\s*([a-zA-Z0-9_.-]+)(?:\|([^}]+))?\s*}}/g;

export const renderTemplate = (template: string, context: TemplateContext): string =>
  template.replace(templatePattern, (_match, key, fallback) => {
    const rawValue = context[key];
    if (
      rawValue === undefined ||
      rawValue === null ||
      (typeof rawValue === 'string' && rawValue.length === 0)
    ) {
      return fallback ?? '';
    }

    if (Array.isArray(rawValue)) {
      return rawValue.join(', ');
    }

    return String(rawValue);
  });

const statusLabels: Partial<Record<ConsultationEvent['type'], string>> = {
  'consultation.checked-in': 'checked in',
  'consultation.in-session': 'in session',
  'consultation.completed': 'completed',
  'consultation.no-show': 'marked as no-show',
};

const deriveDoctorShortName = (doctorName?: string) => {
  if (!doctorName) {
    return 'your doctor';
  }
  const [first] = doctorName.split(' ').filter(Boolean);
  return first ?? doctorName;
};

const formatScheduledTime = (value: string, locale: string) =>
  new Intl.DateTimeFormat(locale, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));

export type ConsultationTemplateContext = {
  patientName: string;
  doctorName: string;
  doctorShortName: string;
  statusLabel: string;
  scheduledTime: string;
  notes?: string | null;
  followUpActions: string[];
};

export const buildConsultationContext = (event: ConsultationEvent): ConsultationTemplateContext => {
  const locale = env.DEFAULT_LOCALE ?? 'en';
  const followUpActions = Array.isArray(event.metadata?.followUpActions)
    ? (event.metadata?.followUpActions as string[]).map((item) => String(item))
    : [];
  const notes =
    event.metadata &&
    typeof event.metadata.notes === 'string' &&
    event.metadata.notes.trim().length > 0
      ? event.metadata.notes
      : null;

  return {
    patientName: event.patientName ?? 'there',
    doctorName: event.doctorName ?? 'your Illajwala doctor',
    doctorShortName: deriveDoctorShortName(event.doctorName),
    statusLabel: statusLabels[event.type] ?? 'updated',
    scheduledTime: formatScheduledTime(event.scheduledAt, locale),
    notes,
    followUpActions,
  };
};
