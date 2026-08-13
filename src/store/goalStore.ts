import { create } from 'zustand';
import { createGoal, type Goal, type NewGoalInput } from '@/core/goal.types';
import type { GoalRepository } from '@/core/goal.repository';
import { DexieGoalRepository } from '@/data/dexieGoalRepository';
import { db } from '@/data/db';

function now(): string {
  return new Date().toISOString();
}

interface GoalStoreState {
  goals: Goal[];
  loaded: boolean;
  repository: GoalRepository;

  load(): Promise<void>;
  addGoal(input: NewGoalInput): Promise<Goal>;
  updateGoal(id: string, patch: Partial<Goal>): Promise<void>;
  archiveGoal(id: string): Promise<void>;
  restoreGoal(id: string): Promise<void>;
  removeGoal(id: string): Promise<void>;
}

export const useGoalStore = create<GoalStoreState>((set, get) => ({
  goals: [],
  loaded: false,
  repository: new DexieGoalRepository(db),

  async load() {
    const goals = await get().repository.getAll();
    set({ goals, loaded: true });
  },

  async addGoal(input) {
    const { goals, repository } = get();
    const maxOrder = goals.reduce((max, g) => Math.max(max, g.order), 0);
    const goal = createGoal({ ...input, order: input.order ?? maxOrder + 1 });
    await repository.put(goal);
    set((state) => ({ goals: [...state.goals, goal] }));
    return goal;
  },

  async updateGoal(id, patch) {
    const existing = get().goals.find((g) => g.id === id);
    if (!existing) return;
    const updated: Goal = { ...existing, ...patch, updatedAt: now() };
    await get().repository.put(updated);
    set((state) => ({ goals: state.goals.map((g) => (g.id === id ? updated : g)) }));
  },

  async archiveGoal(id) {
    await get().updateGoal(id, { status: 'archived' });
  },

  async restoreGoal(id) {
    await get().updateGoal(id, { status: 'active' });
  },

  async removeGoal(id) {
    await get().repository.remove(id);
    set((state) => ({ goals: state.goals.filter((g) => g.id !== id) }));
  },
}));
