import type { EntitlementTier } from '@/core/entitlement.types';
import { FREE_MONTHLY_AI_QUOTA } from '@/core/entitlement.types';
import { useTranslation } from '@/i18n/LanguageContext';
import { BackButton } from '@/ui/components/BackButton';

interface PremiumScreenProps {
  tier: EntitlementTier;
  aiQuotaRemaining: number;
  onBack(): void;
}

export function PremiumScreen({ tier, aiQuotaRemaining, onBack }: PremiumScreenProps) {
  const { t } = useTranslation();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '16px 16px 8px' }}>
      <BackButton label={t('more.title')} onClick={onBack} />
      <h1 style={{ fontSize: 21, margin: 0 }}>{t('premium.title')}</h1>

      <div
        style={{
          padding: 16,
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-border)',
          background: 'var(--color-surface)',
        }}
      >
        <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text-faint)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
          {t('premium.currentPlan')}
        </p>
        <p style={{ margin: '4px 0 0', fontSize: 17, fontWeight: 700 }}>
          {tier === 'premium' ? t('premium.planPremium') : t('premium.planFree')}
        </p>
        {tier === 'free' && (
          <p style={{ margin: '8px 0 0', fontSize: 13.5, color: 'var(--color-text-muted)' }}>
            {t('premium.quotaSummary')
              .replace('{remaining}', String(aiQuotaRemaining))
              .replace('{total}', String(FREE_MONTHLY_AI_QUOTA))}
          </p>
        )}
      </div>

      {tier === 'free' && (
        <div
          style={{
            padding: 16,
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
            background: 'var(--color-surface)',
          }}
        >
          <p style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>{t('premium.upgradeTitle')}</p>
          <p style={{ margin: '6px 0 0', fontSize: 13.5, color: 'var(--color-text-muted)' }}>{t('premium.upgradeBenefits')}</p>
          <p style={{ margin: '12px 0 0', fontSize: 12.5, color: 'var(--color-text-faint)' }}>{t('premium.notConfiguredYet')}</p>
        </div>
      )}
    </div>
  );
}
