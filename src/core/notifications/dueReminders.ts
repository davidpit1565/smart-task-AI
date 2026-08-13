import type { Task } from '@/core/task.types';

export interface DueReminder {
  taskId: string;
  reminderId: string;
  title: string;
}

/** A stable key so "already fired this reminder" survives across a poll interval. */
export function reminderFireKey(taskId: string, reminderId: string): string {
  return `${taskId}:${reminderId}`;
}

/**
 * Pure selection logic: which reminders are due right now and haven't fired
 * yet. Kept separate from the browser Notification API so it's unit-testable
 * without a DOM/Notification stub.
 */
export function selectDueReminders(tasks: Task[], now: Date, alreadyFired: ReadonlySet<string>): DueReminder[] {
  const due: DueReminder[] = [];

  for (const task of tasks) {
    if (task.status !== 'pending' || !task.dueDate) continue;
    const dueMoment = new Date(task.dueTime ? `${task.dueDate}T${task.dueTime}` : `${task.dueDate}T00:00:00`);

    for (const reminder of task.reminders) {
      const key = reminderFireKey(task.id, reminder.id);
      if (alreadyFired.has(key)) continue;

      const fireAt = new Date(dueMoment.getTime() - reminder.offsetMinutes * 60_000);
      if (fireAt.getTime() <= now.getTime()) {
        due.push({ taskId: task.id, reminderId: reminder.id, title: task.title });
      }
    }
  }

  return due;
}
