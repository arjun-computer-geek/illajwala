'use client';

import React from 'react';
import {
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@illajwala/ui';
import { Plus, Trash2 } from 'lucide-react';

type AvailabilitySlot = {
  id: string;
  start: string;
  end: string;
  mode: 'clinic' | 'telehealth' | 'home-visit';
  label: string;
};

type DaySchedule = {
  active: boolean;
  slots: AvailabilitySlot[];
};

type DayScheduleProps = {
  day: string;
  dayLabel: string;
  schedule: DaySchedule;
  slotLabelDefaults: Record<AvailabilitySlot['mode'], string>;
  onToggleActive: (active: boolean) => void;
  onAddSlot: () => void;
  onSlotChange: (slotId: string, key: keyof AvailabilitySlot, value: string) => void;
  onRemoveSlot: (slotId: string) => void;
};

export const DaySchedule = React.memo(
  ({
    day,
    dayLabel,
    schedule,
    slotLabelDefaults,
    onToggleActive,
    onAddSlot,
    onSlotChange,
    onRemoveSlot,
  }: DayScheduleProps) => {
    return (
      <div className="rounded-lg border border-border bg-background/40 p-5 transition-colors hover:border-primary/40 hover:bg-background/60">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-muted-foreground">
              {dayLabel}
            </p>
            <p className="text-xs text-muted-foreground/80">
              {schedule.active
                ? `${schedule.slots.length} slot${schedule.slots.length === 1 ? '' : 's'} configured`
                : 'Day disabled'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <input
                type="checkbox"
                className="size-4 accent-primary"
                checked={schedule.active}
                onChange={(event) => onToggleActive(event.target.checked)}
              />
              Open for bookings
            </label>
            <Button
              size="sm"
              variant="outline"
              className="rounded-full px-3 text-xs"
              onClick={onAddSlot}
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Add slot
            </Button>
          </div>
        </div>

        {schedule.active && schedule.slots.length > 0 && (
          <div className="mt-4 space-y-4">
            {schedule.slots.map((slot) => (
              <div
                key={slot.id}
                className="grid gap-3 rounded-xl border border-border/50 bg-muted/20 p-4 sm:grid-cols-[repeat(4,minmax(0,1fr))_auto]"
              >
                <div className="space-y-1">
                  <label className="text-xs font-medium uppercase tracking-[0.28em] text-muted-foreground">
                    Start
                  </label>
                  <Input
                    type="time"
                    value={slot.start}
                    onChange={(event) => onSlotChange(slot.id, 'start', event.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium uppercase tracking-[0.28em] text-muted-foreground">
                    End
                  </label>
                  <Input
                    type="time"
                    value={slot.end}
                    onChange={(event) => onSlotChange(slot.id, 'end', event.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium uppercase tracking-[0.28em] text-muted-foreground">
                    Mode
                  </label>
                  <Select
                    value={slot.mode}
                    onValueChange={(value: AvailabilitySlot['mode']) =>
                      onSlotChange(slot.id, 'mode', value)
                    }
                  >
                    <SelectTrigger className="text-left">
                      <SelectValue placeholder="Select mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="clinic">Clinic</SelectItem>
                      <SelectItem value="telehealth">Telehealth</SelectItem>
                      <SelectItem value="home-visit">Home visit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium uppercase tracking-[0.28em] text-muted-foreground">
                    Label
                  </label>
                  <Input
                    value={slot.label}
                    placeholder={slotLabelDefaults[slot.mode]}
                    onChange={(event) => onSlotChange(slot.id, 'label', event.target.value)}
                  />
                </div>
                <div className="flex items-end justify-end">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    onClick={() => onRemoveSlot(slot.id)}
                    aria-label="Remove slot"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  },
);

DaySchedule.displayName = 'DaySchedule';
