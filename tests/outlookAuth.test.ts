import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { authenticateWithPopup } from '@/integrations/calendar/outlookAuth';

describe('authenticateWithPopup', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_MICROSOFT_CLIENT_ID', 'test-client-id');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('throws a clear error when no Client ID is configured', async () => {
    vi.stubEnv('VITE_MICROSOFT_CLIENT_ID', '');
    await expect(authenticateWithPopup()).rejects.toThrow(/VITE_MICROSOFT_CLIENT_ID/);
  });

  it('rejects when the popup is blocked', async () => {
    vi.spyOn(window, 'open').mockReturnValue(null);
    await expect(authenticateWithPopup()).rejects.toThrow(/popup was blocked/i);
  });

  it('resolves with the access token once the redirect page posts a message', async () => {
    const fakePopup = { closed: false } as Window;
    vi.spyOn(window, 'open').mockReturnValue(fakePopup);

    const promise = authenticateWithPopup();
    window.dispatchEvent(
      new MessageEvent('message', { origin: window.location.origin, data: { source: 'outlook-auth', accessToken: 'fake-token' } }),
    );

    await expect(promise).resolves.toBe('fake-token');
  });

  it('rejects when the redirect page posts an error', async () => {
    const fakePopup = { closed: false } as Window;
    vi.spyOn(window, 'open').mockReturnValue(fakePopup);

    const promise = authenticateWithPopup();
    window.dispatchEvent(
      new MessageEvent('message', { origin: window.location.origin, data: { source: 'outlook-auth', error: 'Consent denied' } }),
    );

    await expect(promise).rejects.toThrow('Consent denied');
  });

  it('ignores messages from a different origin or a different source', async () => {
    const fakePopup = { closed: false } as Window;
    vi.spyOn(window, 'open').mockReturnValue(fakePopup);

    const promise = authenticateWithPopup();
    window.dispatchEvent(new MessageEvent('message', { origin: 'https://evil.example', data: { source: 'outlook-auth', accessToken: 'nope' } }));
    window.dispatchEvent(new MessageEvent('message', { origin: window.location.origin, data: { source: 'something-else' } }));
    window.dispatchEvent(
      new MessageEvent('message', { origin: window.location.origin, data: { source: 'outlook-auth', accessToken: 'real-token' } }),
    );

    await expect(promise).resolves.toBe('real-token');
  });
});
