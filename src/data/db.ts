import Dexie, { type Table } from 'dexie';
import type { Task } from '@/core/task.types';

interface AttachmentBlobRow {
  id: string;
  blob: Blob;
}

export class SmartTasksDatabase extends Dexie {
  tasks!: Table<Task, string>;
  attachmentBlobs!: Table<AttachmentBlobRow, string>;

  constructor(name = 'smart-tasks-ai') {
    super(name);
    this.version(1).stores({
      tasks: 'id, status, projectId, parentTaskId, dueDate, order',
      attachmentBlobs: 'id',
    });
  }
}

export const db = new SmartTasksDatabase();
