import type { RecurrenceRule } from './task.types';

function parseLocalDate(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year!, (month ?? 1) - 1, day ?? 1);
}

function toLocalIso(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function addMonths(date: Date, months: number, dayOfMonth?: number): Date {
  // Computed via year/month arithmetic rather than Date#setMonth: setMonth would
  // roll a day like 31 over into the next month when the target month is shorter
  // (e.g. Jan 31 + 1 month would become Mar 3, not the intended Feb 28/29).
  const totalMonths = date.getMonth() + months;
  const year = date.getFullYear() + Math.floor(totalMonths / 12);
  const month = ((totalMonths % 12) + 12) % 12;
  const targetDay = dayOfMonth ?? date.getDate();
  const day = Math.min(targetDay, daysInMonth(year, month));
  return new Date(year, month, day);
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function addYears(date: Date, years: number): Date {
  const next = new Date(date);
  next.setFullYear(next.getFullYear() + years);
  return next;
}

function nextWeekday(date: Date): Date {
  let next = addDays(date, 1);
  while (next.getDay() === 0 || next.getDay() === 6) {
    next = addDays(next, 1);
  }
  return next;
}

function nextMatchingDayOfWeek(date: Date, daysOfWeek: number[]): Date {
  if (daysOfWeek.length === 0) return addDays(date, 1);
  for (let offset = 1; offset <= 7; offset++) {
    const candidate = addDays(date, offset);
    if (daysOfWeek.includes(candidate.getDay())) return candidate;
  }
  return addDays(date, 7);
}

/**
 * Computes the next due date for a recurring task, or null if the rule's
 * end conditions (endDate / occurrences) mean it shouldn't recur again.
 */
export function computeNextOccurrence(
  rule: RecurrenceRule,
  fromDateIso: string,
  occurrenceIndex: number,
): string | null {
  if (rule.occurrences !== undefined && occurrenceIndex >= rule.occurrences) return null;

  const from = parseLocalDate(fromDateIso);
  const interval = rule.interval ?? 1;
  let next: Date;

  switch (rule.frequency) {
    case 'daily':
      next = addDays(from, interval);
      break;
    case 'weekly':
      next = addDays(from, interval * 7);
      break;
    case 'monthly':
      next = addMonths(from, interval, rule.dayOfMonth);
      break;
    case 'yearly':
      next = addYears(from, interval);
      break;
    case 'weekdays':
      next = nextWeekday(from);
      break;
    case 'custom':
      next = nextMatchingDayOfWeek(from, rule.daysOfWeek ?? []);
      break;
    default:
      return null;
  }

  if (rule.endDate && toLocalIso(next) > rule.endDate) return null;
  return toLocalIso(next);
}
