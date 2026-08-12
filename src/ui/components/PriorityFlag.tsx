import type { Priority } from '@/core/task.types';
import { useTranslation } from '@/i18n/LanguageContext';
import type { TranslationKey } from '@/i18n/translations';
import { FlagIcon } from '@/ui/icons';

const COLOR_VAR: Record<Priority, string | null> = {
  none: null,
  low: 'var(--color-priority-low)',
  medium: 'var(--color-priority-medium)',
  high: 'var(--color-priority-high)',
  urgent: 'var(--color-priority-urgent)',
};

export function PriorityFlag({ priority, showLabel = false }: { priority: Priority; showLabel?: boolean }) {
  const { t } = useTranslation();
  const color = COLOR_VAR[priority];
  if (!color) return null;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color }}>
      <FlagIcon width={12} height={12} />
      {showLabel && <span style={{ fontWeight: 500 }}>{t(`task.priority.${priority}` as TranslationKey)}</span>}
    </span>
  );
}
