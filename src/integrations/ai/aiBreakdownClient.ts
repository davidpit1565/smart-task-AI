/**
 * Client for api/ai/breakdown.ts. Deliberately thin — all the "is this
 * configured, is this safe" logic lives server-side; this just calls the
 * endpoint and surfaces whatever error it returns.
 */
export async function requestTaskBreakdown(title: string, description: string): Promise<string[]> {
  const res = await fetch('/api/ai/breakdown', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, description }),
  });

  const data = (await res.json().catch(() => null)) as { subtasks?: string[]; error?: string } | null;

  if (!res.ok) {
    throw new Error(data?.error ?? `AI breakdown request failed (HTTP ${res.status}).`);
  }
  if (!data?.subtasks) {
    throw new Error('AI breakdown response was missing subtasks.');
  }
  return data.subtasks;
}
