import type { Priority, Task } from '@/core/task.types';
import { isDueToday, isOverdue } from '@/core/task.types';
import { isBlocked } from '@/core/dependencies';

export type SuggestionReason = 'overdue' | 'dueToday' | 'highPriority' | 'next';

export interface Suggestion {
  task: Task;
  reason: SuggestionReason;
}

const PRIORITY_RANK: Record<Priority, number> = { urgent: 0, high: 1, medium: 2, low: 3, none: 4 };

function urgencyTier(task: Task, referenceDate: Date): 0 | 1 | 2 | 3 {
  if (isOverdue(task, referenceDate)) return 0;
  if (isDueToday(task, referenceDate)) return 1;
  if (task.priority === 'urgent' || task.priority === 'high') return 2;
  return 3;
}

const TIER_REASON: Record<0 | 1 | 2 | 3, SuggestionReason> = {
  0: 'overdue',
  1: 'dueToday',
  2: 'highPriority',
  3: 'next',
};

/**
 * Heuristic "what should I do now?" ranking — deliberately not AI: overdue
 * beats due-today beats high-priority beats everything else, tie-broken by
 * priority then due time then manual order. Honest about being a rule, not
 * a model.
 */
export function suggestTasks(tasks: Task[], allTasks: Task[], referenceDate: Date = new Date(), limit = 3): Suggestion[] {
  const eligible = tasks.filter((t) => t.status === 'pending' && !t.parentTaskId && !isBlocked(t, allTasks));

  const ranked = eligible.slice().sort((a, b) => {
    const tierDiff = urgencyTier(a, referenceDate) - urgencyTier(b, referenceDate);
    if (tierDiff !== 0) return tierDiff;

    const priorityDiff = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
    if (priorityDiff !== 0) return priorityDiff;

    if (a.dueDate && b.dueDate) {
      const dueDiff = `${a.dueDate}T${a.dueTime ?? '23:59'}`.localeCompare(`${b.dueDate}T${b.dueTime ?? '23:59'}`);
      if (dueDiff !== 0) return dueDiff;
    } else if (a.dueDate && !b.dueDate) {
      return -1;
    } else if (!a.dueDate && b.dueDate) {
      return 1;
    }

    return a.order - b.order;
  });

  return ranked.slice(0, limit).map((task) => ({ task, reason: TIER_REASON[urgencyTier(task, referenceDate)] }));
}
