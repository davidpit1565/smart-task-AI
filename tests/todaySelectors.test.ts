import { describe, expect, it } from 'vitest';
import { createTask } from '@/core/task.types';
import {
  selectGreetingPeriod,
  selectInboxTasks,
  selectOverdueTasks,
  selectTodayProgress,
  selectTodayTasks,
} from '@/core/todaySelectors';

const reference = new Date('2026-08-12T10:00:00');

describe('selectOverdueTasks', () => {
  it('returns only pending tasks whose due date+time has passed', () => {
    const overdue = createTask({ title: 'overdue', dueDate: '2026-08-11' });
    const today = createTask({ title: 'today', dueDate: '2026-08-12' });
    const done = createTask({ title: 'done', dueDate: '2026-08-01', status: 'completed' });
    expect(selectOverdueTasks([overdue, today, done], reference)).toEqual([overdue]);
  });
});

describe('selectTodayTasks', () => {
  it('returns pending tasks due today only', () => {
    const today = createTask({ title: 'today', dueDate: '2026-08-12' });
    const tomorrow = createTask({ title: 'tomorrow', dueDate: '2026-08-13' });
    expect(selectTodayTasks([today, tomorrow], reference)).toEqual([today]);
  });
});

describe('selectTodayProgress', () => {
  it('computes completed/remaining/percent for tasks due today', () => {
    const a = createTask({ title: 'a', dueDate: '2026-08-12', status: 'completed' });
    const b = createTask({ title: 'b', dueDate: '2026-08-12' });
    const c = createTask({ title: 'c', dueDate: '2026-08-13' });
    const progress = selectTodayProgress([a, b, c], reference);
    expect(progress).toEqual({ total: 2, completed: 1, remaining: 1, percent: 50 });
  });

  it('returns zero percent when nothing is due today', () => {
    expect(selectTodayProgress([], reference)).toEqual({ total: 0, completed: 0, remaining: 0, percent: 0 });
  });
});

describe('selectInboxTasks', () => {
  it('returns pending tasks with no due date and no project, ordered', () => {
    const first = createTask({ title: 'first', order: 2 });
    const second = createTask({ title: 'second', order: 1 });
    const scheduled = createTask({ title: 'scheduled', dueDate: '2026-08-12', order: 0 });
    const projectTask = createTask({ title: 'in project', projectId: 'p1', order: 0 });
    expect(selectInboxTasks([first, second, scheduled, projectTask])).toEqual([second, first]);
  });
});

describe('selectGreetingPeriod', () => {
  it('buckets hours into morning/afternoon/evening', () => {
    expect(selectGreetingPeriod(new Date('2026-08-12T08:00:00'))).toBe('morning');
    expect(selectGreetingPeriod(new Date('2026-08-12T14:00:00'))).toBe('afternoon');
    expect(selectGreetingPeriod(new Date('2026-08-12T20:00:00'))).toBe('evening');
  });
});
