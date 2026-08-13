import { describe, expect, it } from 'vitest';
import { formatElapsed, secondsToTrackedMinutes } from '@/core/focusSession';

describe('formatElapsed', () => {
  it('formats zero seconds', () => {
    expect(formatElapsed(0)).toBe('00:00');
  });

  it('formats minutes and seconds', () => {
    expect(formatElapsed(65)).toBe('01:05');
  });

  it('does not wrap past 59 minutes (sessions can run long)', () => {
    expect(formatElapsed(3661)).toBe('61:01');
  });
});

describe('secondsToTrackedMinutes', () => {
  it('returns 0 for no elapsed time', () => {
    expect(secondsToTrackedMinutes(0)).toBe(0);
  });

  it('rounds a short session up to 1 tracked minute rather than 0', () => {
    expect(secondsToTrackedMinutes(10)).toBe(1);
    expect(secondsToTrackedMinutes(30)).toBe(1);
  });

  it('rounds to the nearest minute above one', () => {
    expect(secondsToTrackedMinutes(89)).toBe(1);
    expect(secondsToTrackedMinutes(91)).toBe(2);
  });
});
