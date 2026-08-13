import type { Project } from '@/core/project.types';
import type { ProjectRepository } from '@/core/project.repository';
import type { SmartTasksDatabase } from './db';

export class DexieProjectRepository implements ProjectRepository {
  constructor(private readonly database: SmartTasksDatabase) {}

  getAll(): Promise<Project[]> {
    return this.database.projects.toArray();
  }

  getById(id: string): Promise<Project | undefined> {
    return this.database.projects.get(id);
  }

  async put(project: Project): Promise<void> {
    await this.database.projects.put(project);
  }

  async remove(id: string): Promise<void> {
    await this.database.projects.delete(id);
  }
}
