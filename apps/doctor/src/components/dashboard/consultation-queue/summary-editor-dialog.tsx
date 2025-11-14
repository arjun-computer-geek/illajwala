'use client';

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Label,
  Textarea,
} from '@illajwala/ui';
import type { Appointment } from '@illajwala/types';
import React from 'react';

type SummaryEditorDialogProps = {
  appointment: Appointment;
  mode: 'complete' | 'update';
  isOpen: boolean;
  isProcessing: boolean;
  onClose: () => void;
  onSubmit: () => void;
  notes: string;
  followUps: string;
  onNotesChange: (notes: string) => void;
  onFollowUpsChange: (followUps: string) => void;
};

export const SummaryEditorDialog = ({
  appointment,
  mode,
  isOpen,
  isProcessing,
  onClose,
  onSubmit,
  notes,
  followUps,
  onNotesChange,
  onFollowUpsChange,
}: SummaryEditorDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => (!open ? onClose() : undefined)}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {mode === 'complete' ? 'Complete consultation' : 'Update visit summary'}
          </DialogTitle>
          <DialogDescription>
            Add visit notes and follow-up actions. Patients receive these details via email once you
            save.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="consultation-notes">Visit summary</Label>
            <Textarea
              id="consultation-notes"
              placeholder="Eg. Discussed medication schedule. Suggested lifestyle changes..."
              value={notes}
              onChange={(event) => onNotesChange(event.target.value)}
              rows={5}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="consultation-followups">Follow-up actions (one per line)</Label>
            <Textarea
              id="consultation-followups"
              placeholder={'Book follow-up visit in 4 weeks\nComplete blood test at partner lab'}
              value={followUps}
              onChange={(event) => onFollowUpsChange(event.target.value)}
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={isProcessing}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={isProcessing}>
            {mode === 'complete' ? 'Complete visit' : 'Save summary'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
