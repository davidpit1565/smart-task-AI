import type { CalendarProvider, CalendarAuthResult, DateRange } from '@/core/calendar/calendarProvider';
import type { CalendarEvent, ConnectedCalendar, NewCalendarEventInput } from '@/core/calendar/calendarEvent.types';
import { caldavRequest, type CaldavCredentials } from './caldavClient';
import {
  PROPFIND_CALENDAR_HOME_SET,
  PROPFIND_CALENDAR_LIST,
  PROPFIND_CURRENT_USER_PRINCIPAL,
  buildCalendarQueryBody,
  parseCalendarHomeHref,
  parseCalendarList,
  parseCalendarQueryResponse,
  parsePrincipalHref,
} from './caldavXml';
import { parseIcsEvents, serializeIcsEvent } from './ics';

const PROPFIND_HEADERS = { Depth: '0', 'Content-Type': 'application/xml; charset=utf-8' };
const PROPFIND_DEPTH1_HEADERS = { Depth: '1', 'Content-Type': 'application/xml; charset=utf-8' };
const REPORT_HEADERS = { Depth: '1', 'Content-Type': 'application/xml; charset=utf-8' };

interface EventLocation {
  href: string;
  etag: string | null;
  connectedCalendarId: string;
}

/**
 * Apple Calendar via iCloud CalDAV (RFC 4791), proxied through /api/caldav
 * to avoid the browser CORS restriction on caldav.icloud.com. Built to the
 * documented CalDAV/iCalendar spec and unit-tested against realistic
 * fixture XML/ICS (tests/appleCalDavProvider.test.ts, tests/ics.test.ts,
 * tests/caldavXml.test.ts) — it has NOT been exercised against a live
 * iCloud account in this environment (no real Apple ID + app-specific
 * password available here). Verify against your own account before
 * relying on it for anything important.
 */
export class AppleCalDavProvider implements CalendarProvider {
  readonly type = 'apple' as const;

  private credentials: CaldavCredentials | null = null;
  private calendarHomeHref: string | null = null;
  private calendars: ConnectedCalendar[] = [];
  private eventLocations = new Map<string, EventLocation>();

  async authenticate(credentials: unknown): Promise<CalendarAuthResult> {
    const creds = credentials as Partial<CaldavCredentials>;
    if (!creds?.email || !creds?.appSpecificPassword) {
      throw new Error('Apple Calendar requires your iCloud email and an app-specific password (generate one at appleid.apple.com).');
    }
    this.credentials = { email: creds.email, appSpecificPassword: creds.appSpecificPassword };

    const principalRes = await caldavRequest(this.credentials, 'PROPFIND', '/', {
      headers: PROPFIND_HEADERS,
      body: PROPFIND_CURRENT_USER_PRINCIPAL,
    });
    const principalHref = parsePrincipalHref(principalRes.body);
    if (!principalHref) throw new Error('Could not discover your iCloud calendar account (unexpected server response).');

    const homeRes = await caldavRequest(this.credentials, 'PROPFIND', principalHref, {
      headers: PROPFIND_HEADERS,
      body: PROPFIND_CALENDAR_HOME_SET,
    });
    const homeHref = parseCalendarHomeHref(homeRes.body);
    if (!homeHref) throw new Error('Could not find your iCloud calendar home (unexpected server response).');

    this.calendarHomeHref = homeHref;
    return { accountLabel: creds.email };
  }

  private requireAuthenticated(): { credentials: CaldavCredentials; homeHref: string } {
    if (!this.credentials || !this.calendarHomeHref) {
      throw new Error('Not connected to Apple Calendar yet — call authenticate() first.');
    }
    return { credentials: this.credentials, homeHref: this.calendarHomeHref };
  }

  async listCalendars(): Promise<ConnectedCalendar[]> {
    const { credentials, homeHref } = this.requireAuthenticated();
    const res = await caldavRequest(credentials, 'PROPFIND', homeHref, {
      headers: PROPFIND_DEPTH1_HEADERS,
      body: PROPFIND_CALENDAR_LIST,
    });
    const raw = parseCalendarList(res.body);
    this.calendars = raw.map((entry) => ({
      id: entry.href,
      providerType: 'apple' as const,
      externalId: entry.href,
      displayName: entry.displayName,
      color: entry.color ?? '#4f46e5',
      enabled: true,
    }));
    return this.calendars;
  }

