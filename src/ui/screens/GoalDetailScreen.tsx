import { useState, type CSSProperties } from 'react';
import type { Goal } from '@/core/goal.types';
import type { Project } from '@/core/project.types';
import type { Task } from '@/core/task.types';
import { selectGoalProgress, selectProjectProgress } from '@/core/progress';
import { useTranslation } from '@/i18n/LanguageContext';
import { ArchiveIcon } from '@/ui/icons';
import { BackButton } from '@/ui/components/BackButton';
import { ProgressBar } from '@/ui/components/ProgressBar';
import { QuickAddBar } from '@/ui/components/QuickAddBar';
import { TaskList } from '@/ui/components/TaskList';

interface GoalDetailScreenProps {
  goal: Goal;
  projects: Project[];
  tasks: Task[];
  onBack(): void;
  onUpdate(patch: Partial<Goal>): void;
  onArchive(): void;
  onRestore(): void;
  onAddTask(title: string): void;
  onOpenProject(projectId: string): void;
  onToggleComplete(id: string): void;
  onOpenTask(task: Task): void;
  onReorder(orderedIds: string[]): void;
}

export function GoalDetailScreen({
  goal,
  projects,
  tasks,
  onBack,
  onUpdate,
  onArchive,
  onRestore,
  onAddTask,
  onOpenProject,
  onToggleComplete,
  onOpenTask,
  onReorder,
}: GoalDetailScreenProps) {
  const { t } = useTranslation();
  const [name, setName] = useState(goal.name);
  const [description, setDescription] = useState(goal.description);

  const progress = selectGoalProgress(goal.id, tasks, projects);
  const linkedProjects = projects.filter((p) => p.goalId === goal.id && p.status === 'active');
  const directTasks = tasks
    .filter((task) => task.goalId === goal.id && !task.parentTaskId && task.status !== 'trashed' && task.status !== 'archived')
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
      <BackButton label={t('goals.title')} onClick={onBack} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span aria-hidden="true" style={{ width: 12, height: 12, borderRadius: '50%', background: goal.color, flexShrink: 0 }} />
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => name.trim() && onUpdate({ name: name.trim() })}
          aria-label={t('goals.nameLabel')}
          style={{ ...fieldStyle, border: 'none', background: 'none', fontSize: 21, fontWeight: 650, padding: '2px 0' }}
        />
        <button
          type="button"
          aria-label={goal.status === 'archived' ? t('projectDetail.restore') : t('projectDetail.archive')}
          onClick={goal.status === 'archived' ? onRestore : onArchive}
          style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', display: 'flex', flexShrink: 0 }}
        >
          <ArchiveIcon width={19} height={19} />
        </button>
      </div>

      <div>
        <ProgressBar value={progress.percent} label={goal.name} />
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
        <div style={labelStyle}>{t('goals.targetDate')}</div>
        <input
          type="date"
          value={goal.targetDate ?? ''}
          onChange={(e) => onUpdate({ targetDate: e.target.value || null })}
          style={fieldStyle}
        />
      </label>

      {linkedProjects.length > 0 && (
        <div>
          <div style={labelStyle}>{t('goals.projects')}</div>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {linkedProjects.map((project) => {
              const projectProgress = selectProjectProgress(project.id, tasks);
              return (
                <li key={project.id}>
                  <button
                    type="button"
                    onClick={() => onOpenProject(project.id)}
                    style={{
                      width: '100%',
                      textAlign: 'start',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '10px 4px',
                      background: 'none',
                      border: 'none',
                      borderBottom: '1px solid var(--color-border)',
                      cursor: 'pointer',
                      color: 'var(--color-text)',
                      fontSize: 15,
                    }}
                  >
                    <span aria-hidden="true" style={{ width: 8, height: 8, borderRadius: '50%', background: project.color, flexShrink: 0 }} />
                    <span style={{ flex: 1 }}>{project.name}</span>
                    <span style={{ color: 'var(--color-text-muted)', fontSize: 12.5 }}>
                      {projectProgress.completed}/{projectProgress.total}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div>
        <div style={labelStyle}>{t('goals.directTasks')}</div>
        <QuickAddBar onAdd={onAddTask} placeholder={t('goals.addTask')} />
        <TaskList tasks={directTasks} allTasks={tasks} onToggleComplete={onToggleComplete} onOpen={onOpenTask} onReorder={onReorder} emptyMessage={t('goals.noDirectTasks')} />
      </div>
    </div>
  );
}
