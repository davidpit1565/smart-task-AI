import type { Task } from '@/core/task.types';

/** The dependency tasks that are still not completed (i.e. still blocking `task`). */
export function getBlockingTasks(task: Task, allTasks: Task[]): Task[] {
  if (task.dependsOn.length === 0) return [];
  const byId = new Map(allTasks.map((t) => [t.id, t]));
  return task.dependsOn
    .map((id) => byId.get(id))
    .filter((dep): dep is Task => dep !== undefined && dep.status !== 'completed');
}

export function isBlocked(task: Task, allTasks: Task[]): boolean {
  return getBlockingTasks(task, allTasks).length > 0;
}

/** True if `taskId` depending on `dependsOnId` would create a dependency cycle (directly or transitively). */
export function wouldCreateCycle(taskId: string, dependsOnId: string, allTasks: Task[]): boolean {
  if (taskId === dependsOnId) return true;
  const byId = new Map(allTasks.map((t) => [t.id, t]));
  const visited = new Set<string>();
  const stack = [dependsOnId];

  while (stack.length > 0) {
    const current = stack.pop() as string;
    if (current === taskId) return true;
    if (visited.has(current)) continue;
    visited.add(current);
    const currentTask = byId.get(current);
    if (currentTask) stack.push(...currentTask.dependsOn);
  }

  return false;
}
