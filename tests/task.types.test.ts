import { describe, expect, it } from 'vitest';
import { createTask, isDueToday, isOverdue } from '@/core/task.types';

describe('createTask', () => {
  it('fills in sensible defaults for a minimal input', () => {
    const task = createTask({ title: 'Buy headphones' });
    expect(task.title).toBe('Buy headphones');
    expect(task.status).toBe('pending');
    expect(task.priority).toBe('none');
    expect(task.tags).toEqual([]);
    expect(task.attachments).toEqual([]);
    expect(task.createdFromAI).toBe(false);
    expect(task.id).toBeTruthy();
  });

  it('preserves explicitly provided fields', () => {
    const task = createTask({ title: 'Call John', priority: 'high', dueDate: '2026-08-14' });
    expect(task.priority).toBe('high');
    expect(task.dueDate).toBe('2026-08-14');
  });
});

describe('isOverdue', () => {
  const reference = new Date('2026-08-12T10:00:00');

  it('is false for tasks without a due date', () => {
    const task = createTask({ title: 'x' });
    expect(isOverdue(task, reference)).toBe(false);
  });

  it('is true when the due date+time is in the past', () => {
    const task = createTask({ title: 'x', dueDate: '2026-08-11', dueTime: '09:00' });
    expect(isOverdue(task, reference)).toBe(true);
  });

  it('is false when the due date is today but end of day has not passed', () => {
    const task = createTask({ title: 'x', dueDate: '2026-08-12' });
    expect(isOverdue(task, reference)).toBe(false);
  });

  it('is false for completed tasks even if past due', () => {
    const task = createTask({ title: 'x', dueDate: '2026-08-01', status: 'completed' });
    expect(isOverdue(task, reference)).toBe(false);
  });
});

describe('isDueToday', () => {
  const reference = new Date('2026-08-12T10:00:00');

  it('matches same-day due dates', () => {
    const task = createTask({ title: 'x', dueDate: '2026-08-12' });
    expect(isDueToday(task, reference)).toBe(true);
  });

  it('does not match other days', () => {
    const task = createTask({ title: 'x', dueDate: '2026-08-13' });
    expect(isDueToday(task, reference)).toBe(false);
  });
});
