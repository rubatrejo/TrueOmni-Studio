import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';

import { LOCALE_LABELS } from '@/lib/i18n';
import { LOCALE_CODE_REGEX } from '@/lib/studio/locale-catalog';
import { type Locale } from '@/lib/studio/schema';

/**
 * `GET  /api/studio/i18n/translate`  → `{ available, provider }` para que el
 *                                       editor sepa si mostrar el botón ✨.
 * `POST /api/studio/i18n/translate`  → traduce un string.
 *
 * Body POST: `{ text, fromLocale, toLocale, context?, key? }`.
 * Devuelve: `{ translation, model, provider }`.
 *
 * Provider precedence:
 *   1. DeepL Free  (DEEPL_API_KEY) — gratis 500k chars/mes, calidad superior
 *      para EN/ES/FR/DE/PT/JA. Preserva placeholders `{xxx}` con XML tags.
 *   2. Anthropic   (ANTHROPIC_API_KEY) — fallback. Soporta cualquier locale
 *      ISO incluso fuera del catálogo de DeepL.
 *   3. 503         si ninguna key está configurada.
 *
 * Si DeepL falla (rate limit, 4xx) y Anthropic está configurado, hacemos
 * automatic fallback. El operador no ve el switch — solo el resultado.
 */

const ANTHROPIC_MODEL = 'claude-haiku-4-5';
const ANTHROPIC_MAX_TOKENS = 256;

const DEEPL_ENDPOINT = 'https://api-free.deepl.com/v2/translate';

/**
 * Locales que DeepL Free soporta. Cualquier otro locale cae al fallback de
 * Anthropic. Mapping a los códigos exactos que DeepL espera (algunos llevan
 * sufijo regional, ej. `EN-US`, `PT-BR`).
 */
const DEEPL_TARGET_MAP: Record<string, string> = {
  en: 'EN-US',
  es: 'ES',
  fr: 'FR',
  de: 'DE',
  pt: 'PT-BR',
  ja: 'JA',
  it: 'IT',
  nl: 'NL',
  pl: 'PL',
  ru: 'RU',
  zh: 'ZH',
  ko: 'KO',
  tr: 'TR',
  uk: 'UK',
  cs: 'CS',
  da: 'DA',
  el: 'EL',
  fi: 'FI',
  hu: 'HU',
  id: 'ID',
  no: 'NB',
  ro: 'RO',
  sk: 'SK',
  sv: 'SV',
};

const ANTHROPIC_SYSTEM_PROMPT = `You are a professional UI translator for a public-facing kiosk that runs at hotels, airports, and museums. Translate the user's text to the requested locale.

Rules:
- Output ONLY the translated text. No quotes, no explanations, no labels, no markdown.
- Keep placeholders like {client_name}, {date}, {count} verbatim.
- Keep newlines (\\n) verbatim — they map to literal line breaks in the kiosk UI.
- Match the source's tone (concise, action-driven). Don't add filler.
- For UI labels and CTAs, prefer 1-3 words.
- For Japanese, use polite-but-modern register (です・ます style).
- For German/French, use formal address (Sie / vous).
- If the source is already in the target locale, return it unchanged.`;

export async function GET() {
  const hasDeepL = !!process.env.DEEPL_API_KEY;
  const hasAnthropic = !!process.env.ANTHROPIC_API_KEY;
  return NextResponse.json({
    available: hasDeepL || hasAnthropic,
    provider: hasDeepL ? 'deepl' : hasAnthropic ? 'anthropic' : null,
  });
}

