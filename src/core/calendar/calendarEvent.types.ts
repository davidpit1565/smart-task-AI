export type CalendarProviderType = 'apple' | 'google' | 'outlook';

export interface ConnectedCalendar {
  id: string;
  providerType: CalendarProviderType;
  /** Provider-specific identifier for this calendar (e.g. a CalDAV collection URL). */
  externalId: string;
  displayName: string;
  color: string;
  /** Whether this specific sub-calendar's events should sync/display. */
  enabled: boolean;
}

export interface CalendarEvent {
  id: string;
  connectedCalendarId: string;
  /** The provider's event id (CalDAV UID, Google eventId, Graph event id). */
  externalId: string;
  title: string;
  description: string;
  location: string;
  /** ISO datetime (with timezone offset or Z). */
  start: string;
  end: string;
  allDay: boolean;
  /** Opaque recurrence rule as returned by the provider (e.g. an RRULE line). Not expanded client-side yet. */
  recurrenceRule: string | null;
  /** Set when this event was created from, or linked to, a task. */
  taskId: string | null;
  updatedAt: string;
}

export type NewCalendarEventInput = Omit<CalendarEvent, 'id' | 'externalId' | 'updatedAt'>;

export function eventsOverlap(a: { start: string; end: string }, b: { start: string; end: string }): boolean {
  return new Date(a.start).getTime() < new Date(b.end).getTime() && new Date(b.start).getTime() < new Date(a.end).getTime();
}
