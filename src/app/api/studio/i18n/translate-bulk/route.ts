import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';

import { LOCALE_LABELS } from '@/lib/i18n';
import { LOCALE_CODE_REGEX } from '@/lib/studio/locale-catalog';
import { type Locale } from '@/lib/studio/schema';

/**
 * `POST /api/studio/i18n/translate-bulk`
 *
 * Traduce múltiples strings en una sola llamada — útil para "Auto-translate
 * missing keys in {locale}" del Languages editor.
 *
 * Body: `{ fromLocale, toLocale, items: [{ key, text, context? }] }`
 * Response: `{ translations: [{ key, translation, error? }], provider }`
 *
 * Backend: DeepL Free preferido (un único request con múltiples `text=`
 * params; la API devuelve un array en orden). Anthropic como fallback con
 * requests paralelas concurrent-limited.
 *
 * Hard limit 50 items por request para no saturar el provider en kiosks
 * con catálogos enormes — el cliente debe trocear.
 */

const MAX_ITEMS = 50;
const ANTHROPIC_MODEL = 'claude-haiku-4-5';
const DEEPL_ENDPOINT = 'https://api-free.deepl.com/v2/translate';

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

interface BulkItem {
  key: string;
  text: string;
  context?: string;
}

interface BulkResult {
  key: string;
  translation?: string;
  error?: string;
}

export async function POST(req: Request) {
  const hasDeepL = !!process.env.DEEPL_API_KEY;
  const hasAnthropic = !!process.env.ANTHROPIC_API_KEY;

  if (!hasDeepL && !hasAnthropic) {
    return NextResponse.json(
      {
        error:
          'No translation provider configured. Set DEEPL_API_KEY or ANTHROPIC_API_KEY in .env.local.',
      },
      { status: 503 },
    );
  }

  let body: { fromLocale?: string; toLocale?: string; items?: BulkItem[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  if (!isLocale(body.fromLocale) || !isLocale(body.toLocale)) {
    return NextResponse.json(
      { error: '`fromLocale` and `toLocale` must be valid ISO 639-1 codes.' },
      { status: 400 },
    );
  }
  if (!Array.isArray(body.items) || body.items.length === 0) {
    return NextResponse.json({ error: '`items` array is required.' }, { status: 400 });
  }
  if (body.items.length > MAX_ITEMS) {
    return NextResponse.json(
      { error: `Max ${MAX_ITEMS} items per request. Got ${body.items.length}.` },
      { status: 400 },
    );
  }
  if (body.fromLocale === body.toLocale) {
    return NextResponse.json({
      translations: body.items.map((it) => ({ key: it.key, translation: it.text })),
      provider: 'noop',
    });
  }

  // DeepL preferred — un solo network request para todos los items.
  if (hasDeepL && DEEPL_TARGET_MAP[body.toLocale]) {
    try {
      const translations = await translateBulkDeepL({
        items: body.items,
        fromLocale: body.fromLocale,
        toLocale: body.toLocale,
      });
      return NextResponse.json({ translations, provider: 'deepl' });
    } catch (err) {
      console.error('[translate-bulk] DeepL failed, trying Anthropic:', err);
      if (!hasAnthropic) {
        const message = err instanceof Error ? err.message : 'DeepL bulk failed';
        return NextResponse.json({ error: message }, { status: 502 });
      }
      // fall through
    }
  }

  // Anthropic fallback con concurrency 5.
  if (hasAnthropic) {
    try {
      const translations = await translateBulkAnthropic({
        items: body.items,
        fromLocale: body.fromLocale,
        toLocale: body.toLocale,
      });
      return NextResponse.json({ translations, provider: 'anthropic' });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Anthropic bulk failed';
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  return NextResponse.json(
    {
      error: `DeepL does not support target locale '${body.toLocale}' and Anthropic is not configured.`,
    },
    { status: 400 },
  );
}

/* ────────────────────────────────────────────────────────────────────────── */

async function translateBulkDeepL({
  items,
  fromLocale,
  toLocale,
}: {
  items: BulkItem[];
  fromLocale: Locale;
  toLocale: Locale;
}): Promise<BulkResult[]> {
  // Mask placeholders por item, mantener el placeholder map por index.
  const placeholderMaps: string[][] = [];
  const masked = items.map((it) => {
    const phs: string[] = [];
    const m = it.text.replace(/\{[^}]+\}/g, (match) => {
      const idx = phs.length;
      phs.push(match);
      return `<x id="${idx}"/>`;
    });
    placeholderMaps.push(phs);
    return m;
  });

  const target = DEEPL_TARGET_MAP[toLocale] ?? toLocale.toUpperCase();
  const source = (fromLocale.slice(0, 2) || 'en').toUpperCase();

  const params = new URLSearchParams();
  for (const text of masked) params.append('text', text);
  params.set('target_lang', target);
  params.set('source_lang', source);
  params.set('preserve_formatting', '1');
  params.set('tag_handling', 'xml');
  params.set('ignore_tags', 'x');
  params.set('split_sentences', 'nonewlines');

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
    translations?: Array<{ text: string }>;
  };
  const translated = data.translations ?? [];
  if (translated.length !== items.length) {
    throw new Error(
      `DeepL returned ${translated.length} translations, expected ${items.length}`,
    );
  }

  return items.map((it, i) => {
    const phs = placeholderMaps[i] ?? [];
    const restored = (translated[i]!.text ?? '').replace(
      /<x id="(\d+)"\s*\/?>(?:[^<]*<\/x>)?/g,
      (_, idx) => phs[parseInt(idx, 10)] ?? '',
    );
    return { key: it.key, translation: restored };
  });
}

async function translateBulkAnthropic({
  items,
  fromLocale,
  toLocale,
}: {
  items: BulkItem[];
  fromLocale: Locale;
  toLocale: Locale;
}): Promise<BulkResult[]> {
  const fromName = LOCALE_LABELS[fromLocale] ?? fromLocale;
  const toName = LOCALE_LABELS[toLocale] ?? toLocale;
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const SYSTEM = `You are a professional UI translator for a kiosk. Translate from ${fromName} to ${toName}. Output ONLY the translation. Keep placeholders {x} verbatim. Match tone (concise, action-driven).`;

  // Concurrency 5 to avoid rate limits.
  const results: BulkResult[] = new Array(items.length);
  const queue = items.map((it, i) => ({ ...it, _idx: i }));
  const workers = Array.from({ length: Math.min(5, queue.length) }, async () => {
    while (queue.length > 0) {
      const it = queue.shift();
      if (!it) break;
      try {
        const response = await client.messages.create({
          model: ANTHROPIC_MODEL,
          max_tokens: 256,
          system: [{ type: 'text', text: SYSTEM, cache_control: { type: 'ephemeral' } }],
          messages: [
            {
              role: 'user',
              content:
                (it.context ? `Context: ${it.context}\n\n` : '') +
                `Source (${fromName}):\n${it.text}`,
            },
          ],
        });
        const block = response.content.find((b) => b.type === 'text');
        const translation = block && block.type === 'text' ? block.text.trim() : '';
        results[it._idx] = { key: it.key, translation };
      } catch (err) {
        results[it._idx] = {
          key: it.key,
          error: err instanceof Error ? err.message : 'translate failed',
        };
      }
    }
  });
  await Promise.all(workers);
  return results;
}

function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && LOCALE_CODE_REGEX.test(value);
}
