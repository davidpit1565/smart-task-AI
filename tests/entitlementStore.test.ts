import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/data/db';
import { useEntitlementStore } from '@/store/entitlementStore';
import { FREE_MONTHLY_AI_QUOTA } from '@/core/entitlement.types';

beforeEach(async () => {
  await db.entitlement.clear();
  await db.aiUsage.clear();
  useEntitlementStore.setState({ tier: 'free', remainingAiQuota: 0, loaded: false });
});

describe('entitlementStore', () => {
  it('defaults to free tier with the full quota when nothing is stored yet', async () => {
    await useEntitlementStore.getState().load();
    expect(useEntitlementStore.getState().tier).toBe('free');
    expect(useEntitlementStore.getState().remainingAiQuota).toBe(FREE_MONTHLY_AI_QUOTA);
    expect(useEntitlementStore.getState().canUseAiBreakdown()).toBe(true);
  });

  it('decrements the quota on each recorded use and blocks once exhausted', async () => {
    await useEntitlementStore.getState().load();
    for (let i = 0; i < FREE_MONTHLY_AI_QUOTA; i++) {
      expect(useEntitlementStore.getState().canUseAiBreakdown()).toBe(true);
      await useEntitlementStore.getState().recordAiBreakdownUse();
    }
    expect(useEntitlementStore.getState().remainingAiQuota).toBe(0);
    expect(useEntitlementStore.getState().canUseAiBreakdown()).toBe(false);
  });

  it('persists usage across a reload (same month)', async () => {
    await useEntitlementStore.getState().load();
    await useEntitlementStore.getState().recordAiBreakdownUse();
    await useEntitlementStore.getState().recordAiBreakdownUse();

    useEntitlementStore.setState({ tier: 'free', remainingAiQuota: 0, loaded: false });
    await useEntitlementStore.getState().load();
    expect(useEntitlementStore.getState().remainingAiQuota).toBe(FREE_MONTHLY_AI_QUOTA - 2);
  });

  it('does not touch the usage table for a premium tier', async () => {
    await db.entitlement.put({ id: 'local', tier: 'premium', updatedAt: new Date().toISOString() });
    await useEntitlementStore.getState().load();
    expect(useEntitlementStore.getState().remainingAiQuota).toBe(Infinity);

    await useEntitlementStore.getState().recordAiBreakdownUse();
    expect(await db.aiUsage.toArray()).toHaveLength(0);
    expect(useEntitlementStore.getState().remainingAiQuota).toBe(Infinity);
  });
});
