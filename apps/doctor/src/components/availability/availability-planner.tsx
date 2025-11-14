'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Separator,
} from '@illajwala/ui';
import { Save, Undo2 } from 'lucide-react';
import { toast } from 'sonner';
import { DaySchedule } from './day-schedule';
import {
  dayOrder,
  dayLabels,
  slotLabelDefaults,
  storageKey,
  createDefaultState,
  sanitiseState,
  createSlot,
  type AvailabilityState,
  type DayKey,
} from './utils';

type AvailabilityPlannerProps = {
  doctorId: string;
  clinicName?: string | null;
};

export const AvailabilityPlanner = ({ doctorId, clinicName }: AvailabilityPlannerProps) => {
  const [availability, setAvailability] = useState<AvailabilityState>(() => createDefaultState());
  const savedSnapshotRef = useRef<AvailabilityState>(createDefaultState());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!doctorId) {
      return;
    }

    const storedRaw = window.localStorage.getItem(storageKey(doctorId));
    if (!storedRaw) {
      savedSnapshotRef.current = createDefaultState();
      setAvailability(createDefaultState());
      setIsLoading(false);
      return;
    }

    try {
      const parsed = JSON.parse(storedRaw);
      const sanitised = sanitiseState(parsed);
      if (sanitised) {
        savedSnapshotRef.current = sanitised;
        setAvailability(sanitised);
      } else {
        savedSnapshotRef.current = createDefaultState();
        setAvailability(createDefaultState());
      }
    } catch {
      savedSnapshotRef.current = createDefaultState();
      setAvailability(createDefaultState());
    } finally {
      setIsLoading(false);
    }
  }, [doctorId]);

  const isDirty = useMemo(() => {
    return JSON.stringify(availability) !== JSON.stringify(savedSnapshotRef.current);
  }, [availability]);

  const updateDay = useCallback(
    (
      day: DayKey,
      updater: (current: import('./utils').DaySchedule) => import('./utils').DaySchedule,
    ) => {
      setAvailability((prev) => ({
        ...prev,
        [day]: updater(prev[day]),
      }));
    },
    [],
  );

  const toggleDay = useCallback(
    (day: DayKey, active: boolean) => {
      updateDay(day, (current) => ({
        ...current,
        active,
        slots: active && current.slots.length === 0 ? [createSlot()] : current.slots,
      }));
    },
    [updateDay],
  );

  const handleSlotChange = useCallback(
    (day: DayKey, slotId: string, key: keyof import('./utils').AvailabilitySlot, value: string) => {
      updateDay(day, (current) => ({
        ...current,
        slots: current.slots.map((slot) => (slot.id === slotId ? { ...slot, [key]: value } : slot)),
      }));
    },
    [updateDay],
  );

  const handleAddSlot = useCallback(
    (day: DayKey) => {
      updateDay(day, (current) => ({
        ...current,
        active: true,
        slots: [...current.slots, createSlot()],
      }));
    },
    [updateDay],
  );

  const handleRemoveSlot = useCallback(
    (day: DayKey, slotId: string) => {
      updateDay(day, (current) => ({
        ...current,
        slots: current.slots.filter((slot) => slot.id !== slotId),
      }));
    },
    [updateDay],
  );

  const handleReset = useCallback(() => {
    const next = createDefaultState();
    savedSnapshotRef.current = next;
    setAvailability(next);
    window.localStorage.removeItem(storageKey(doctorId));
    toast.success('Availability reset', {
      description: 'Weekly template restored to Illajwala defaults.',
    });
  }, [doctorId]);

  const handleSave = useCallback(() => {
    savedSnapshotRef.current = availability;
    window.localStorage.setItem(storageKey(doctorId), JSON.stringify(availability));
    toast.success('Availability synced', {
      description:
        'Slots saved locally. Backend sync will follow once appointment-service is online.',
    });
  }, [availability, doctorId]);

  const activeDays = useMemo(
    () => dayOrder.filter((day) => availability[day]?.active).map((day) => dayLabels[day]),
    [availability],
  );

  return (
    <Card className="rounded-lg border border-border bg-card shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Weekly availability</CardTitle>
        <CardDescription>
          Publish slots for {clinicName ?? 'your clinic'}. Stored locally until the scheduling
          service is connected.
        </CardDescription>
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <Badge
            variant="outline"
            className="rounded-full border border-primary/40 bg-primary/10 text-primary"
          >
            Active days: {activeDays.length > 0 ? activeDays.join(', ') : 'None'}
          </Badge>
          <Badge variant="outline" className="rounded-full border border-border/50">
            Autosave: manual
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-20 animate-pulse rounded-xl bg-muted/40" />
            ))}
          </div>
        ) : (
          <div className="space-y-5">
            {dayOrder.map((day) => (
              <DaySchedule
                key={day}
                day={day}
                dayLabel={dayLabels[day]}
                schedule={availability[day]}
                slotLabelDefaults={slotLabelDefaults}
                onToggleActive={(active) => toggleDay(day, active)}
                onAddSlot={() => handleAddSlot(day)}
                onSlotChange={(slotId, key, value) => handleSlotChange(day, slotId, key, value)}
                onRemoveSlot={(slotId) => handleRemoveSlot(day, slotId)}
              />
            ))}
          </div>
        )}
      </CardContent>

      <CardFooter className="flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-xs text-muted-foreground sm:text-sm">
          Changes are cached in your browser. Illajwala ops will migrate these templates once the
          scheduling API is live.
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="rounded-full px-4 text-xs sm:text-sm"
            onClick={handleReset}
            disabled={isLoading}
          >
            <Undo2 className="mr-2 h-4 w-4" />
            Reset
          </Button>
          <Button
            className="rounded-full px-4 text-xs sm:text-sm"
            onClick={handleSave}
            disabled={isLoading || !isDirty}
          >
            <Save className="mr-2 h-4 w-4" />
            Save template
          </Button>
        </div>
      </CardFooter>

      <Separator className="mx-6 mt-6 opacity-50" />

      <CardContent className="pb-6 pt-4 text-xs text-muted-foreground">
        Upcoming integration: these templates will sync with appointment locks, waitlist routing,
        and automated patient nudges once the appointment-service comes online in Sprint 2.
      </CardContent>
    </Card>
  );
};
