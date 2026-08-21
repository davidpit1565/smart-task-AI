import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Stateless proxy to Apple's iCloud CalDAV server. Exists only because
 * caldav.icloud.com does not send CORS headers, so the browser can't call
 * it directly. This function never stores or logs credentials — it reads
 * email/password from the request body, builds a single Basic Auth header,
 * forwards one request to Apple, and returns the response. Nothing is
 * persisted server-side.
 */

const CALDAV_ORIGIN = 'https://caldav.icloud.com';
const ALLOWED_METHODS = new Set(['PROPFIND', 'REPORT', 'PUT', 'DELETE', 'GET']);

interface ProxyRequestBody {
  method: string;
  /** Either an absolute path on caldav.icloud.com ("/1234/calendars/"), or a
   *  full https URL on an *.icloud.com host — the latter only for following
   *  Apple's account-sharding redirect (pNN-caldav.icloud.com), never
   *  client-supplied for the initial request. */
  path: string;
  headers?: Record<string, string>;
  body?: string | null;
  email: string;
  password: string;
}

function resolveTargetUrl(path: string): URL | null {
  try {
    const url = path.startsWith('/') ? new URL(path, CALDAV_ORIGIN) : new URL(path);
    // Only ever talk to Apple's iCloud CalDAV hosts (this includes the
    // pNN-caldav.icloud.com shards Apple redirects to) — never an arbitrary
    // host, so this proxy can't be turned into an open SSRF relay.
    if (url.protocol !== 'https:' || !/(^|\.)icloud\.com$/i.test(url.hostname)) return null;
    return url;
  } catch {
    return null;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const payload = req.body as ProxyRequestBody;
  if (!payload?.method || !payload.path || !payload.email || !payload.password) {
    res.status(400).json({ error: 'Missing required fields (method, path, email, password).' });
    return;
  }
  if (!ALLOWED_METHODS.has(payload.method)) {
    res.status(400).json({ error: `Unsupported CalDAV method: ${payload.method}` });
    return;
  }
  const targetUrl = resolveTargetUrl(payload.path);
  if (!targetUrl) {
    res.status(400).json({ error: 'path must be an absolute path, or a full URL, on an icloud.com host.' });
    return;
  }

  const authHeader = 'Basic ' + Buffer.from(`${payload.email}:${payload.password}`).toString('base64');

  try {
    const upstream = await fetch(targetUrl, {
      method: payload.method,
      redirect: 'manual',
      headers: {
        ...payload.headers,
        Authorization: authHeader,
        // Apple's CalDAV service has been observed treating requests with no/generic
        // User-Agent as bot traffic. A descriptive one is standard CalDAV client practice.
        'User-Agent': 'Unknot/1.0 (+https://smart-task-ai.vercel.app) CalDAV-Client',
      },
      body: payload.body ?? undefined,
    });

    const text = await upstream.text();
    const headers: Record<string, string> = {};
    upstream.headers.forEach((value, key) => {
      headers[key] = value;
    });

    // Apple shards CalDAV across per-account hosts (pNN-caldav.icloud.com) and
    // signals the right one via a redirect. Node's fetch won't auto-follow a
    // 301/302 for PROPFIND/REPORT (it would silently downgrade to GET and drop
    // the XML body), so surface the redirect target for the client to retry.
    if (upstream.status >= 300 && upstream.status < 400) {
      const location = headers['location'] ?? null;
      const resolvedRedirect = location ? resolveTargetUrl(location) : null;
      res.status(200).json({ status: upstream.status, body: text, headers, redirectedTo: resolvedRedirect?.toString() ?? null });
      return;
    }

    if (upstream.status === 401) {
      res.status(401).json({
        error: 'Apple rejected the iCloud email/app-specific password.',
        status: 401,
        // Truncated diagnostics, not logged anywhere server-side — only returned
        // to the same request that sent the credentials, to help tell "wrong
        // credentials" apart from "Apple blocked this request for another reason."
        wwwAuthenticate: headers['www-authenticate'] ?? null,
        bodySnippet: text.slice(0, 300),
      });
      return;
    }
    if (upstream.status >= 400) {
      res.status(upstream.status).json({ error: `Apple Calendar returned HTTP ${upstream.status}.`, status: upstream.status, body: text, headers });
      return;
    }

    res.status(200).json({ status: upstream.status, body: text, headers });
  } catch (error) {
    res.status(502).json({ error: error instanceof Error ? error.message : 'Failed to reach Apple Calendar.' });
  }
}
