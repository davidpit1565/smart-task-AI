/**
 * Minimal iCalendar (RFC 5545) VEVENT reader/writer — just enough to round-trip
 * the fields this app cares about (uid, summary, description, location,
 * dtstart/dtend, rrule). Not a general-purpose ICS library: no timezone
 * database, no recurrence expansion (the RRULE is kept opaque and passed
 * through unchanged).
 */

export interface ParsedIcsEvent {
  uid: string;
  summary: string;
  description: string;
  location: string;
  /** ISO 8601 datetime. */
  start: string;
  end: string;
  allDay: boolean;
  rrule: string | null;
}

function unfoldLines(ics: string): string[] {
  const raw = ics.split(/\r\n|\n|\r/);
  const unfolded: string[] = [];
  for (const line of raw) {
    if ((line.startsWith(' ') || line.startsWith('\t')) && unfolded.length > 0) {
      unfolded[unfolded.length - 1] += line.slice(1);
    } else {
      unfolded.push(line);
    }
  }
  return unfolded;
}

function parseDateTimeValue(value: string, params: string): { iso: string; allDay: boolean } {
  const isDateOnly = params.includes('VALUE=DATE') && !params.includes('VALUE=DATE-TIME');
  if (isDateOnly || /^\d{8}$/.test(value)) {
    const year = value.slice(0, 4);
    const month = value.slice(4, 6);
    const day = value.slice(6, 8);
    return { iso: `${year}-${month}-${day}T00:00:00`, allDay: true };
  }
  const utc = value.endsWith('Z');
  const year = value.slice(0, 4);
  const month = value.slice(4, 6);
  const day = value.slice(6, 8);
  const hour = value.slice(9, 11);
  const minute = value.slice(11, 13);
  const second = value.slice(13, 15) || '00';
  const iso = `${year}-${month}-${day}T${hour}:${minute}:${second}${utc ? 'Z' : ''}`;
  return { iso, allDay: false };
}

function parsePropertyLine(line: string): { name: string; params: string; value: string } | null {
  const colonIndex = line.indexOf(':');
  if (colonIndex === -1) return null;
  const left = line.slice(0, colonIndex);
  const value = line.slice(colonIndex + 1);
  const [name, ...paramParts] = left.split(';');
  return { name: name!.toUpperCase(), params: paramParts.join(';').toUpperCase(), value };
}

function unescapeText(value: string): string {
  return value.replace(/\\n/gi, '\n').replace(/\\,/g, ',').replace(/\\;/g, ';').replace(/\\\\/g, '\\');
}

/** Parses every VEVENT block found in raw ICS text (a calendar-data blob may contain more than one). */
export function parseIcsEvents(ics: string): ParsedIcsEvent[] {
  const lines = unfoldLines(ics);
  const events: ParsedIcsEvent[] = [];
  let current: Partial<ParsedIcsEvent> & { startAllDay?: boolean } | null = null;

  for (const line of lines) {
    if (line === 'BEGIN:VEVENT') {
      current = {};
      continue;
    }
    if (line === 'END:VEVENT') {
      if (current && current.uid && current.start && current.end) {
        events.push({
          uid: current.uid,
          summary: current.summary ?? '',
          description: current.description ?? '',
          location: current.location ?? '',
          start: current.start,
          end: current.end,
          allDay: current.allDay ?? false,
          rrule: current.rrule ?? null,
        });
      }
      current = null;
      continue;
    }
    if (!current) continue;

    const prop = parsePropertyLine(line);
    if (!prop) continue;

    switch (prop.name) {
      case 'UID':
        current.uid = prop.value;
        break;
      case 'SUMMARY':
        current.summary = unescapeText(prop.value);
        break;
      case 'DESCRIPTION':
        current.description = unescapeText(prop.value);
        break;
      case 'LOCATION':
        current.location = unescapeText(prop.value);
        break;
      case 'DTSTART': {
        const { iso, allDay } = parseDateTimeValue(prop.value, prop.params);
        current.start = iso;
        current.allDay = allDay;
        break;
      }
      case 'DTEND': {
        const { iso } = parseDateTimeValue(prop.value, prop.params);
        current.end = iso;
        break;
      }
      case 'RRULE':
        current.rrule = prop.value;
        break;
      default:
        break;
    }
  }

  return events;
}

function toIcsDateTime(iso: string): string {
  const date = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}` +
    `T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`
  );
}

function escapeText(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

/** Serializes a single event into a complete VCALENDAR document, suitable for a CalDAV PUT body. */
export function serializeIcsEvent(event: {
  uid: string;
  summary: string;
  description?: string;
  location?: string;
  start: string;
  end: string;
  allDay?: boolean;
}): string {
  const dtstamp = toIcsDateTime(new Date().toISOString());
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Unknot//EN',
    'BEGIN:VEVENT',
    `UID:${event.uid}`,
    `DTSTAMP:${dtstamp}`,
    event.allDay ? `DTSTART;VALUE=DATE:${event.start.slice(0, 10).replace(/-/g, '')}` : `DTSTART:${toIcsDateTime(event.start)}`,
    event.allDay ? `DTEND;VALUE=DATE:${event.end.slice(0, 10).replace(/-/g, '')}` : `DTEND:${toIcsDateTime(event.end)}`,
    `SUMMARY:${escapeText(event.summary)}`,
  ];
  if (event.description) lines.push(`DESCRIPTION:${escapeText(event.description)}`);
  if (event.location) lines.push(`LOCATION:${escapeText(event.location)}`);
  lines.push('END:VEVENT', 'END:VCALENDAR');
  return lines.join('\r\n');
}
