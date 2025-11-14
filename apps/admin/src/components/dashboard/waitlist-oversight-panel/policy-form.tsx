'use client';

import React, { useCallback } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { Button, Input, Label, Textarea } from '@illajwala/ui';

type PolicyFormState = {
  maxQueueSize: string;
  autoExpiryHours: string;
  autoPromoteBufferMinutes: string;
  notes: string;
};

type PolicyFormProps = {
  form: PolicyFormState;
  onFormChange: (updater: (current: PolicyFormState) => PolicyFormState) => void;
  onSave: () => void;
  onReset: () => void;
  isSaving: boolean;
  isLoading: boolean;
  clinicLabel: string;
};

export const PolicyForm = React.memo(
  ({ form, onFormChange, onSave, onReset, isSaving, isLoading, clinicLabel }: PolicyFormProps) => {
    const handleMaxQueueSizeChange = useCallback(
      (value: string) => {
        onFormChange((current) => ({ ...current, maxQueueSize: value }));
      },
      [onFormChange],
    );

    const handleAutoExpiryHoursChange = useCallback(
      (value: string) => {
        onFormChange((current) => ({ ...current, autoExpiryHours: value }));
      },
      [onFormChange],
    );

    const handleAutoPromoteBufferMinutesChange = useCallback(
      (value: string) => {
        onFormChange((current) => ({ ...current, autoPromoteBufferMinutes: value }));
      },
      [onFormChange],
    );

    const handleNotesChange = useCallback(
      (value: string) => {
        onFormChange((current) => ({ ...current, notes: value }));
      },
      [onFormChange],
    );

    return (
      <div className="space-y-3 rounded-lg border border-border bg-background/40 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
              Waitlist policy
            </h3>
            <p className="text-[11px] text-muted-foreground/80">
              Adjust queue limits and expiry settings for {clinicLabel}.
            </p>
          </div>
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : null}
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1">
            <Label htmlFor="waitlist-max-queue">Max queue size</Label>
            <Input
              id="waitlist-max-queue"
              inputMode="numeric"
              value={form.maxQueueSize}
              onChange={(event) => handleMaxQueueSizeChange(event.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="waitlist-expiry-hours">Auto expiry (hours)</Label>
            <Input
              id="waitlist-expiry-hours"
              inputMode="numeric"
              value={form.autoExpiryHours}
              onChange={(event) => handleAutoExpiryHoursChange(event.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="waitlist-promote-buffer">Auto promote buffer (minutes)</Label>
            <Input
              id="waitlist-promote-buffer"
              inputMode="numeric"
              value={form.autoPromoteBufferMinutes}
              onChange={(event) => handleAutoPromoteBufferMinutesChange(event.target.value)}
            />
          </div>
        </div>

        <div className="space-y-1">
          <Label htmlFor="waitlist-notes">Notes (optional)</Label>
          <Textarea
            id="waitlist-notes"
            placeholder="Record rationale for policy changes (internal)"
            value={form.notes}
            onChange={(event) => handleNotesChange(event.target.value)}
            rows={3}
          />
          {form.notes.trim() ? (
            <div className="mt-1 inline-flex items-center gap-2 text-[11px] text-muted-foreground">
              <AlertTriangle className="h-3.5 w-3.5 text-primary" />
              Notes are not stored yet; add to runbooks if required.
            </div>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            className="rounded-full px-4 text-xs"
            onClick={onSave}
            disabled={isSaving || isLoading}
          >
            {isSaving ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : null}
            Save policy
          </Button>
          <Button size="sm" variant="ghost" className="rounded-full px-4 text-xs" onClick={onReset}>
            Reset
          </Button>
        </div>
      </div>
    );
  },
);

PolicyForm.displayName = 'PolicyForm';
