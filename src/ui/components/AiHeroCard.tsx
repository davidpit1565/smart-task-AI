import { useState } from 'react';
import { useTranslation } from '@/i18n/LanguageContext';
import { SparkleIcon } from '@/ui/icons';

const STORAGE_KEY = 'unknot.aiHeroDismissed';

function readDismissed(): boolean {
  return typeof localStorage !== 'undefined' && localStorage.getItem(STORAGE_KEY) === 'true';
}

/** A one-time explainer for the app's core feature — see docs/PRODUCT_GOAL.md: the idea has to be obvious on Today, not buried in a task's detail panel. */
export function AiHeroCard() {
  const { t } = useTranslation();
  const [dismissed, setDismissed] = useState(readDismissed);
  if (dismissed) return null;

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, 'true');
    setDismissed(true);
  }

  return (
    <section
      style={{
        position: 'relative',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-card)',
        padding: '16px 18px',
        background: 'linear-gradient(155deg, var(--tile-today-1), var(--tile-today-2))',
        color: '#ffffff',
      }}
    >
      <button
        type="button"
        onClick={dismiss}
        aria-label={t('action.dismiss')}
        style={{
          position: 'absolute',
          top: 10,
          insetInlineEnd: 10,
          width: 24,
          height: 24,
          borderRadius: '50%',
          border: 'none',
          background: 'rgba(255, 255, 255, 0.2)',
          color: '#ffffff',
          fontSize: 14,
          lineHeight: 1,
          cursor: 'pointer',
        }}
      >
        ×
      </button>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <SparkleIcon width={16} height={16} />
        <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>{t('today.aiHero.title')}</h2>
      </div>
      <p style={{ fontSize: 13, lineHeight: 1.5, margin: 0, opacity: 0.95, maxWidth: 320 }}>{t('today.aiHero.subtitle')}</p>
    </section>
  );
}
