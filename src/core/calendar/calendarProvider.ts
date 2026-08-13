import type { CalendarEvent, CalendarProviderType, ConnectedCalendar, NewCalendarEventInput } from './calendarEvent.types';

export interface DateRange {
  start: string;
  end: string;
}

export interface CalendarAuthResult {
  /** Display-only label (e.g. the connected account's email). Never the raw secret. */
  accountLabel: string;
}

/**
 * Provider-agnostic contract every calendar integration implements —
 * Apple (CalDAV), and later Google/Outlook (OAuth + REST). The UI and
 * calendarStore only ever talk to this interface, never a concrete
 * provider, so a new integration is additive (implement this + register
 * it), never a rewrite.
 */
export interface CalendarProvider {
  readonly type: CalendarProviderType;
  authenticate(credentials: unknown): Promise<CalendarAuthResult>;
  listCalendars(): Promise<ConnectedCalendar[]>;
  listEvents(range: DateRange): Promise<CalendarEvent[]>;
  createEvent(input: NewCalendarEventInput): Promise<CalendarEvent>;
  updateEvent(id: string, patch: Partial<CalendarEvent>): Promise<CalendarEvent>;
  deleteEvent(id: string): Promise<void>;
  /** Pulls the latest events for all enabled calendars and returns the merged, current set. */
  sync(range: DateRange): Promise<CalendarEvent[]>;
  disconnect(): Promise<void>;
}
