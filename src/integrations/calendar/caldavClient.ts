/**
 * Talks to Apple's iCloud CalDAV server through our own `/api/caldav`
 * serverless proxy. A direct browser fetch to caldav.icloud.com is blocked
 * by CORS (Apple's CalDAV endpoints don't send Access-Control-Allow-Origin),
 * so every request round-trips through our own origin, which forwards it
 * server-side. The proxy is a stateless passthrough — it never stores the
 * credentials, it only relays them for the single request's Basic Auth
 * header, over HTTPS both hops.
 */

export interface CaldavCredentials {
  /** Full iCloud email address (also the CalDAV username). */
  email: string;
  /** An app-specific password generated at appleid.apple.com — never the main Apple ID password. */
  appSpecificPassword: string;
}

export interface CaldavResponse {
  status: number;
  body: string;
  headers: Record<string, string>;
}

const CALDAV_ORIGIN = 'https://caldav.icloud.com';

export async function caldavRequest(
  credentials: CaldavCredentials,
  method: 'PROPFIND' | 'REPORT' | 'PUT' | 'DELETE' | 'GET',
  path: string,
  options: { headers?: Record<string, string>; body?: string } = {},
): Promise<CaldavResponse> {
  const res = await fetch('/api/caldav', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      method,
      path,
      headers: options.headers ?? {},
      body: options.body ?? null,
      email: credentials.email,
      password: credentials.appSpecificPassword,
    }),
  });

  let data: (CaldavResponse & { error?: string }) | null = null;
  try {
    data = await res.json();
  } catch {
    // Non-JSON response (e.g. a 404 from a misconfigured or unreachable proxy) — fall through to the generic error below.
  }

  if (!res.ok || !data) {
    throw new Error(data?.error ?? `Apple Calendar request failed (HTTP ${res.status} ${res.statusText}).`);
  }
  return data;
}

export function calendarOrigin(): string {
  return CALDAV_ORIGIN;
}
