'use client';

import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@illajwala/ui';
import type { WaitlistStatus } from '@illajwala/types';

type BulkActionsBarProps = {
  selectedCount: number;
  bulkActionStatus: WaitlistStatus | null;
  onBulkActionChange: (status: WaitlistStatus | null) => void;
  onApply: () => void;
  onClear: () => void;
};

export const BulkActionsBar = ({
  selectedCount,
  bulkActionStatus,
  onBulkActionChange,
  onApply,
  onClear,
}: BulkActionsBarProps) => {
  if (selectedCount === 0) {
    return null;
  }

  return (
    <div className="border-b border-border px-6 py-3 bg-muted/30">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          {selectedCount} {selectedCount === 1 ? 'entry' : 'entries'} selected
        </span>
        <div className="flex items-center gap-2">
          <Select
            value={bulkActionStatus ?? ''}
            onValueChange={(value) => onBulkActionChange(value as WaitlistStatus)}
          >
            <SelectTrigger className="h-8 w-[140px] text-xs">
              <SelectValue placeholder="Bulk action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="invited">Mark as Invited</SelectItem>
              <SelectItem value="cancelled">Cancel Selected</SelectItem>
            </SelectContent>
          </Select>
          {bulkActionStatus && (
            <Button size="sm" className="rounded-full px-3 text-xs" onClick={onApply}>
              Apply
            </Button>
          )}
          <Button variant="ghost" size="sm" className="rounded-full px-3 text-xs" onClick={onClear}>
            Clear
          </Button>
        </div>
      </div>
    </div>
  );
};
