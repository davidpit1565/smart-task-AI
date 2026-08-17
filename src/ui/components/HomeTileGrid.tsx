import type { ComponentType } from 'react';
import type { ScreenId } from '@/ui/components/BottomNav';
import { AlertIcon, CalendarIcon, InboxIcon, MoreIcon, ProjectsIcon, SunIcon } from '@/ui/icons';
import { useTranslation } from '@/i18n/LanguageContext';
import type { TranslationKey } from '@/i18n/translations';

interface Tile {
  key: 'today' | 'overdue' | 'inbox' | 'calendar' | 'projects' | 'more';
  labelKey: TranslationKey;
  Icon: ComponentType<{ width?: number; height?: number }>;
  gradient: string;
  screen: ScreenId;
  count?: number;
}

interface HomeTileGridProps {
  todayCount: number;
  overdueCount: number;
  inboxCount: number;
  onNavigate(screen: ScreenId): void;
}

export function HomeTileGrid({ todayCount, overdueCount, inboxCount, onNavigate }: HomeTileGridProps) {
  const { t } = useTranslation();

  const tiles: Tile[] = [
    { key: 'today', labelKey: 'nav.today', Icon: SunIcon, gradient: 'var(--tile-today-1), var(--tile-today-2)', screen: 'today', count: todayCount },
    { key: 'overdue', labelKey: 'today.overdue', Icon: AlertIcon, gradient: 'var(--tile-calendar-1), var(--tile-calendar-2)', screen: 'today', count: overdueCount },
    { key: 'inbox', labelKey: 'nav.inbox', Icon: InboxIcon, gradient: 'var(--tile-inbox-1), var(--tile-inbox-2)', screen: 'inbox', count: inboxCount },
    { key: 'calendar', labelKey: 'nav.calendar', Icon: CalendarIcon, gradient: 'var(--tile-calendar-1), var(--tile-calendar-2)', screen: 'calendar' },
    { key: 'projects', labelKey: 'nav.projects', Icon: ProjectsIcon, gradient: 'var(--tile-projects-1), var(--tile-projects-2)', screen: 'projects' },
    { key: 'more', labelKey: 'nav.more', Icon: MoreIcon, gradient: 'var(--tile-more-1), var(--tile-more-2)', screen: 'more' },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
      {tiles.map(({ key, labelKey, Icon, gradient, screen, count }) => (
        <button
          key={key}
          type="button"
          onClick={() => onNavigate(screen)}
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            height: 104,
            padding: 14,
            borderRadius: 'var(--radius-xl)',
            border: 'none',
            background: `linear-gradient(155deg, ${gradient})`,
            boxShadow: 'var(--shadow-tile)',
            color: '#ffffff',
            cursor: 'pointer',
            textAlign: 'start',
          }}
        >
          <Icon width={22} height={22} />
          <div>
            {count !== undefined && (
              <div style={{ fontSize: 26, fontWeight: 800, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{count}</div>
            )}
            <div style={{ fontSize: 13, fontWeight: 600, marginTop: count !== undefined ? 2 : 0 }}>{t(labelKey)}</div>
          </div>
        </button>
      ))}
    </div>
  );
}
