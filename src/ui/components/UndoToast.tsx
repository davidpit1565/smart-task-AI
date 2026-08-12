import { useTranslation } from '@/i18n/LanguageContext';
import type { TranslationKey } from '@/i18n/translations';

interface UndoToastProps {
  messageKey: TranslationKey;
  onUndo(): void;
  onDismiss(): void;
}

export function UndoToast({ messageKey, onUndo, onDismiss }: UndoToastProps) {
  const { t } = useTranslation();
  return (
    <div
      role="status"
      style={{
        position: 'fixed',
        insetInlineStart: 16,
        insetInlineEnd: 16,
        bottom: 88,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        padding: '12px 16px',
        borderRadius: 'var(--radius-md)',
        background: 'var(--color-surface-raised)',
        boxShadow: 'var(--shadow-card)',
        color: 'var(--color-text)',
        maxWidth: 688,
        marginInline: 'auto',
      }}
    >
      <span>{t(messageKey)}</span>
      <button
        type="button"
        onClick={() => {
          onUndo();
          onDismiss();
        }}
        style={{ background: 'none', border: 'none', color: 'var(--color-accent)', fontWeight: 600, cursor: 'pointer' }}
      >
        {t('action.undo')}
      </button>
    </div>
  );
}
