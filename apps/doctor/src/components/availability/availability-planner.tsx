"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
} from "@illajwala/ui";
import { Plus, Save, Trash2, Undo2 } from "lucide-react";
import { toast } from "sonner";

type DayKey = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";

type AvailabilitySlot = {
  id: string;
  start: string;
  end: string;
  mode: "clinic" | "telehealth" | "home-visit";
  label: string;
};

type DaySchedule = {
  active: boolean;
  slots: AvailabilitySlot[];
};

type AvailabilityState = Record<DayKey, DaySchedule>;

const dayOrder: DayKey[] = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

const dayLabels: Record<DayKey, string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
};

const slotLabelDefaults: Record<AvailabilitySlot["mode"], string> = {
  clinic: "Primary clinic",
  telehealth: "Telehealth room",
  "home-visit": "Home visit",
};

const storageKey = (doctorId: string) => `illajwala:doctor:${doctorId}:availability`;

const createSlot = (): AvailabilitySlot => ({
  id: typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2, 10),
  start: "09:00",
  end: "12:00",
  mode: "clinic",
  label: slotLabelDefaults.clinic,
});

const createDefaultState = (): AvailabilityState =>
  dayOrder.reduce((acc, day) => {
    const isWeekday = ["monday", "tuesday", "wednesday", "thursday", "friday"].includes(day);
    acc[day] = {
      active: isWeekday,
      slots: isWeekday ? [createSlot()] : [],
    };
    return acc;
  }, {} as AvailabilityState);

const sanitiseState = (value: unknown): AvailabilityState | null => {
  if (!value || typeof value !== "object") {
    return null;
  }

  try {
    const parsed = value as AvailabilityState;
    const next: AvailabilityState = createDefaultState();

    for (const day of dayOrder) {
      const schedule = parsed[day];
      if (!schedule) {
        continue;
      }

      next[day] = {
        active: Boolean(schedule.active),
        slots: Array.isArray(schedule.slots) && schedule.slots.length > 0
          ? schedule.slots
              .filter((slot): slot is AvailabilitySlot => Boolean(slot && slot.start && slot.end))
              .map((slot) => ({
                ...slot,
                id: slot.id ?? createSlot().id,
                mode: slot.mode ?? "clinic",
                label: slot.label ?? slotLabelDefaults[slot.mode ?? "clinic"],
              }))
          : [],
      };
    }

    return next;
  } catch {
    return null;
  }
};

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

  const updateDay = useCallback((day: DayKey, updater: (current: DaySchedule) => DaySchedule) => {
    setAvailability((prev) => ({
      ...prev,
      [day]: updater(prev[day]),
    }));
  }, []);

  const toggleDay = (day: DayKey, active: boolean) => {
    updateDay(day, (current) => ({
      ...current,
      active,
      slots: active && current.slots.length === 0 ? [createSlot()] : current.slots,
    }));
  };

  const handleSlotChange = (day: DayKey, slotId: string, key: keyof AvailabilitySlot, value: string) => {
    updateDay(day, (current) => ({
      ...current,
      slots: current.slots.map((slot) => (slot.id === slotId ? { ...slot, [key]: value } : slot)),
    }));
  };

  const handleAddSlot = (day: DayKey) => {
    updateDay(day, (current) => ({
      ...current,
      active: true,
      slots: [...current.slots, createSlot()],
    }));
  };

  const handleRemoveSlot = (day: DayKey, slotId: string) => {
    updateDay(day, (current) => ({
      ...current,
      slots: current.slots.filter((slot) => slot.id !== slotId),
    }));
  };

  const handleReset = () => {
    const next = createDefaultState();
    savedSnapshotRef.current = next;
    setAvailability(next);
    window.localStorage.removeItem(storageKey(doctorId));
    toast.success("Availability reset", { description: "Weekly template restored to Illajwala defaults." });
  };

  const handleSave = () => {
    savedSnapshotRef.current = availability;
    window.localStorage.setItem(storageKey(doctorId), JSON.stringify(availability));
    toast.success("Availability synced", { description: "Slots saved locally. Backend sync will follow once appointment-service is online." });
  };

  const activeDays = useMemo(
    () =>
      dayOrder.filter((day) => availability[day]?.active).map((day) => dayLabels[day]),
    [availability]
  );

  return (
    <Card className="rounded-lg border border-border bg-card shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Weekly availability</CardTitle>
        <CardDescription>
          Publish slots for {clinicName ?? "your clinic"}. Stored locally until the scheduling service is connected.
        </CardDescription>
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <Badge variant="outline" className="rounded-full border border-primary/40 bg-primary/10 text-primary">
            Active days: {activeDays.length > 0 ? activeDays.join(", ") : "None"}
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
            {dayOrder.map((day) => {
              const schedule = availability[day];
              return (
                <div
                  key={day}
                  className="rounded-lg border border-border bg-background/40 p-5 transition-colors hover:border-primary/40 hover:bg-background/60"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                        {dayLabels[day]}
                      </p>
                      <p className="text-xs text-muted-foreground/80">
                        {schedule.active
                          ? `${schedule.slots.length} slot${schedule.slots.length === 1 ? "" : "s"} configured`
                          : "Day disabled"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                        <input
                          type="checkbox"
                          className="size-4 accent-primary"
                          checked={schedule.active}
                          onChange={(event) => toggleDay(day, event.target.checked)}
                        />
                        Open for bookings
                      </label>
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-full px-3 text-xs"
                        onClick={() => handleAddSlot(day)}
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
                              onChange={(event) => handleSlotChange(day, slot.id, "start", event.target.value)}
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-medium uppercase tracking-[0.28em] text-muted-foreground">
                              End
                            </label>
                            <Input
                              type="time"
                              value={slot.end}
                              onChange={(event) => handleSlotChange(day, slot.id, "end", event.target.value)}
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-medium uppercase tracking-[0.28em] text-muted-foreground">
                              Mode
                            </label>
                            <Select
                              value={slot.mode}
                              onValueChange={(value: AvailabilitySlot["mode"]) => handleSlotChange(day, slot.id, "mode", value)}
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
                              onChange={(event) => handleSlotChange(day, slot.id, "label", event.target.value)}
                            />
                          </div>
                          <div className="flex items-end justify-end">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleRemoveSlot(day, slot.id)}
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
            })}
          </div>
        )}
      </CardContent>

      <CardFooter className="flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-xs text-muted-foreground sm:text-sm">
          Changes are cached in your browser. Illajwala ops will migrate these templates once the scheduling API is live.
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="rounded-full px-4 text-xs sm:text-sm" onClick={handleReset} disabled={isLoading}>
            <Undo2 className="mr-2 h-4 w-4" />
            Reset
          </Button>
          <Button className="rounded-full px-4 text-xs sm:text-sm" onClick={handleSave} disabled={isLoading || !isDirty}>
            <Save className="mr-2 h-4 w-4" />
            Save template
          </Button>
        </div>
      </CardFooter>

      <Separator className="mx-6 mt-6 opacity-50" />

      <CardContent className="pb-6 pt-4 text-xs text-muted-foreground">
        Upcoming integration: these templates will sync with appointment locks, waitlist routing, and automated patient nudges once the appointment-service comes online in Sprint 2.
      </CardContent>
    </Card>
  );
};

