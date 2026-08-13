import { isDueToday, isOverdue, type Task } from './task.types';

export function selectOverdueTasks(tasks: Task[], referenceDate = new Date()): Task[] {
  return tasks.filter((t) => isOverdue(t, referenceDate)).sort((a, b) => a.order - b.order);
}

export function selectTodayTasks(tasks: Task[], referenceDate = new Date()): Task[] {
  return tasks
    .filter((t) => t.status === 'pending' && isDueToday(t, referenceDate))
    .sort((a, b) => a.order - b.order);
}

export interface TodayProgress {
  total: number;
  completed: number;
  remaining: number;
  percent: number;
}

/** "Today" for progress purposes = tasks due today, whatever their current status. */
export function selectTodayProgress(tasks: Task[], referenceDate = new Date()): TodayProgress {
  const todaysTasks = tasks.filter((t) => t.dueDate && t.status !== 'trashed' && isDueToday(t, referenceDate));
  const completed = todaysTasks.filter((t) => t.status === 'completed').length;
  const total = todaysTasks.length;
  return {
    total,
    completed,
    remaining: total - completed,
    percent: total === 0 ? 0 : Math.round((completed / total) * 100),
  };
}

/** Tasks not yet organized: no due date, no project, and not a subtask of something else. */
export function selectInboxTasks(tasks: Task[]): Task[] {
  return tasks
    .filter((t) => t.status === 'pending' && !t.dueDate && !t.projectId && !t.parentTaskId)
    .sort((a, b) => a.order - b.order);
}

export type GreetingPeriod = 'morning' | 'afternoon' | 'evening';

export function selectGreetingPeriod(referenceDate = new Date()): GreetingPeriod {
  const hour = referenceDate.getHours();
  if (hour < 12) return 'morning';
  if (hour < 18) return 'afternoon';
  return 'evening';
}
