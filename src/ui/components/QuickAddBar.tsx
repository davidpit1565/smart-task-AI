import { useState } from 'react';
import { useTranslation } from '@/i18n/LanguageContext';

interface QuickAddBarProps {
  onAdd(title: string): void;
  placeholder?: string;
}

export function QuickAddBar({ onAdd, placeholder }: QuickAddBarProps) {
  const { t } = useTranslation();
  const [value, setValue] = useState('');
  const resolvedPlaceholder = placeholder ?? t('inbox.quickAdd.placeholder');

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
      style={{ display: 'flex', gap: 8, padding: '4px 16px 12px' }}
    >
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={resolvedPlaceholder}
        aria-label={resolvedPlaceholder}
        style={{
          flex: 1,
          padding: '11px 14px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-border)',
          background: 'var(--color-bg)',
          color: 'var(--color-text)',
          fontSize: 16,
          transition: 'border-color 0.15s ease',
        }}
      />
      <button
        type="submit"
        aria-label={resolvedPlaceholder}
        style={{
          width: 44,
          borderRadius: 'var(--radius-md)',
          border: 'none',
          background: 'var(--color-accent)',
          color: 'var(--color-accent-contrast)',
          fontWeight: 600,
          fontSize: 18,
          cursor: 'pointer',
          flexShrink: 0,
        }}
      >
        +
      </button>
    </form>
  );
}
