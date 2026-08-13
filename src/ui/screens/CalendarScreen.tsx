import { useState, type CSSProperties, type FormEvent } from 'react';
import type { CalendarEvent, ConnectedCalendar } from '@/core/calendar/calendarEvent.types';
import type { CalendarConnection } from '@/data/db';
import { useTranslation } from '@/i18n/LanguageContext';
import { CalendarIcon } from '@/ui/icons';

interface CalendarScreenProps {
  connections: CalendarConnection[];
  connectedCalendars: ConnectedCalendar[];
  events: CalendarEvent[];
  connecting: boolean;
  error: string | null;
  onConnectApple(email: string, appSpecificPassword: string): Promise<void>;
  onDisconnectApple(): Promise<void>;
  onSync(): Promise<void>;
  onToggleCalendar(calendarId: string, enabled: boolean): void;
  onConvertToTask(event: CalendarEvent): void;
}

export function CalendarScreen({
  connections,
  connectedCalendars,
  events,
  connecting,
  error,
  onConnectApple,
  onDisconnectApple,
  onSync,
  onToggleCalendar,
  onConvertToTask,
}: CalendarScreenProps) {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [syncing, setSyncing] = useState(false);

  const appleConnection = connections.find((c) => c.providerType === 'apple');
  const appleCalendars = connectedCalendars.filter((c) => c.providerType === 'apple');

  const fieldStyle: CSSProperties = {
    width: '100%',
    padding: '9px 11px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--color-border)',
    background: 'var(--color-bg)',
    color: 'var(--color-text)',
    fontSize: 14,
  };

  async function handleConnect(e: FormEvent) {
    e.preventDefault();
    await onConnectApple(email, password);
    setPassword('');
  }

  async function handleSync() {
    setSyncing(true);
    try {
      await onSync();
    } finally {
      setSyncing(false);
    }
  }

  const upcoming = [...events]
    .filter((e) => new Date(e.end).getTime() >= Date.now())
    .sort((a, b) => a.start.localeCompare(b.start));

  const groupedByDay = new Map<string, CalendarEvent[]>();
  for (const event of upcoming) {
    const day = event.start.slice(0, 10);
    const list = groupedByDay.get(day) ?? [];
    list.push(event);
    groupedByDay.set(day, list);
  }

  return (
    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 20 }}>
      <h1 style={{ fontSize: 23, margin: 0 }}>{t('calendar.title')}</h1>

      <section
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-card)',
          padding: 18,
        }}
      >
        {appleConnection ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 14, color: 'var(--color-text)' }}>
                {t('calendar.connectedAs', { email: appleConnection.accountLabel })}
              </span>
              <button
                type="button"
                onClick={() => onDisconnectApple()}
                style={{ background: 'none', border: 'none', color: 'var(--color-danger)', fontSize: 13, cursor: 'pointer' }}
              >
                {t('calendar.disconnect')}
              </button>
            </div>

            {appleCalendars.length > 0 && (
              <div>
                <div style={{ fontSize: 11.5, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--color-text-faint)', marginBottom: 6 }}>
                  {t('calendar.calendars')}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {appleCalendars.map((cal) => (
                    <label key={cal.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
                      <input type="checkbox" checked={cal.enabled} onChange={(e) => onToggleCalendar(cal.id, e.target.checked)} />
                      <span aria-hidden="true" style={{ width: 8, height: 8, borderRadius: '50%', background: cal.color }} />
                      {cal.displayName}
                    </label>
                  ))}
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={handleSync}
              disabled={syncing}
              style={{
                alignSelf: 'flex-start',
                padding: '8px 14px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                background: 'none',
                color: 'var(--color-text)',
                fontSize: 13,
                cursor: syncing ? 'default' : 'pointer',
              }}
            >
              {syncing ? t('calendar.syncing') : t('calendar.sync')}
            </button>
          </div>
        ) : (
          <form onSubmit={handleConnect} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <CalendarIcon width={18} height={18} />
              <span style={{ fontSize: 15, fontWeight: 600 }}>{t('calendar.connectApple.title')}</span>
            </div>
            <p style={{ fontSize: 12.5, color: 'var(--color-text-muted)', margin: 0, lineHeight: 1.5 }}>
              {t('calendar.connectApple.description')}
            </p>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('calendar.connectApple.email')}
              style={fieldStyle}
            />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('calendar.connectApple.password')}
              style={fieldStyle}
            />
            {error && <p style={{ color: 'var(--color-danger)', fontSize: 12.5, margin: 0 }}>{error}</p>}
            <button
              type="submit"
              disabled={connecting}
              style={{
                alignSelf: 'flex-start',
                padding: '9px 16px',
                borderRadius: 'var(--radius-md)',
                border: 'none',
                background: 'var(--color-accent)',
                color: 'var(--color-accent-contrast)',
                fontWeight: 600,
                fontSize: 13,
                cursor: connecting ? 'default' : 'pointer',
              }}
            >
              {connecting ? t('calendar.connectApple.connecting') : t('calendar.connectApple.connect')}
            </button>
          </form>
        )}
      </section>

      <section
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          padding: 18,
          opacity: 0.55,
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{t('calendar.google.title')}</div>
        <p style={{ fontSize: 12.5, color: 'var(--color-text-muted)', margin: 0 }}>{t('calendar.google.comingSoon')}</p>
      </section>
      <section
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          padding: 18,
          opacity: 0.55,
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{t('calendar.outlook.title')}</div>
        <p style={{ fontSize: 12.5, color: 'var(--color-text-muted)', margin: 0 }}>{t('calendar.outlook.comingSoon')}</p>
      </section>

      {appleConnection && (
        <section>
          <div style={{ fontSize: 13.5, fontWeight: 650, letterSpacing: '0.02em', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: 8 }}>
            {t('calendar.upcoming')}
          </div>
          {upcoming.length === 0 ? (
            <p style={{ color: 'var(--color-text-muted)', fontSize: 13.5 }}>{t('calendar.noEvents')}</p>
          ) : (
            [...groupedByDay.entries()].map(([day, dayEvents]) => (
              <div key={day} style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12.5, color: 'var(--color-text-faint)', marginBottom: 4 }}>{day}</div>
                {dayEvents.map((event) => (
                  <div
                    key={event.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 10,
                      padding: '10px 4px',
                      borderBottom: '1px solid var(--color-border)',
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 14.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{event.title}</div>
                      <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                        {event.allDay ? '' : `${event.start.slice(11, 16)}–${event.end.slice(11, 16)}`}
                      </div>
                    </div>
                    {!event.taskId && (
                      <button
                        type="button"
                        onClick={() => onConvertToTask(event)}
                        style={{ background: 'none', border: 'none', color: 'var(--color-accent)', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}
                      >
                        {t('calendar.convertToTask')}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ))
          )}
        </section>
      )}
    </div>
  );
}
