import { describe, expect, it } from 'vitest';
import { extractBreakdownSubtasks } from '@/core/aiBreakdown';

describe('extractBreakdownSubtasks', () => {
  it('parses a clean JSON object', () => {
    expect(extractBreakdownSubtasks('{"subtasks": ["Draft outline", "Write intro"]}')).toEqual(['Draft outline', 'Write intro']);
  });

  it('extracts JSON surrounded by extra text or markdown fences', () => {
    const raw = '```json\n{"subtasks": ["A", "B"]}\n```';
    expect(extractBreakdownSubtasks(raw)).toEqual(['A', 'B']);
  });

  it('trims whitespace from each subtask', () => {
    expect(extractBreakdownSubtasks('{"subtasks": ["  Draft outline  "]}')).toEqual(['Draft outline']);
  });

  it('drops non-string and empty entries', () => {
    expect(extractBreakdownSubtasks('{"subtasks": ["Valid", "", 42, null, "  "]}')).toEqual(['Valid']);
  });

  it('caps the result at MAX_BREAKDOWN_SUBTASKS', () => {
    const many = Array.from({ length: 20 }, (_, i) => `Task ${i}`);
    expect(extractBreakdownSubtasks(JSON.stringify({ subtasks: many }))).toHaveLength(8);
  });

  it('throws when there is no JSON object at all', () => {
    expect(() => extractBreakdownSubtasks('sorry, I cannot help with that')).toThrow(/did not contain a JSON object/);
  });

  it('throws when the JSON object has no subtasks array', () => {
    expect(() => extractBreakdownSubtasks('{"notes": "oops"}')).toThrow(/subtasks/);
  });
});
