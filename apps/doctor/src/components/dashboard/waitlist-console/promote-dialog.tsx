'use client';

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Textarea,
} from '@illajwala/ui';
import type { WaitlistEntry } from '@illajwala/types';
import React from 'react';

type PromoteDialogProps = {
  entry: WaitlistEntry;
  isOpen: boolean;
  isProcessing: boolean;
  onClose: () => void;
  onPromote: (appointmentId: string, notes?: string) => void;
};

export const PromoteDialog = ({
  entry,
  isOpen,
  isProcessing,
  onClose,
  onPromote,
}: PromoteDialogProps) => {
  const [appointmentId, setAppointmentId] = React.useState('');
  const [notes, setNotes] = React.useState('');

  React.useEffect(() => {
    if (isOpen) {
      setAppointmentId('');
      setNotes('');
    }
  }, [isOpen]);

  const handlePromote = () => {
    if (appointmentId.trim().length === 0) {
      return;
    }
    onPromote(appointmentId.trim(), notes.trim() || undefined);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => (!open ? onClose() : undefined)}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Promote waitlist entry</DialogTitle>
          <DialogDescription>
            Confirm the appointment reference to move this patient from the waitlist into a booked
            slot.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="appointment-id">Appointment reference *</Label>
            <Input
              id="appointment-id"
              value={appointmentId}
              onChange={(e) => setAppointmentId(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="promotion-notes">Internal notes (optional)</Label>
            <Textarea
              id="promotion-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={isProcessing}>
            Cancel
          </Button>
          <Button
            onClick={handlePromote}
            disabled={isProcessing || appointmentId.trim().length === 0}
          >
            Promote
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
