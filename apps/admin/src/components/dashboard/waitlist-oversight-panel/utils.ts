import type { WaitlistEntry } from '@illajwala/types';

export const derivePatientLabel = (entry: WaitlistEntry) => {
  if (entry.patientId) {
    return entry.patientId;
  }
  return 'Unknown patient';
};

export const calculateAverageWaitMinutes = (entries: WaitlistEntry[]) => {
  if (!entries.length) {
    return null;
  }
  const now = Date.now();
  const total = entries.reduce((accumulator, entry) => {
    const created = new Date(entry.createdAt ?? Date.now()).getTime();
    return accumulator + (now - created);
  }, 0);
  const averageMs = total / entries.length;
  return Math.round(averageMs / 60000);
};
