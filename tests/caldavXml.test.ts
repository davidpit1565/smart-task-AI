import { describe, expect, it } from 'vitest';
import {
  buildCalendarQueryBody,
  parseCalendarHomeHref,
  parseCalendarList,
  parseCalendarQueryResponse,
  parsePrincipalHref,
} from '@/integrations/calendar/caldavXml';

// Fixtures modeled on Apple's documented CalDAV multistatus response shapes
// (RFC 4791 / RFC 3744), since this code can't be exercised against a live
// iCloud account in this environment.

describe('parsePrincipalHref', () => {
  it('extracts current-user-principal href', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<multistatus xmlns="DAV:">
  <response>
    <href>/</href>
    <propstat>
      <prop>
        <current-user-principal>
          <href>/1234567/principal/</href>
        </current-user-principal>
      </prop>
      <status>HTTP/1.1 200 OK</status>
    </propstat>
  </response>
</multistatus>`;
    expect(parsePrincipalHref(xml)).toBe('/1234567/principal/');
  });

  it('returns null when the property is missing', () => {
    const xml = `<multistatus xmlns="DAV:"><response><href>/</href></response></multistatus>`;
    expect(parsePrincipalHref(xml)).toBeNull();
  });
});

describe('parseCalendarHomeHref', () => {
  it('extracts calendar-home-set href (namespace-prefixed)', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<D:multistatus xmlns:D="DAV:" xmlns:C="urn:ietf:params:xml:ns:caldav">
  <D:response>
    <D:href>/1234567/principal/</D:href>
    <D:propstat>
      <D:prop>
        <C:calendar-home-set>
          <D:href>/1234567/calendars/</D:href>
        </C:calendar-home-set>
      </D:prop>
      <D:status>HTTP/1.1 200 OK</D:status>
    </D:propstat>
  </D:response>
</D:multistatus>`;
    expect(parseCalendarHomeHref(xml)).toBe('/1234567/calendars/');
  });
});

describe('parseCalendarList', () => {
  it('returns only collections whose resourcetype includes calendar', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<multistatus xmlns="DAV:" xmlns:C="urn:ietf:params:xml:ns:caldav" xmlns:A="http://apple.com/ns/ical/">
  <response>
    <href>/1234567/calendars/</href>
    <propstat>
      <prop>
        <resourcetype><collection/></resourcetype>
        <displayname>calendars</displayname>
      </prop>
      <status>HTTP/1.1 200 OK</status>
    </propstat>
  </response>
  <response>
    <href>/1234567/calendars/home/</href>
    <propstat>
      <prop>
        <resourcetype><collection/><C:calendar/></resourcetype>
        <displayname>Home</displayname>
        <A:calendar-color>#FF2D55</A:calendar-color>
      </prop>
      <status>HTTP/1.1 200 OK</status>
    </propstat>
  </response>
  <response>
    <href>/1234567/calendars/work/</href>
    <propstat>
      <prop>
        <resourcetype><collection/><C:calendar/></resourcetype>
        <displayname>Work</displayname>
      </prop>
      <status>HTTP/1.1 200 OK</status>
    </propstat>
  </response>
</multistatus>`;

    const calendars = parseCalendarList(xml);
    expect(calendars).toEqual([
      { href: '/1234567/calendars/home/', displayName: 'Home', color: '#FF2D55' },
      { href: '/1234567/calendars/work/', displayName: 'Work', color: null },
    ]);
  });
});

describe('parseCalendarQueryResponse', () => {
  it('extracts href + raw calendar-data for each event resource', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<multistatus xmlns="DAV:" xmlns:C="urn:ietf:params:xml:ns:caldav">
  <response>
    <href>/1234567/calendars/home/event1.ics</href>
    <propstat>
      <prop>
        <getetag>"abc123"</getetag>
        <C:calendar-data>BEGIN:VCALENDAR
BEGIN:VEVENT
UID:event1@icloud.com
DTSTART:20260814T140000Z
DTEND:20260814T150000Z
SUMMARY:Meeting
END:VEVENT
END:VCALENDAR</C:calendar-data>
      </prop>
      <status>HTTP/1.1 200 OK</status>
    </propstat>
  </response>
</multistatus>`;

    const resources = parseCalendarQueryResponse(xml);
    expect(resources).toHaveLength(1);
    expect(resources[0]?.href).toBe('/1234567/calendars/home/event1.ics');
    expect(resources[0]?.etag).toBe('"abc123"');
    expect(resources[0]?.calendarData).toContain('UID:event1@icloud.com');
  });
});

describe('buildCalendarQueryBody', () => {
  it('embeds the time range as UTC basic ICS datetimes', () => {
    const body = buildCalendarQueryBody({ start: '2026-08-01T00:00:00Z', end: '2026-09-01T00:00:00Z' });
    expect(body).toContain('start="20260801T000000Z"');
    expect(body).toContain('end="20260901T000000Z"');
  });
});
