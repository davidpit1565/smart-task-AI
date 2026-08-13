import { create } from 'zustand';
import { createProject, normalizeProject, type NewProjectInput, type Project } from '@/core/project.types';
import type { ProjectRepository } from '@/core/project.repository';
import { DexieProjectRepository } from '@/data/dexieProjectRepository';
import { db } from '@/data/db';

function now(): string {
  return new Date().toISOString();
}

interface ProjectStoreState {
  projects: Project[];
  loaded: boolean;
  repository: ProjectRepository;

  load(): Promise<void>;
  addProject(input: NewProjectInput): Promise<Project>;
  updateProject(id: string, patch: Partial<Project>): Promise<void>;
  archiveProject(id: string): Promise<void>;
  restoreProject(id: string): Promise<void>;
  removeProject(id: string): Promise<void>;
}

export const useProjectStore = create<ProjectStoreState>((set, get) => ({
  projects: [],
  loaded: false,
  repository: new DexieProjectRepository(db),

  async load() {
    const projects = (await get().repository.getAll()).map(normalizeProject);
    set({ projects, loaded: true });
  },

  async addProject(input) {
    const { projects, repository } = get();
    const maxOrder = projects.reduce((max, p) => Math.max(max, p.order), 0);
    const project = createProject({ ...input, order: input.order ?? maxOrder + 1 });
    await repository.put(project);
    set((state) => ({ projects: [...state.projects, project] }));
    return project;
  },

  async updateProject(id, patch) {
    const existing = get().projects.find((p) => p.id === id);
    if (!existing) return;
    const updated: Project = { ...existing, ...patch, updatedAt: now() };
    await get().repository.put(updated);
    set((state) => ({ projects: state.projects.map((p) => (p.id === id ? updated : p)) }));
  },

  async archiveProject(id) {
    await get().updateProject(id, { status: 'archived' });
  },

  async restoreProject(id) {
    await get().updateProject(id, { status: 'active' });
  },

  async removeProject(id) {
    await get().repository.remove(id);
    set((state) => ({ projects: state.projects.filter((p) => p.id !== id) }));
  },
}));
