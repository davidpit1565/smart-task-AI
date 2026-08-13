/**
 * Microsoft identity platform OAuth (implicit flow) via a popup + a static
 * redirect page (public/outlook-auth-callback.html) — no MSAL dependency and
 * no backend, mirroring the same "no secret ever leaves the browser"
 * approach as Google's GIS token flow (see googleIdentityLoader.ts).
 *
 * Requires a Microsoft Entra ID (Azure AD) App Registration Client ID (a
 * public, non-secret value) configured via VITE_MICROSOFT_CLIENT_ID — see
 * README for the exact Azure setup steps.
 */

const AUTHORIZE_ENDPOINT = 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize';
const SCOPE = 'openid email profile Calendars.ReadWrite';

export function readMicrosoftClientId(): string | null {
  const id = import.meta.env.VITE_MICROSOFT_CLIENT_ID;
  return typeof id === 'string' && id.length > 0 ? id : null;
}

interface OutlookAuthMessage {
  source: 'outlook-auth';
  accessToken?: string;
  error?: string;
}

function isOutlookAuthMessage(data: unknown): data is OutlookAuthMessage {
  return typeof data === 'object' && data !== null && (data as { source?: unknown }).source === 'outlook-auth';
}

export function authenticateWithPopup(): Promise<string> {
  const clientId = readMicrosoftClientId();
  if (!clientId) {
    return Promise.reject(
      new Error(
        "Outlook Calendar isn't configured yet — this app needs a Microsoft Entra ID App Client ID (VITE_MICROSOFT_CLIENT_ID env var). See README for the exact Azure setup steps.",
      ),
    );
  }

  const redirectUri = `${window.location.origin}/outlook-auth-callback.html`;
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'token',
    redirect_uri: redirectUri,
    scope: SCOPE,
    response_mode: 'fragment',
    prompt: 'select_account',
  });

  const popup = window.open(`${AUTHORIZE_ENDPOINT}?${params}`, 'outlook-auth', 'width=480,height=640');
  if (!popup) return Promise.reject(new Error('Popup was blocked — allow popups for this site to sign in with Outlook.'));

  return new Promise<string>((resolve, reject) => {
    let settled = false;

    function cleanup() {
      window.removeEventListener('message', onMessage);
      window.clearInterval(closedCheck);
    }

    function onMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin || !isOutlookAuthMessage(event.data)) return;
      settled = true;
      cleanup();
      if (event.data.accessToken) resolve(event.data.accessToken);
      else reject(new Error(event.data.error ?? 'Microsoft sign-in failed.'));
    }

    const closedCheck = window.setInterval(() => {
      if (popup.closed && !settled) {
        cleanup();
        reject(new Error('Microsoft sign-in was cancelled.'));
      }
    }, 500);

    window.addEventListener('message', onMessage);
  });
}
