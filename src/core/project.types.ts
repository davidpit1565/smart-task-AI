export type ProjectStatus = 'active' | 'archived';

export interface Project {
  id: string;
  name: string;
  description: string;
  notes: string;
  color: string;
  status: ProjectStatus;
  deadline: string | null;
  calendarEventId: string | null;
  createdAt: string;
  updatedAt: string;
  order: number;
}

export type NewProjectInput = Partial<Project> & { name: string };

export const PROJECT_COLORS = ['#5c7a93', '#4c7a5e', '#b8842e', '#b5622e', '#a5352e', '#8a6a9e'] as const;

export function createProject(input: NewProjectInput, now: () => string = () => new Date().toISOString()): Project {
  const timestamp = now();
  return {
    id: input.id ?? crypto.randomUUID(),
    name: input.name,
    description: input.description ?? '',
    notes: input.notes ?? '',
    color: input.color ?? PROJECT_COLORS[0],
    status: input.status ?? 'active',
    deadline: input.deadline ?? null,
    calendarEventId: input.calendarEventId ?? null,
    createdAt: input.createdAt ?? timestamp,
    updatedAt: input.updatedAt ?? timestamp,
    order: input.order ?? 0,
  };
}
