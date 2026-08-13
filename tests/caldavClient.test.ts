import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { caldavRequest } from '@/integrations/calendar/caldavClient';

const credentials = { email: 'test@icloud.com', appSpecificPassword: 'abcd-efgh-ijkl-mnop' };

function jsonResponse(status: number, body: unknown, ok = status >= 200 && status < 300) {
  return { ok, status, statusText: `status ${status}`, json: () => Promise.resolve(body) } as Response;
}

describe('caldavRequest', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns the proxy response on success', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(200, { status: 207, body: '<multistatus/>', headers: {} }));

    const result = await caldavRequest(credentials, 'PROPFIND', '/', { headers: { Depth: '0' } });

    expect(result.status).toBe(207);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, init] = fetchMock.mock.calls[0]!;
    const sentBody = JSON.parse((init as RequestInit).body as string);
    expect(sentBody).toMatchObject({ method: 'PROPFIND', path: '/', email: credentials.email, password: credentials.appSpecificPassword });
  });

  it('follows a redirect once and retries against the new host', async () => {
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse(200, { status: 302, body: '', headers: { location: 'https://p36-caldav.icloud.com/' }, redirectedTo: 'https://p36-caldav.icloud.com/' }),
      )
      .mockResolvedValueOnce(jsonResponse(200, { status: 207, body: '<multistatus/>', headers: {} }));

    const result = await caldavRequest(credentials, 'PROPFIND', '/');

    expect(result.status).toBe(207);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const secondBody = JSON.parse((fetchMock.mock.calls[1]![1] as RequestInit).body as string);
    expect(secondBody.path).toBe('https://p36-caldav.icloud.com/');
  });

  it('gives up after too many redirects', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(200, { status: 302, body: '', headers: {}, redirectedTo: 'https://p36-caldav.icloud.com/' }),
    );

    await expect(caldavRequest(credentials, 'PROPFIND', '/')).rejects.toThrow(/too many redirects/i);
  });

  it('throws a helpful message on 401, including any WWW-Authenticate hint', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(
        401,
        { error: 'Apple rejected the iCloud email/app-specific password.', wwwAuthenticate: 'Basic realm="caldav.icloud.com"' },
        false,
      ),
    );

    await expect(caldavRequest(credentials, 'PROPFIND', '/')).rejects.toThrow(/app-specific password/i);
  });

  it('throws a generic message when the proxy response is not JSON', async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 404, statusText: 'Not Found', json: () => Promise.reject(new Error('not json')) } as unknown as Response);

    await expect(caldavRequest(credentials, 'PROPFIND', '/')).rejects.toThrow(/HTTP 404/);
  });
});
