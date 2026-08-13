import type { Goal } from '@/core/goal.types';
import type { GoalRepository } from '@/core/goal.repository';
import type { SmartTasksDatabase } from './db';

export class DexieGoalRepository implements GoalRepository {
  constructor(private readonly database: SmartTasksDatabase) {}

  getAll(): Promise<Goal[]> {
    return this.database.goals.toArray();
  }

  getById(id: string): Promise<Goal | undefined> {
    return this.database.goals.get(id);
  }

  async put(goal: Goal): Promise<void> {
    await this.database.goals.put(goal);
  }

  async remove(id: string): Promise<void> {
    await this.database.goals.delete(id);
  }
}
