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
  path: string;
  headers?: Record<string, string>;
  body?: string | null;
  email: string;
  password: string;
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
  if (!payload.path.startsWith('/')) {
    res.status(400).json({ error: 'path must be an absolute path on caldav.icloud.com.' });
    return;
  }

  const authHeader = 'Basic ' + Buffer.from(`${payload.email}:${payload.password}`).toString('base64');

  try {
    const upstream = await fetch(`${CALDAV_ORIGIN}${payload.path}`, {
      method: payload.method,
      headers: {
        ...payload.headers,
        Authorization: authHeader,
      },
      body: payload.body ?? undefined,
    });

    const text = await upstream.text();
    const headers: Record<string, string> = {};
    upstream.headers.forEach((value, key) => {
      headers[key] = value;
    });

    if (upstream.status === 401) {
      res.status(401).json({ error: 'Apple rejected the iCloud email/app-specific password.' });
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