export async function POST(req: Request) {
  const hasDeepL = !!process.env.DEEPL_API_KEY;
  const hasAnthropic = !!process.env.ANTHROPIC_API_KEY;

  if (!hasDeepL && !hasAnthropic) {
    return NextResponse.json(
      {
        error:
          'No translation provider configured. Set DEEPL_API_KEY (preferred) or ANTHROPIC_API_KEY in .env.local and restart the dev server.',
      },
      { status: 503 },
    );
  }

  let body: {
    text?: string;
    fromLocale?: string;
    toLocale?: string;
    context?: string;
    key?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

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
    return NextResponse.json({
      translation: body.text,
      model: 'noop',
      provider: 'noop',
    });
  }

  // Try DeepL first (preferred — free + high quality for kiosk locales).
  if (hasDeepL && DEEPL_TARGET_MAP[body.toLocale]) {
    try {
      const translation = await translateWithDeepL({
        text: body.text,
        fromLocale: body.fromLocale,
        toLocale: body.toLocale,
      });
      return NextResponse.json({
        translation,
        model: 'deepl-free',
        provider: 'deepl',
      });
    } catch (err) {
      console.error('[i18n/translate] DeepL failed, trying Anthropic fallback:', err);
      if (!hasAnthropic) {
        const message = err instanceof Error ? err.message : 'DeepL request failed';
        return NextResponse.json({ error: message }, { status: 502 });
      }
      // fall through to Anthropic
    }
  }

  // Fallback: Anthropic.
  if (hasAnthropic) {
    try {
      const translation = await translateWithAnthropic({
        text: body.text,
        fromLocale: body.fromLocale,
        toLocale: body.toLocale,
        context: body.context,
        key: body.key,
      });
      return NextResponse.json({
        translation,
        model: ANTHROPIC_MODEL,
        provider: 'anthropic',
      });
    } catch (error) {
      console.error('[i18n/translate] Anthropic failed:', error);
      const message = error instanceof Error ? error.message : 'Translate failed';
      const status = message.includes('401') || message.includes('authentication') ? 401 : 500;
      return NextResponse.json({ error: message }, { status });
    }
  }

  // Sólo se llega aquí si DeepL no soporta el locale y Anthropic no está set.
  return NextResponse.json(
    {
      error: `DeepL does not support target locale '${body.toLocale}'. Configure ANTHROPIC_API_KEY for broader locale coverage.`,
    },
    { status: 400 },
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  DeepL implementation                                                     */
/* ────────────────────────────────────────────────────────────────────────── */

async function translateWithDeepL({
  text,
  fromLocale,
  toLocale,
}: {
  text: string;
  fromLocale: Locale;
  toLocale: Locale;
}): Promise<string> {
  // Mask placeholders {xxx} con XML tags <x id="N">…</x> + ignore_tags=x.
  // DeepL no traduce el contenido de los tags ignorados, lo que preserva
  // {client_name}, {count}, etc. Después restauramos.
  const placeholders: string[] = [];
  const masked = text.replace(/\{[^}]+\}/g, (match) => {
    const idx = placeholders.length;
    placeholders.push(match);
    return `<x id="${idx}"/>`;
  });

  const target = DEEPL_TARGET_MAP[toLocale] ?? toLocale.toUpperCase();
  const source = (fromLocale.slice(0, 2) || 'en').toUpperCase();

  const params = new URLSearchParams({
    text: masked,
    target_lang: target,
    source_lang: source,
    preserve_formatting: '1',
    tag_handling: 'xml',
    ignore_tags: 'x',
    split_sentences: 'nonewlines',
  });

  const res = await fetch(DEEPL_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `DeepL-Auth-Key ${process.env.DEEPL_API_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
    cache: 'no-store',
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`DeepL ${res.status}: ${errText.slice(0, 200) || res.statusText}`);
  }

  const data = (await res.json()) as {
    translations?: Array<{ text: string; detected_source_language: string }>;
  };
  const translated = data.translations?.[0]?.text;
  if (!translated) throw new Error('DeepL returned empty translation');

  // Restore placeholders. Si DeepL devolvió self-closing <x id="N"/>, no
  // traerá contenido, así que hacemos match laxo.
  return translated.replace(/<x id="(\d+)"\s*\/?>(?:[^<]*<\/x>)?/g, (_, idx) => {
    const i = parseInt(idx, 10);
    return placeholders[i] ?? '';
  });
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Anthropic implementation (fallback)                                      */
/* ────────────────────────────────────────────────────────────────────────── */

async function translateWithAnthropic({
  text,
  fromLocale,
  toLocale,
  context,
  key,
}: {
  text: string;
  fromLocale: Locale;
  toLocale: Locale;
  context?: string;
  key?: string;
}): Promise<string> {
  const fromName = LOCALE_LABELS[fromLocale] ?? fromLocale;
  const toName = LOCALE_LABELS[toLocale] ?? toLocale;

  const userParts: string[] = [`Translate the following ${fromName} UI string to ${toName}.`];
  if (key) userParts.push(`Key: ${key}`);
  if (context) userParts.push(`Context: ${context}`);
  userParts.push(`Source (${fromName}):`, text);

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const response = await client.messages.create({
    model: ANTHROPIC_MODEL,
    max_tokens: ANTHROPIC_MAX_TOKENS,
    system: [
      {
        type: 'text',
        text: ANTHROPIC_SYSTEM_PROMPT,
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
    throw new Error('No text content in Anthropic response.');
  }
  return block.text.trim();
}

function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && LOCALE_CODE_REGEX.test(value);
}
