import { isOverdue, toLocalIsoDate, type Task } from '@/core/task.types';
import type { Project } from '@/core/project.types';

export interface CompletedByProject {
  projectId: string | null;
  projectName: string;
  count: number;
}

export interface InsightsSummary {
  totalActive: number;
  totalCompleted: number;
  completionRate: number;
  overdueCount: number;
  currentStreakDays: number;
  completedByProject: CompletedByProject[];
}

/** Consecutive days, ending today, with at least one task completed. */
export function computeStreak(tasks: Task[], referenceDate: Date = new Date()): number {
  const completedDays = new Set(
    tasks.filter((t): t is Task & { completedAt: string } => t.status === 'completed' && t.completedAt !== null).map((t) => t.completedAt.slice(0, 10)),
  );

  let streak = 0;
  const cursor = new Date(referenceDate);
  while (completedDays.has(toLocalIsoDate(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

const MAX_PROJECT_BREAKDOWN = 5;

export function computeInsights(tasks: Task[], projects: Project[], referenceDate: Date = new Date()): InsightsSummary {
  const relevant = tasks.filter((t) => (t.status === 'pending' || t.status === 'completed') && !t.parentTaskId);
  const completed = relevant.filter((t) => t.status === 'completed');
  const totalActive = relevant.filter((t) => t.status === 'pending').length;
  const totalCompleted = completed.length;
  const completionRate = relevant.length === 0 ? 0 : Math.round((totalCompleted / relevant.length) * 100);
  const overdueCount = relevant.filter((t) => isOverdue(t, referenceDate)).length;

  const projectNameById = new Map(projects.map((p) => [p.id, p.name]));
  const countByProject = new Map<string | null, number>();
  for (const task of completed) {
    countByProject.set(task.projectId, (countByProject.get(task.projectId) ?? 0) + 1);
  }

  const completedByProject = [...countByProject.entries()]
    .map(([projectId, count]) => ({
      projectId,
      projectName: projectId ? (projectNameById.get(projectId) ?? 'Unknown project') : 'No project',
      count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, MAX_PROJECT_BREAKDOWN);

  return {
    totalActive,
    totalCompleted,
    completionRate,
    overdueCount,
    currentStreakDays: computeStreak(tasks, referenceDate),
    completedByProject,
  };
}
