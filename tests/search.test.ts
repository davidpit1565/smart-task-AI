import { describe, expect, it } from 'vitest';
import { createTask } from '@/core/task.types';
import { searchTasks } from '@/core/search';

const now = new Date('2026-08-14T12:00:00');

describe('searchTasks', () => {
  it('returns nothing when there is no query and no filters', () => {
    const tasks = [createTask({ title: 'Buy milk' })];
    expect(searchTasks(tasks, '', {}, now)).toEqual([]);
  });

  it('matches by title, case-insensitively', () => {
    const tasks = [createTask({ title: 'Buy Milk' }), createTask({ title: 'Walk the dog' })];
    expect(searchTasks(tasks, 'milk', {}, now).map((t) => t.title)).toEqual(['Buy Milk']);
  });

  it('matches by description, notes, and tags', () => {
    const byDescription = createTask({ title: 'A', description: 'call the plumber' });
    const byNotes = createTask({ title: 'B', notes: 'remember the plumber quote' });
    const byTag = createTask({ title: 'C', tags: ['plumber'] });
    const noMatch = createTask({ title: 'D' });
    const results = searchTasks([byDescription, byNotes, byTag, noMatch], 'plumber', {}, now);
    expect(results.map((t) => t.id).sort()).toEqual([byDescription.id, byNotes.id, byTag.id].sort());
  });

  it('excludes trashed tasks even on an exact title match', () => {
    const trashed = createTask({ title: 'Trashed match', status: 'trashed' });
    expect(searchTasks([trashed], 'trashed', {}, now)).toEqual([]);
  });

  it('filters by project without a query', () => {
    const inProject = createTask({ title: 'A', projectId: 'p1' });
    const other = createTask({ title: 'B', projectId: 'p2' });
    expect(searchTasks([inProject, other], '', { projectId: 'p1' }, now).map((t) => t.id)).toEqual([inProject.id]);
  });

  it('filters by priority', () => {
    const urgent = createTask({ title: 'A', priority: 'urgent' });
    const low = createTask({ title: 'B', priority: 'low' });
    expect(searchTasks([urgent, low], '', { priority: 'urgent' }, now).map((t) => t.id)).toEqual([urgent.id]);
  });

  it('filters by overdue only', () => {
    const overdue = createTask({ title: 'A', dueDate: '2026-08-01' });
    const future = createTask({ title: 'B', dueDate: '2026-12-01' });
    expect(searchTasks([overdue, future], '', { overdueOnly: true }, now).map((t) => t.id)).toEqual([overdue.id]);
  });

  it('combines a query with filters (AND semantics)', () => {
    const match = createTask({ title: 'Fix bug', priority: 'high', projectId: 'p1' });
    const wrongPriority = createTask({ title: 'Fix bug', priority: 'low', projectId: 'p1' });
    const wrongTitle = createTask({ title: 'Other', priority: 'high', projectId: 'p1' });
    const results = searchTasks([match, wrongPriority, wrongTitle], 'fix', { priority: 'high', projectId: 'p1' }, now);
    expect(results.map((t) => t.id)).toEqual([match.id]);
  });
});
