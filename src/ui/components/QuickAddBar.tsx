import { useState } from 'react';
import { useTranslation } from '@/i18n/LanguageContext';

export function QuickAddBar({ onAdd }: { onAdd(title: string): void }) {
  const { t } = useTranslation();
  const [value, setValue] = useState('');

  function submit() {
    const title = value.trim();
    if (!title) return;
    onAdd(title);
    setValue('');
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      style={{ display: 'flex', gap: 8, padding: 12 }}
    >
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={t('inbox.quickAdd.placeholder')}
        aria-label={t('inbox.quickAdd.placeholder')}
        style={{
          flex: 1,
          padding: '10px 14px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-border)',
          background: 'var(--color-surface)',
          color: 'var(--color-text)',
          fontSize: 15,
        }}
      />
      <button
        type="submit"
        style={{
          padding: '10px 16px',
          borderRadius: 'var(--radius-md)',
          border: 'none',
          background: 'var(--color-accent)',
          color: 'var(--color-accent-contrast)',
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        +
      </button>
    </form>
  );
}
