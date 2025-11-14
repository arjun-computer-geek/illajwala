'use client';

import { Button } from '@illajwala/ui';

type DateRangeFilterProps = {
  startDate?: string;
  endDate?: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onRefresh: () => void;
};

export const DateRangeFilter = ({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onRefresh,
}: DateRangeFilterProps) => {
  return (
    <div className="flex items-center gap-2">
      <input
        type="date"
        value={startDate ?? ''}
        onChange={(e) => onStartDateChange(e.target.value)}
        className="rounded-md border border-input bg-background px-3 py-2 text-sm"
      />
      <span className="text-muted-foreground">to</span>
      <input
        type="date"
        value={endDate ?? ''}
        onChange={(e) => onEndDateChange(e.target.value)}
        className="rounded-md border border-input bg-background px-3 py-2 text-sm"
      />
      <Button variant="outline" size="sm" onClick={onRefresh}>
        Refresh
      </Button>
    </div>
  );
};
