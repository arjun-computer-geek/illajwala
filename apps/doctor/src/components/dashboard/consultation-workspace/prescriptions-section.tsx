'use client';

import { Button, Input, Label, Textarea } from '@illajwala/ui';
import { Pill, Plus, Trash2 } from 'lucide-react';
import React from 'react';

type PrescriptionDraft = {
  id: string;
  medication: string;
  dosage: string;
  frequency: string;
  duration?: string;
  instructions?: string;
  refills?: number;
};

type PrescriptionsSectionProps = {
  prescriptions: PrescriptionDraft[];
  onAdd: () => void;
  onUpdate: (
    id: string,
    field: keyof Omit<PrescriptionDraft, 'id'>,
    value: string | number | undefined,
  ) => void;
  onRemove: (id: string) => void;
};

export const PrescriptionsSection = ({
  prescriptions,
  onAdd,
  onUpdate,
  onRemove,
}: PrescriptionsSectionProps) => {
  return (
    <section className="space-y-4 rounded-2xl border border-border bg-background/60 p-5">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.28em] text-muted-foreground">
          <Pill className="h-4 w-4" />
          Prescriptions
        </span>
        <Button size="sm" variant="outline" className="rounded-full px-3 text-xs" onClick={onAdd}>
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Add prescription
        </Button>
      </div>
      {prescriptions.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border/60 bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
          Prescribe medications, dosages, and instructions. These will be included in the
          patient&apos;s visit summary.
        </p>
      ) : (
        <div className="space-y-3">
          {prescriptions.map((prescription) => (
            <div
              key={prescription.id}
              className="rounded-xl border border-border/60 bg-background/80 p-4 space-y-3"
            >
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                    Medication *
                  </Label>
                  <Input
                    value={prescription.medication}
                    placeholder="Paracetamol"
                    onChange={(event) =>
                      onUpdate(prescription.id, 'medication', event.target.value)
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                    Dosage *
                  </Label>
                  <Input
                    value={prescription.dosage}
                    placeholder="500mg"
                    onChange={(event) => onUpdate(prescription.id, 'dosage', event.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                    Frequency *
                  </Label>
                  <Input
                    value={prescription.frequency}
                    placeholder="Twice daily"
                    onChange={(event) => onUpdate(prescription.id, 'frequency', event.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                    Duration
                  </Label>
                  <Input
                    value={prescription.duration ?? ''}
                    placeholder="7 days"
                    onChange={(event) => onUpdate(prescription.id, 'duration', event.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                    Refills
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    value={prescription.refills ?? ''}
                    placeholder="0"
                    onChange={(event) =>
                      onUpdate(
                        prescription.id,
                        'refills',
                        event.target.value ? parseInt(event.target.value, 10) : undefined,
                      )
                    }
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                  Instructions
                </Label>
                <Textarea
                  value={prescription.instructions ?? ''}
                  placeholder="Take after meals. Avoid alcohol."
                  rows={2}
                  onChange={(event) =>
                    onUpdate(prescription.id, 'instructions', event.target.value)
                  }
                />
              </div>
              <div className="flex items-center justify-end">
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="text-destructive hover:text-destructive"
                  onClick={() => onRemove(prescription.id)}
                  aria-label="Remove prescription"
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
