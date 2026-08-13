import { useTranslation } from '@/i18n/LanguageContext';
import { ChevronBackIcon } from '@/ui/icons';

export function BackButton({ label, onClick }: { label: string; onClick(): void }) {
  const { dir } = useTranslation();
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        background: 'none',
        border: 'none',
        color: 'var(--color-text-muted)',
        cursor: 'pointer',
        padding: 0,
        fontSize: 13,
        alignSelf: 'flex-start',
      }}
    >
      <ChevronBackIcon width={16} height={16} style={{ transform: dir === 'rtl' ? 'scaleX(-1)' : undefined }} />
      {label}
    </button>
  );
}
