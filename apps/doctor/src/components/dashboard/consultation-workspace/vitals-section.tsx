'use client';

import { Button, Input, Label } from '@illajwala/ui';
import { HeartPulse, Plus, Trash2 } from 'lucide-react';
import React from 'react';

type VitalDraft = {
  id: string;
  label: string;
  value: string;
  unit?: string;
};

type VitalsSectionProps = {
  vitals: VitalDraft[];
  onAdd: () => void;
  onUpdate: (id: string, field: keyof Omit<VitalDraft, 'id'>, value: string) => void;
  onRemove: (id: string) => void;
};

export const VitalsSection = ({ vitals, onAdd, onUpdate, onRemove }: VitalsSectionProps) => {
  return (
    <section className="space-y-4 rounded-2xl border border-border bg-background/60 p-5">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.28em] text-muted-foreground">
          <HeartPulse className="h-4 w-4" />
          Vitals
        </span>
        <Button size="sm" variant="outline" className="rounded-full px-3 text-xs" onClick={onAdd}>
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Add vital
        </Button>
      </div>
      {vitals.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border/60 bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
          Log important readings captured during the consultation. These surface in the
          patient&apos;s summary.
        </p>
      ) : (
        <div className="space-y-3">
          {vitals.map((vital) => (
            <div
              key={vital.id}
              className="grid gap-3 rounded-xl border border-border/60 bg-background/80 p-4 sm:grid-cols-[auto_auto_auto_auto]"
            >
              <div className="space-y-1">
                <Label className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                  Label
                </Label>
                <Input
                  value={vital.label}
                  placeholder="Blood pressure"
                  onChange={(event) => onUpdate(vital.id, 'label', event.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                  Value
                </Label>
                <Input
                  value={vital.value}
                  placeholder="120/80"
                  onChange={(event) => onUpdate(vital.id, 'value', event.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                  Unit
                </Label>
                <Input
                  value={vital.unit ?? ''}
                  placeholder="mmHg"
                  onChange={(event) => onUpdate(vital.id, 'unit', event.target.value)}
                />
              </div>
              <div className="flex items-end justify-end">
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="text-destructive hover:text-destructive"
                  onClick={() => onRemove(vital.id)}
                  aria-label="Remove vital"
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
