import type { AiUsage, EntitlementState } from '@/core/entitlement.types';
import type { EntitlementRepository } from '@/core/entitlement.repository';
import type { SmartTasksDatabase } from './db';

const LOCAL_ID = 'local';

export class DexieEntitlementRepository implements EntitlementRepository {
  constructor(private readonly database: SmartTasksDatabase) {}

  async getEntitlement(): Promise<EntitlementState> {
    const row = await this.database.entitlement.get(LOCAL_ID);
    return row ?? { tier: 'free', updatedAt: new Date().toISOString() };
  }

  getAiUsage(monthKey: string): Promise<AiUsage | undefined> {
    return this.database.aiUsage.get(monthKey);
  }

  async incrementAiUsage(monthKey: string): Promise<AiUsage> {
    const existing = await this.database.aiUsage.get(monthKey);
    const updated: AiUsage = { monthKey, count: (existing?.count ?? 0) + 1 };
    await this.database.aiUsage.put(updated);
    return updated;
  }
}
