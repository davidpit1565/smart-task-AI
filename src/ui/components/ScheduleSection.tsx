import { useState, type CSSProperties } from 'react';
import type { Task } from '@/core/task.types';
import type { CalendarEvent } from '@/core/calendar/calendarEvent.types';
import { findAvailableSlots, findConflicts, type TimeSlot } from '@/core/calendar/scheduling';
import { useTranslation } from '@/i18n/LanguageContext';

interface ScheduleSectionProps {
  task: Task;
  calendarEvents: CalendarEvent[];
  connectedCalendarId: string | null;
  onSchedule(input: { connectedCalendarId: string; start: string; end: string }): Promise<void>;
  onUnschedule(): Promise<void>;
}

function toLocalDateTime(date: string, time: string): string {
  return `${date}T${time}:00`;
}

export function ScheduleSection({ task, calendarEvents, connectedCalendarId, onSchedule, onUnschedule }: ScheduleSectionProps) {
  const { t } = useTranslation();
  const [date, setDate] = useState(task.dueDate ?? new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState(task.dueTime ?? '09:00');
  const [duration, setDuration] = useState(task.estimatedDuration ?? 30);
  const [conflicts, setConflicts] = useState<CalendarEvent[] | null>(null);
  const [suggestions, setSuggestions] = useState<TimeSlot[] | null>(null);
  const [checked, setChecked] = useState(false);
  const [scheduling, setScheduling] = useState(false);

  const fieldStyle: CSSProperties = {
    width: '100%',
    padding: '9px 11px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--color-border)',
    background: 'var(--color-bg)',
    color: 'var(--color-text)',
    fontSize: 16,
  };
  const labelStyle: CSSProperties = {
    fontSize: 11.5,
    fontWeight: 600,
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    color: 'var(--color-text-faint)',
    marginBottom: 6,
  };

  if (task.calendarEventId && task.dueDate) {
    return (
      <div>
        <div style={labelStyle}>{t('schedule.title')}</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13.5 }}>
          <span>{t('schedule.scheduledFor', { date: task.dueDate, time: task.dueTime ?? '' })}</span>
          <button
            type="button"
            onClick={() => onUnschedule()}
            style={{ background: 'none', border: 'none', color: 'var(--color-danger)', fontSize: 13, cursor: 'pointer' }}
          >
            {t('schedule.unschedule')}
          </button>
        </div>
      </div>
    );
  }

  if (!connectedCalendarId) {
    return (
      <div>
        <div style={labelStyle}>{t('schedule.title')}</div>
        <p style={{ fontSize: 13, color: 'var(--color-text-muted)', margin: 0 }}>{t('schedule.notConnected')}</p>
      </div>
    );
  }

  function proposedSlot(): TimeSlot {
    const start = toLocalDateTime(date, time);
    const end = new Date(new Date(start).getTime() + duration * 60000).toISOString().slice(0, 19);
    return { start, end };
  }

  function checkAvailability() {
    const slot = proposedSlot();
    const found = findConflicts(slot, calendarEvents);
    setConflicts(found);
    setSuggestions(found.length > 0 ? findAvailableSlots(date, duration, calendarEvents) : null);
    setChecked(true);
  }

  async function confirmSchedule(slot: TimeSlot) {
    if (!connectedCalendarId) return;
    setScheduling(true);
    try {
      await onSchedule({ connectedCalendarId, start: slot.start, end: slot.end });
    } finally {
      setScheduling(false);
    }
  }

  async function applySuggestedSlot(slot: TimeSlot) {
    setDate(slot.start.slice(0, 10));
    setTime(slot.start.slice(11, 16));
    await confirmSchedule(slot);
  }

  return (
    <div>
      <div style={labelStyle}>{t('schedule.title')}</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 10 }}>
        <input
          type="date"
          value={date}
          onChange={(e) => {
            setDate(e.target.value);
            setChecked(false);
          }}
          style={fieldStyle}
        />
        <input
          type="time"
          value={time}
          onChange={(e) => {
            setTime(e.target.value);
            setChecked(false);
          }}
          style={fieldStyle}
        />
        <input
          type="number"
          min={5}
          step={5}
          value={duration}
          onChange={(e) => {
            setDuration(Number(e.target.value));
            setChecked(false);
          }}
          style={fieldStyle}
        />
      </div>

      {!checked ? (
        <button
          type="button"
          onClick={checkAvailability}
          style={{ padding: '8px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'none', color: 'var(--color-text)', fontSize: 13, cursor: 'pointer' }}
        >
          {t('schedule.checkAvailability')}
        </button>
      ) : conflicts && conflicts.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <p style={{ color: 'var(--color-danger)', fontSize: 13, margin: 0 }}>
            {t('schedule.conflictsFound', { count: conflicts.length })}
          </p>
          {suggestions && suggestions.length > 0 && (
            <div>
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 4 }}>{t('schedule.suggestedSlots')}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {suggestions.map((slot) => (
                  <button
                    key={slot.start}
                    type="button"
                    disabled={scheduling}
                    onClick={() => applySuggestedSlot(slot)}
                    style={{
                      padding: '6px 10px',
                      borderRadius: 999,
                      border: '1px solid var(--color-accent)',
                      background: 'var(--color-accent-soft)',
                      color: 'var(--color-accent)',
                      fontSize: 12.5,
                      cursor: 'pointer',
                    }}
                  >
                    {slot.start.slice(11, 16)}–{slot.end.slice(11, 16)}
                  </button>
                ))}
              </div>
            </div>
          )}
          <button
            type="button"
            disabled={scheduling}
            onClick={() => confirmSchedule(proposedSlot())}
            style={{ alignSelf: 'flex-start', padding: '8px 14px', borderRadius: 'var(--radius-md)', border: 'none', background: 'var(--color-accent)', color: 'var(--color-accent-contrast)', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
          >
            {t('schedule.scheduleAnyway')}
          </button>
        </div>
      ) : (
        <button
          type="button"
          disabled={scheduling}
          onClick={() => confirmSchedule(proposedSlot())}
          style={{ padding: '8px 14px', borderRadius: 'var(--radius-md)', border: 'none', background: 'var(--color-accent)', color: 'var(--color-accent-contrast)', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
        >
          {t('schedule.confirm')}
        </button>
      )}
    </div>
  );
}
