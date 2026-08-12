import type { Task } from '@/core/task.types';
import { selectInboxTasks } from '@/core/todaySelectors';
import { useTranslation } from '@/i18n/LanguageContext';
import { QuickAddBar } from '@/ui/components/QuickAddBar';
import { TaskList } from '@/ui/components/TaskList';

interface InboxScreenProps {
  tasks: Task[];
  onAdd(title: string): void;
  onToggleComplete(id: string): void;
  onOpen(task: Task): void;
  onReorder(orderedIds: string[]): void;
}

export function InboxScreen({ tasks, onAdd, onToggleComplete, onOpen, onReorder }: InboxScreenProps) {
  const { t } = useTranslation();
  const inboxTasks = selectInboxTasks(tasks);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <h1 style={{ fontSize: 23, margin: '20px 16px 4px' }}>{t('inbox.title')}</h1>
      <QuickAddBar onAdd={onAdd} />
      <div style={{ padding: '0 8px' }}>
        <TaskList tasks={inboxTasks} onToggleComplete={onToggleComplete} onOpen={onOpen} onReorder={onReorder} emptyMessage={t('inbox.empty')} />
      </div>
    </div>
  );
}
