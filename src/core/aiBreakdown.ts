export const MAX_BREAKDOWN_SUBTASKS = 8;

/**
 * Parses the AI's raw text response into a list of subtask titles. Kept as
 * pure logic (no fetch, no API key) so the exact parsing rules — what
 * counts as a valid JSON object, what gets filtered out — are unit-tested
 * without mocking the Anthropic API.
 */
export function extractBreakdownSubtasks(rawText: string): string[] {
  const start = rawText.indexOf('{');
  const end = rawText.lastIndexOf('}');
  if (start === -1 || end === -1 || end < start) {
    throw new Error('AI response did not contain a JSON object.');
  }

  const parsed = JSON.parse(rawText.slice(start, end + 1)) as { subtasks?: unknown };
  if (!Array.isArray(parsed.subtasks)) {
    throw new Error('AI response JSON did not have a "subtasks" array.');
  }

  return parsed.subtasks
    .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    .map((item) => item.trim())
    .slice(0, MAX_BREAKDOWN_SUBTASKS);
}
