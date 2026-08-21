import { describe, expect, it } from 'vitest';
import { FREE_MONTHLY_AI_QUOTA, monthKeyFor, remainingAiQuota } from '@/core/entitlement.types';

describe('monthKeyFor', () => {
  it('formats as YYYY-MM with a zero-padded month', () => {
    expect(monthKeyFor(new Date(2026, 0, 15))).toBe('2026-01');
    expect(monthKeyFor(new Date(2026, 10, 1))).toBe('2026-11');
  });
});

describe('remainingAiQuota', () => {
  const now = new Date(2026, 7, 21); // 2026-08-21

  it('is unlimited for premium regardless of usage', () => {
    expect(remainingAiQuota('premium', { monthKey: '2026-08', count: 999 }, now)).toBe(Infinity);
    expect(remainingAiQuota('premium', undefined, now)).toBe(Infinity);
  });

  it('is the full quota for free tier with no usage yet', () => {
    expect(remainingAiQuota('free', undefined, now)).toBe(FREE_MONTHLY_AI_QUOTA);
  });

  it('subtracts this month\'s usage for free tier', () => {
    expect(remainingAiQuota('free', { monthKey: '2026-08', count: 2 }, now)).toBe(FREE_MONTHLY_AI_QUOTA - 2);
  });

  it('never goes below zero even if usage exceeds the quota', () => {
    expect(remainingAiQuota('free', { monthKey: '2026-08', count: 999 }, now)).toBe(0);
  });

  it('resets: usage from a past month does not carry over', () => {
    expect(remainingAiQuota('free', { monthKey: '2026-07', count: 5 }, now)).toBe(FREE_MONTHLY_AI_QUOTA);
  });
});