  async listEvents(range: DateRange): Promise<CalendarEvent[]> {
    const { credentials } = this.requireAuthenticated();
    if (this.calendars.length === 0) await this.listCalendars();

    const events: CalendarEvent[] = [];
    for (const calendar of this.calendars.filter((c) => c.enabled)) {
      const res = await caldavRequest(credentials, 'REPORT', calendar.externalId, {
        headers: REPORT_HEADERS,
        body: buildCalendarQueryBody(range),
      });
      const resources = parseCalendarQueryResponse(res.body);
      for (const resource of resources) {
        const parsed = parseIcsEvents(resource.calendarData);
        for (const ics of parsed) {
          this.eventLocations.set(ics.uid, { href: resource.href, etag: resource.etag, connectedCalendarId: calendar.id });
          events.push({
            id: ics.uid,
            connectedCalendarId: calendar.id,
            externalId: ics.uid,
            title: ics.summary,
            description: ics.description,
            location: ics.location,
            start: ics.start,
            end: ics.end,
            allDay: ics.allDay,
            recurrenceRule: ics.rrule,
            taskId: null,
            updatedAt: new Date().toISOString(),
          });
        }
      }
    }
    return events;
  }

  async createEvent(input: NewCalendarEventInput): Promise<CalendarEvent> {
    const { credentials } = this.requireAuthenticated();
    const calendar = this.calendars.find((c) => c.id === input.connectedCalendarId);
    if (!calendar) throw new Error('Unknown calendar — call listCalendars() first.');

    const uid = `${crypto.randomUUID()}@smart-tasks-ai`;
    const href = `${calendar.externalId.replace(/\/$/, '')}/${uid}.ics`;
    const ics = serializeIcsEvent({
      uid,
      summary: input.title,
      description: input.description,
      location: input.location,
      start: input.start,
      end: input.end,
      allDay: input.allDay,
    });

    await caldavRequest(credentials, 'PUT', href, {
      headers: { 'Content-Type': 'text/calendar; charset=utf-8', 'If-None-Match': '*' },
      body: ics,
    });

    this.eventLocations.set(uid, { href, etag: null, connectedCalendarId: calendar.id });
    return {
      id: uid,
      connectedCalendarId: calendar.id,
      externalId: uid,
      title: input.title,
      description: input.description,
      location: input.location,
      start: input.start,
      end: input.end,
      allDay: input.allDay,
      recurrenceRule: null,
      taskId: input.taskId,
      updatedAt: new Date().toISOString(),
    };
  }

  async updateEvent(id: string, patch: Partial<CalendarEvent>): Promise<CalendarEvent> {
    const { credentials } = this.requireAuthenticated();
    const location = this.eventLocations.get(id);
    if (!location) throw new Error('Unknown event — list events before updating them.');

    const getRes = await caldavRequest(credentials, 'GET', location.href);
    const [current] = parseIcsEvents(getRes.body);
    if (!current) throw new Error('Could not read the existing event from Apple Calendar.');

    const merged = {
      uid: id,
      summary: patch.title ?? current.summary,
      description: patch.description ?? current.description,
      location: patch.location ?? current.location,
      start: patch.start ?? current.start,
      end: patch.end ?? current.end,
      allDay: patch.allDay ?? current.allDay,
    };
    const ics = serializeIcsEvent(merged);

    await caldavRequest(credentials, 'PUT', location.href, {
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        ...(location.etag ? { 'If-Match': location.etag } : {}),
      },
      body: ics,
    });

    return {
      id,
      connectedCalendarId: location.connectedCalendarId,
      externalId: id,
      title: merged.summary,
      description: merged.description,
      location: merged.location,
      start: merged.start,
      end: merged.end,
      allDay: merged.allDay,
      recurrenceRule: current.rrule,
      taskId: patch.taskId ?? null,
      updatedAt: new Date().toISOString(),
    };
  }

  async deleteEvent(id: string): Promise<void> {
    const { credentials } = this.requireAuthenticated();
    const location = this.eventLocations.get(id);
    if (!location) throw new Error('Unknown event — list events before deleting them.');
    await caldavRequest(credentials, 'DELETE', location.href, {
      headers: location.etag ? { 'If-Match': location.etag } : {},
    });
    this.eventLocations.delete(id);
  }

  async sync(range: DateRange): Promise<CalendarEvent[]> {
    await this.listCalendars();
    return this.listEvents(range);
  }

  async disconnect(): Promise<void> {
    this.credentials = null;
    this.calendarHomeHref = null;
    this.calendars = [];
    this.eventLocations.clear();
  }
}
