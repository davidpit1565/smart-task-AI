export function ProgressBar({ value, label }: { value: number; label?: string }) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      style={{
        height: 8,
        borderRadius: 999,
        background: 'var(--color-border)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          height: '100%',
          width: `${clamped}%`,
          background: 'var(--color-accent)',
          borderRadius: 999,
          transition: 'width 0.3s ease',
        }}
      />
    </div>
  );
}
