export type DayKey =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

export type AvailabilitySlot = {
  id: string;
  start: string;
  end: string;
  mode: 'clinic' | 'telehealth' | 'home-visit';
  label: string;
};

export type DaySchedule = {
  active: boolean;
  slots: AvailabilitySlot[];
};

export type AvailabilityState = Record<DayKey, DaySchedule>;

export const dayOrder: DayKey[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];

export const dayLabels: Record<DayKey, string> = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday',
};

export const slotLabelDefaults: Record<AvailabilitySlot['mode'], string> = {
  clinic: 'Primary clinic',
  telehealth: 'Telehealth room',
  'home-visit': 'Home visit',
};

export const storageKey = (doctorId: string) => `illajwala:doctor:${doctorId}:availability`;

export const createSlot = (): AvailabilitySlot => ({
  id:
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2, 10),
  start: '09:00',
  end: '12:00',
  mode: 'clinic',
  label: slotLabelDefaults.clinic,
});

export const createDefaultState = (): AvailabilityState =>
  dayOrder.reduce((acc, day) => {
    const isWeekday = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].includes(day);
    acc[day] = {
      active: isWeekday,
      slots: isWeekday ? [createSlot()] : [],
    };
    return acc;
  }, {} as AvailabilityState);

export const sanitiseState = (value: unknown): AvailabilityState | null => {
  if (!value || typeof value !== 'object') {
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
        slots:
          Array.isArray(schedule.slots) && schedule.slots.length > 0
            ? schedule.slots
                .filter((slot): slot is AvailabilitySlot => Boolean(slot && slot.start && slot.end))
                .map((slot) => ({
                  ...slot,
                  id: slot.id ?? createSlot().id,
                  mode: slot.mode ?? 'clinic',
                  label: slot.label ?? slotLabelDefaults[slot.mode ?? 'clinic'],
                }))
            : [],
      };
    }

    return next;
  } catch {
    return null;
  }
};
