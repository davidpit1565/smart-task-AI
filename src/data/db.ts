import Dexie, { type Table } from 'dexie';
import type { Task } from '@/core/task.types';
import type { Project } from '@/core/project.types';

interface AttachmentBlobRow {
  id: string;
  blob: Blob;
}

export class SmartTasksDatabase extends Dexie {
  tasks!: Table<Task, string>;
  projects!: Table<Project, string>;
  attachmentBlobs!: Table<AttachmentBlobRow, string>;

  constructor(name = 'smart-tasks-ai') {
    super(name);
    this.version(1).stores({
      tasks: 'id, status, projectId, parentTaskId, dueDate, order',
      attachmentBlobs: 'id',
    });
    this.version(2).stores({
      tasks: 'id, status, projectId, parentTaskId, dueDate, order',
      projects: 'id, status, order',
      attachmentBlobs: 'id',
    });
  }
}

export const db = new SmartTasksDatabase();
