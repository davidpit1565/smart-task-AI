import { create } from 'zustand';
import { createTask, toLocalIsoDate, type NewTaskInput, type Task } from '@/core/task.types';
import { computeNextOccurrence } from '@/core/recurrence';
import type { TaskRepository } from '@/core/task.repository';
import { DexieTaskRepository } from '@/data/dexieTaskRepository';
import { db } from '@/data/db';

interface UndoEntry {
  label: string;
  previous: Task;
  /** A task spawned as a side effect (e.g. the next occurrence of a recurring task) that undo should also remove. */
  spawnedTaskId?: string;
}

interface TaskStoreState {
  tasks: Task[];
  loaded: boolean;
  lastUndo: UndoEntry | null;
  repository: TaskRepository;

  load(): Promise<void>;
  addTask(input: NewTaskInput): Promise<Task>;
  updateTask(id: string, patch: Partial<Task>): Promise<void>;
  completeTask(id: string): Promise<void>;
  uncompleteTask(id: string): Promise<void>;
  deleteTask(id: string): Promise<void>;
  restoreTask(id: string): Promise<void>;
  archiveTask(id: string): Promise<void>;
  undo(): Promise<void>;
  reorder(orderedIds: string[]): Promise<void>;
}

function now(): string {
  return new Date().toISOString();
}

async function persistAndReplace(
  set: (fn: (state: TaskStoreState) => Partial<TaskStoreState>) => void,
  repository: TaskRepository,
  task: Task,
): Promise<void> {
  await repository.put(task);
  set((state) => ({
    tasks: state.tasks.map((t) => (t.id === task.id ? task : t)),
  }));
}

export const useTaskStore = create<TaskStoreState>((set, get) => ({
  tasks: [],
  loaded: false,
  lastUndo: null,
  repository: new DexieTaskRepository(db),

  async load() {
    const tasks = await get().repository.getAll();
    set({ tasks, loaded: true });
  },

  async addTask(input) {
    const { tasks, repository } = get();
    const maxOrder = tasks.reduce((max, t) => Math.max(max, t.order), 0);
    const task = createTask({ ...input, order: input.order ?? maxOrder + 1 });
    await repository.put(task);
    set((state) => ({ tasks: [...state.tasks, task] }));
    return task;
  },

  async updateTask(id, patch) {
    const existing = get().tasks.find((t) => t.id === id);
    if (!existing) return;
    const updated: Task = { ...existing, ...patch, updatedAt: now() };
    await persistAndReplace(set, get().repository, updated);
  },

  async completeTask(id) {
    const existing = get().tasks.find((t) => t.id === id);
    if (!existing) return;
    const updated: Task = { ...existing, status: 'completed', completedAt: now(), updatedAt: now() };
    await persistAndReplace(set, get().repository, updated);

    let spawnedTaskId: string | undefined;
    if (existing.recurrenceRule) {
      const occurrenceIndex =
        typeof existing.metadata.occurrenceIndex === 'number' ? existing.metadata.occurrenceIndex : 1;
      const fromDate = existing.dueDate ?? toLocalIsoDate(new Date());
      const nextDueDate = computeNextOccurrence(existing.recurrenceRule, fromDate, occurrenceIndex);
      if (nextDueDate) {
        const spawned = await get().addTask({
          title: existing.title,
          description: existing.description,
          notes: existing.notes,
          priority: existing.priority,
          dueDate: nextDueDate,
          dueTime: existing.dueTime,
          categoryId: existing.categoryId,
          projectId: existing.projectId,
          tags: existing.tags,
          recurrenceRule: existing.recurrenceRule,
          reminders: existing.reminders,
          estimatedDuration: existing.estimatedDuration,
          source: existing.source,
          createdFromAI: existing.createdFromAI,
          metadata: { ...existing.metadata, occurrenceIndex: occurrenceIndex + 1 },
        });
        spawnedTaskId = spawned.id;
      }
    }

    set({ lastUndo: { label: 'complete', previous: existing, spawnedTaskId } });
  },

  async uncompleteTask(id) {
    const existing = get().tasks.find((t) => t.id === id);
    if (!existing) return;
    const updated: Task = { ...existing, status: 'pending', completedAt: null, updatedAt: now() };
    await persistAndReplace(set, get().repository, updated);
  },

  async deleteTask(id) {
    const existing = get().tasks.find((t) => t.id === id);
    if (!existing) return;
    const updated: Task = { ...existing, status: 'trashed', updatedAt: now() };
    await persistAndReplace(set, get().repository, updated);
    set({ lastUndo: { label: 'delete', previous: existing } });
  },

  async restoreTask(id) {
    const existing = get().tasks.find((t) => t.id === id);
    if (!existing) return;
    const updated: Task = { ...existing, status: 'pending', updatedAt: now() };
    await persistAndReplace(set, get().repository, updated);
  },

  async archiveTask(id) {
    const existing = get().tasks.find((t) => t.id === id);
    if (!existing) return;
    const updated: Task = { ...existing, status: 'archived', updatedAt: now() };
    await persistAndReplace(set, get().repository, updated);
    set({ lastUndo: { label: 'archive', previous: existing } });
  },

  async undo() {
    const entry = get().lastUndo;
    if (!entry) return;
    await persistAndReplace(set, get().repository, entry.previous);
    if (entry.spawnedTaskId) {
      const spawnedId = entry.spawnedTaskId;
      await get().repository.remove(spawnedId);
      set((state) => ({ tasks: state.tasks.filter((t) => t.id !== spawnedId) }));
    }
    set({ lastUndo: null });
  },

  async reorder(orderedIds) {
    const { tasks, repository } = get();
    const byId = new Map(tasks.map((t) => [t.id, t]));
    const reordered = orderedIds
      .map((id, index) => {
        const task = byId.get(id);
        return task ? { ...task, order: index, updatedAt: now() } : undefined;
      })
      .filter((t): t is Task => t !== undefined);
    await repository.putMany(reordered);
    set((state) => ({
      tasks: state.tasks.map((t) => reordered.find((r) => r.id === t.id) ?? t),
    }));
  },
}));
