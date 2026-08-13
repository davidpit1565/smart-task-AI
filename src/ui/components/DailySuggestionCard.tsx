import type { Suggestion, SuggestionReason } from '@/core/dailyPlanner';
import { useTranslation } from '@/i18n/LanguageContext';
import type { TranslationKey } from '@/i18n/translations';
import { ChevronBackIcon } from '@/ui/icons';

const REASON_KEY: Record<SuggestionReason, TranslationKey> = {
  overdue: 'planner.reason.overdue',
  dueToday: 'planner.reason.dueToday',
  highPriority: 'planner.reason.highPriority',
  next: 'planner.reason.next',
};

const REASON_COLOR: Record<SuggestionReason, string> = {
  overdue: 'var(--color-danger)',
  dueToday: 'var(--color-accent)',
  highPriority: 'var(--color-priority-high)',
  next: 'var(--color-text-muted)',
};

export function DailySuggestionCard({ suggestions, onOpen }: { suggestions: Suggestion[]; onOpen(taskId: string): void }) {
  const { t, dir } = useTranslation();
  if (suggestions.length === 0) return null;

  return (
    <section
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-card)',
        padding: '16px 18px',
      }}
    >
      <h2 style={{ fontSize: 15.5, fontWeight: 650, margin: '0 0 4px' }}>{t('planner.title')}</h2>
      <p style={{ fontSize: 12.5, color: 'var(--color-text-muted)', margin: '0 0 12px' }}>{t('planner.subtitle')}</p>
      <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {suggestions.map(({ task, reason }, index) => (
          <li key={task.id}>
            <button
              type="button"
              onClick={() => onOpen(task.id)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 4px',
                background: 'none',
                border: 'none',
                borderTop: index > 0 ? '1px solid var(--color-border)' : 'none',
                cursor: 'pointer',
                textAlign: 'start',
              }}
            >
              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
                <span style={{ fontSize: 15, fontWeight: 500, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {task.title}
                </span>
                <span style={{ fontSize: 12, fontWeight: 600, color: REASON_COLOR[reason] }}>{t(REASON_KEY[reason])}</span>
              </div>
              <ChevronBackIcon width={15} height={15} style={{ color: 'var(--color-text-faint)', transform: dir === 'rtl' ? undefined : 'scaleX(-1)', flexShrink: 0 }} />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
