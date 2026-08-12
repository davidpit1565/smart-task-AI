import type { ComponentType } from 'react';
import { useTranslation } from '@/i18n/LanguageContext';
import type { TranslationKey } from '@/i18n/translations';

export function PlaceholderScreen({
  messageKey,
  Icon,
}: {
  messageKey: TranslationKey;
  Icon: ComponentType<{ width?: number; height?: number }>;
}) {
  const { t } = useTranslation();
  return (
    <div style={{ padding: '64px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: 'var(--color-accent-soft)',
          color: 'var(--color-accent)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon width={26} height={26} />
      </div>
      <h2 style={{ color: 'var(--color-text)', fontSize: 17, margin: 0 }}>{t('comingSoon.title')}</h2>
      <p style={{ color: 'var(--color-text-muted)', fontSize: 14, margin: 0, maxWidth: 280, lineHeight: 1.5 }}>{t(messageKey)}</p>
    </div>
  );
}
