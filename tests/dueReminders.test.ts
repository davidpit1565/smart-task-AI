import { describe, expect, it } from 'vitest';
import { createTask } from '@/core/task.types';
import { reminderFireKey, selectDueReminders } from '@/core/notifications/dueReminders';

const now = new Date('2026-08-14T14:00:00');

describe('selectDueReminders', () => {
  it('fires a reminder whose offset has already passed', () => {
    const task = createTask({
      title: 'Call John',
      dueDate: '2026-08-14',
      dueTime: '14:15',
      reminders: [{ id: 'r1', offsetMinutes: 15, method: 'push' }],
    });
    // due 14:15, offset 15min before = 14:00 -> fires exactly at `now`
    expect(selectDueReminders([task], now, new Set())).toEqual([{ taskId: task.id, reminderId: 'r1', title: 'Call John' }]);
  });

  it('does not fire a reminder whose offset has not arrived yet', () => {
    const task = createTask({
      title: 'Call John',
      dueDate: '2026-08-14',
      dueTime: '15:00',
      reminders: [{ id: 'r1', offsetMinutes: 15, method: 'push' }],
    });
    expect(selectDueReminders([task], now, new Set())).toEqual([]);
  });

  it('skips reminders that already fired', () => {
    const task = createTask({
      title: 'Call John',
      dueDate: '2026-08-14',
      dueTime: '14:00',
      reminders: [{ id: 'r1', offsetMinutes: 0, method: 'push' }],
    });
    const fired = new Set([reminderFireKey(task.id, 'r1')]);
    expect(selectDueReminders([task], now, fired)).toEqual([]);
  });

  it('ignores completed tasks and tasks with no due date', () => {
    const completed = createTask({
      title: 'Done',
      status: 'completed',
      dueDate: '2026-08-14',
      dueTime: '14:00',
      reminders: [{ id: 'r1', offsetMinutes: 0, method: 'push' }],
    });
    const noDate = createTask({ title: 'No date', reminders: [{ id: 'r1', offsetMinutes: 0, method: 'push' }] });
    expect(selectDueReminders([completed, noDate], now, new Set())).toEqual([]);
  });

  it('handles multiple reminders on the same task independently', () => {
    const task = createTask({
      title: 'Prep meeting',
      dueDate: '2026-08-14',
      dueTime: '15:00',
      reminders: [
        { id: 'day-before', offsetMinutes: 60 * 24, method: 'push' },
        { id: 'hour-before', offsetMinutes: 60, method: 'push' },
      ],
    });
    // now = 14:00 on the due day: the 1-day-before reminder (fires 08-13 15:00) is long past,
    // the 1-hour-before reminder (fires 14:00) fires exactly now.
    const result = selectDueReminders([task], now, new Set());
    expect(result.map((r) => r.reminderId).sort()).toEqual(['day-before', 'hour-before']);
  });
});
