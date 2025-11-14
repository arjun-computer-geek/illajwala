'use client';

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@illajwala/ui';
import type { Appointment } from '@illajwala/types';

type NoShowDialogProps = {
  appointment: Appointment | null;
  isOpen: boolean;
  isProcessing: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export const NoShowDialog = ({
  appointment,
  isOpen,
  isProcessing,
  onClose,
  onConfirm,
}: NoShowDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => (!open ? onClose() : undefined)}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Mark as no-show?</DialogTitle>
          <DialogDescription>
            We&apos;ll notify the patient and keep the appointment in your completed list for
            reference.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={isProcessing}>
            Keep pending
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isProcessing}>
            Confirm no-show
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
