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
  onAdd: (vital?: Partial<Omit<VitalDraft, 'id'>>) => void;
  onUpdate: (id: string, field: keyof Omit<VitalDraft, 'id'>, value: string) => void;
  onRemove: (id: string) => void;
};

const COMMON_VITALS = [
  { label: 'Blood Pressure', unit: 'mmHg', placeholder: '120/80' },
  { label: 'Heart Rate', unit: 'bpm', placeholder: '72' },
  { label: 'Temperature', unit: '°F', placeholder: '98.6' },
  { label: 'Oxygen Saturation', unit: '%', placeholder: '98' },
  { label: 'Respiratory Rate', unit: '/min', placeholder: '16' },
  { label: 'Weight', unit: 'kg', placeholder: '70' },
  { label: 'Height', unit: 'cm', placeholder: '170' },
  { label: 'BMI', unit: 'kg/m²', placeholder: '24.2' },
  { label: 'Blood Glucose', unit: 'mg/dL', placeholder: '95' },
];

export const VitalsSection = ({ vitals, onAdd, onUpdate, onRemove }: VitalsSectionProps) => {
  const handleQuickAdd = (vital: (typeof COMMON_VITALS)[0]) => {
    onAdd({
      label: vital.label,
      unit: vital.unit,
      value: '',
    });
  };

  return (
    <section className="space-y-4 rounded-2xl border border-border bg-background/60 p-5">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.28em] text-muted-foreground">
          <HeartPulse className="h-4 w-4" />
          Vitals
        </span>
        <Button
          size="sm"
          variant="outline"
          className="rounded-full px-3 text-xs"
          onClick={() => onAdd()}
        >
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Add custom
        </Button>
      </div>

      {vitals.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/60 bg-muted/30 p-4">
          <p className="text-xs text-muted-foreground mb-3">
            Log important readings captured during the consultation. These surface in the
            patient&apos;s summary.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {COMMON_VITALS.map((vital) => {
              const exists = vitals.some((v) => v.label === vital.label);
              return (
                <Button
                  key={vital.label}
                  type="button"
                  size="sm"
                  variant="outline"
                  className="text-xs"
                  disabled={exists}
                  onClick={() => handleQuickAdd(vital)}
                >
                  {vital.label}
                </Button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {vitals.map((vital) => {
            const commonVital = COMMON_VITALS.find((cv) => cv.label === vital.label);
            return (
              <div
                key={vital.id}
                className="grid gap-3 rounded-xl border border-border/60 bg-background/80 p-4 sm:grid-cols-[1fr_auto_auto_auto]"
              >
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                    Label
                  </Label>
                  <Input
                    value={vital.label}
                    placeholder="Blood pressure"
                    list={`vital-labels-${vital.id}`}
                    onChange={(event) => onUpdate(vital.id, 'label', event.target.value)}
                  />
                  <datalist id={`vital-labels-${vital.id}`}>
                    {COMMON_VITALS.map((cv) => (
                      <option key={cv.label} value={cv.label} />
                    ))}
                  </datalist>
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                    Value
                  </Label>
                  <Input
                    value={vital.value}
                    placeholder={commonVital?.placeholder ?? 'Value'}
                    onChange={(event) => onUpdate(vital.id, 'value', event.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                    Unit
                  </Label>
                  <Input
                    value={vital.unit ?? ''}
                    placeholder={commonVital?.unit ?? 'Unit'}
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
            );
          })}
          <div className="flex flex-col gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="w-full rounded-full text-xs"
              onClick={() => onAdd()}
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Add another vital
            </Button>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {COMMON_VITALS.map((vital) => {
                const exists = vitals.some((v) => v.label === vital.label);
                return (
                  <Button
                    key={vital.label}
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="text-xs"
                    disabled={exists}
                    onClick={() => handleQuickAdd(vital)}
                  >
                    + {vital.label}
                  </Button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
