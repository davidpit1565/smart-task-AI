export type EntitlementTier = 'free' | 'premium';

export interface EntitlementState {
  tier: EntitlementTier;
  updatedAt: string;
}

export interface AiUsage {
  monthKey: string; // 'YYYY-MM', local calendar month
  count: number;
}

/** Free-tier AI task-breakdown calls allowed per calendar month — see docs/PRODUCT_GOAL.md §7. */
export const FREE_MONTHLY_AI_QUOTA = 5;

export function monthKeyFor(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Remaining free AI-breakdown calls for the given month. Premium is
 * unlimited. A usage record from a past month doesn't carry over — the
 * quota resets every calendar month, it isn't a running total.
 */
export function remainingAiQuota(tier: EntitlementTier, usage: AiUsage | undefined, now: Date): number {
  if (tier === 'premium') return Infinity;
  const currentMonthCount = usage && usage.monthKey === monthKeyFor(now) ? usage.count : 0;
  return Math.max(0, FREE_MONTHLY_AI_QUOTA - currentMonthCount);
}
