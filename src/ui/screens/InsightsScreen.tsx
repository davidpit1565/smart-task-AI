import type { Task } from '@/core/task.types';
import type { Project } from '@/core/project.types';
import { computeInsights } from '@/core/insights';
import { useTranslation } from '@/i18n/LanguageContext';
import { BackButton } from '@/ui/components/BackButton';
import { ProgressBar } from '@/ui/components/ProgressBar';

interface InsightsScreenProps {
  tasks: Task[];
  projects: Project[];
  onBack(): void;
}

function StatCard({ value, label }: { value: string | number; label: string }) {
  return (
    <div
      style={{
        flex: '1 1 0',
        minWidth: 0,
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-md)',
        padding: '14px 12px',
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: 23, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: 'var(--color-text)' }}>{value}</div>
      <div style={{ fontSize: 11.5, color: 'var(--color-text-muted)', marginTop: 4 }}>{label}</div>
    </div>
  );
}

export function InsightsScreen({ tasks, projects, onBack }: InsightsScreenProps) {
  const { t } = useTranslation();
  const summary = computeInsights(tasks, projects);
  const maxProjectCount = Math.max(1, ...summary.completedByProject.map((p) => p.count));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '16px 16px 8px' }}>
      <BackButton label={t('more.title')} onClick={onBack} />
      <h1 style={{ fontSize: 21, margin: 0 }}>{t('insights.title')}</h1>

      <div style={{ display: 'flex', gap: 8 }}>
        <StatCard value={summary.currentStreakDays} label={t('insights.streak')} />
        <StatCard value={`${summary.completionRate}%`} label={t('insights.completionRate')} />
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <StatCard value={summary.totalActive} label={t('insights.active')} />
        <StatCard value={summary.totalCompleted} label={t('insights.completed')} />
        <StatCard value={summary.overdueCount} label={t('insights.overdue')} />
      </div>

      <div>
        <div
          style={{
            fontSize: 11.5,
            fontWeight: 600,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            color: 'var(--color-text-faint)',
            marginBottom: 10,
          }}
        >
          {t('insights.byProject')}
        </div>
        {summary.completedByProject.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)', fontSize: 13.5, margin: 0 }}>{t('insights.empty')}</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {summary.completedByProject.map((row) => (
              <div key={row.projectId ?? 'none'}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, marginBottom: 4 }}>
                  <span style={{ color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.projectName}</span>
                  <span style={{ color: 'var(--color-text-muted)', fontVariantNumeric: 'tabular-nums', flexShrink: 0, marginInlineStart: 8 }}>{row.count}</span>
                </div>
                <ProgressBar value={(row.count / maxProjectCount) * 100} label={row.projectName} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
