import type { Task } from '@/core/task.types';
import { selectGreetingPeriod, selectOverdueTasks, selectTodayProgress, selectTodayTasks } from '@/core/todaySelectors';
import { useTranslation } from '@/i18n/LanguageContext';
import { ProgressBar } from '@/ui/components/ProgressBar';
import { TaskList } from '@/ui/components/TaskList';

interface TodayScreenProps {
  tasks: Task[];
  onToggleComplete(id: string): void;
  onOpen(task: Task): void;
  onReorder(orderedIds: string[]): void;
}

export function TodayScreen({ tasks, onToggleComplete, onOpen, onReorder }: TodayScreenProps) {
  const { t } = useTranslation();
  const overdue = selectOverdueTasks(tasks);
  const today = selectTodayTasks(tasks);
  const progress = selectTodayProgress(tasks);
  const greeting = t(`today.greeting.${selectGreetingPeriod()}`);

  return (
    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h1 style={{ fontSize: 22, margin: '0 0 12px' }}>{greeting} 👋</h1>
        <div style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 6 }}>{t('today.progress')}</div>
        <ProgressBar value={progress.percent} label={t('today.progress')} />
        {progress.total > 0 && (
          <div style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 6 }}>
            {t('today.completedOf', { completed: progress.completed, total: progress.total })}
          </div>
        )}
      </div>

      {overdue.length > 0 && (
        <section>
          <h2 style={{ fontSize: 14, color: 'var(--color-danger)', margin: '0 0 4px' }}>
            {t('today.overdue')} · {overdue.length}
          </h2>
          <TaskList tasks={overdue} onToggleComplete={onToggleComplete} onOpen={onOpen} onReorder={onReorder} emptyMessage="" />
        </section>
      )}

      <section>
        <h2 style={{ fontSize: 14, color: 'var(--color-text-muted)', margin: '0 0 4px' }}>
          {t('today.tasksToday')} · {today.length}
        </h2>
        <TaskList tasks={today} onToggleComplete={onToggleComplete} onOpen={onOpen} onReorder={onReorder} emptyMessage={t('today.empty')} />
      </section>
    </div>
  );
}
