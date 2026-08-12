import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Task } from '@/core/task.types';
import { isOverdue } from '@/core/task.types';
import { CheckIcon, DragHandleIcon } from '@/ui/icons';
import { PriorityFlag } from './PriorityFlag';

interface TaskRowProps {
  task: Task;
  onToggleComplete(id: string): void;
  onOpen(task: Task): void;
}

export function TaskRow({ task, onToggleComplete, onOpen }: TaskRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
  const overdue = isOverdue(task);
  const completed = task.status === 'completed';

  return (
    <li
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.55 : 1,
        listStyle: 'none',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '13px 4px',
          borderBottom: '1px solid var(--color-border)',
          background: isDragging ? 'var(--color-surface-raised)' : 'var(--color-surface)',
        }}
      >
        <button
          type="button"
          aria-label={completed ? 'Mark as not completed' : 'Mark as completed'}
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
            transition: 'background-color 0.15s ease, border-color 0.15s ease',
            flexShrink: 0,
          }}
        >
          {completed && <CheckIcon width={13} height={13} stroke="white" />}
        </button>

        <button
          type="button"
          onClick={() => onOpen(task)}
          style={{
            flex: 1,
            textAlign: 'start',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 3,
            minWidth: 0,
          }}
        >
          <span
            style={{
              color: completed ? 'var(--color-text-muted)' : 'var(--color-text)',
              textDecoration: completed ? 'line-through' : 'none',
              fontSize: 15,
              fontWeight: 450,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {task.title}
          </span>
          {(task.dueDate || task.priority !== 'none') && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5 }}>
              <PriorityFlag priority={task.priority} />
              {task.dueDate && (
                <span style={{ color: overdue ? 'var(--color-danger)' : 'var(--color-text-muted)', fontWeight: overdue ? 600 : 400 }}>
                  {task.dueDate}
                  {task.dueTime ? ` · ${task.dueTime}` : ''}
                </span>
              )}
            </span>
          )}
        </button>

        <button
          type="button"
          aria-label="Drag to reorder"
          {...attributes}
          {...listeners}
          style={{
            cursor: 'grab',
            border: 'none',
            background: 'none',
            color: 'var(--color-text-faint)',
            padding: 4,
            touchAction: 'none',
            display: 'flex',
            flexShrink: 0,
          }}
        >
          <DragHandleIcon />
        </button>
      </div>
    </li>
  );
}
