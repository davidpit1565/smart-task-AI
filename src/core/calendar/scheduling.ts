import { eventsOverlap } from './calendarEvent.types';

export interface TimeSlot {
  start: string;
  end: string;
}

export interface WorkingHours {
  /** Minutes from midnight, e.g. 9:00 = 540. */
  startMinute: number;
  /** Minutes from midnight, e.g. 18:00 = 1080. */
  endMinute: number;
}

export const DEFAULT_WORKING_HOURS: WorkingHours = { startMinute: 9 * 60, endMinute: 18 * 60 };

/** Returns the events from `events` that overlap the proposed slot. */
export function findConflicts<T extends TimeSlot>(proposed: TimeSlot, events: T[]): T[] {
  return events.filter((event) => eventsOverlap(proposed, event));
}

function parseLocalDateOnly(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year!, (month ?? 1) - 1, day ?? 1);
}

/**
 * Finds every free window of at least `durationMinutes` within working
 * hours on the given date, after subtracting the given busy events.
 * Never books anything itself — purely a suggestion list for the UI to
 * present, matching "never automatically move important tasks without
 * user confirmation."
 */
export function findAvailableSlots(
  dateIso: string,
  durationMinutes: number,
  events: TimeSlot[],
  workingHours: WorkingHours = DEFAULT_WORKING_HOURS,
): TimeSlot[] {
  const dayStart = parseLocalDateOnly(dateIso);
  const windowStart = new Date(dayStart);
  windowStart.setMinutes(workingHours.startMinute);
  const windowEnd = new Date(dayStart);
  windowEnd.setMinutes(workingHours.endMinute);

  const busy = events
    .map((event) => ({ start: new Date(event.start), end: new Date(event.end) }))
    .filter((event) => event.end > windowStart && event.start < windowEnd)
    .sort((a, b) => a.start.getTime() - b.start.getTime());

  const slots: TimeSlot[] = [];
  let cursor = windowStart;

  for (const busyBlock of busy) {
    const gapMinutes = (Math.max(busyBlock.start.getTime(), cursor.getTime()) - cursor.getTime()) / 60000;
    if (busyBlock.start > cursor && gapMinutes >= durationMinutes) {
      slots.push({ start: cursor.toISOString(), end: busyBlock.start.toISOString() });
    }
    if (busyBlock.end > cursor) cursor = busyBlock.end;
  }

  const trailingMinutes = (windowEnd.getTime() - cursor.getTime()) / 60000;
  if (trailingMinutes >= durationMinutes) {
    slots.push({ start: cursor.toISOString(), end: windowEnd.toISOString() });
  }

  return slots;
}
