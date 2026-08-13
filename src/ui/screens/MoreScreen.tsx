import type { Task } from '@/core/task.types';
import { useTranslation } from '@/i18n/LanguageContext';
import { ListRow } from '@/ui/components/ListRow';

export type MoreView = 'completed' | 'archived';

interface MoreScreenProps {
  tasks: Task[];
  onOpen(view: MoreView): void;
}

export function MoreScreen({ tasks, onOpen }: MoreScreenProps) {
  const { t } = useTranslation();
  const completedCount = tasks.filter((task) => task.status === 'completed').length;
  const archivedCount = tasks.filter((task) => task.status === 'archived').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <h1 style={{ fontSize: 23, margin: '20px 16px 12px' }}>{t('more.title')}</h1>
      <div style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', margin: '0 16px', overflow: 'hidden' }}>
        <ListRow label={t('more.completed')} count={completedCount} onClick={() => onOpen('completed')} />
        <ListRow label={t('more.archived')} count={archivedCount} onClick={() => onOpen('archived')} />
      </div>
      <p style={{ color: 'var(--color-text-muted)', fontSize: 13, textAlign: 'center', padding: '24px 24px 0' }}>{t('comingSoon.more')}</p>
    </div>
  );
}
