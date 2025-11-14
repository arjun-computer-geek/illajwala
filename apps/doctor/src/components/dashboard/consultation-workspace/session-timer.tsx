'use client';

import { Alert, AlertDescription, AlertTitle } from '@illajwala/ui';
import { CalendarClock, Timer, TimerReset } from 'lucide-react';
import React from 'react';

type SessionTimerProps = {
  scheduleLabel: string;
  elapsed: string;
};

export const SessionTimer = ({ scheduleLabel, elapsed }: SessionTimerProps) => {
  return (
    <Alert className="rounded-2xl border border-primary/40 bg-primary/5 text-sm text-primary">
      <AlertTitle className="flex items-center gap-2 text-sm font-semibold">
        <Timer className="h-4 w-4" />
        Session timer
      </AlertTitle>
      <AlertDescription className="flex flex-wrap items-center gap-3 text-xs sm:text-sm">
        <span className="inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-1.5 text-primary shadow-sm">
          <CalendarClock className="h-4 w-4" />
          {scheduleLabel}
        </span>
        <span className="inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-1.5 text-primary shadow-sm">
          <TimerReset className="h-4 w-4" />
          {elapsed}
        </span>
      </AlertDescription>
    </Alert>
  );
};
