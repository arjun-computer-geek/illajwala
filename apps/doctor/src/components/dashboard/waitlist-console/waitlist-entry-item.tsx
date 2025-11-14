'use client';

import { Badge, Button, Checkbox } from '@illajwala/ui';
import { ArrowUpDown, Trash2 } from 'lucide-react';
import type { WaitlistEntry } from '@illajwala/types';

type WaitlistEntryItemProps = {
  entry: WaitlistEntry;
  isSelected: boolean;
  isProcessing: boolean;
  onSelect: () => void;
  onStatusUpdate: (status: WaitlistEntry['status'], notes?: string) => void;
  onPromote: () => void;
  onPriorityOverride: () => void;
  notesDraft: string;
  statusBadgeVariant: Partial<
    Record<WaitlistEntry['status'], 'default' | 'secondary' | 'outline' | 'destructive'>
  >;
  derivePatientLabel: (entry: WaitlistEntry) => string;
  formatDate: (value?: string | Date | null) => string | null;
};

export const WaitlistEntryItem = ({
  entry,
  isSelected,
  isProcessing,
  onSelect,
  onStatusUpdate,
  onPromote,
  onPriorityOverride,
  notesDraft,
  statusBadgeVariant,
  derivePatientLabel,
  formatDate,
}: WaitlistEntryItemProps) => {
  return (
    <div
      className={`flex flex-col gap-3 rounded-2xl border p-5 transition duration-200 md:flex-row md:items-center md:justify-between ${
        isSelected
          ? 'border-primary bg-primary/5'
          : 'border-border bg-background/60 hover:border-primary/40 hover:bg-background/80'
      }`}
    >
      <div className="flex items-start gap-3 flex-1">
        <Checkbox checked={isSelected} onCheckedChange={onSelect} className="mt-1" />
        <div className="space-y-2 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold text-foreground">{derivePatientLabel(entry)}</h3>
            <Badge
              variant={statusBadgeVariant[entry.status] ?? 'outline'}
              className="rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.3em]"
            >
              {entry.status}
            </Badge>
            {entry.priorityScore ? (
              <Badge
                variant="outline"
                className="rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.3em]"
              >
                Priority {entry.priorityScore}
              </Badge>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground/90">
            {entry.requestedWindow?.notes ? (
              <span className="inline-flex items-center gap-2 rounded-full bg-muted/30 px-3 py-1">
                {entry.requestedWindow.notes}
              </span>
            ) : null}
            {entry.requestedWindow?.start || entry.requestedWindow?.end ? (
              <span className="inline-flex items-center gap-2 rounded-full bg-muted/30 px-3 py-1">
                {formatDate(entry.requestedWindow?.start) ?? 'Any'} –{' '}
                {formatDate(entry.requestedWindow?.end) ?? 'Any'}
              </span>
            ) : null}
            {entry.expiresAt ? (
              <span className="inline-flex items-center gap-2 rounded-full bg-muted/30 px-3 py-1">
                Expires {formatDate(entry.expiresAt)}
              </span>
            ) : null}
          </div>
          {entry.notes ? (
            <div className="rounded-xl border border-dashed border-border/50 bg-muted/20 p-3 text-xs text-muted-foreground/90">
              <p className="font-medium text-foreground">Notes</p>
              <p>{entry.notes}</p>
            </div>
          ) : null}
        </div>
      </div>
      <div className="flex flex-col gap-2 md:w-60">
        <div className="flex gap-2">
          {entry.status === 'active' ? (
            <Button
              variant="secondary"
              className="rounded-full px-4 text-xs flex-1"
              disabled={isProcessing}
              onClick={() => void onStatusUpdate('invited', notesDraft.trim() || undefined)}
            >
              Send invite
            </Button>
          ) : null}
          {entry.status === 'invited' ? (
            <Button
              variant="secondary"
              className="rounded-full px-4 text-xs flex-1"
              disabled={isProcessing}
              onClick={onPromote}
            >
              Promote
            </Button>
          ) : null}
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="rounded-full px-3 text-xs"
            disabled={isProcessing}
            onClick={onPriorityOverride}
            title="Override priority"
          >
            <ArrowUpDown className="h-3 w-3" />
          </Button>
          {entry.status !== 'cancelled' && entry.status !== 'promoted' ? (
            <Button
              variant="ghost"
              size="sm"
              className="rounded-full px-3 text-xs text-destructive"
              disabled={isProcessing}
              onClick={() => void onStatusUpdate('cancelled', notesDraft.trim() || undefined)}
              title="Cancel entry"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
};
