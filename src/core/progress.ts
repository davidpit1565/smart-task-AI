import type { Task } from './task.types';

export interface Progress {
  total: number;
  completed: number;
  percent: number;
}

function computeProgress(tasks: Task[]): Progress {
  const relevant = tasks.filter((t) => t.status === 'pending' || t.status === 'completed');
  const completed = relevant.filter((t) => t.status === 'completed').length;
  const total = relevant.length;
  return { total, completed, percent: total === 0 ? 0 : Math.round((completed / total) * 100) };
}

/** Counts top-level project tasks only — a subtask's completion already rolls up into its parent. */
export function selectProjectProgress(projectId: string, tasks: Task[]): Progress {
  return computeProgress(tasks.filter((t) => t.projectId === projectId && !t.parentTaskId));
}

export function selectSubtaskProgress(parentTaskId: string, tasks: Task[]): Progress {
  return computeProgress(tasks.filter((t) => t.parentTaskId === parentTaskId));
}

export function selectSubtasks(parentTaskId: string, tasks: Task[]): Task[] {
  return tasks.filter((t) => t.parentTaskId === parentTaskId && t.status !== 'trashed').sort((a, b) => a.order - b.order);
}
