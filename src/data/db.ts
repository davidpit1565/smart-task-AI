import Dexie, { type Table } from 'dexie';
import type { Task } from '@/core/task.types';
import type { Project } from '@/core/project.types';
import type { Goal } from '@/core/goal.types';
import type { CalendarEvent, CalendarProviderType, ConnectedCalendar } from '@/core/calendar/calendarEvent.types';
import type { AiUsage, EntitlementState } from '@/core/entitlement.types';

interface AttachmentBlobRow {
  id: string;
  blob: Blob;
}

/**
 * Non-secret record of a connected calendar account. Deliberately does NOT
 * include the app-specific password / OAuth token — those live in memory
 * only for the session (see calendarStore), never written to IndexedDB.
 */
export interface CalendarConnection {
  id: string;
  providerType: CalendarProviderType;
  accountLabel: string;
  connectedAt: string;
}

export class SmartTasksDatabase extends Dexie {
  tasks!: Table<Task, string>;
  projects!: Table<Project, string>;
  goals!: Table<Goal, string>;
  attachmentBlobs!: Table<AttachmentBlobRow, string>;
  calendarConnections!: Table<CalendarConnection, string>;
  connectedCalendars!: Table<ConnectedCalendar, string>;
  calendarEvents!: Table<CalendarEvent, string>;
  entitlement!: Table<EntitlementState & { id: 'local' }, string>;
  aiUsage!: Table<AiUsage, string>;

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
    this.version(3).stores({
      tasks: 'id, status, projectId, parentTaskId, dueDate, order',
      projects: 'id, status, order',
      attachmentBlobs: 'id',
      calendarConnections: 'id, providerType',
      connectedCalendars: 'id, providerType',
      calendarEvents: 'id, connectedCalendarId, start, taskId',
    });
    this.version(4).stores({
      tasks: 'id, status, projectId, parentTaskId, dueDate, order',
      projects: 'id, status, order',
      goals: 'id, status, order',
      attachmentBlobs: 'id',
      calendarConnections: 'id, providerType',
      connectedCalendars: 'id, providerType',
      calendarEvents: 'id, connectedCalendarId, start, taskId',
    });
    this.version(5).stores({
      tasks: 'id, status, projectId, parentTaskId, dueDate, order',
      projects: 'id, status, order',
      goals: 'id, status, order',
      attachmentBlobs: 'id',
      calendarConnections: 'id, providerType',
      connectedCalendars: 'id, providerType',
      calendarEvents: 'id, connectedCalendarId, start, taskId',
      // Single row keyed 'local' — there's no account system, entitlement is
      // per-device. aiUsage is keyed by 'YYYY-MM' so the free quota resets
      // every calendar month without a cleanup job.
      entitlement: 'id',
      aiUsage: 'monthKey',
    });
  }
}

export const db = new SmartTasksDatabase();
