/* Vercel serverless function — POST /api/claude
 *
 * Body  : { prompt: string }
 * Reply : { text: string } on 200, { error: string } otherwise
 *
 * The Anthropic API key NEVER ships to the client — Vite only inlines vars
 * prefixed with VITE_. This file reads `ANTHROPIC_API_KEY` from the server
 * environment (Vercel project settings) and is invoked over HTTP.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic(); // reads ANTHROPIC_API_KEY from env

const SYSTEM = `Tu es la voix éditoriale de TripTailor : sobre, sensuelle, jamais commerciale. Tu réponds en français, en 3 phrases courtes maximum, comme une note de carnet de voyage. Pas d'emojis. Pas d'introduction. Pas de "Voici" ni "Bien sûr".`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const prompt = (req.body as { prompt?: unknown })?.prompt;
  if (typeof prompt !== 'string' || prompt.trim().length === 0) {
    return res.status(400).json({ error: 'Missing or invalid `prompt`' });
  }
  if (prompt.length > 2000) {
    return res.status(413).json({ error: '`prompt` too long (max 2000 chars)' });
  }

  try {
    const message = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 400,
      system: SYSTEM,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = message.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map(b => b.text)
      .join('')
      .trim();

    return res.status(200).json({ text });
  } catch (err) {
    if (err instanceof Anthropic.RateLimitError) {
      return res.status(429).json({ error: 'Rate limited — réessayez dans un instant.' });
    }
    if (err instanceof Anthropic.APIError) {
      console.error('[/api/claude] APIError', err.status, err.message);
      return res.status(err.status ?? 502).json({ error: 'Erreur côté Claude.' });
    }
    console.error('[/api/claude] unknown error', err);
    return res.status(500).json({ error: 'Erreur interne.' });
  }
}
