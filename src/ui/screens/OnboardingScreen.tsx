import { useState } from 'react';
import { useTranslation } from '@/i18n/LanguageContext';
import type { TranslationKey } from '@/i18n/translations';
import { SparkleIcon } from '@/ui/icons';

const EXAMPLE_STEP_KEYS: TranslationKey[] = ['onboarding.example.step1', 'onboarding.example.step2', 'onboarding.example.step3'];

interface OnboardingScreenProps {
  onFinish(): void;
}

const PAGE_COUNT = 2;

export function OnboardingScreen({ onFinish }: OnboardingScreenProps) {
  const { t } = useTranslation();
  const [page, setPage] = useState(0);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(160deg, var(--tile-today-1), var(--tile-today-2))',
        color: '#ffffff',
        padding: '24px 20px calc(24px + env(safe-area-inset-bottom))',
      }}
    >
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, textAlign: 'center' }}>
        {page === 0 ? (
          <>
            <SparkleIcon width={40} height={40} />
            <h1 style={{ fontFamily: 'var(--font-rounded)', fontWeight: 800, fontSize: 32, margin: 0 }}>Unknot</h1>
            <p style={{ fontSize: 17, lineHeight: 1.5, margin: 0, maxWidth: 320, opacity: 0.95 }}>{t('onboarding.page1.subtitle')}</p>
          </>
        ) : (
          <>
            <h1 style={{ fontFamily: 'var(--font-rounded)', fontWeight: 800, fontSize: 24, margin: 0, maxWidth: 320 }}>
              {t('onboarding.page2.title')}
            </h1>
            <p style={{ fontSize: 15, lineHeight: 1.5, margin: 0, maxWidth: 300, opacity: 0.95 }}>{t('onboarding.page2.subtitle')}</p>

            <div
              style={{
                width: '100%',
                maxWidth: 300,
                marginTop: 8,
                padding: 14,
                borderRadius: 'var(--radius-md)',
                background: 'rgba(255, 255, 255, 0.14)',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                textAlign: 'start',
              }}
            >
              <p style={{ fontSize: 12.5, fontWeight: 700, margin: '0 0 8px', opacity: 0.85 }}>{t('onboarding.example.task')}</p>
              {EXAMPLE_STEP_KEYS.map((key) => (
                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', fontSize: 13.5 }}>
                  <span
                    style={{
                      width: 14,
                      height: 14,
                      borderRadius: 4,
                      border: '1.5px solid rgba(255, 255, 255, 0.6)',
                      flexShrink: 0,
                    }}
                  />
                  {t(key)}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 20 }}>
        {Array.from({ length: PAGE_COUNT }).map((_, index) => (
          <span
            key={index}
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: index === page ? '#ffffff' : 'rgba(255, 255, 255, 0.4)',
            }}
          />
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button
          type="button"
          onClick={() => (page < PAGE_COUNT - 1 ? setPage(page + 1) : onFinish())}
          style={{
            width: '100%',
            padding: '13px',
            borderRadius: 'var(--radius-lg)',
            border: 'none',
            background: '#ffffff',
            color: 'var(--tile-today-2)',
            fontSize: 15.5,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          {page < PAGE_COUNT - 1 ? t('onboarding.next') : t('onboarding.getStarted')}
        </button>
        {page < PAGE_COUNT - 1 && (
          <button
            type="button"
            onClick={onFinish}
            style={{ width: '100%', padding: '8px', borderRadius: 'var(--radius-lg)', border: 'none', background: 'none', color: 'rgba(255, 255, 255, 0.85)', fontSize: 14, cursor: 'pointer' }}
          >
            {t('onboarding.skip')}
          </button>
        )}
      </div>
    </div>
  );
}
