import { describe, expect, it } from 'vitest';
import { createTask } from '@/core/task.types';
import { selectProjectProgress, selectSubtaskProgress, selectSubtasks } from '@/core/progress';

describe('selectProjectProgress', () => {
  it('counts only top-level tasks for the given project', () => {
    const done = createTask({ title: 'a', projectId: 'p1', status: 'completed' });
    const pending = createTask({ title: 'b', projectId: 'p1' });
    const otherProject = createTask({ title: 'c', projectId: 'p2' });
    const subtask = createTask({ title: 'sub', projectId: 'p1', parentTaskId: done.id, status: 'completed' });
    const progress = selectProjectProgress('p1', [done, pending, otherProject, subtask]);
    expect(progress).toEqual({ total: 2, completed: 1, percent: 50 });
  });

  it('returns zero progress for a project with no tasks', () => {
    expect(selectProjectProgress('empty', [])).toEqual({ total: 0, completed: 0, percent: 0 });
  });
});

describe('selectSubtasks / selectSubtaskProgress', () => {
  it('finds subtasks of a parent ordered by their order field, excluding trashed', () => {
    const parent = createTask({ title: 'parent' });
    const first = createTask({ title: 'first', parentTaskId: parent.id, order: 2 });
    const second = createTask({ title: 'second', parentTaskId: parent.id, order: 1, status: 'completed' });
    const trashed = createTask({ title: 'gone', parentTaskId: parent.id, order: 0, status: 'trashed' });
    const unrelated = createTask({ title: 'other parent', parentTaskId: 'someone-else' });

    expect(selectSubtasks(parent.id, [first, second, trashed, unrelated])).toEqual([second, first]);
    expect(selectSubtaskProgress(parent.id, [first, second, trashed, unrelated])).toEqual({ total: 2, completed: 1, percent: 50 });
  });
});
