import { useTranslation } from '@/i18n/LanguageContext';
import { ChevronBackIcon } from '@/ui/icons';

export function ListRow({ label, count, onClick }: { label: string; count?: number; onClick(): void }) {
  const { dir } = useTranslation();
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        padding: '14px 16px',
        background: 'var(--color-surface)',
        border: 'none',
        borderBottom: '1px solid var(--color-border)',
        cursor: 'pointer',
        fontSize: 15,
        color: 'var(--color-text)',
      }}
    >
      <span>{label}</span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-text-muted)' }}>
        {count !== undefined && <span style={{ fontSize: 13 }}>{count}</span>}
        <ChevronBackIcon width={16} height={16} style={{ transform: dir === 'rtl' ? undefined : 'scaleX(-1)' }} />
      </span>
    </button>
  );
}
