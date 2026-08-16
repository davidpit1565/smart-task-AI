/**
 * Deep-link contract for this app — the one place that defines what a URL
 * into the app can mean. Consumed today by:
 *  - the PWA's own install shortcuts (long-press the home screen icon)
 *  - the Web Share Target registration in the manifest (Android/ChromeOS
 *    today; iOS Safari doesn't support share_target yet)
 * and by design the same contract a native wrapper (Capacitor) would call
 * into via `window.location` — see docs/NATIVE_SHELL_CONTRACT.md.
 */

const VALID_SCREENS = ['today', 'inbox', 'calendar', 'projects', 'more'] as const;
export type DeepLinkScreen = (typeof VALID_SCREENS)[number];

export interface ShareTargetPayload {
  title: string;
  text: string;
  url: string;
}

export interface DeepLinkAction {
  screen?: DeepLinkScreen;
  taskId?: string;
  shareTarget?: ShareTargetPayload;
}

export function parseDeepLink(search: string): DeepLinkAction {
  const params = new URLSearchParams(search);
  const result: DeepLinkAction = {};

  const screen = params.get('screen');
  if (screen && (VALID_SCREENS as readonly string[]).includes(screen)) {
    result.screen = screen as DeepLinkScreen;
  }

  const taskId = params.get('task');
  if (taskId) result.taskId = taskId;

  const title = params.get('title') ?? '';
  const text = params.get('text') ?? '';
  const url = params.get('url') ?? '';
  if (title || text || url) {
    result.shareTarget = { title, text, url };
  }

  return result;
}

/** Never silently drops shared content — whatever the OS share sheet sent ends up somewhere in the new task. */
export function shareTargetToTaskInput(shareTarget: ShareTargetPayload): { title: string; description: string } {
  const title = shareTarget.title || shareTarget.text || shareTarget.url || 'Shared item';
  const descriptionParts = [shareTarget.text, shareTarget.url].filter((part) => part && part !== title);
  return { title, description: descriptionParts.join('\n') };
}
