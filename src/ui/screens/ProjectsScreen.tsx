import type { Project } from '@/core/project.types';
import type { Task } from '@/core/task.types';
import { selectProjectProgress } from '@/core/progress';
import { useTranslation } from '@/i18n/LanguageContext';
import { ProjectCard } from '@/ui/components/ProjectCard';
import { QuickAddBar } from '@/ui/components/QuickAddBar';

interface ProjectsScreenProps {
  projects: Project[];
  tasks: Task[];
  onAdd(name: string): void;
  onOpen(projectId: string): void;
}

export function ProjectsScreen({ projects, tasks, onAdd, onOpen }: ProjectsScreenProps) {
  const { t } = useTranslation();
  const activeProjects = projects.filter((p) => p.status === 'active').sort((a, b) => a.order - b.order);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <h1 style={{ fontSize: 23, margin: '20px 16px 4px' }}>{t('projects.title')}</h1>
      <QuickAddBar onAdd={onAdd} placeholder={t('projects.namePlaceholder')} />
      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {activeProjects.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '32px 16px' }}>{t('projects.empty')}</p>
        ) : (
          activeProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              progress={selectProjectProgress(project.id, tasks)}
              onOpen={() => onOpen(project.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}
