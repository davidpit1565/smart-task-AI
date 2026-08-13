import { useEffect, useState } from 'react';
import type { Task } from '@/core/task.types';
import { formatElapsed, secondsToTrackedMinutes } from '@/core/focusSession';
import { useTranslation } from '@/i18n/LanguageContext';
import { ChevronBackIcon, PauseIcon, PlayIcon } from '@/ui/icons';

interface FocusModeScreenProps {
  task: Task;
  /** Always called on exit (back button or finish button) — a session's elapsed time is never silently discarded. */
  onFinish(minutesSpent: number): void;
}

export function FocusModeScreen({ task, onFinish }: FocusModeScreenProps) {
  const { t, dir } = useTranslation();
  const [running, setRunning] = useState(true);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (!running) return;
    const interval = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, [running]);

  function finish() {
    onFinish(secondsToTrackedMinutes(elapsedSeconds));
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t('focus.title')}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'var(--color-bg)',
        zIndex: 60,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ padding: '16px 16px 0' }}>
        <button
          type="button"
          onClick={finish}
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
          }}
        >
          <ChevronBackIcon width={16} height={16} style={{ transform: dir === 'rtl' ? 'scaleX(-1)' : undefined }} />
          {t('focus.end')}
        </button>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 28, padding: 24 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 12.5, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--color-text-faint)', marginBottom: 8 }}>
            {t('focus.title')}
          </div>
          <h1 style={{ fontSize: 21, margin: 0, maxWidth: 320 }}>{task.title}</h1>
        </div>

        <div
          style={{
            fontSize: 56,
            fontWeight: 650,
            fontVariantNumeric: 'tabular-nums',
            color: 'var(--color-text)',
            letterSpacing: '0.01em',
          }}
        >
          {formatElapsed(elapsedSeconds)}
        </div>

        <button
          type="button"
          aria-label={running ? t('focus.pause') : t('focus.resume')}
          onClick={() => setRunning((r) => !r)}
          style={{
            width: 72,
            height: 72,
            borderRadius: '50%',
            border: 'none',
            background: 'var(--color-accent)',
            color: 'var(--color-accent-contrast)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          {running ? <PauseIcon width={28} height={28} /> : <PlayIcon width={28} height={28} />}
        </button>
      </div>

      <div style={{ padding: '0 24px 32px' }}>
        <button
          type="button"
          onClick={finish}
          style={{
            width: '100%',
            padding: '13px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
            background: 'var(--color-surface)',
            color: 'var(--color-text)',
            fontSize: 15,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {t('focus.finish')}
        </button>
      </div>
    </div>
  );
}
