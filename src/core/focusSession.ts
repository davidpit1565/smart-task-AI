export function formatElapsed(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

/** Rounds to the nearest minute; any session under 30s still counts as 1 tracked minute rather than vanishing to 0. */
export function secondsToTrackedMinutes(totalSeconds: number): number {
  if (totalSeconds <= 0) return 0;
  return Math.max(1, Math.round(totalSeconds / 60));
}
