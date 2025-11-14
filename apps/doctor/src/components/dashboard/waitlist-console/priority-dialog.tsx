'use client';

import React from 'react';
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

type PriorityDialogProps = {
  entry: WaitlistEntry;
  priorityScore: number;
  isOpen: boolean;
  isProcessing: boolean;
  onClose: () => void;
  onSave: (priorityScore: number, notes?: string) => void;
};

export const PriorityDialog = ({
  entry,
  priorityScore,
  isOpen,
  isProcessing,
  onClose,
  onSave,
}: PriorityDialogProps) => {
  const [score, setScore] = React.useState(priorityScore);
  const [notes, setNotes] = React.useState('');

  React.useEffect(() => {
    if (isOpen) {
      setScore(priorityScore);
      setNotes('');
    }
  }, [isOpen, priorityScore]);

  const handleSave = () => {
    onSave(score, notes.trim() || undefined);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => (!open ? onClose() : undefined)}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Override Priority</DialogTitle>
          <DialogDescription>
            Adjust the priority score for this waitlist entry. Lower scores are promoted first.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="priority-score">Priority Score *</Label>
            <Input
              id="priority-score"
              type="number"
              min="0"
              value={score}
              onChange={(e) => setScore(parseInt(e.target.value, 10) || 0)}
            />
            <p className="text-xs text-muted-foreground">
              Current priority: {entry.priorityScore ?? 0}. Lower values = higher priority.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="priority-notes">Notes (optional)</Label>
            <Textarea
              id="priority-notes"
              placeholder="Reason for priority override..."
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
          <Button onClick={handleSave} disabled={isProcessing}>
            Update Priority
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
