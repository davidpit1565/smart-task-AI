import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { OutlookCalendarProvider } from '@/integrations/calendar/outlookCalendarProvider';

vi.mock('@/integrations/calendar/outlookAuth', () => ({
  authenticateWithPopup: vi.fn().mockResolvedValue('fake-access-token'),
}));

function jsonResponse(body: unknown, ok = true, status = ok ? 200 : 400) {
  return { ok, status, text: () => Promise.resolve(JSON.stringify(body)), json: () => Promise.resolve(body) } as Response;
}

describe('OutlookCalendarProvider', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('authenticates and returns the account email', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ mail: 'david@example.com' }));

    const provider = new OutlookCalendarProvider();
    const result = await provider.authenticate(undefined);

    expect(result.accountLabel).toBe('david@example.com');
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toContain('/me');
    expect((init as RequestInit).headers).toMatchObject({ Authorization: 'Bearer fake-access-token' });
  });

  it('falls back to userPrincipalName when mail is missing', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ userPrincipalName: 'david@tenant.onmicrosoft.com' }));
    const provider = new OutlookCalendarProvider();
    const result = await provider.authenticate(undefined);
    expect(result.accountLabel).toBe('david@tenant.onmicrosoft.com');
  });

  it('lists calendars and marks only the default one enabled', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ mail: 'david@example.com' }))
      .mockResolvedValueOnce(
        jsonResponse({
          value: [
            { id: 'cal-1', name: 'Calendar', isDefaultCalendar: true },
            { id: 'cal-2', name: 'Work' },
          ],
        }),
      );

    const provider = new OutlookCalendarProvider();
    await provider.authenticate(undefined);
    const calendars = await provider.listCalendars();

    expect(calendars).toEqual([
      { id: 'cal-1', providerType: 'outlook', externalId: 'cal-1', displayName: 'Calendar', color: '#5c7a93', enabled: true },
      { id: 'cal-2', providerType: 'outlook', externalId: 'cal-2', displayName: 'Work', color: '#5c7a93', enabled: false },
    ]);
  });

  it('lists events only from enabled calendars and maps timed + all-day events', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ mail: 'david@example.com' }))
      .mockResolvedValueOnce(jsonResponse({ value: [{ id: 'cal-1', name: 'Calendar', isDefaultCalendar: true }] }))
      .mockResolvedValueOnce(
        jsonResponse({
          value: [
            { id: 'ev1', subject: 'Timed', start: { dateTime: '2026-08-14T14:00:00' }, end: { dateTime: '2026-08-14T15:00:00' } },
            { id: 'ev2', subject: 'All day', isAllDay: true, start: { dateTime: '2026-08-15T00:00:00' }, end: { dateTime: '2026-08-16T00:00:00' } },
          ],
        }),
      );

    const provider = new OutlookCalendarProvider();
    await provider.authenticate(undefined);
    await provider.listCalendars();
    const events = await provider.listEvents({ start: '2026-08-01T00:00:00Z', end: '2026-09-01T00:00:00Z' });

    expect(events).toHaveLength(2);
    expect(events[0]).toMatchObject({ id: 'ev1', title: 'Timed', start: '2026-08-14T14:00:00Z', allDay: false });
    expect(events[1]).toMatchObject({ id: 'ev2', title: 'All day', allDay: true });
  });

  it('creates an event via POST and maps the response back', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ mail: 'david@example.com' }))
      .mockResolvedValueOnce(
        jsonResponse({ id: 'created-1', subject: 'Finish presentation', start: { dateTime: '2026-08-14T14:00:00' }, end: { dateTime: '2026-08-14T15:00:00' } }),
      );

    const provider = new OutlookCalendarProvider();
    await provider.authenticate(undefined);

    const event = await provider.createEvent({
      connectedCalendarId: 'cal-1',
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
    expect(url).toContain('/calendars/cal-1/events');
    expect((init as RequestInit).method).toBe('POST');
  });

  it('throws when updating or deleting an event that was never listed or created', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ mail: 'david@example.com' }));
    const provider = new OutlookCalendarProvider();
    await provider.authenticate(undefined);

    await expect(provider.updateEvent('unknown-id', { title: 'x' })).rejects.toThrow(/unknown event/i);
    await expect(provider.deleteEvent('unknown-id')).rejects.toThrow(/unknown event/i);
  });
});
