import type { VercelRequest, VercelResponse } from '@vercel/node';
// Relative import, not the "@/" alias — Vercel's function bundler isn't
// guaranteed to resolve tsconfig path aliases the way Vite does for the client build.
import { extractBreakdownSubtasks, MAX_BREAKDOWN_SUBTASKS } from '../../src/core/aiBreakdown';

/**
 * Task breakdown: given a task's title/description, ask Claude for a short
 * list of concrete subtask titles. The API key never reaches the browser —
 * this function is the only thing that calls Anthropic. If ANTHROPIC_API_KEY
 * isn't configured, it returns a clear "not configured" error (501) rather
 * than fabricating suggestions; the client surfaces that honestly instead of
 * faking a working AI feature. Nothing returned here is ever applied to the
 * task automatically — the caller always shows a preview and lets the user
 * accept or reject each suggestion.
 */

const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-haiku-4-5-20251001';
const MAX_TITLE_LENGTH = 300;
const MAX_DESCRIPTION_LENGTH = 4000;

interface BreakdownRequestBody {
  title: string;
  description?: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(501).json({
      error: "AI features aren't configured yet — this app needs an Anthropic API key (ANTHROPIC_API_KEY env var). See README for setup steps.",
    });
    return;
  }

  const payload = req.body as BreakdownRequestBody;
  const title = payload?.title?.trim();
  if (!title) {
    res.status(400).json({ error: 'Missing required field: title.' });
    return;
  }
  if (title.length > MAX_TITLE_LENGTH || (payload.description?.length ?? 0) > MAX_DESCRIPTION_LENGTH) {
    res.status(400).json({ error: 'title or description is too long.' });
    return;
  }

  const description = payload.description?.trim() ?? '';
  const prompt = [
    `Break this task down into ${MAX_BREAKDOWN_SUBTASKS} or fewer concrete, actionable subtasks.`,
    `Task title: ${title}`,
    description ? `Task description: ${description}` : null,
    `Respond with ONLY a JSON object of the exact shape {"subtasks": ["...", "..."]} — no other text, no markdown fences.`,
  ]
    .filter(Boolean)
    .join('\n');

  try {
    const upstream = await fetch(ANTHROPIC_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 512,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!upstream.ok) {
      const body = await upstream.text();
      res.status(502).json({ error: `AI request failed (HTTP ${upstream.status}): ${body.slice(0, 200)}` });
      return;
    }

    const data = (await upstream.json()) as { content?: Array<{ type: string; text?: string }> };
    const text = data.content?.find((block) => block.type === 'text')?.text;
    if (!text) {
      res.status(502).json({ error: 'AI response had no text content.' });
      return;
    }

    const subtasks = extractBreakdownSubtasks(text);
    res.status(200).json({ subtasks });
  } catch (error) {
    res.status(502).json({ error: error instanceof Error ? error.message : 'Failed to reach the AI provider.' });
  }
}
