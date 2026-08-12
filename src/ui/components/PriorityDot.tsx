import type { Priority } from '@/core/task.types';

const COLORS: Record<Priority, string | null> = {
  none: null,
  low: '#5b9df0',
  medium: '#d98a1f',
  high: '#e0455f',
  urgent: '#b3123a',
};

export function PriorityDot({ priority }: { priority: Priority }) {
  const color = COLORS[priority];
  if (!color) return null;
  return (
    <span
      aria-hidden="true"
      style={{
        display: 'inline-block',
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: color,
        flexShrink: 0,
      }}
    />
  );
}
