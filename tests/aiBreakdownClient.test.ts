import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { requestTaskBreakdown } from '@/integrations/ai/aiBreakdownClient';

function jsonResponse(body: unknown, ok = true, status = ok ? 200 : 400) {
  return { ok, status, json: () => Promise.resolve(body) } as Response;
}

describe('requestTaskBreakdown', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns the subtasks from a successful response', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ subtasks: ['Draft outline', 'Write intro'] }));
    const result = await requestTaskBreakdown('Write report', 'Quarterly summary');
    expect(result).toEqual(['Draft outline', 'Write intro']);
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe('/api/ai/breakdown');
    expect(JSON.parse((init as RequestInit).body as string)).toEqual({ title: 'Write report', description: 'Quarterly summary' });
  });

  it('surfaces the server error message on a non-configured gate (501)', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ error: "AI features aren't configured yet — needs ANTHROPIC_API_KEY." }, false, 501));
    await expect(requestTaskBreakdown('Write report', '')).rejects.toThrow(/ANTHROPIC_API_KEY/);
  });

  it('throws a generic error when the response has no error message', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({}, false, 500));
    await expect(requestTaskBreakdown('Write report', '')).rejects.toThrow(/HTTP 500/);
  });

  it('throws when the response is ok but missing subtasks', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({}));
    await expect(requestTaskBreakdown('Write report', '')).rejects.toThrow(/missing subtasks/i);
  });
});
