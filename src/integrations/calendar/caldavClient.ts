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

interface CaldavProxyPayload extends CaldavResponse {
  error?: string;
  wwwAuthenticate?: string | null;
  bodySnippet?: string;
  redirectedTo?: string | null;
}

const CALDAV_ORIGIN = 'https://caldav.icloud.com';
const MAX_REDIRECTS = 3;

export async function caldavRequest(
  credentials: CaldavCredentials,
  method: 'PROPFIND' | 'REPORT' | 'PUT' | 'DELETE' | 'GET',
  path: string,
  options: { headers?: Record<string, string>; body?: string } = {},
  redirectCount = 0,
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

  let data: CaldavProxyPayload | null = null;
  try {
    data = await res.json();
  } catch {
    // Non-JSON response (e.g. a 404 from a misconfigured or unreachable proxy) — fall through below.
  }

  if (!data) {
    throw new Error(`Apple Calendar request failed (HTTP ${res.status} ${res.statusText}).`);
  }

  if (!res.ok) {
    if (res.status === 401) {
      const hint = data.wwwAuthenticate ? ` Apple said: ${data.wwwAuthenticate}.` : '';
      throw new Error(
        `${data.error ?? 'Apple rejected the iCloud email/app-specific password.'}${hint} ` +
          'Generate a fresh app-specific password at appleid.apple.com (Sign-In and Security → App-Specific Passwords) and paste it in exactly, with the dashes.',
      );
    }
    throw new Error(data.error ?? `Apple Calendar request failed (HTTP ${res.status}).`);
  }

  // Apple shards CalDAV across per-account hosts and signals the right one via
  // a redirect; the proxy can't safely auto-follow a PROPFIND/REPORT redirect
  // (fetch would downgrade it to GET and drop the XML body), so follow it here instead.
  if (data.status >= 300 && data.status < 400) {
    if (!data.redirectedTo) {
      throw new Error(`Apple redirected this request but gave no usable destination (HTTP ${data.status}).`);
    }
    if (redirectCount >= MAX_REDIRECTS) {
      throw new Error('Too many redirects while talking to Apple Calendar.');
    }
    return caldavRequest(credentials, method, data.redirectedTo, options, redirectCount + 1);
  }

  return data;
}

export function calendarOrigin(): string {
  return CALDAV_ORIGIN;
}
