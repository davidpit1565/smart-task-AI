import { describe, expect, it } from 'vitest';
import { createTask } from '@/core/task.types';
import { getBlockingTasks, isBlocked, wouldCreateCycle } from '@/core/dependencies';

describe('dependencies', () => {
  it('is not blocked with no dependencies', () => {
    const task = createTask({ title: 'A' });
    expect(isBlocked(task, [task])).toBe(false);
  });

  it('is blocked while a dependency is not completed', () => {
    const dep = createTask({ title: 'Dep' });
    const task = createTask({ title: 'A', dependsOn: [dep.id] });
    expect(isBlocked(task, [task, dep])).toBe(true);
    expect(getBlockingTasks(task, [task, dep]).map((t) => t.id)).toEqual([dep.id]);
  });

  it('is not blocked once all dependencies are completed', () => {
    const dep = createTask({ title: 'Dep', status: 'completed' });
    const task = createTask({ title: 'A', dependsOn: [dep.id] });
    expect(isBlocked(task, [task, dep])).toBe(false);
  });

  it('ignores a dependency reference that no longer exists', () => {
    const task = createTask({ title: 'A', dependsOn: ['missing-id'] });
    expect(isBlocked(task, [task])).toBe(false);
  });

  it('rejects a task depending on itself', () => {
    const task = createTask({ title: 'A' });
    expect(wouldCreateCycle(task.id, task.id, [task])).toBe(true);
  });

  it('detects a direct cycle (A depends on B, B would depend on A)', () => {
    const a = createTask({ title: 'A' });
    const b = createTask({ title: 'B', dependsOn: [a.id] });
    expect(wouldCreateCycle(a.id, b.id, [a, b])).toBe(true);
  });

  it('detects a transitive cycle (A -> B -> C, C would depend on A)', () => {
    const a = createTask({ title: 'A' });
    const b = createTask({ title: 'B', dependsOn: [a.id] });
    const c = createTask({ title: 'C', dependsOn: [b.id] });
    expect(wouldCreateCycle(a.id, c.id, [a, b, c])).toBe(true);
  });

  it('allows a non-cyclical dependency', () => {
    const a = createTask({ title: 'A' });
    const b = createTask({ title: 'B' });
    expect(wouldCreateCycle(a.id, b.id, [a, b])).toBe(false);
  });
});
