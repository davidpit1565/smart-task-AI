import type { Task } from '@/core/task.types';
import { useTranslation } from '@/i18n/LanguageContext';
import { BackButton } from '@/ui/components/BackButton';

interface ArchivedScreenProps {
  tasks: Task[];
  onBack(): void;
  onRestore(id: string): void;
}

export function ArchivedScreen({ tasks, onBack, onRestore }: ArchivedScreenProps) {
  const { t } = useTranslation();
  const archived = tasks.filter((task) => task.status === 'archived').sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '16px 16px 8px' }}>
      <BackButton label={t('more.title')} onClick={onBack} />
      <h1 style={{ fontSize: 21, margin: 0 }}>{t('archived.title')}</h1>

      {archived.length === 0 ? (
        <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '32px 16px' }}>{t('archived.empty')}</p>
      ) : (
        <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
          {archived.map((task) => (
            <li
              key={task.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 10,
                padding: '12px 4px',
                borderBottom: '1px solid var(--color-border)',
              }}
            >
              <span style={{ color: 'var(--color-text)', fontSize: 15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {task.title}
              </span>
              <button
                type="button"
                onClick={() => onRestore(task.id)}
                style={{ background: 'none', border: 'none', color: 'var(--color-accent)', fontWeight: 600, fontSize: 13, cursor: 'pointer', flexShrink: 0 }}
              >
                {t('action.restore')}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
