import { describe, expect, it } from 'vitest';
import { computeNextOccurrence } from '@/core/recurrence';
import type { RecurrenceRule } from '@/core/task.types';

describe('computeNextOccurrence', () => {
  it('advances daily by the interval', () => {
    const rule: RecurrenceRule = { frequency: 'daily' };
    expect(computeNextOccurrence(rule, '2026-08-12', 1)).toBe('2026-08-13');
    expect(computeNextOccurrence({ ...rule, interval: 3 }, '2026-08-12', 1)).toBe('2026-08-15');
  });

  it('advances weekly by 7 * interval days', () => {
    const rule: RecurrenceRule = { frequency: 'weekly' };
    expect(computeNextOccurrence(rule, '2026-08-12', 1)).toBe('2026-08-19');
    expect(computeNextOccurrence({ ...rule, interval: 2 }, '2026-08-12', 1)).toBe('2026-08-26');
  });

  it('advances monthly keeping the day of month, clamped to short months', () => {
    const rule: RecurrenceRule = { frequency: 'monthly' };
    expect(computeNextOccurrence(rule, '2026-01-15', 1)).toBe('2026-02-15');
    expect(computeNextOccurrence(rule, '2026-01-31', 1)).toBe('2026-02-28');
  });

  it('supports an explicit day-of-month ("every 15th")', () => {
    const rule: RecurrenceRule = { frequency: 'monthly', dayOfMonth: 15 };
    expect(computeNextOccurrence(rule, '2026-08-01', 1)).toBe('2026-09-15');
  });

  it('advances yearly', () => {
    const rule: RecurrenceRule = { frequency: 'yearly' };
    expect(computeNextOccurrence(rule, '2026-08-12', 1)).toBe('2027-08-12');
  });

  it('skips weekends for "weekdays"', () => {
    const rule: RecurrenceRule = { frequency: 'weekdays' };
    // 2026-08-14 is a Friday
    expect(computeNextOccurrence(rule, '2026-08-14', 1)).toBe('2026-08-17');
  });

  it('finds the next matching day for "custom"', () => {
    // Mon=1, Wed=3 — from a Wednesday, next match is the following Monday
    const rule: RecurrenceRule = { frequency: 'custom', daysOfWeek: [1, 3] };
    expect(computeNextOccurrence(rule, '2026-08-12', 1)).toBe('2026-08-17');
  });

  it('stops once the computed date passes endDate', () => {
    const rule: RecurrenceRule = { frequency: 'daily', endDate: '2026-08-12' };
    expect(computeNextOccurrence(rule, '2026-08-12', 1)).toBeNull();
  });

  it('stops once occurrenceIndex reaches the occurrences limit', () => {
    const rule: RecurrenceRule = { frequency: 'daily', occurrences: 3 };
    expect(computeNextOccurrence(rule, '2026-08-12', 3)).toBeNull();
    expect(computeNextOccurrence(rule, '2026-08-12', 2)).toBe('2026-08-13');
  });
});
