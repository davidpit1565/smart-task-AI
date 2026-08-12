/**
 * Core task domain model. Deliberately extensible: fields used by later
 * phases (recurrence, reminders, calendar links, AI provenance) are defined
 * now so the schema doesn't need breaking migrations as features land.
 */

export type Priority = 'none' | 'low' | 'medium' | 'high' | 'urgent';

export const PRIORITIES: Priority[] = ['none', 'low', 'medium', 'high', 'urgent'];

export type TaskStatus = 'pending' | 'completed' | 'archived' | 'trashed';

export type TaskSource = 'app' | 'ai' | 'import' | 'share' | 'calendar' | 'telegram';

export type RecurrenceFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'weekdays' | 'custom';

/** Defined now for Phase 2; the recurrence engine is not implemented yet. */
export interface RecurrenceRule {
  frequency: RecurrenceFrequency;
  interval?: number;
  /** 0 = Sunday .. 6 = Saturday, for weekly/custom recurrence. */
  daysOfWeek?: number[];
  /** Day of month, for monthly recurrence (e.g. "every 15th"). */
  dayOfMonth?: number;
  endDate?: string;
  occurrences?: number;
}

export type ReminderMethod = 'push' | 'email';

export interface Reminder {
  id: string;
  /** Minutes before the task's due date/time. Negative values are invalid. */
  offsetMinutes: number;
  method: ReminderMethod;
}

export interface AttachmentMeta {
  id: string;
  taskId: string;
  name: string;
  mimeType: string;
  size: number;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  notes: string;
  status: TaskStatus;
  priority: Priority;

  createdAt: string;
  updatedAt: string;
  completedAt: string | null;

  /** ISO date, e.g. "2026-08-14". No time component. */
  dueDate: string | null;
  /** "HH:mm", only meaningful when dueDate is set. */
  dueTime: string | null;
  /** Hard deadline, distinct from the soft dueDate. ISO date. */
  deadline: string | null;

  categoryId: string | null;
  projectId: string | null;
  parentTaskId: string | null;

  tags: string[];
  recurrenceRule: RecurrenceRule | null;
  reminders: Reminder[];
  attachments: AttachmentMeta[];

  estimatedDuration: number | null;
  actualDuration: number | null;

  /** Fractional ordering key for drag-and-drop reordering within a list. */
  order: number;

  source: TaskSource;
  externalId: string | null;
  calendarEventId: string | null;
  createdFromAI: boolean;

  metadata: Record<string, unknown>;
}

export type NewTaskInput = Partial<Task> & { title: string };

export function createTask(input: NewTaskInput, now: () => string = () => new Date().toISOString()): Task {
  const timestamp = now();
  return {
    id: input.id ?? crypto.randomUUID(),
    title: input.title,
    description: input.description ?? '',
    notes: input.notes ?? '',
    status: input.status ?? 'pending',
    priority: input.priority ?? 'none',
    createdAt: input.createdAt ?? timestamp,
    updatedAt: input.updatedAt ?? timestamp,
    completedAt: input.completedAt ?? null,
    dueDate: input.dueDate ?? null,
    dueTime: input.dueTime ?? null,
    deadline: input.deadline ?? null,
    categoryId: input.categoryId ?? null,
    projectId: input.projectId ?? null,
    parentTaskId: input.parentTaskId ?? null,
    tags: input.tags ?? [],
    recurrenceRule: input.recurrenceRule ?? null,
    reminders: input.reminders ?? [],
    attachments: input.attachments ?? [],
    estimatedDuration: input.estimatedDuration ?? null,
    actualDuration: input.actualDuration ?? null,
    order: input.order ?? 0,
    source: input.source ?? 'app',
    externalId: input.externalId ?? null,
    calendarEventId: input.calendarEventId ?? null,
    createdFromAI: input.createdFromAI ?? false,
    metadata: input.metadata ?? {},
  };
}

export function isOverdue(task: Task, referenceDate: Date = new Date()): boolean {
  if (task.status !== 'pending' || !task.dueDate) return false;
  const due = new Date(task.dueTime ? `${task.dueDate}T${task.dueTime}` : `${task.dueDate}T23:59:59`);
  return due.getTime() < referenceDate.getTime();
}

function toLocalIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function isDueToday(task: Task, referenceDate: Date = new Date()): boolean {
  if (!task.dueDate) return false;
  return task.dueDate === toLocalIsoDate(referenceDate);
}
