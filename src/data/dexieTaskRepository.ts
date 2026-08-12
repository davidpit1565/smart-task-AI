import type { Task } from '@/core/task.types';
import type { AttachmentBlobStore, TaskRepository } from '@/core/task.repository';
import type { SmartTasksDatabase } from './db';

export class DexieTaskRepository implements TaskRepository {
  constructor(private readonly database: SmartTasksDatabase) {}

  getAll(): Promise<Task[]> {
    return this.database.tasks.toArray();
  }

  getById(id: string): Promise<Task | undefined> {
    return this.database.tasks.get(id);
  }

  async put(task: Task): Promise<void> {
    await this.database.tasks.put(task);
  }

  async putMany(tasks: Task[]): Promise<void> {
    await this.database.tasks.bulkPut(tasks);
  }

  async remove(id: string): Promise<void> {
    await this.database.tasks.delete(id);
  }
}

export class DexieAttachmentBlobStore implements AttachmentBlobStore {
  constructor(private readonly database: SmartTasksDatabase) {}

  async put(id: string, blob: Blob): Promise<void> {
    await this.database.attachmentBlobs.put({ id, blob });
  }

  async get(id: string): Promise<Blob | undefined> {
    const row = await this.database.attachmentBlobs.get(id);
    return row?.blob;
  }

  async remove(id: string): Promise<void> {
    await this.database.attachmentBlobs.delete(id);
  }
}
