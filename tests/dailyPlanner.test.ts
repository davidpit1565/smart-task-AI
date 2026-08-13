import { describe, expect, it } from 'vitest';
import { createTask } from '@/core/task.types';
import { suggestTasks } from '@/core/dailyPlanner';

const now = new Date('2026-08-14T12:00:00');

describe('suggestTasks', () => {
  it('ranks an overdue task above everything else', () => {
    const overdue = createTask({ title: 'Overdue', dueDate: '2026-08-01' });
    const urgentNoDate = createTask({ title: 'Urgent no date', priority: 'urgent' });
    const top = suggestTasks([urgentNoDate, overdue], [urgentNoDate, overdue], now)[0]!;
    expect(top.task.id).toBe(overdue.id);
    expect(top.reason).toBe('overdue');
  });

  it('ranks a due-today task above a high-priority task with no date', () => {
    const dueToday = createTask({ title: 'Due today', dueDate: '2026-08-14' });
    const highPriority = createTask({ title: 'High priority', priority: 'high' });
    const top = suggestTasks([highPriority, dueToday], [highPriority, dueToday], now)[0]!;
    expect(top.task.id).toBe(dueToday.id);
    expect(top.reason).toBe('dueToday');
  });

  it('breaks ties within a tier by priority', () => {
    const low = createTask({ title: 'Low', dueDate: '2026-08-14', priority: 'low' });
    const urgent = createTask({ title: 'Urgent', dueDate: '2026-08-14', priority: 'urgent' });
    const top = suggestTasks([low, urgent], [low, urgent], now)[0]!;
    expect(top.task.id).toBe(urgent.id);
  });

  it('excludes blocked tasks', () => {
    const dep = createTask({ title: 'Dep' });
    const blocked = createTask({ title: 'Blocked', priority: 'urgent', dependsOn: [dep.id] });
    const free = createTask({ title: 'Free', priority: 'low' });
    const results = suggestTasks([blocked, free, dep], [blocked, free, dep], now);
    expect(results.map((s) => s.task.id)).not.toContain(blocked.id);
    expect(results.map((s) => s.task.id)).toContain(free.id);
  });

  it('excludes completed tasks and subtasks', () => {
    const completed = createTask({ title: 'Done', status: 'completed' });
    const parent = createTask({ title: 'Parent' });
    const subtask = createTask({ title: 'Sub', parentTaskId: parent.id });
    const results = suggestTasks([completed, parent, subtask], [completed, parent, subtask], now);
    expect(results.map((s) => s.task.id)).toEqual([parent.id]);
  });

  it('respects the limit', () => {
    const tasks = Array.from({ length: 5 }, (_, i) => createTask({ title: `T${i}` }));
    expect(suggestTasks(tasks, tasks, now, 2)).toHaveLength(2);
  });

  it('labels an otherwise-eligible task as "next"', () => {
    const task = createTask({ title: 'Someday' });
    const top = suggestTasks([task], [task], now)[0]!;
    expect(top.reason).toBe('next');
  });
});
