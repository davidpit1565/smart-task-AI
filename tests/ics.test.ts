import { describe, expect, it } from 'vitest';
import { parseIcsEvents, serializeIcsEvent } from '@/integrations/calendar/ics';

describe('parseIcsEvents', () => {
  it('parses a timed VEVENT with UTC times', () => {
    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'BEGIN:VEVENT',
      'UID:abc-123@icloud.com',
      'DTSTAMP:20260810T120000Z',
      'DTSTART:20260814T140000Z',
      'DTEND:20260814T150000Z',
      'SUMMARY:Team sync',
      'LOCATION:Zoom',
      'DESCRIPTION:Weekly sync call',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const events = parseIcsEvents(ics);
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      uid: 'abc-123@icloud.com',
      summary: 'Team sync',
      location: 'Zoom',
      description: 'Weekly sync call',
      start: '2026-08-14T14:00:00Z',
      end: '2026-08-14T15:00:00Z',
      allDay: false,
      rrule: null,
    });
  });

  it('parses an all-day VEVENT (VALUE=DATE)', () => {
    const ics = [
      'BEGIN:VCALENDAR',
      'BEGIN:VEVENT',
      'UID:allday-1@icloud.com',
      'DTSTART;VALUE=DATE:20260901',
      'DTEND;VALUE=DATE:20260902',
      'SUMMARY:Company holiday',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const [event] = parseIcsEvents(ics);
    expect(event?.allDay).toBe(true);
    expect(event?.start).toBe('2026-09-01T00:00:00');
  });

  it('unescapes commas, semicolons, and \\n within text fields', () => {
    const ics = [
      'BEGIN:VCALENDAR',
      'BEGIN:VEVENT',
      'UID:escape-1@icloud.com',
      'DTSTART:20260814T140000Z',
      'DTEND:20260814T150000Z',
      'SUMMARY:Line one\\, still one line',
      'DESCRIPTION:First line\\nSecond line',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const [event] = parseIcsEvents(ics);
    expect(event?.summary).toBe('Line one, still one line');
    expect(event?.description).toBe('First line\nSecond line');
  });

  it('unfolds a property value wrapped across continuation lines', () => {
    const ics = [
      'BEGIN:VCALENDAR',
      'BEGIN:VEVENT',
      'UID:fold-1@icloud.com',
      'DTSTART:20260814T140000Z',
      'DTEND:20260814T150000Z',
      'SUMMARY:This is a long summary that got',
      ' wrapped onto a continuation line',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const [event] = parseIcsEvents(ics);
    expect(event?.summary).toBe('This is a long summary that gotwrapped onto a continuation line');
  });

  it('parses a recurring event and keeps RRULE opaque', () => {
    const ics = [
      'BEGIN:VCALENDAR',
      'BEGIN:VEVENT',
      'UID:recur-1@icloud.com',
      'DTSTART:20260814T140000Z',
      'DTEND:20260814T150000Z',
      'SUMMARY:Standup',
      'RRULE:FREQ=DAILY;COUNT=10',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const [event] = parseIcsEvents(ics);
    expect(event?.rrule).toBe('FREQ=DAILY;COUNT=10');
  });

  it('parses multiple VEVENTs in one document', () => {
    const ics = [
      'BEGIN:VCALENDAR',
      'BEGIN:VEVENT',
      'UID:one@icloud.com',
      'DTSTART:20260814T140000Z',
      'DTEND:20260814T150000Z',
      'SUMMARY:One',
      'END:VEVENT',
      'BEGIN:VEVENT',
      'UID:two@icloud.com',
      'DTSTART:20260815T140000Z',
      'DTEND:20260815T150000Z',
      'SUMMARY:Two',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    expect(parseIcsEvents(ics).map((e) => e.uid)).toEqual(['one@icloud.com', 'two@icloud.com']);
  });
});

describe('serializeIcsEvent', () => {
  it('round-trips a timed event through serialize -> parse', () => {
    const ics = serializeIcsEvent({
      uid: 'round-trip-1@smart-tasks-ai',
      summary: 'Finish presentation',
      description: 'Slides for the board',
      location: 'Office',
      start: '2026-08-14T14:00:00Z',
      end: '2026-08-14T15:00:00Z',
    });

    const [parsed] = parseIcsEvents(ics);
    expect(parsed).toMatchObject({
      uid: 'round-trip-1@smart-tasks-ai',
      summary: 'Finish presentation',
      description: 'Slides for the board',
      location: 'Office',
      start: '2026-08-14T14:00:00Z',
      end: '2026-08-14T15:00:00Z',
      allDay: false,
    });
  });

  it('round-trips an all-day event', () => {
    const ics = serializeIcsEvent({
      uid: 'allday-rt@smart-tasks-ai',
      summary: 'Vacation',
      start: '2026-09-01T00:00:00Z',
      end: '2026-09-02T00:00:00Z',
      allDay: true,
    });

    const [parsed] = parseIcsEvents(ics);
    expect(parsed?.allDay).toBe(true);
    expect(parsed?.start).toBe('2026-09-01T00:00:00');
  });

  it('escapes special characters in text fields', () => {
    const ics = serializeIcsEvent({
      uid: 'escape-1@smart-tasks-ai',
      summary: 'Comma, semicolon; and\nnewline',
      start: '2026-08-14T14:00:00Z',
      end: '2026-08-14T15:00:00Z',
    });
    expect(ics).toContain('SUMMARY:Comma\\, semicolon\\; and\\nnewline');
  });
});
