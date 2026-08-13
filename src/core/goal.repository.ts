import type { Goal } from './goal.types';

export interface GoalRepository {
  getAll(): Promise<Goal[]>;
  getById(id: string): Promise<Goal | undefined>;
  put(goal: Goal): Promise<void>;
  remove(id: string): Promise<void>;
}
