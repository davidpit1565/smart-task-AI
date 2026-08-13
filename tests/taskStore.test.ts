import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/data/db';
import { useTaskStore } from '@/store/taskStore';

beforeEach(async () => {
  await db.tasks.clear();
  useTaskStore.setState({ tasks: [], loaded: false, lastUndo: null });
});

describe('taskStore', () => {
  it('loads tasks from the repository', async () => {
    await useTaskStore.getState().addTask({ title: 'seed' });
    useTaskStore.setState({ tasks: [], loaded: false });
    await useTaskStore.getState().load();
    expect(useTaskStore.getState().tasks).toHaveLength(1);
    expect(useTaskStore.getState().loaded).toBe(true);
  });

  it('adds a task with an incrementing order', async () => {
    const first = await useTaskStore.getState().addTask({ title: 'first' });
    const second = await useTaskStore.getState().addTask({ title: 'second' });
    expect(second.order).toBeGreaterThan(first.order);
    expect(useTaskStore.getState().tasks.map((t) => t.title)).toEqual(['first', 'second']);
  });

  it('persists added tasks to the repository', async () => {
    const task = await useTaskStore.getState().addTask({ title: 'persisted' });
    const stored = await db.tasks.get(task.id);
    expect(stored?.title).toBe('persisted');
  });

  it('updates a task and bumps updatedAt', async () => {
    const task = await useTaskStore.getState().addTask({ title: 'original' });
    await useTaskStore.getState().updateTask(task.id, { title: 'renamed' });
    const updated = useTaskStore.getState().tasks.find((t) => t.id === task.id);
    expect(updated?.title).toBe('renamed');
    expect(new Date(updated!.updatedAt).getTime()).toBeGreaterThanOrEqual(new Date(task.updatedAt).getTime());
  });

  it('completes a task and allows undo back to pending', async () => {
    const task = await useTaskStore.getState().addTask({ title: 'to complete' });
    await useTaskStore.getState().completeTask(task.id);
    expect(useTaskStore.getState().tasks.find((t) => t.id === task.id)?.status).toBe('completed');

    await useTaskStore.getState().undo();
    const restored = useTaskStore.getState().tasks.find((t) => t.id === task.id);
    expect(restored?.status).toBe('pending');
    expect(restored?.completedAt).toBeNull();
  });

  it('soft-deletes a task (trashed) and allows undo', async () => {
    const task = await useTaskStore.getState().addTask({ title: 'to delete' });
    await useTaskStore.getState().deleteTask(task.id);
    expect(useTaskStore.getState().tasks.find((t) => t.id === task.id)?.status).toBe('trashed');

    await useTaskStore.getState().undo();
    expect(useTaskStore.getState().tasks.find((t) => t.id === task.id)?.status).toBe('pending');
  });

  it('archives a task and can restore it directly', async () => {
    const task = await useTaskStore.getState().addTask({ title: 'to archive' });
    await useTaskStore.getState().archiveTask(task.id);
    expect(useTaskStore.getState().tasks.find((t) => t.id === task.id)?.status).toBe('archived');

    await useTaskStore.getState().restoreTask(task.id);
    expect(useTaskStore.getState().tasks.find((t) => t.id === task.id)?.status).toBe('pending');
  });

  it('reorders tasks by the given id sequence and persists the new order', async () => {
    const a = await useTaskStore.getState().addTask({ title: 'a' });
    const b = await useTaskStore.getState().addTask({ title: 'b' });
    const c = await useTaskStore.getState().addTask({ title: 'c' });

    await useTaskStore.getState().reorder([c.id, a.id, b.id]);

    const ordered = [...useTaskStore.getState().tasks].sort((x, y) => x.order - y.order);
    expect(ordered.map((t) => t.title)).toEqual(['c', 'a', 'b']);

    const stored = await db.tasks.get(c.id);
    expect(stored?.order).toBe(0);
  });

  it('spawns the next occurrence when completing a recurring task', async () => {
    const task = await useTaskStore.getState().addTask({
      title: 'Water plants',
      dueDate: '2026-08-12',
      recurrenceRule: { frequency: 'daily' },
    });

    await useTaskStore.getState().completeTask(task.id);

    const state = useTaskStore.getState().tasks;
    const original = state.find((t) => t.id === task.id);
    expect(original?.status).toBe('completed');

    const spawned = state.find((t) => t.id !== task.id && t.title === 'Water plants');
    expect(spawned).toBeDefined();
    expect(spawned?.status).toBe('pending');
    expect(spawned?.dueDate).toBe('2026-08-13');
    expect(spawned?.metadata.occurrenceIndex).toBe(2);
  });

  it('does not spawn a next occurrence past the recurrence end date', async () => {
    const task = await useTaskStore.getState().addTask({
      title: 'Last one',
      dueDate: '2026-08-12',
      recurrenceRule: { frequency: 'daily', endDate: '2026-08-12' },
    });

    await useTaskStore.getState().completeTask(task.id);

    expect(useTaskStore.getState().tasks).toHaveLength(1);
  });

  it('undo after completing a recurring task also removes the spawned occurrence', async () => {
    const task = await useTaskStore.getState().addTask({
      title: 'Recurring',
      dueDate: '2026-08-12',
      recurrenceRule: { frequency: 'daily' },
    });

    await useTaskStore.getState().completeTask(task.id);
    expect(useTaskStore.getState().tasks).toHaveLength(2);

    await useTaskStore.getState().undo();
    const remaining = useTaskStore.getState().tasks;
    expect(remaining).toHaveLength(1);
    expect(remaining[0]?.status).toBe('pending');
  });
});
