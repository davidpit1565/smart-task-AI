import { useMemo, useState, type CSSProperties } from 'react';
import type { Priority, Task } from '@/core/task.types';
import { isOverdue } from '@/core/task.types';
import type { Project } from '@/core/project.types';
import { searchTasks } from '@/core/search';
import { selectSubtaskProgress } from '@/core/progress';
import { useTranslation } from '@/i18n/LanguageContext';
import type { TranslationKey } from '@/i18n/translations';
import { BackButton } from '@/ui/components/BackButton';
import { PriorityFlag } from '@/ui/components/PriorityFlag';
import { CheckIcon, SearchIcon } from '@/ui/icons';

const PRIORITY_FILTERS: Priority[] = ['urgent', 'high', 'medium', 'low', 'none'];

interface SearchScreenProps {
  tasks: Task[];
  projects: Project[];
  onBack(): void;
  onToggleComplete(id: string): void;
  onOpen(task: Task): void;
}

export function SearchScreen({ tasks, projects, onBack, onToggleComplete, onOpen }: SearchScreenProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [projectId, setProjectId] = useState<string | null>(null);
  const [priority, setPriority] = useState<Priority | null>(null);
  const [overdueOnly, setOverdueOnly] = useState(false);

  const results = useMemo(
    () => searchTasks(tasks, query, { projectId, priority, overdueOnly }),
    [tasks, query, projectId, priority, overdueOnly],
  );

  const hasActiveFilter = projectId !== null || priority !== null || overdueOnly;
  const hasSearched = query.trim().length > 0 || hasActiveFilter;

  const inputStyle: CSSProperties = {
    flex: 1,
    padding: '11px 14px',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-border)',
    background: 'var(--color-bg)',
    color: 'var(--color-text)',
    fontSize: 16,
  };

  const chipStyle = (active: boolean): CSSProperties => ({
    padding: '6px 12px',
    borderRadius: 999,
    border: `1px solid ${active ? 'var(--color-accent)' : 'var(--color-border)'}`,
    background: active ? 'var(--color-accent-soft)' : 'none',
    color: active ? 'var(--color-accent)' : 'var(--color-text-muted)',
    fontSize: 13,
    fontWeight: 550,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '16px 16px 8px' }}>
      <BackButton label={t('more.title')} onClick={onBack} />
      <h1 style={{ fontSize: 21, margin: 0 }}>{t('search.title')}</h1>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <SearchIcon width={18} height={18} style={{ color: 'var(--color-text-faint)', flexShrink: 0 }} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('search.placeholder')}
          aria-label={t('search.placeholder')}
          style={inputStyle}
          autoFocus
        />
      </div>

      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2 }}>
        <button type="button" style={chipStyle(overdueOnly)} onClick={() => setOverdueOnly((v) => !v)}>
          {t('search.filter.overdue')}
        </button>
        {PRIORITY_FILTERS.map((p) => (
          <button
            key={p}
            type="button"
            style={chipStyle(priority === p)}
            onClick={() => setPriority((current) => (current === p ? null : p))}
          >
            {t(`task.priority.${p}` as TranslationKey)}
          </button>
        ))}
        {projects.map((project) => (
          <button
            key={project.id}
            type="button"
            style={chipStyle(projectId === project.id)}
            onClick={() => setProjectId((current) => (current === project.id ? null : project.id))}
          >
            {project.name}
          </button>
        ))}
      </div>

      {!hasSearched ? (
        <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '32px 16px' }}>{t('search.empty.prompt')}</p>
      ) : results.length === 0 ? (
        <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '32px 16px' }}>{t('search.empty.noResults')}</p>
      ) : (
        <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
          {results.map((task) => {
            const overdue = isOverdue(task);
            const completed = task.status === 'completed';
            const subtaskProgress = selectSubtaskProgress(task.id, tasks);
            return (
              <li key={task.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 4px', borderBottom: '1px solid var(--color-border)' }}>
                <button
                  type="button"
                  aria-label={completed ? t('task.action.markIncomplete') : t('task.action.markComplete')}
                  onClick={() => onToggleComplete(task.id)}
                  style={{
                    width: 24,
                    height: 24,
                    minWidth: 24,
                    borderRadius: '50%',
                    border: `1.75px solid ${completed ? 'var(--color-success)' : 'var(--color-border-strong)'}`,
                    background: completed ? 'var(--color-success)' : 'transparent',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {completed && <CheckIcon width={13} height={13} stroke="white" />}
                </button>
                <button
                  type="button"
                  onClick={() => onOpen(task)}
                  style={{ flex: 1, textAlign: 'start', background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}
                >
                  <span style={{ color: completed ? 'var(--color-text-muted)' : 'var(--color-text)', textDecoration: completed ? 'line-through' : 'none', fontSize: 15, fontWeight: 450, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {task.title}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, flexWrap: 'wrap' }}>
                    <PriorityFlag priority={task.priority} />
                    {task.dueDate && (
                      <span style={{ color: overdue ? 'var(--color-danger)' : 'var(--color-text-muted)', fontWeight: overdue ? 600 : 400 }}>
                        {task.dueDate}
                        {task.dueTime ? ` · ${task.dueTime}` : ''}
                      </span>
                    )}
                    {subtaskProgress.total > 0 && (
                      <span style={{ color: 'var(--color-text-muted)' }}>
                        {subtaskProgress.completed}/{subtaskProgress.total}
                      </span>
                    )}
                    {task.tags.map((tag) => (
                      <span key={tag} style={{ color: 'var(--color-accent)' }}>
                        #{tag}
                      </span>
                    ))}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
