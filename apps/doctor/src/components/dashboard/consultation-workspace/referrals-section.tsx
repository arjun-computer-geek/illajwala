'use client';

import {
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from '@illajwala/ui';
import { UserRoundPlus, Plus, Trash2 } from 'lucide-react';
import React from 'react';

type ReferralDraft = {
  id: string;
  type: 'specialist' | 'lab' | 'imaging' | 'therapy' | 'other';
  specialty?: string;
  provider?: string;
  reason: string;
  priority?: 'routine' | 'urgent' | 'emergency';
  notes?: string;
};

type ReferralsSectionProps = {
  referrals: ReferralDraft[];
  onAdd: () => void;
  onUpdate: (id: string, field: keyof Omit<ReferralDraft, 'id'>, value: string | undefined) => void;
  onRemove: (id: string) => void;
};

export const ReferralsSection = ({
  referrals,
  onAdd,
  onUpdate,
  onRemove,
}: ReferralsSectionProps) => {
  return (
    <section className="space-y-4 rounded-2xl border border-border bg-background/60 p-5">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.28em] text-muted-foreground">
          <UserRoundPlus className="h-4 w-4" />
          Referrals
        </span>
        <Button size="sm" variant="outline" className="rounded-full px-3 text-xs" onClick={onAdd}>
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Add referral
        </Button>
      </div>
      {referrals.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border/60 bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
          Refer patients to specialists, labs, imaging centers, or therapy services. Include reason
          and priority.
        </p>
      ) : (
        <div className="space-y-3">
          {referrals.map((referral) => (
            <div
              key={referral.id}
              className="rounded-xl border border-border/60 bg-background/80 p-4 space-y-3"
            >
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                    Type *
                  </Label>
                  <Select
                    value={referral.type}
                    onValueChange={(value) =>
                      onUpdate(referral.id, 'type', value as ReferralDraft['type'])
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="specialist">Specialist</SelectItem>
                      <SelectItem value="lab">Lab</SelectItem>
                      <SelectItem value="imaging">Imaging</SelectItem>
                      <SelectItem value="therapy">Therapy</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {referral.type === 'specialist' && (
                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                      Specialty
                    </Label>
                    <Input
                      value={referral.specialty ?? ''}
                      placeholder="Cardiology"
                      onChange={(event) => onUpdate(referral.id, 'specialty', event.target.value)}
                    />
                  </div>
                )}
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                    Provider
                  </Label>
                  <Input
                    value={referral.provider ?? ''}
                    placeholder="Provider name or facility"
                    onChange={(event) => onUpdate(referral.id, 'provider', event.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                    Priority
                  </Label>
                  <Select
                    value={referral.priority ?? 'routine'}
                    onValueChange={(value) =>
                      onUpdate(referral.id, 'priority', value as ReferralDraft['priority'])
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="routine">Routine</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                      <SelectItem value="emergency">Emergency</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                  Reason *
                </Label>
                <Input
                  value={referral.reason}
                  placeholder="Reason for referral"
                  onChange={(event) => onUpdate(referral.id, 'reason', event.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                  Notes
                </Label>
                <Textarea
                  value={referral.notes ?? ''}
                  placeholder="Additional notes or instructions"
                  rows={2}
                  onChange={(event) => onUpdate(referral.id, 'notes', event.target.value)}
                />
              </div>
              <div className="flex items-center justify-end">
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="text-destructive hover:text-destructive"
                  onClick={() => onRemove(referral.id)}
                  aria-label="Remove referral"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
