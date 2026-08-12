import type { Task } from './task.types';

/**
 * Storage-agnostic contract for task persistence. The local (Dexie/IndexedDB)
 * implementation is the only one today; Phase 6 adds a remote-backed
 * implementation behind the same interface plus a sync queue, so the store
 * and UI never need to change.
 */
export interface TaskRepository {
  getAll(): Promise<Task[]>;
  getById(id: string): Promise<Task | undefined>;
  put(task: Task): Promise<void>;
  putMany(tasks: Task[]): Promise<void>;
  remove(id: string): Promise<void>;
}

export interface AttachmentBlobStore {
  put(id: string, blob: Blob): Promise<void>;
  get(id: string): Promise<Blob | undefined>;
  remove(id: string): Promise<void>;
}
