'use client';

import React from 'react';
import { Badge } from '@illajwala/ui';
import type { WaitlistEntry } from '@illajwala/types';

type StatusBuckets = Record<WaitlistEntry['status'], WaitlistEntry[]>;

type StatusBadgesProps = {
  buckets: StatusBuckets;
};

export const StatusBadges = React.memo(({ buckets }: StatusBadgesProps) => {
  return (
    <div className="flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
      <Badge
        variant="secondary"
        className="rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.3em]"
      >
        Active {buckets.active.length}
      </Badge>
      <Badge
        variant="outline"
        className="rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.3em]"
      >
        Invited {buckets.invited.length}
      </Badge>
      <Badge
        variant="outline"
        className="rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.3em]"
      >
        Promoted {buckets.promoted.length}
      </Badge>
      <Badge
        variant="outline"
        className="rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.3em]"
      >
        Expired {buckets.expired.length}
      </Badge>
      <Badge
        variant="outline"
        className="rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.3em]"
      >
        Cancelled {buckets.cancelled.length}
      </Badge>
    </div>
  );
});

StatusBadges.displayName = 'StatusBadges';
