import type { AiUsage, EntitlementState } from './entitlement.types';

export interface EntitlementRepository {
  getEntitlement(): Promise<EntitlementState>;
  getAiUsage(monthKey: string): Promise<AiUsage | undefined>;
  /** Increments and persists the given month's usage count, returning the new record. */
  incrementAiUsage(monthKey: string): Promise<AiUsage>;
}
