'use client';

import { Badge, Button, Label, Textarea } from '@illajwala/ui';
import { ClipboardList } from 'lucide-react';
import type { Appointment } from '@illajwala/types';

type NotesSectionProps = {
  appointment: Appointment;
  notes: string;
  followUps: string;
  onNotesChange: (notes: string) => void;
  onFollowUpsChange: (followUps: string) => void;
  onStartSession: () => void;
  canStartSession: boolean;
  isActiveSession: boolean;
  isSaving: boolean;
};

export const NotesSection = ({
  appointment,
  notes,
  followUps,
  onNotesChange,
  onFollowUpsChange,
  onStartSession,
  canStartSession,
  isActiveSession,
  isSaving,
}: NotesSectionProps) => {
  return (
    <section className="space-y-4 rounded-2xl border border-border bg-muted/20 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.28em] text-muted-foreground">
          <ClipboardList className="h-4 w-4" />
          Consultation notes
        </span>
        <div className="flex items-center gap-2">
          {canStartSession ? (
            <Button
              size="sm"
              className="rounded-full px-4 text-xs"
              disabled={isSaving}
              onClick={onStartSession}
            >
              Begin session
            </Button>
          ) : null}
          {isActiveSession ? (
            <Badge
              variant="secondary"
              className="rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.3em]"
            >
              Live
            </Badge>
          ) : null}
        </div>
      </div>

      <div className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor="workspace-notes">Visit summary</Label>
          <Textarea
            id="workspace-notes"
            rows={5}
            placeholder="Document key observations, next steps, and medication changes..."
            value={notes}
            onChange={(event) => onNotesChange(event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="workspace-followups">Follow-up actions (one per line)</Label>
          <Textarea
            id="workspace-followups"
            rows={3}
            placeholder={'Book follow-up visit in 2 weeks\nComplete lab tests before next visit'}
            value={followUps}
            onChange={(event) => onFollowUpsChange(event.target.value)}
          />
        </div>
      </div>
    </section>
  );
};
