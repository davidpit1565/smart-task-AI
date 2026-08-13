import { describe, expect, it } from 'vitest';
import { createTask } from '@/core/task.types';
import { createProject } from '@/core/project.types';
import { computeInsights, computeStreak } from '@/core/insights';

const now = new Date('2026-08-14T12:00:00');

describe('computeStreak', () => {
  it('is 0 with no completed tasks', () => {
    expect(computeStreak([], now)).toBe(0);
  });

  it('counts consecutive days ending today', () => {
    const tasks = [
      createTask({ title: 'a', status: 'completed', completedAt: '2026-08-14T09:00:00' }),
      createTask({ title: 'b', status: 'completed', completedAt: '2026-08-13T09:00:00' }),
      createTask({ title: 'c', status: 'completed', completedAt: '2026-08-12T09:00:00' }),
    ];
    expect(computeStreak(tasks, now)).toBe(3);
  });

  it('stops at the first gap', () => {
    const tasks = [
      createTask({ title: 'a', status: 'completed', completedAt: '2026-08-14T09:00:00' }),
      createTask({ title: 'b', status: 'completed', completedAt: '2026-08-12T09:00:00' }), // gap on the 13th
    ];
    expect(computeStreak(tasks, now)).toBe(1);
  });

  it('is 0 if nothing was completed today', () => {
    const tasks = [createTask({ title: 'a', status: 'completed', completedAt: '2026-08-13T09:00:00' })];
    expect(computeStreak(tasks, now)).toBe(0);
  });
});

describe('computeInsights', () => {
  it('computes totals, completion rate, and overdue count', () => {
    const done = createTask({ title: 'done', status: 'completed', completedAt: '2026-08-14T09:00:00' });
    const pending = createTask({ title: 'pending' });
    const overdue = createTask({ title: 'overdue', dueDate: '2026-08-01' });
    const summary = computeInsights([done, pending, overdue], [], now);

    expect(summary.totalActive).toBe(2);
    expect(summary.totalCompleted).toBe(1);
    expect(summary.completionRate).toBe(33);
    expect(summary.overdueCount).toBe(1);
  });

  it('excludes subtasks from totals (they roll up into their parent)', () => {
    const parent = createTask({ title: 'parent', status: 'completed', completedAt: '2026-08-14T09:00:00' });
    const subtask = createTask({ title: 'sub', parentTaskId: parent.id, status: 'completed', completedAt: '2026-08-14T09:00:00' });
    const summary = computeInsights([parent, subtask], [], now);
    expect(summary.totalCompleted).toBe(1);
  });

  it('breaks down completed tasks by project, sorted descending, capped at 5', () => {
    const p1 = createProject({ name: 'Alpha' });
    const p2 = createProject({ name: 'Beta' });
    const tasks = [
      ...Array.from({ length: 3 }, (_, i) => createTask({ title: `a${i}`, projectId: p1.id, status: 'completed', completedAt: '2026-08-14T09:00:00' })),
      ...Array.from({ length: 1 }, (_, i) => createTask({ title: `b${i}`, projectId: p2.id, status: 'completed', completedAt: '2026-08-14T09:00:00' })),
      createTask({ title: 'no project', status: 'completed', completedAt: '2026-08-14T09:00:00' }),
    ];
    const summary = computeInsights(tasks, [p1, p2], now);
    expect(summary.completedByProject[0]).toMatchObject({ projectName: 'Alpha', count: 3 });
    expect(summary.completedByProject[1]).toMatchObject({ projectName: 'Beta', count: 1 });
    expect(summary.completedByProject[2]).toMatchObject({ projectName: 'No project', count: 1 });
  });

  it('returns zero completion rate with no relevant tasks', () => {
    const summary = computeInsights([], [], now);
    expect(summary.completionRate).toBe(0);
  });
});
