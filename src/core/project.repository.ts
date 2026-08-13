import type { Project } from './project.types';

export interface ProjectRepository {
  getAll(): Promise<Project[]>;
  getById(id: string): Promise<Project | undefined>;
  put(project: Project): Promise<void>;
  remove(id: string): Promise<void>;
}
