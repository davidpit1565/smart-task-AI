import { create } from 'zustand';
import type { CalendarEvent, CalendarProviderType, ConnectedCalendar, NewCalendarEventInput } from '@/core/calendar/calendarEvent.types';
import type { CalendarProvider, DateRange } from '@/core/calendar/calendarProvider';
import { GoogleCalendarProvider } from '@/integrations/calendar/googleCalendarProvider';
import { db, type CalendarConnection } from '@/data/db';

// Apple Calendar (CalDAV) is implemented but removed from the active UI —
// see docs/PRODUCT_VISION.md. Outlook is a later phase behind this same
// interface; adding a provider here is the only wiring a new one needs.
const providers: Partial<Record<CalendarProviderType, CalendarProvider>> = {
  google: new GoogleCalendarProvider(),
};

function defaultSyncRange(): DateRange {
  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() - 14);
  const end = new Date(now);
  end.setDate(end.getDate() + 60);
  return { start: start.toISOString(), end: end.toISOString() };
}

interface CalendarStoreState {
  connections: CalendarConnection[];
  connectedCalendars: ConnectedCalendar[];
  events: CalendarEvent[];
  loaded: boolean;
  connecting: boolean;
  error: string | null;

  load(): Promise<void>;
  connectGoogle(): Promise<void>;
  disconnect(providerType: CalendarProviderType): Promise<void>;
  syncProvider(providerType: CalendarProviderType): Promise<void>;
  setCalendarEnabled(calendarId: string, enabled: boolean): Promise<void>;
  createEventForTask(input: NewCalendarEventInput): Promise<CalendarEvent>;
  deleteEventForTask(eventId: string): Promise<void>;
  linkEventToTask(eventId: string, taskId: string): Promise<void>;
}

export const useCalendarStore = create<CalendarStoreState>((set, get) => ({
  connections: [],
  connectedCalendars: [],
  events: [],
  loaded: false,
  connecting: false,
  error: null,

  async load() {
    const [connections, connectedCalendars, events] = await Promise.all([
      db.calendarConnections.toArray(),
      db.connectedCalendars.toArray(),
      db.calendarEvents.toArray(),
    ]);
    set({ connections, connectedCalendars, events, loaded: true });
  },

  async connectGoogle() {
    set({ connecting: true, error: null });
    try {
      const provider = providers.google;
      if (!provider) throw new Error('Google Calendar provider is not registered.');
      const auth = await provider.authenticate(undefined);

      const connection: CalendarConnection = {
        id: 'google',
        providerType: 'google',
        accountLabel: auth.accountLabel,
        connectedAt: new Date().toISOString(),
      };
      await db.calendarConnections.put(connection);
      set((state) => ({ connections: [...state.connections.filter((c) => c.providerType !== 'google'), connection] }));

      await get().syncProvider('google');
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Could not connect to Google Calendar.' });
    } finally {
      set({ connecting: false });
    }
  },

  async disconnect(providerType) {
    const provider = providers[providerType];
    await provider?.disconnect();

    const calendarIds = get()
      .connectedCalendars.filter((c) => c.providerType === providerType)
      .map((c) => c.id);

    await db.calendarConnections.delete(providerType);
    await db.connectedCalendars.bulkDelete(calendarIds);
    await db.calendarEvents.where('connectedCalendarId').anyOf(calendarIds).delete();

    set((state) => ({
      connections: state.connections.filter((c) => c.providerType !== providerType),
      connectedCalendars: state.connectedCalendars.filter((c) => c.providerType !== providerType),
      events: state.events.filter((e) => !calendarIds.includes(e.connectedCalendarId)),
    }));
  },

  async syncProvider(providerType) {
    const provider = providers[providerType];
    if (!provider) throw new Error(`${providerType} calendar sync is not available yet.`);

    set({ error: null });
    try {
      const calendars = await provider.listCalendars();
      await db.connectedCalendars.bulkPut(calendars);

      const events = await provider.sync(defaultSyncRange());
      const calendarIds = calendars.map((c) => c.id);
      await db.calendarEvents.where('connectedCalendarId').anyOf(calendarIds).delete();
      await db.calendarEvents.bulkPut(events);

      set((state) => ({
        connectedCalendars: [...state.connectedCalendars.filter((c) => c.providerType !== providerType), ...calendars],
        events: [...state.events.filter((e) => !calendarIds.includes(e.connectedCalendarId)), ...events],
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Calendar sync failed.' });
      throw error;
    }
  },

  async setCalendarEnabled(calendarId, enabled) {
    const calendar = get().connectedCalendars.find((c) => c.id === calendarId);
    if (!calendar) return;
    const updated = { ...calendar, enabled };
    await db.connectedCalendars.put(updated);
    set((state) => ({ connectedCalendars: state.connectedCalendars.map((c) => (c.id === calendarId ? updated : c)) }));
  },

  async createEventForTask(input) {
    const calendar = get().connectedCalendars.find((c) => c.id === input.connectedCalendarId);
    if (!calendar) throw new Error('Unknown calendar — connect one before scheduling.');
    const provider = providers[calendar.providerType];
    if (!provider) throw new Error(`${calendar.providerType} calendar is not available yet.`);

    const event = await provider.createEvent(input);
    await db.calendarEvents.put(event);
    set((state) => ({ events: [...state.events, event] }));
    return event;
  },

  async deleteEventForTask(eventId) {
    const event = get().events.find((e) => e.id === eventId);
    if (!event) return;
    const calendar = get().connectedCalendars.find((c) => c.id === event.connectedCalendarId);
    const provider = calendar ? providers[calendar.providerType] : undefined;
    if (provider) await provider.deleteEvent(eventId);
    await db.calendarEvents.delete(eventId);
    set((state) => ({ events: state.events.filter((e) => e.id !== eventId) }));
  },

  async linkEventToTask(eventId, taskId) {
    const event = get().events.find((e) => e.id === eventId);
    if (!event) return;
    const updated = { ...event, taskId };
    await db.calendarEvents.put(updated);
    set((state) => ({ events: state.events.map((e) => (e.id === eventId ? updated : e)) }));
  },
}));
