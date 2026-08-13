import type { CalendarAuthResult, CalendarProvider, DateRange } from '@/core/calendar/calendarProvider';
import type { CalendarEvent, ConnectedCalendar, NewCalendarEventInput } from '@/core/calendar/calendarEvent.types';
import { loadGoogleIdentityServices, type GoogleTokenClient } from './googleIdentityLoader';

/**
 * Google Calendar via Google Identity Services (GIS) + the Calendar API v3,
 * called directly from the browser — no backend proxy needed, unlike Apple's
 * CalDAV, because Google's APIs send proper CORS headers and GIS's token
 * flow is designed for public (browser-only) clients: it returns a
 * short-lived access token straight to the page, no client secret involved
 * anywhere. The access token lives in memory only for the session, same
 * policy as the Apple app-specific password — nothing sensitive is
 * persisted to IndexedDB.
 *
 * Requires a Google Cloud OAuth 2.0 Client ID (a public, non-secret value)
 * configured via the VITE_GOOGLE_CLIENT_ID env var — see README for the
 * exact Google Cloud Console setup steps.
 */

const CALENDAR_API = 'https://www.googleapis.com/calendar/v3';
const USERINFO_ENDPOINT = 'https://www.googleapis.com/oauth2/v3/userinfo';
const SCOPE = 'https://www.googleapis.com/auth/calendar openid email profile';

interface GoogleEventDateTime {
  dateTime?: string;
  date?: string;
  timeZone?: string;
}

interface GoogleEvent {
  id: string;
  summary?: string;
  description?: string;
  location?: string;
  start?: GoogleEventDateTime;
  end?: GoogleEventDateTime;
  recurrence?: string[];
}

function readClientId(): string | null {
  const id = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  return typeof id === 'string' && id.length > 0 ? id : null;
}

function toIsoFromGoogleDateTime(value: GoogleEventDateTime | undefined): { iso: string; allDay: boolean } {
  if (!value) return { iso: new Date().toISOString(), allDay: false };
  if (value.date) return { iso: `${value.date}T00:00:00`, allDay: true };
  return { iso: value.dateTime ?? new Date().toISOString(), allDay: false };
}

function mapGoogleEvent(event: GoogleEvent, connectedCalendarId: string, taskId: string | null = null): CalendarEvent {
  const start = toIsoFromGoogleDateTime(event.start);
  const end = toIsoFromGoogleDateTime(event.end);
  return {
    id: event.id,
    connectedCalendarId,
    externalId: event.id,
    title: event.summary ?? '',
    description: event.description ?? '',
    location: event.location ?? '',
    start: start.iso,
    end: end.iso,
    allDay: start.allDay,
    recurrenceRule: event.recurrence?.[0] ?? null,
    taskId,
    updatedAt: new Date().toISOString(),
  };
}

function toGoogleEventBody(input: { title: string; description: string; location: string; start: string; end: string; allDay: boolean }) {
  return {
    summary: input.title,
    description: input.description,
    location: input.location,
    start: input.allDay ? { date: input.start.slice(0, 10) } : { dateTime: input.start },
    end: input.allDay ? { date: input.end.slice(0, 10) } : { dateTime: input.end },
  };
}

export class GoogleCalendarProvider implements CalendarProvider {
  readonly type = 'google' as const;

  private accessToken: string | null = null;
  private calendars: ConnectedCalendar[] = [];
  private eventCalendarMap = new Map<string, string>();

