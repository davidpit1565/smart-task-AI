import { useState, type CSSProperties } from 'react';
import type { Project } from '@/core/project.types';
import type { Task } from '@/core/task.types';
import { selectProjectProgress } from '@/core/progress';
import { useTranslation } from '@/i18n/LanguageContext';
import { ArchiveIcon } from '@/ui/icons';
import { BackButton } from '@/ui/components/BackButton';
import { ProgressBar } from '@/ui/components/ProgressBar';
import { QuickAddBar } from '@/ui/components/QuickAddBar';
import { TaskList } from '@/ui/components/TaskList';

interface ProjectDetailScreenProps {
  project: Project;
  tasks: Task[];
  onBack(): void;
  onUpdate(patch: Partial<Project>): void;
  onArchive(): void;
  onRestore(): void;
  onAddTask(title: string): void;
  onToggleComplete(id: string): void;
  onOpenTask(task: Task): void;
  onReorder(orderedIds: string[]): void;
}

export function ProjectDetailScreen({
  project,
  tasks,
  onBack,
  onUpdate,
  onArchive,
  onRestore,
  onAddTask,
  onToggleComplete,
  onOpenTask,
  onReorder,
}: ProjectDetailScreenProps) {
  const { t } = useTranslation();
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description);
  const [notes, setNotes] = useState(project.notes);

  const progress = selectProjectProgress(project.id, tasks);
  const projectTasks = tasks
    .filter((task) => task.projectId === project.id && !task.parentTaskId && task.status !== 'trashed' && task.status !== 'archived')
    .sort((a, b) => a.order - b.order);

  const fieldStyle: CSSProperties = {
    width: '100%',
    padding: '9px 11px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--color-border)',
    background: 'var(--color-bg)',
    color: 'var(--color-text)',
    fontSize: 16,
  };
  const labelStyle: CSSProperties = {
    fontSize: 11.5,
    fontWeight: 600,
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    color: 'var(--color-text-faint)',
    marginBottom: 6,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '16px 16px 8px' }}>
      <BackButton label={t('projectDetail.back')} onClick={onBack} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span aria-hidden="true" style={{ width: 12, height: 12, borderRadius: '50%', background: project.color, flexShrink: 0 }} />
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => name.trim() && onUpdate({ name: name.trim() })}
          aria-label={t('projectDetail.nameLabel')}
          style={{ ...fieldStyle, border: 'none', background: 'none', fontSize: 21, fontWeight: 650, padding: '2px 0' }}
        />
        <button
          type="button"
          aria-label={project.status === 'archived' ? t('projectDetail.restore') : t('projectDetail.archive')}
          onClick={project.status === 'archived' ? onRestore : onArchive}
          style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', display: 'flex', flexShrink: 0 }}
        >
          <ArchiveIcon width={19} height={19} />
        </button>
      </div>

      <div>
        <ProgressBar value={progress.percent} label={project.name} />
        <div style={{ fontSize: 12.5, color: 'var(--color-text-muted)', marginTop: 6 }}>
          {t('projects.progressOf', { completed: progress.completed, total: progress.total })}
        </div>
      </div>

      <label>
        <div style={labelStyle}>{t('projectDetail.description')}</div>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onBlur={() => onUpdate({ description })}
          rows={2}
          style={fieldStyle}
        />
      </label>

      <label>
        <div style={labelStyle}>{t('projectDetail.notes')}</div>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} onBlur={() => onUpdate({ notes })} rows={2} style={fieldStyle} />
      </label>

      <label>
        <div style={labelStyle}>{t('projects.deadline')}</div>
        <input
          type="date"
          value={project.deadline ?? ''}
          onChange={(e) => onUpdate({ deadline: e.target.value || null })}
          style={fieldStyle}
        />
      </label>

      <div>
        <div style={labelStyle}>{t('projectDetail.tasks')}</div>
        <QuickAddBar onAdd={onAddTask} placeholder={t('projectDetail.addTask')} />
        <TaskList
          tasks={projectTasks}
          allTasks={tasks}
          onToggleComplete={onToggleComplete}
          onOpen={onOpenTask}
          onReorder={onReorder}
          emptyMessage={t('projectDetail.noTasks')}
        />
      </div>
    </div>
  );
}
