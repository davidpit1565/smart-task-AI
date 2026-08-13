import type { Task } from '@/core/task.types';
import { selectGreetingPeriod, selectOverdueTasks, selectTodayProgress, selectTodayTasks } from '@/core/todaySelectors';
import { suggestTasks } from '@/core/dailyPlanner';
import { useTranslation } from '@/i18n/LanguageContext';
import { DailySuggestionCard } from '@/ui/components/DailySuggestionCard';
import { ProgressBar } from '@/ui/components/ProgressBar';
import { SectionHeader } from '@/ui/components/SectionHeader';
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
  const suggestions = suggestTasks(tasks, tasks);

  return (
    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-card)',
          padding: '20px 20px 18px',
        }}
      >
        <h1 style={{ fontSize: 23, margin: '0 0 16px' }}>{greeting}</h1>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 12.5, fontWeight: 600, letterSpacing: '0.03em', textTransform: 'uppercase', color: 'var(--color-text-faint)' }}>
            {t('today.progress')}
          </span>
          <span style={{ fontSize: 15, fontWeight: 650, color: 'var(--color-accent)' }}>{progress.percent}%</span>
        </div>
        <ProgressBar value={progress.percent} label={t('today.progress')} />
        {progress.total > 0 && (
          <div style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 10 }}>
            {t('today.completedOf', { completed: progress.completed, total: progress.total })}
          </div>
        )}
      </div>

      <DailySuggestionCard
        suggestions={suggestions}
        onOpen={(taskId) => {
          const task = tasks.find((t) => t.id === taskId);
          if (task) onOpen(task);
        }}
      />

      {overdue.length > 0 && (
        <section>
          <SectionHeader title={t('today.overdue')} count={overdue.length} tone="danger" />
          <TaskList tasks={overdue} allTasks={tasks} onToggleComplete={onToggleComplete} onOpen={onOpen} onReorder={onReorder} emptyMessage="" />
        </section>
      )}

      <section>
        <SectionHeader title={t('today.tasksToday')} count={today.length} />
        <TaskList tasks={today} allTasks={tasks} onToggleComplete={onToggleComplete} onOpen={onOpen} onReorder={onReorder} emptyMessage={t('today.empty')} />
      </section>
    </div>
  );
}
