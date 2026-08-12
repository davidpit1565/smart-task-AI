import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Task } from '@/core/task.types';
import { isOverdue } from '@/core/task.types';
import { PriorityDot } from './PriorityDot';

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
        opacity: isDragging ? 0.6 : 1,
        listStyle: 'none',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '12px 8px',
          borderBottom: '1px solid var(--color-border)',
          background: 'var(--color-surface)',
        }}
      >
        <button
          type="button"
          aria-label={completed ? 'Mark as not completed' : 'Mark as completed'}
          onClick={() => onToggleComplete(task.id)}
          style={{
            width: 26,
            height: 26,
            minWidth: 26,
            borderRadius: '50%',
            border: `2px solid ${completed ? 'var(--color-success)' : 'var(--color-border)'}`,
            background: completed ? 'var(--color-success)' : 'transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {completed && (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M5 13l4 4L19 7" stroke="white" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
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
            gap: 2,
            minWidth: 0,
          }}
        >
          <span
            style={{
              color: completed ? 'var(--color-text-muted)' : 'var(--color-text)',
              textDecoration: completed ? 'line-through' : 'none',
              fontSize: 15,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {task.title}
          </span>
          {(task.dueDate || task.priority !== 'none') && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: overdue ? 'var(--color-danger)' : 'var(--color-text-muted)' }}>
              <PriorityDot priority={task.priority} />
              {task.dueDate && (
                <span>
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
            color: 'var(--color-text-muted)',
            padding: 4,
            touchAction: 'none',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <circle cx="8" cy="6" r="1.6" />
            <circle cx="8" cy="12" r="1.6" />
            <circle cx="8" cy="18" r="1.6" />
            <circle cx="16" cy="6" r="1.6" />
            <circle cx="16" cy="12" r="1.6" />
            <circle cx="16" cy="18" r="1.6" />
          </svg>
        </button>
      </div>
    </li>
  );
}
