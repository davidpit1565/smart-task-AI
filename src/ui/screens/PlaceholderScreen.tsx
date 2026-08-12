import { useTranslation } from '@/i18n/LanguageContext';
import type { TranslationKey } from '@/i18n/translations';

export function PlaceholderScreen({ messageKey }: { messageKey: TranslationKey }) {
  const { t } = useTranslation();
  return (
    <div style={{ padding: 24, textAlign: 'center', color: 'var(--color-text-muted)' }}>
      <h2 style={{ color: 'var(--color-text)' }}>{t('comingSoon.title')}</h2>
      <p>{t(messageKey)}</p>
    </div>
  );
}
