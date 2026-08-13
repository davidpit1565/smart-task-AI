import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/data/db';
import { useProjectStore } from '@/store/projectStore';

beforeEach(async () => {
  await db.projects.clear();
  useProjectStore.setState({ projects: [], loaded: false });
});

describe('projectStore', () => {
  it('adds a project with an incrementing order and persists it', async () => {
    const first = await useProjectStore.getState().addProject({ name: 'Launch app' });
    const second = await useProjectStore.getState().addProject({ name: 'Redesign site' });
    expect(second.order).toBeGreaterThan(first.order);

    const stored = await db.projects.get(first.id);
    expect(stored?.name).toBe('Launch app');
    expect(stored?.status).toBe('active');
  });

  it('updates a project', async () => {
    const project = await useProjectStore.getState().addProject({ name: 'Original' });
    await useProjectStore.getState().updateProject(project.id, { name: 'Renamed', deadline: '2026-09-01' });
    const updated = useProjectStore.getState().projects.find((p) => p.id === project.id);
    expect(updated?.name).toBe('Renamed');
    expect(updated?.deadline).toBe('2026-09-01');
  });

  it('archives and restores a project', async () => {
    const project = await useProjectStore.getState().addProject({ name: 'To archive' });
    await useProjectStore.getState().archiveProject(project.id);
    expect(useProjectStore.getState().projects.find((p) => p.id === project.id)?.status).toBe('archived');

    await useProjectStore.getState().restoreProject(project.id);
    expect(useProjectStore.getState().projects.find((p) => p.id === project.id)?.status).toBe('active');
  });

  it('removes a project permanently', async () => {
    const project = await useProjectStore.getState().addProject({ name: 'To delete' });
    await useProjectStore.getState().removeProject(project.id);
    expect(useProjectStore.getState().projects.find((p) => p.id === project.id)).toBeUndefined();
    expect(await db.projects.get(project.id)).toBeUndefined();
  });
});
