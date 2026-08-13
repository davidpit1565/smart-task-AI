import type { Project } from '@/core/project.types';
import type { Progress } from '@/core/progress';
import { useTranslation } from '@/i18n/LanguageContext';
import { ProgressBar } from './ProgressBar';

export function ProjectCard({ project, progress, onOpen }: { project: Project; progress: Progress; onOpen(): void }) {
  const { t } = useTranslation();
  return (
    <button
      type="button"
      onClick={onOpen}
      style={{
        display: 'block',
        width: '100%',
        textAlign: 'start',
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-card)',
        padding: '14px 16px',
        cursor: 'pointer',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <span aria-hidden="true" style={{ width: 10, height: 10, borderRadius: '50%', background: project.color, flexShrink: 0 }} />
        <span style={{ fontSize: 15.5, fontWeight: 600, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {project.name}
        </span>
      </div>
      <ProgressBar value={progress.percent} label={project.name} />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 12.5, color: 'var(--color-text-muted)' }}>
        <span>{t('projects.progressOf', { completed: progress.completed, total: progress.total })}</span>
        <span>{project.deadline ?? t('projects.noDeadline')}</span>
      </div>
    </button>
  );
}
