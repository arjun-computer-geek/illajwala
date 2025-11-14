import { useEffect, useState } from 'react';
import type { Appointment } from '@/types/api';

const countdownEligibleStatuses: Appointment['status'][] = [
  'pending-payment',
  'confirmed',
  'checked-in',
];

const computeCountdownLabel = (scheduledAt: string, status: Appointment['status']) => {
  if (!countdownEligibleStatuses.includes(status)) {
    return null;
  }

  const target = new Date(scheduledAt).getTime();
  const difference = target - Date.now();

  // Past the window: no countdown shown once the visit is 45 minutes in the past.
  if (difference <= -45 * 60 * 1000) {
    return null;
  }

  if (difference <= 0) {
    return 'Starting now';
  }

  const seconds = Math.floor(difference / 1000);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  if (minutes > 0) {
    return `${minutes}m ${remainingSeconds.toString().padStart(2, '0')}s`;
  }

  return `${remainingSeconds}s`;
};

export const useCountdown = (scheduledAt: string, status: Appointment['status']) => {
  const [label, setLabel] = useState<string | null>(() =>
    computeCountdownLabel(scheduledAt, status),
  );

  useEffect(() => {
    setLabel(computeCountdownLabel(scheduledAt, status));

    if (!countdownEligibleStatuses.includes(status)) {
      return;
    }

    const interval = window.setInterval(() => {
      setLabel(computeCountdownLabel(scheduledAt, status));
    }, 1000);

    return () => window.clearInterval(interval);
  }, [scheduledAt, status]);

  return label;
};