  /** Google's OAuth flow needs no credentials argument — the consent popup handles it. */
  async authenticate(_credentials?: unknown): Promise<CalendarAuthResult> {
    const clientId = readClientId();
    if (!clientId) {
      throw new Error(
        "Google Calendar isn't configured yet — this app needs a Google OAuth Client ID (VITE_GOOGLE_CLIENT_ID env var). See README for the exact Google Cloud Console steps.",
      );
    }

    await loadGoogleIdentityServices();
    if (!window.google) throw new Error('Google Identity Services failed to load.');

    this.accessToken = await new Promise<string>((resolve, reject) => {
      let tokenClient: GoogleTokenClient;
      tokenClient = window.google!.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: SCOPE,
        callback: (response) => {
          if (response.error || !response.access_token) {
            reject(new Error(response.error_description ?? response.error ?? 'Google sign-in was cancelled or failed.'));
            return;
          }
          resolve(response.access_token);
        },
        error_callback: (error) => {
          reject(new Error(error.message ?? `Google sign-in failed (${error.type}).`));
        },
      });
      tokenClient.requestAccessToken();
    });

    const profile = await this.request<{ email?: string }>(USERINFO_ENDPOINT);
    return { accountLabel: profile.email ?? 'Google account' };
  }

  private requireToken(): string {
    if (!this.accessToken) throw new Error('Not connected to Google Calendar yet — call authenticate() first.');
    return this.accessToken;
  }

  private async request<T>(url: string, init: RequestInit = {}): Promise<T> {
    const res = await fetch(url, {
      ...init,
      headers: {
        ...init.headers,
        Authorization: `Bearer ${this.requireToken()}`,
      },
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Google Calendar request failed (HTTP ${res.status}): ${body.slice(0, 200)}`);
    }
    if (res.status === 204) return undefined as T;
    return (await res.json()) as T;
  }

  async listCalendars(): Promise<ConnectedCalendar[]> {
    const data = await this.request<{ items: Array<{ id: string; summary: string; backgroundColor?: string; primary?: boolean }> }>(
      `${CALENDAR_API}/users/me/calendarList`,
    );
    this.calendars = data.items.map((item) => ({
      id: item.id,
      providerType: 'google' as const,
      externalId: item.id,
      displayName: item.summary,
      color: item.backgroundColor ?? '#b8842e',
      // Only the primary calendar syncs by default — the user can enable others from the Calendar screen.
      enabled: item.primary ?? false,
    }));
    return this.calendars;
  }

  private async fetchEventsForCalendar(calendarId: string, range: DateRange): Promise<CalendarEvent[]> {
    const params = new URLSearchParams({
      timeMin: range.start,
      timeMax: range.end,
      singleEvents: 'true',
      orderBy: 'startTime',
      maxResults: '250',
    });
    const data = await this.request<{ items: GoogleEvent[] }>(`${CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events?${params}`);
    return data.items.map((item) => {
      this.eventCalendarMap.set(item.id, calendarId);
      return mapGoogleEvent(item, calendarId);
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
    const created = await this.request<GoogleEvent>(`${CALENDAR_API}/calendars/${encodeURIComponent(input.connectedCalendarId)}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(toGoogleEventBody(input)),
    });
    this.eventCalendarMap.set(created.id, input.connectedCalendarId);
    return mapGoogleEvent(created, input.connectedCalendarId, input.taskId);
  }

  async updateEvent(id: string, patch: Partial<CalendarEvent>): Promise<CalendarEvent> {
    const calendarId = this.eventCalendarMap.get(id);
    if (!calendarId) throw new Error('Unknown event — list events before updating them.');

    const body: Record<string, unknown> = {};
    if (patch.title !== undefined) body.summary = patch.title;
    if (patch.description !== undefined) body.description = patch.description;
    if (patch.location !== undefined) body.location = patch.location;
    if (patch.start !== undefined) body.start = patch.allDay ? { date: patch.start.slice(0, 10) } : { dateTime: patch.start };
    if (patch.end !== undefined) body.end = patch.allDay ? { date: patch.end.slice(0, 10) } : { dateTime: patch.end };

    const updated = await this.request<GoogleEvent>(`${CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return mapGoogleEvent(updated, calendarId, patch.taskId ?? null);
  }

  async deleteEvent(id: string): Promise<void> {
    const calendarId = this.eventCalendarMap.get(id);
    if (!calendarId) throw new Error('Unknown event — list events before deleting them.');
    await this.request<void>(`${CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events/${id}`, { method: 'DELETE' });
    this.eventCalendarMap.delete(id);
  }

  async sync(range: DateRange): Promise<CalendarEvent[]> {
    await this.listCalendars();
    return this.listEvents(range);
  }

  async disconnect(): Promise<void> {
    if (this.accessToken && window.google) {
      window.google.accounts.oauth2.revoke(this.accessToken, () => {});
    }
    this.accessToken = null;
    this.calendars = [];
    this.eventCalendarMap.clear();
  }
}
