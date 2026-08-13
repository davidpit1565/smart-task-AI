export type GoalStatus = 'active' | 'archived';

/**
 * A "life area" / higher-level goal that projects (and standalone tasks) can
 * roll up into — one level above Project, for things like "Get healthier"
 * or "Grow the business" that span multiple projects.
 */
export interface Goal {
  id: string;
  name: string;
  description: string;
  color: string;
  status: GoalStatus;
  targetDate: string | null;
  createdAt: string;
  updatedAt: string;
  order: number;
}

export type NewGoalInput = Partial<Goal> & { name: string };

export const GOAL_COLORS = ['#5c7a93', '#4c7a5e', '#b8842e', '#b5622e', '#a5352e', '#8a6a9e'] as const;

export function createGoal(input: NewGoalInput, now: () => string = () => new Date().toISOString()): Goal {
  const timestamp = now();
  return {
    id: input.id ?? crypto.randomUUID(),
    name: input.name,
    description: input.description ?? '',
    color: input.color ?? GOAL_COLORS[0],
    status: input.status ?? 'active',
    targetDate: input.targetDate ?? null,
    createdAt: input.createdAt ?? timestamp,
    updatedAt: input.updatedAt ?? timestamp,
    order: input.order ?? 0,
  };
}
