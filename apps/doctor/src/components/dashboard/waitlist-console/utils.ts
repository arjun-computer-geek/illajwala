import type { WaitlistEntry } from '@illajwala/types';

export const derivePatientLabel = (entry: WaitlistEntry) => {
  if (entry.metadata && typeof entry.metadata.patientName === 'string') {
    return entry.metadata.patientName;
  }
  return entry.patientId;
};

export const formatDate = (value?: string | Date | null) => {
  if (!value) {
    return null;
  }
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};
