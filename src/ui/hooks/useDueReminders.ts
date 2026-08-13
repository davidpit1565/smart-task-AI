import { useEffect, useRef } from 'react';
import type { Task } from '@/core/task.types';
import { reminderFireKey, selectDueReminders } from '@/core/notifications/dueReminders';
import { showTaskReminder } from '@/integrations/notifications/notificationManager';

const POLL_INTERVAL_MS = 30_000;

/** Polls for due task reminders while this component tree is mounted (i.e. the app is open) and fires local notifications. */
export function useDueReminders(tasks: Task[]): void {
  const firedRef = useRef<Set<string>>(new Set());
  const tasksRef = useRef(tasks);
  tasksRef.current = tasks;

  useEffect(() => {
    function checkNow() {
      const due = selectDueReminders(tasksRef.current, new Date(), firedRef.current);
      for (const reminder of due) {
        firedRef.current.add(reminderFireKey(reminder.taskId, reminder.reminderId));
        showTaskReminder(reminder.title, 'Due now');
      }
    }

    checkNow();
    const interval = setInterval(checkNow, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);
}
