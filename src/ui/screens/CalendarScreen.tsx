import { useState } from 'react';
import type { CalendarEvent, CalendarProviderType, ConnectedCalendar } from '@/core/calendar/calendarEvent.types';
import type { CalendarConnection } from '@/data/db';
import { useTranslation } from '@/i18n/LanguageContext';
import { GoogleIcon, OutlookIcon } from '@/ui/icons';

interface CalendarScreenProps {
  connections: CalendarConnection[];
  connectedCalendars: ConnectedCalendar[];
  events: CalendarEvent[];
  connecting: boolean;
  error: string | null;
  onConnectGoogle(): Promise<void>;
  onConnectOutlook(): Promise<void>;
  onDisconnectGoogle(): Promise<void>;
  onDisconnectOutlook(): Promise<void>;
  onSync(providerType: CalendarProviderType): Promise<void>;
  onToggleCalendar(calendarId: string, enabled: boolean): void;
  onConvertToTask(event: CalendarEvent): void;
}

export function CalendarScreen({
  connections,
  connectedCalendars,
  events,
  connecting,
  error,
  onConnectGoogle,
  onConnectOutlook,
  onDisconnectGoogle,
  onDisconnectOutlook,
  onSync,
  onToggleCalendar,
  onConvertToTask,
}: CalendarScreenProps) {
  const { t } = useTranslation();
  const [syncingProvider, setSyncingProvider] = useState<CalendarProviderType | null>(null);

  const googleConnection = connections.find((c) => c.providerType === 'google');
  const googleCalendars = connectedCalendars.filter((c) => c.providerType === 'google');
  const outlookConnection = connections.find((c) => c.providerType === 'outlook');
  const outlookCalendars = connectedCalendars.filter((c) => c.providerType === 'outlook');

  async function handleSync(providerType: CalendarProviderType) {
    setSyncingProvider(providerType);
    try {
      await onSync(providerType);
    } finally {
      setSyncingProvider(null);
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
      {error && <p style={{ color: 'var(--color-danger)', fontSize: 12.5, margin: 0 }}>{error}</p>}

      <section
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-card)',
          padding: 18,
        }}
      >
        {googleConnection ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 14, color: 'var(--color-text)' }}>
                {t('calendar.connectedAs', { email: googleConnection.accountLabel })}
              </span>
              <button
                type="button"
                onClick={() => onDisconnectGoogle()}
                style={{ background: 'none', border: 'none', color: 'var(--color-danger)', fontSize: 13, cursor: 'pointer' }}
              >
                {t('calendar.disconnect')}
              </button>
            </div>

            {googleCalendars.length > 0 && (
              <div>
                <div style={{ fontSize: 11.5, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--color-text-faint)', marginBottom: 6 }}>
                  {t('calendar.calendars')}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {googleCalendars.map((cal) => (
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
              onClick={() => handleSync('google')}
              disabled={syncingProvider === 'google'}
              style={{
                alignSelf: 'flex-start',
                padding: '8px 14px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                background: 'none',
                color: 'var(--color-text)',
                fontSize: 13,
                cursor: syncingProvider === 'google' ? 'default' : 'pointer',
              }}
            >
              {syncingProvider === 'google' ? t('calendar.syncing') : t('calendar.sync')}
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <GoogleIcon width={18} height={18} />
              <span style={{ fontSize: 15, fontWeight: 600 }}>{t('calendar.connectGoogle.title')}</span>
            </div>
            <p style={{ fontSize: 12.5, color: 'var(--color-text-muted)', margin: 0, lineHeight: 1.5 }}>
              {t('calendar.connectGoogle.description')}
            </p>
            <button
              type="button"
              onClick={() => onConnectGoogle()}
              disabled={connecting}
              style={{
                alignSelf: 'flex-start',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '9px 16px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border-strong)',
                background: 'var(--color-surface-raised)',
                color: 'var(--color-text)',
                fontWeight: 600,
                fontSize: 13,
                cursor: connecting ? 'default' : 'pointer',
              }}
            >
              <GoogleIcon width={16} height={16} />
              {connecting ? t('calendar.connectGoogle.connecting') : t('calendar.connectGoogle.signIn')}
            </button>
          </div>
        )}
      </section>

      <section
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-card)',
          padding: 18,
        }}
      >
        {outlookConnection ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 14, color: 'var(--color-text)' }}>
                {t('calendar.connectedAs', { email: outlookConnection.accountLabel })}
              </span>
              <button
                type="button"
                onClick={() => onDisconnectOutlook()}
                style={{ background: 'none', border: 'none', color: 'var(--color-danger)', fontSize: 13, cursor: 'pointer' }}
              >
                {t('calendar.disconnect')}
              </button>
            </div>

            {outlookCalendars.length > 0 && (
              <div>
                <div style={{ fontSize: 11.5, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--color-text-faint)', marginBottom: 6 }}>
                  {t('calendar.calendars')}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {outlookCalendars.map((cal) => (
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
              onClick={() => handleSync('outlook')}
              disabled={syncingProvider === 'outlook'}
              style={{
                alignSelf: 'flex-start',
                padding: '8px 14px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                background: 'none',
                color: 'var(--color-text)',
                fontSize: 13,
                cursor: syncingProvider === 'outlook' ? 'default' : 'pointer',
              }}
            >
              {syncingProvider === 'outlook' ? t('calendar.syncing') : t('calendar.sync')}
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <OutlookIcon width={18} height={18} />
              <span style={{ fontSize: 15, fontWeight: 600 }}>{t('calendar.connectOutlook.title')}</span>
            </div>
            <p style={{ fontSize: 12.5, color: 'var(--color-text-muted)', margin: 0, lineHeight: 1.5 }}>
              {t('calendar.connectOutlook.description')}
            </p>
            <button
              type="button"
              onClick={() => onConnectOutlook()}
              disabled={connecting}
              style={{
                alignSelf: 'flex-start',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '9px 16px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border-strong)',
                background: 'var(--color-surface-raised)',
                color: 'var(--color-text)',
                fontWeight: 600,
                fontSize: 13,
                cursor: connecting ? 'default' : 'pointer',
              }}
            >
              <OutlookIcon width={16} height={16} />
              {connecting ? t('calendar.connectOutlook.connecting') : t('calendar.connectOutlook.signIn')}
            </button>
          </div>
        )}
      </section>

      {(googleConnection || outlookConnection) && (
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
