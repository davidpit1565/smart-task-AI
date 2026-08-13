import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GoogleCalendarProvider } from '@/integrations/calendar/googleCalendarProvider';

function jsonResponse(body: unknown, ok = true, status = ok ? 200 : 400) {
  return { ok, status, text: () => Promise.resolve(JSON.stringify(body)), json: () => Promise.resolve(body) } as Response;
}

describe('GoogleCalendarProvider', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.stubEnv('VITE_GOOGLE_CLIENT_ID', 'test-client-id.apps.googleusercontent.com');
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    vi.stubGlobal('google', {
      accounts: {
        oauth2: {
          initTokenClient: (config: { callback: (r: { access_token: string }) => void }) => ({
            requestAccessToken: () => config.callback({ access_token: 'fake-access-token' }),
          }),
          revoke: vi.fn(),
        },
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('throws a clear error when no Client ID is configured', async () => {
    vi.stubEnv('VITE_GOOGLE_CLIENT_ID', '');
    const provider = new GoogleCalendarProvider();
    await expect(provider.authenticate(undefined)).rejects.toThrow(/VITE_GOOGLE_CLIENT_ID/);
  });

  it('authenticates and returns the account email', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ email: 'david@example.com' }));

    const provider = new GoogleCalendarProvider();
    const result = await provider.authenticate(undefined);

    expect(result.accountLabel).toBe('david@example.com');
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toContain('userinfo');
    expect((init as RequestInit).headers).toMatchObject({ Authorization: 'Bearer fake-access-token' });
  });

  it('lists calendars and marks only the primary one enabled by default', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ email: 'david@example.com' }))
      .mockResolvedValueOnce(
        jsonResponse({
          items: [
            { id: 'primary', summary: 'David', primary: true, backgroundColor: '#123456' },
            { id: 'work@group.calendar.google.com', summary: 'Work' },
          ],
        }),
      );

    const provider = new GoogleCalendarProvider();
    await provider.authenticate(undefined);
    const calendars = await provider.listCalendars();

    expect(calendars).toEqual([
      { id: 'primary', providerType: 'google', externalId: 'primary', displayName: 'David', color: '#123456', enabled: true },
      { id: 'work@group.calendar.google.com', providerType: 'google', externalId: 'work@group.calendar.google.com', displayName: 'Work', color: '#b8842e', enabled: false },
    ]);
  });

  it('lists events only from enabled calendars and maps timed + all-day events', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ email: 'david@example.com' }))
      .mockResolvedValueOnce(jsonResponse({ items: [{ id: 'primary', summary: 'David', primary: true }] }))
      .mockResolvedValueOnce(
        jsonResponse({
          items: [
            { id: 'ev1', summary: 'Timed', start: { dateTime: '2026-08-14T14:00:00Z' }, end: { dateTime: '2026-08-14T15:00:00Z' } },
            { id: 'ev2', summary: 'All day', start: { date: '2026-08-15' }, end: { date: '2026-08-16' } },
          ],
        }),
      );

    const provider = new GoogleCalendarProvider();
    await provider.authenticate(undefined);
    await provider.listCalendars();
    const events = await provider.listEvents({ start: '2026-08-01T00:00:00Z', end: '2026-09-01T00:00:00Z' });

    expect(events).toHaveLength(2);
    expect(events[0]).toMatchObject({ id: 'ev1', title: 'Timed', start: '2026-08-14T14:00:00Z', allDay: false });
    expect(events[1]).toMatchObject({ id: 'ev2', title: 'All day', start: '2026-08-15T00:00:00', allDay: true });
  });

  it('creates an event via POST and maps the response back', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ email: 'david@example.com' }))
      .mockResolvedValueOnce(jsonResponse({ id: 'created-1', summary: 'Finish presentation', start: { dateTime: '2026-08-14T14:00:00Z' }, end: { dateTime: '2026-08-14T15:00:00Z' } }));

    const provider = new GoogleCalendarProvider();
    await provider.authenticate(undefined);

    const event = await provider.createEvent({
      connectedCalendarId: 'primary',
      title: 'Finish presentation',
      description: '',
      location: '',
      start: '2026-08-14T14:00:00Z',
      end: '2026-08-14T15:00:00Z',
      allDay: false,
      recurrenceRule: null,
      taskId: 'task-1',
    });

    expect(event).toMatchObject({ id: 'created-1', title: 'Finish presentation', taskId: 'task-1' });
    const [url, init] = fetchMock.mock.calls[1]!;
    expect(url).toContain('/calendars/primary/events');
    expect((init as RequestInit).method).toBe('POST');
  });

  it('throws when updating or deleting an event that was never listed or created', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ email: 'david@example.com' }));
    const provider = new GoogleCalendarProvider();
    await provider.authenticate(undefined);

    await expect(provider.updateEvent('unknown-id', { title: 'x' })).rejects.toThrow(/unknown event/i);
    await expect(provider.deleteEvent('unknown-id')).rejects.toThrow(/unknown event/i);
  });
});
