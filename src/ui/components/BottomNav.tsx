import { useTranslation } from '@/i18n/LanguageContext';
import type { TranslationKey } from '@/i18n/translations';

export type ScreenId = 'today' | 'inbox' | 'calendar' | 'projects' | 'more';

const ITEMS: { id: ScreenId; labelKey: TranslationKey; icon: string }[] = [
  { id: 'today', labelKey: 'nav.today', icon: '☀️' },
  { id: 'inbox', labelKey: 'nav.inbox', icon: '📥' },
  { id: 'calendar', labelKey: 'nav.calendar', icon: '📅' },
  { id: 'projects', labelKey: 'nav.projects', icon: '📁' },
  { id: 'more', labelKey: 'nav.more', icon: '⋯' },
];

export function BottomNav({ active, onChange }: { active: ScreenId; onChange(id: ScreenId): void }) {
  const { t } = useTranslation();
  return (
    <nav
      aria-label="Main navigation"
      style={{
        display: 'flex',
        justifyContent: 'space-around',
        borderTop: '1px solid var(--color-border)',
        background: 'var(--color-surface)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {ITEMS.map((item) => {
        const isActive = item.id === active;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onChange(item.id)}
            aria-current={isActive ? 'page' : undefined}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              padding: '10px 4px',
              background: 'none',
              border: 'none',
              color: isActive ? 'var(--color-accent)' : 'var(--color-text-muted)',
              cursor: 'pointer',
              fontSize: 11,
            }}
          >
            <span aria-hidden="true" style={{ fontSize: 18 }}>
              {item.icon}
            </span>
            {t(item.labelKey)}
          </button>
        );
      })}
    </nav>
  );
}
