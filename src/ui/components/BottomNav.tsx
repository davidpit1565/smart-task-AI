import type { ComponentType } from 'react';
import { useTranslation } from '@/i18n/LanguageContext';
import type { TranslationKey } from '@/i18n/translations';
import { CalendarIcon, InboxIcon, MoreIcon, ProjectsIcon, SunIcon } from '@/ui/icons';

export type ScreenId = 'today' | 'inbox' | 'calendar' | 'projects' | 'more';

const ITEMS: { id: ScreenId; labelKey: TranslationKey; Icon: ComponentType<{ width?: number; height?: number }> }[] = [
  { id: 'today', labelKey: 'nav.today', Icon: SunIcon },
  { id: 'inbox', labelKey: 'nav.inbox', Icon: InboxIcon },
  { id: 'calendar', labelKey: 'nav.calendar', Icon: CalendarIcon },
  { id: 'projects', labelKey: 'nav.projects', Icon: ProjectsIcon },
  { id: 'more', labelKey: 'nav.more', Icon: MoreIcon },
];

export function BottomNav({ active, onChange }: { active: ScreenId; onChange(id: ScreenId): void }) {
  const { t } = useTranslation();
  return (
    <nav
      aria-label={t('nav.landmarkLabel')}
      style={{
        display: 'flex',
        justifyContent: 'space-around',
        borderTop: '1px solid var(--color-border)',
        background: 'var(--color-surface)',
        paddingTop: 6,
        paddingBottom: 'calc(6px + env(safe-area-inset-bottom))',
      }}
    >
      {ITEMS.map(({ id, labelKey, Icon }) => {
        const isActive = id === active;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            aria-current={isActive ? 'page' : undefined}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 3,
              padding: '6px 4px',
              background: 'none',
              border: 'none',
              color: isActive ? 'var(--color-accent)' : 'var(--color-text-muted)',
              cursor: 'pointer',
              fontSize: 11,
              fontWeight: isActive ? 600 : 500,
              letterSpacing: '0.01em',
              transition: 'color 0.15s ease',
            }}
          >
            <Icon width={21} height={21} />
            {t(labelKey)}
          </button>
        );
      })}
    </nav>
  );
}
