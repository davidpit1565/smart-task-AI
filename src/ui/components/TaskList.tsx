import { DndContext, type DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { Task } from '@/core/task.types';
import { TaskRow } from './TaskRow';

interface TaskListProps {
  tasks: Task[];
  allTasks: Task[];
  onToggleComplete(id: string): void;
  onOpen(task: Task): void;
  onReorder(orderedIds: string[]): void;
  emptyMessage: string;
}

export function TaskList({ tasks, allTasks, onToggleComplete, onOpen, onReorder, emptyMessage }: TaskListProps) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  if (tasks.length === 0) {
    return (
      <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '32px 16px' }}>{emptyMessage}</p>
    );
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const ids = tasks.map((t) => t.id);
    const from = ids.indexOf(String(active.id));
    const to = ids.indexOf(String(over.id));
    if (from === -1 || to === -1) return;
    const next = [...ids];
    next.splice(from, 1);
    next.splice(to, 0, String(active.id));
    onReorder(next);
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <ul style={{ margin: 0, padding: 0 }}>
          {tasks.map((task) => (
            <TaskRow key={task.id} task={task} allTasks={allTasks} onToggleComplete={onToggleComplete} onOpen={onOpen} />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}
