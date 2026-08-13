import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/data/db';
import { useGoalStore } from '@/store/goalStore';

beforeEach(async () => {
  await db.goals.clear();
  useGoalStore.setState({ goals: [], loaded: false });
});

describe('goalStore', () => {
  it('adds a goal with an incrementing order and persists it', async () => {
    const first = await useGoalStore.getState().addGoal({ name: 'Get healthier' });
    const second = await useGoalStore.getState().addGoal({ name: 'Grow the business' });
    expect(second.order).toBeGreaterThan(first.order);

    const stored = await db.goals.get(first.id);
    expect(stored?.name).toBe('Get healthier');
    expect(stored?.status).toBe('active');
  });

  it('updates a goal', async () => {
    const goal = await useGoalStore.getState().addGoal({ name: 'Original' });
    await useGoalStore.getState().updateGoal(goal.id, { name: 'Renamed', targetDate: '2026-12-31' });
    const updated = useGoalStore.getState().goals.find((g) => g.id === goal.id);
    expect(updated?.name).toBe('Renamed');
    expect(updated?.targetDate).toBe('2026-12-31');
  });

  it('archives and restores a goal', async () => {
    const goal = await useGoalStore.getState().addGoal({ name: 'To archive' });
    await useGoalStore.getState().archiveGoal(goal.id);
    expect(useGoalStore.getState().goals.find((g) => g.id === goal.id)?.status).toBe('archived');

    await useGoalStore.getState().restoreGoal(goal.id);
    expect(useGoalStore.getState().goals.find((g) => g.id === goal.id)?.status).toBe('active');
  });

  it('removes a goal permanently', async () => {
    const goal = await useGoalStore.getState().addGoal({ name: 'To delete' });
    await useGoalStore.getState().removeGoal(goal.id);
    expect(useGoalStore.getState().goals.find((g) => g.id === goal.id)).toBeUndefined();
    expect(await db.goals.get(goal.id)).toBeUndefined();
  });
});
