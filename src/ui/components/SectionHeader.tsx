import type { CSSProperties } from 'react';

export function SectionHeader({ title, count, tone = 'muted' }: { title: string; count: number; tone?: 'muted' | 'danger' }) {
  const color = tone === 'danger' ? 'var(--color-danger)' : 'var(--color-text-muted)';
  const chipStyle: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 20,
    height: 20,
    padding: '0 6px',
    borderRadius: 999,
    fontSize: 11.5,
    fontWeight: 600,
    background: tone === 'danger' ? 'rgba(220, 38, 38, 0.12)' : 'var(--color-accent-soft)',
    color: tone === 'danger' ? 'var(--color-danger)' : 'var(--color-accent)',
  };

  return (
    <h2
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        fontSize: 13.5,
        fontWeight: 650,
        letterSpacing: '0.02em',
        textTransform: 'uppercase',
        color,
        margin: '0 0 6px',
      }}
    >
      {title}
      <span style={chipStyle}>{count}</span>
    </h2>
  );
}
