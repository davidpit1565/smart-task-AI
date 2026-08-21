import { create } from 'zustand';
import { monthKeyFor, remainingAiQuota, type EntitlementTier } from '@/core/entitlement.types';
import type { EntitlementRepository } from '@/core/entitlement.repository';
import { DexieEntitlementRepository } from '@/data/dexieEntitlementRepository';
import { db } from '@/data/db';

interface EntitlementStoreState {
  tier: EntitlementTier;
  remainingAiQuota: number; // Infinity for premium
  loaded: boolean;
  repository: EntitlementRepository;

  load(): Promise<void>;
  /** True if an AI breakdown call is allowed right now — check before calling the API. */
  canUseAiBreakdown(): boolean;
  /** Call once an AI breakdown call actually succeeds — never on a failed call, so errors don't burn the user's quota. */
  recordAiBreakdownUse(): Promise<void>;
}

export const useEntitlementStore = create<EntitlementStoreState>((set, get) => ({
  tier: 'free',
  remainingAiQuota: 0,
  loaded: false,
  repository: new DexieEntitlementRepository(db),

  async load() {
    const { repository } = get();
    const now = new Date();
    const [entitlement, usage] = await Promise.all([repository.getEntitlement(), repository.getAiUsage(monthKeyFor(now))]);
    set({
      tier: entitlement.tier,
      remainingAiQuota: remainingAiQuota(entitlement.tier, usage, now),
      loaded: true,
    });
  },

  canUseAiBreakdown() {
    return get().remainingAiQuota > 0;
  },

  async recordAiBreakdownUse() {
    const { repository, tier } = get();
    if (tier === 'premium') return; // unlimited — no usage row needed
    const now = new Date();
    const usage = await repository.incrementAiUsage(monthKeyFor(now));
    set({ remainingAiQuota: remainingAiQuota(tier, usage, now) });
  },
}));
