import { XMLParser } from 'fast-xml-parser';

/**
 * CalDAV (RFC 4791) request bodies and multistatus response parsing.
 * Namespace prefixes are stripped on parse (removeNSPrefix) so this code
 * doesn't care whether a server writes `<D:href>`, `<d:href>`, or
 * `<href>` — servers are inconsistent about this in practice.
 */

const parser = new XMLParser({
  removeNSPrefix: true,
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
});

function ensureArray<T>(value: T | T[] | undefined): T[] {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

/** Text content of a possibly-empty/self-closing XML element, as fast-xml-parser represents it. */
function textOf(node: unknown): string {
  if (node === undefined || node === null) return '';
  if (typeof node === 'string') return node;
  if (typeof node === 'object' && '#text' in (node as Record<string, unknown>)) {
    return String((node as Record<string, unknown>)['#text']);
  }
  return '';
}

export const PROPFIND_CURRENT_USER_PRINCIPAL = `<?xml version="1.0" encoding="UTF-8"?>
<propfind xmlns="DAV:">
  <prop>
    <current-user-principal/>
  </prop>
</propfind>`;

export const PROPFIND_CALENDAR_HOME_SET = `<?xml version="1.0" encoding="UTF-8"?>
<propfind xmlns="DAV:" xmlns:C="urn:ietf:params:xml:ns:caldav">
  <prop>
    <C:calendar-home-set/>
  </prop>
</propfind>`;

export const PROPFIND_CALENDAR_LIST = `<?xml version="1.0" encoding="UTF-8"?>
<propfind xmlns="DAV:" xmlns:C="urn:ietf:params:xml:ns:caldav" xmlns:A="http://apple.com/ns/ical/">
  <prop>
    <resourcetype/>
    <displayname/>
    <A:calendar-color/>
  </prop>
</propfind>`;

export function buildCalendarQueryBody(range: { start: string; end: string }): string {
  const toIcsUtc = (iso: string) => {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
  };
  return `<?xml version="1.0" encoding="UTF-8"?>
<calendar-query xmlns="urn:ietf:params:xml:ns:caldav" xmlns:D="DAV:">
  <D:prop>
    <D:getetag/>
    <calendar-data/>
  </D:prop>
  <filter>
    <comp-filter name="VCALENDAR">
      <comp-filter name="VEVENT">
        <time-range start="${toIcsUtc(range.start)}" end="${toIcsUtc(range.end)}"/>
      </comp-filter>
    </comp-filter>
  </filter>
</calendar-query>`;
}

/** Extracts `<current-user-principal><href>` from a PROPFIND response. */
export function parsePrincipalHref(xml: string): string | null {
  const doc = parser.parse(xml);
  const responses = ensureArray(doc?.multistatus?.response);
  for (const response of responses) {
    const propstats = ensureArray(response?.propstat);
    for (const propstat of propstats) {
      const href = propstat?.prop?.['current-user-principal']?.href;
      if (href) return textOf(href);
    }
  }
  return null;
}

/** Extracts `<calendar-home-set><href>` from a PROPFIND response. */
export function parseCalendarHomeHref(xml: string): string | null {
  const doc = parser.parse(xml);
  const responses = ensureArray(doc?.multistatus?.response);
  for (const response of responses) {
    const propstats = ensureArray(response?.propstat);
    for (const propstat of propstats) {
      const href = propstat?.prop?.['calendar-home-set']?.href;
      if (href) return textOf(href);
    }
  }
  return null;
}

export interface RawCalendarListing {
  href: string;
  displayName: string;
  color: string | null;
}

/** Lists child calendar collections from a PROPFIND (Depth:1) on the calendar-home-set. */
export function parseCalendarList(xml: string): RawCalendarListing[] {
  const doc = parser.parse(xml);
  const responses = ensureArray(doc?.multistatus?.response);
  const calendars: RawCalendarListing[] = [];

  for (const response of responses) {
    const href = textOf(response?.href);
    const propstats = ensureArray(response?.propstat);
    for (const propstat of propstats) {
      const prop = propstat?.prop;
      if (!prop) continue;
      const resourceType = prop.resourcetype;
      const isCalendar = resourceType && Object.prototype.hasOwnProperty.call(resourceType, 'calendar');
      if (!isCalendar) continue;
      calendars.push({
        href,
        displayName: textOf(prop.displayname) || href,
        color: prop['calendar-color'] ? textOf(prop['calendar-color']) : null,
      });
    }
  }
  return calendars;
}

export interface RawEventResource {
  href: string;
  etag: string | null;
  calendarData: string;
}

/** Extracts each event resource's href + raw ICS text from a calendar-query REPORT response. */
export function parseCalendarQueryResponse(xml: string): RawEventResource[] {
  const doc = parser.parse(xml);
  const responses = ensureArray(doc?.multistatus?.response);
  const resources: RawEventResource[] = [];

  for (const response of responses) {
    const href = textOf(response?.href);
    const propstats = ensureArray(response?.propstat);
    for (const propstat of propstats) {
      const prop = propstat?.prop;
      const calendarData = prop?.['calendar-data'];
      if (!calendarData) continue;
      resources.push({
        href,
        etag: prop.getetag ? textOf(prop.getetag) : null,
        calendarData: textOf(calendarData),
      });
    }
  }
  return resources;
}
