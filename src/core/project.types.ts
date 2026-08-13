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

export const PROJECT_COLORS = ['#4f46e5', '#0891b2', '#16a34a', '#d97706', '#dc2626', '#a21caf'] as const;

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
