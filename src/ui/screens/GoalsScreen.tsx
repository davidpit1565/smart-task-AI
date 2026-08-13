import type { Goal } from '@/core/goal.types';
import type { Project } from '@/core/project.types';
import type { Task } from '@/core/task.types';
import { selectGoalProgress } from '@/core/progress';
import { useTranslation } from '@/i18n/LanguageContext';
import { BackButton } from '@/ui/components/BackButton';
import { GoalCard } from '@/ui/components/GoalCard';
import { QuickAddBar } from '@/ui/components/QuickAddBar';

interface GoalsScreenProps {
  goals: Goal[];
  projects: Project[];
  tasks: Task[];
  onBack(): void;
  onAdd(name: string): void;
  onOpen(goalId: string): void;
}

export function GoalsScreen({ goals, projects, tasks, onBack, onAdd, onOpen }: GoalsScreenProps) {
  const { t } = useTranslation();
  const activeGoals = goals.filter((g) => g.status === 'active').sort((a, b) => a.order - b.order);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '16px 0 0' }}>
      <div style={{ padding: '0 16px' }}>
        <BackButton label={t('more.title')} onClick={onBack} />
      </div>
      <h1 style={{ fontSize: 23, margin: '8px 16px 4px' }}>{t('goals.title')}</h1>
      <p style={{ color: 'var(--color-text-muted)', fontSize: 13, margin: '0 16px 4px' }}>{t('goals.description')}</p>
      <QuickAddBar onAdd={onAdd} placeholder={t('goals.namePlaceholder')} />
      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {activeGoals.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '32px 16px' }}>{t('goals.empty')}</p>
        ) : (
          activeGoals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} progress={selectGoalProgress(goal.id, tasks, projects)} onOpen={() => onOpen(goal.id)} />
          ))
        )}
      </div>
    </div>
  );
}
