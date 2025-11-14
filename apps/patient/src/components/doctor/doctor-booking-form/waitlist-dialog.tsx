'use client';

import React, { useCallback, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { patientWaitlistsApi } from '@/lib/api/waitlists';
import { queryKeys } from '@/lib/query-keys';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/errors';

type WaitlistDialogProps = {
  doctorId: string;
  clinicId?: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
};

export const WaitlistDialog = React.memo(
  ({ doctorId, clinicId, isOpen, onClose, onSuccess }: WaitlistDialogProps) => {
    const { patient } = useAuth();
    const queryClient = useQueryClient();
    const [preferredStart, setPreferredStart] = useState('');
    const [preferredEnd, setPreferredEnd] = useState('');
    const [notes, setNotes] = useState('');

    const joinMutation = useMutation({
      mutationFn: () => {
        if (!patient?._id) {
          throw new Error('Patient ID required');
        }

        const requestedWindow =
          preferredStart || preferredEnd
            ? {
                start: preferredStart || undefined,
                end: preferredEnd || undefined,
                notes: notes || undefined,
              }
            : undefined;

        return patientWaitlistsApi.create({
          patientId: patient._id,
          doctorId,
          clinicId,
          requestedWindow,
          notes: notes || undefined,
        });
      },
      onSuccess: () => {
        toast.success("You've been added to the waitlist!");
        void queryClient.invalidateQueries({ queryKey: queryKeys.waitlists() });
        setPreferredStart('');
        setPreferredEnd('');
        setNotes('');
        onSuccess?.();
        onClose();
      },
      onError: (error) => {
        toast.error(getErrorMessage(error, 'Failed to join waitlist. Please try again.'));
      },
    });

    const handleClose = useCallback(() => {
      setPreferredStart('');
      setPreferredEnd('');
      setNotes('');
      onClose();
    }, [onClose]);

    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Join Waitlist</DialogTitle>
            <DialogDescription>
              We'll notify you when slots become available. You can specify preferred times if you'd
              like.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="preferred-start">Preferred start time (optional)</Label>
              <Input
                id="preferred-start"
                type="datetime-local"
                value={preferredStart}
                onChange={(e) => setPreferredStart(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="preferred-end">Preferred end time (optional)</Label>
              <Input
                id="preferred-end"
                type="datetime-local"
                value={preferredEnd}
                onChange={(e) => setPreferredEnd(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="waitlist-notes">Additional notes (optional)</Label>
              <Textarea
                id="waitlist-notes"
                placeholder="Any specific requirements or preferences..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button onClick={() => joinMutation.mutate()} disabled={joinMutation.isPending}>
              {joinMutation.isPending ? 'Joining...' : 'Join Waitlist'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  },
);

WaitlistDialog.displayName = 'WaitlistDialog';
