'use client';

import React from 'react';
import { Badge } from '@illajwala/ui';
import { formatDistanceToNowStrict } from 'date-fns';
import type { WaitlistEntry } from '@illajwala/types';

type WaitlistEntryItemProps = {
  entry: WaitlistEntry;
};

const derivePatientLabel = (entry: WaitlistEntry) => {
  if (entry.patientId) {
    return entry.patientId;
  }
  return 'Unknown patient';
};

export const WaitlistEntryItem = React.memo(({ entry }: WaitlistEntryItemProps) => {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-background/50 px-4 py-3 text-xs text-muted-foreground/90">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold text-foreground">{derivePatientLabel(entry)}</span>
        <Badge
          variant="outline"
          className="rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.3em]"
        >
          {entry.status}
        </Badge>
        {entry.clinicId ? (
          <Badge
            variant="secondary"
            className="rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.3em]"
          >
            Clinic {entry.clinicId}
          </Badge>
        ) : null}
        {entry.priorityScore ? (
          <Badge
            variant="outline"
            className="rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.3em]"
          >
            Priority {entry.priorityScore}
          </Badge>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <span>
          Added{' '}
          {entry.createdAt
            ? formatDistanceToNowStrict(new Date(entry.createdAt), {
                addSuffix: true,
              })
            : 'recently'}
        </span>
        {entry.requestedWindow?.start || entry.requestedWindow?.end ? (
          <span className="inline-flex items-center gap-2 rounded-full bg-muted/30 px-3 py-1">
            {entry.requestedWindow?.start
              ? new Date(entry.requestedWindow.start).toLocaleString()
              : 'Any'}{' '}
            –{' '}
            {entry.requestedWindow?.end
              ? new Date(entry.requestedWindow.end).toLocaleString()
              : 'Any'}
          </span>
        ) : null}
        {entry.expiresAt ? <span>Expires {new Date(entry.expiresAt).toLocaleString()}</span> : null}
      </div>
      {entry.notes ? (
        <p className="text-xs text-muted-foreground/80">Notes: {entry.notes}</p>
      ) : null}
    </div>
  );
});

WaitlistEntryItem.displayName = 'WaitlistEntryItem';
