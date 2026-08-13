import type { CalendarAuthResult, CalendarProvider, DateRange } from '@/core/calendar/calendarProvider';
import type { CalendarEvent, ConnectedCalendar, NewCalendarEventInput } from '@/core/calendar/calendarEvent.types';
import { authenticateWithPopup } from './outlookAuth';

/**
 * Outlook Calendar via Microsoft Graph, called directly from the browser —
 * Graph sends CORS headers for public-client tokens, so no backend proxy is
 * needed, same as Google. See outlookAuth.ts for the popup-based OAuth flow.
 */

const GRAPH_API = 'https://graph.microsoft.com/v1.0';

interface GraphDateTime {
  dateTime: string;
  timeZone: string;
}

interface GraphEvent {
  id: string;
  subject?: string;
  bodyPreview?: string;
  location?: { displayName?: string };
  start?: GraphDateTime;
  end?: GraphDateTime;
  isAllDay?: boolean;
  recurrence?: unknown;
}

function toIso(value: GraphDateTime | undefined): string {
  if (!value) return new Date().toISOString();
  // Graph returns naive local-to-timezone strings without a trailing "Z" — treat as UTC since we request that timezone.
  return value.dateTime.endsWith('Z') ? value.dateTime : `${value.dateTime}Z`;
}

function mapGraphEvent(event: GraphEvent, connectedCalendarId: string, taskId: string | null = null): CalendarEvent {
  return {
    id: event.id,
    connectedCalendarId,
    externalId: event.id,
    title: event.subject ?? '',
    description: event.bodyPreview ?? '',
    location: event.location?.displayName ?? '',
    start: toIso(event.start),
    end: toIso(event.end),
    allDay: event.isAllDay ?? false,
    recurrenceRule: null,
    taskId,
    updatedAt: new Date().toISOString(),
  };
}

function toGraphEventBody(input: { title: string; description: string; location: string; start: string; end: string; allDay: boolean }) {
  return {
    subject: input.title,
    body: { contentType: 'text', content: input.description },
    location: { displayName: input.location },
    isAllDay: input.allDay,
    start: { dateTime: input.start, timeZone: 'UTC' },
    end: { dateTime: input.end, timeZone: 'UTC' },
  };
}

export class OutlookCalendarProvider implements CalendarProvider {
  readonly type = 'outlook' as const;

  private accessToken: string | null = null;
  private calendars: ConnectedCalendar[] = [];
  private eventCalendarMap = new Map<string, string>();

  async authenticate(_credentials?: unknown): Promise<CalendarAuthResult> {
    this.accessToken = await authenticateWithPopup();
    const profile = await this.request<{ mail?: string; userPrincipalName?: string }>(`${GRAPH_API}/me`);
    return { accountLabel: profile.mail ?? profile.userPrincipalName ?? 'Microsoft account' };
  }

  private requireToken(): string {
    if (!this.accessToken) throw new Error('Not connected to Outlook Calendar yet — call authenticate() first.');
    return this.accessToken;
  }

  private async request<T>(url: string, init: RequestInit = {}): Promise<T> {
    const res = await fetch(url, {
      ...init,
      headers: {
        ...init.headers,
        Authorization: `Bearer ${this.requireToken()}`,
        Prefer: 'outlook.timezone="UTC"',
      },
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Outlook Calendar request failed (HTTP ${res.status}): ${body.slice(0, 200)}`);
    }
    if (res.status === 204) return undefined as T;
    return (await res.json()) as T;
  }

  async listCalendars(): Promise<ConnectedCalendar[]> {
    const data = await this.request<{ value: Array<{ id: string; name: string; isDefaultCalendar?: boolean }> }>(`${GRAPH_API}/me/calendars`);
    this.calendars = data.value.map((item) => ({
      id: item.id,
      providerType: 'outlook' as const,
      externalId: item.id,
      displayName: item.name,
      color: '#5c7a93',
      // Only the default calendar syncs by default — the user can enable others from the Calendar screen.
      enabled: item.isDefaultCalendar ?? false,
    }));
    return this.calendars;
  }

  private async fetchEventsForCalendar(calendarId: string, range: DateRange): Promise<CalendarEvent[]> {
    const params = new URLSearchParams({
      startDateTime: range.start,
      endDateTime: range.end,
      $orderby: 'start/dateTime',
      $top: '250',
    });
    const data = await this.request<{ value: GraphEvent[] }>(
      `${GRAPH_API}/me/calendars/${encodeURIComponent(calendarId)}/calendarView?${params}`,
    );
    return data.value.map((item) => {
      this.eventCalendarMap.set(item.id, calendarId);
      return mapGraphEvent(item, calendarId);
    });
  }

  async listEvents(range: DateRange): Promise<CalendarEvent[]> {
    if (this.calendars.length === 0) await this.listCalendars();
    const events: CalendarEvent[] = [];
    for (const calendar of this.calendars.filter((c) => c.enabled)) {
      events.push(...(await this.fetchEventsForCalendar(calendar.id, range)));
    }
    return events;
  }

  async createEvent(input: NewCalendarEventInput): Promise<CalendarEvent> {
    const created = await this.request<GraphEvent>(`${GRAPH_API}/me/calendars/${encodeURIComponent(input.connectedCalendarId)}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(toGraphEventBody(input)),
    });
    this.eventCalendarMap.set(created.id, input.connectedCalendarId);
    return mapGraphEvent(created, input.connectedCalendarId, input.taskId);
  }

  async updateEvent(id: string, patch: Partial<CalendarEvent>): Promise<CalendarEvent> {
    const calendarId = this.eventCalendarMap.get(id);
    if (!calendarId) throw new Error('Unknown event — list events before updating them.');

    const body: Record<string, unknown> = {};
    if (patch.title !== undefined) body.subject = patch.title;
    if (patch.description !== undefined) body.body = { contentType: 'text', content: patch.description };
    if (patch.location !== undefined) body.location = { displayName: patch.location };
    if (patch.start !== undefined) body.start = { dateTime: patch.start, timeZone: 'UTC' };
    if (patch.end !== undefined) body.end = { dateTime: patch.end, timeZone: 'UTC' };
    if (patch.allDay !== undefined) body.isAllDay = patch.allDay;

    const updated = await this.request<GraphEvent>(`${GRAPH_API}/me/events/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return mapGraphEvent(updated, calendarId, patch.taskId ?? null);
  }

  async deleteEvent(id: string): Promise<void> {
    if (!this.eventCalendarMap.has(id)) throw new Error('Unknown event — list events before deleting them.');
    await this.request<void>(`${GRAPH_API}/me/events/${id}`, { method: 'DELETE' });
    this.eventCalendarMap.delete(id);
  }

  async sync(range: DateRange): Promise<CalendarEvent[]> {
    await this.listCalendars();
    return this.listEvents(range);
  }

  async disconnect(): Promise<void> {
    this.accessToken = null;
    this.calendars = [];
    this.eventCalendarMap.clear();
  }
}
