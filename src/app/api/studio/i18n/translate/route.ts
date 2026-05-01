import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';

import { LOCALE_LABELS } from '@/lib/i18n';
import { LOCALE_CODE_REGEX } from '@/lib/studio/locale-catalog';
import { type Locale } from '@/lib/studio/schema';

/**
 * `GET  /api/studio/i18n/translate`  → `{ available: boolean }` para que el
 *                                       editor sepa si mostrar el botón ✨.
 * `POST /api/studio/i18n/translate`  → traduce un string.
 *
 * Body POST: `{ text: string, fromLocale: Locale, toLocale: Locale, context?: string, key?: string }`.
 * Devuelve: `{ translation: string, model: string }`.
 *
 * Usa Anthropic claude-haiku-4-5 con prompt caching del system prompt.
 * Si `ANTHROPIC_API_KEY` no está configurado, GET devuelve `{available:false}`
 * y POST devuelve 503 con mensaje claro.
 */

export async function GET() {
  return NextResponse.json({ available: !!process.env.ANTHROPIC_API_KEY });
}

const MODEL = 'claude-haiku-4-5';
const MAX_TOKENS = 256;

const SYSTEM_PROMPT = `You are a professional UI translator for a public-facing kiosk that runs at hotels, airports, and museums. Translate the user's text to the requested locale.

Rules:
- Output ONLY the translated text. No quotes, no explanations, no labels, no markdown.
- Keep placeholders like {client_name}, {date}, {count} verbatim.
- Keep newlines (\\n) verbatim — they map to literal line breaks in the kiosk UI.
- Match the source's tone (concise, action-driven). Don't add filler.
- For UI labels and CTAs, prefer 1-3 words.
- For Japanese, use polite-but-modern register (です・ます style).
- For German/French, use formal address (Sie / vous).
- If the source is already in the target locale, return it unchanged.`;

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      {
        error:
          'ANTHROPIC_API_KEY not set. Add it to .env.local and restart the dev server to enable AI translate.',
      },
      { status: 503 },
    );
  }

  try {
    const body = (await req.json()) as {
      text?: string;
      fromLocale?: string;
      toLocale?: string;
      context?: string;
      key?: string;
    };

    if (!body.text || typeof body.text !== 'string' || body.text.trim() === '') {
      return NextResponse.json({ error: '`text` is required.' }, { status: 400 });
    }
    if (!isLocale(body.fromLocale) || !isLocale(body.toLocale)) {
      return NextResponse.json(
        { error: '`fromLocale` and `toLocale` must be valid ISO 639-1 codes (2 lowercase letters).' },
        { status: 400 },
      );
    }
    if (body.fromLocale === body.toLocale) {
      return NextResponse.json({ translation: body.text, model: MODEL });
    }

    const fromName = LOCALE_LABELS[body.fromLocale] ?? body.fromLocale;
    const toName = LOCALE_LABELS[body.toLocale] ?? body.toLocale;

    const userParts: string[] = [
      `Translate the following ${fromName} UI string to ${toName}.`,
    ];
    if (body.key) {
      userParts.push(`Key: ${body.key}`);
    }
    if (body.context) {
      userParts.push(`Context: ${body.context}`);
    }
    userParts.push(`Source (${fromName}):`, body.text);

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const response = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: [
        {
          type: 'text',
          text: SYSTEM_PROMPT,
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: [
        {
          role: 'user',
          content: userParts.join('\n\n'),
        },
      ],
    });

    const block = response.content.find((b) => b.type === 'text');
    if (!block || block.type !== 'text') {
      return NextResponse.json(
        { error: 'No text content in model response.' },
        { status: 502 },
      );
    }
    const translation = block.text.trim();

    return NextResponse.json({ translation, model: MODEL });
  } catch (error) {
    console.error('[api/studio/i18n/translate]', error);
    const message = error instanceof Error ? error.message : 'Translate failed';
    const status = message.includes('401') || message.includes('authentication') ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && LOCALE_CODE_REGEX.test(value);
}
