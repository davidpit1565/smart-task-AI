import type { Priority, Task } from '@/core/task.types';
import { isOverdue } from '@/core/task.types';

export interface SearchFilters {
  projectId?: string | null;
  priority?: Priority | null;
  tag?: string | null;
  overdueOnly?: boolean;
}

function hasActiveFilter(filters: SearchFilters): boolean {
  return filters.projectId != null || !!filters.priority || !!filters.tag || !!filters.overdueOnly;
}

/**
 * Pure search + filter over tasks. With no query and no filters it returns
 * nothing (an intentional empty state) rather than dumping the whole list —
 * the screen is for finding something specific, not browsing everything.
 */
export function searchTasks(tasks: Task[], query: string, filters: SearchFilters = {}, referenceDate: Date = new Date()): Task[] {
  const q = query.trim().toLowerCase();
  if (!q && !hasActiveFilter(filters)) return [];

  return tasks.filter((task) => {
    if (task.status === 'trashed') return false;
    if (filters.projectId != null && task.projectId !== filters.projectId) return false;
    if (filters.priority && task.priority !== filters.priority) return false;
    if (filters.tag && !task.tags.includes(filters.tag)) return false;
    if (filters.overdueOnly && !isOverdue(task, referenceDate)) return false;
    if (!q) return true;
    return (
      task.title.toLowerCase().includes(q) ||
      task.description.toLowerCase().includes(q) ||
      task.notes.toLowerCase().includes(q) ||
      task.tags.some((tag) => tag.toLowerCase().includes(q))
    );
  });
}
