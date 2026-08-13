import { describe, expect, it } from 'vitest';
import { findAvailableSlots, findConflicts } from '@/core/calendar/scheduling';

describe('findConflicts', () => {
  it('finds events that overlap a proposed slot', () => {
    const events = [
      { id: 'a', start: '2026-08-14T15:00:00', end: '2026-08-14T16:00:00' },
      { id: 'b', start: '2026-08-14T18:00:00', end: '2026-08-14T19:00:00' },
    ];
    const conflicts = findConflicts({ start: '2026-08-14T15:30:00', end: '2026-08-14T17:00:00' }, events);
    expect(conflicts.map((e) => e.id)).toEqual(['a']);
  });

  it('returns nothing when the slot is fully free', () => {
    const events = [{ id: 'a', start: '2026-08-14T15:00:00', end: '2026-08-14T16:00:00' }];
    expect(findConflicts({ start: '2026-08-14T09:00:00', end: '2026-08-14T10:00:00' }, events)).toEqual([]);
  });
});

describe('findAvailableSlots', () => {
  it('returns the whole working day when there are no events', () => {
    const slots = findAvailableSlots('2026-08-14', 60, []);
    expect(slots).toEqual([{ start: '2026-08-14T09:00:00.000Z', end: '2026-08-14T18:00:00.000Z' }]);
  });

  it('splits the day around a single meeting', () => {
    // 15:00 Meeting, 16:00 Meeting per the product brief's example
    const events = [{ start: '2026-08-14T15:00:00', end: '2026-08-14T16:00:00' }];
    const slots = findAvailableSlots('2026-08-14', 60, events);
    expect(slots).toEqual([
      { start: '2026-08-14T09:00:00.000Z', end: '2026-08-14T15:00:00.000Z' },
      { start: '2026-08-14T16:00:00.000Z', end: '2026-08-14T18:00:00.000Z' },
    ]);
  });

  it("excludes a gap that's too short for the requested duration", () => {
    // 15:00 Meeting, 16:00 Meeting back-to-back with only a 90-minute task to fit before 18:00
    const events = [
      { start: '2026-08-14T15:00:00', end: '2026-08-14T16:00:00' },
      { start: '2026-08-14T16:00:00', end: '2026-08-14T17:00:00' },
    ];
    const slots = findAvailableSlots('2026-08-14', 90, events);
    // Only the 9:00-15:00 (360min) and 17:00-18:00 (60min, too short) windows exist;
    // the second is dropped since it can't fit a 90-minute task.
    expect(slots).toEqual([{ start: '2026-08-14T09:00:00.000Z', end: '2026-08-14T15:00:00.000Z' }]);
  });

  it('ignores events outside working hours', () => {
    const events = [{ start: '2026-08-14T07:00:00', end: '2026-08-14T08:30:00' }];
    const slots = findAvailableSlots('2026-08-14', 60, events);
    expect(slots).toEqual([{ start: '2026-08-14T09:00:00.000Z', end: '2026-08-14T18:00:00.000Z' }]);
  });
});
