import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';

/**
 * `POST /api/studio/ai/suggest` — genera N items para un módulo de contenido
 * (#26 audit). Útil para poblar un kiosk nuevo en 1 click sin que el operador
 * tenga que escribir 10 listings/events/deals a mano.
 *
 * Body: `{ kind, count, city, state, exclude? }`.
 * Response: `{ items: Array<{slug, title, description, address, tags?, _aiGenerated: true}>, tokensUsed }`.
 *
 * Provider: Anthropic Claude (clave reusada del módulo Tavus / i18n translate).
 * Si la clave no está set → 503 con mensaje claro.
 *
 * Rate limit: confiamos en Anthropic + el cap de count (max 10 items / req).
 */

const ANTHROPIC_MODEL = 'claude-haiku-4-5';
const MAX_ITEMS = 10;
const MIN_ITEMS = 1;

type SuggestKind = 'restaurants' | 'things-to-do' | 'stay' | 'events' | 'deals';
const VALID_KINDS: SuggestKind[] = ['restaurants', 'things-to-do', 'stay', 'events', 'deals'];

interface SuggestedItem {
  slug: string;
  title: string;
  description: string;
  address: string;
  tags?: string[];
  _aiGenerated: true;
}

const SYSTEM_PROMPT = `You generate plausible UI seed content for a tourism kiosk. The operator will review every item before adding to the kiosk; your job is to produce items that look real, not actual real businesses.

Rules:
- Always output a single JSON array, no prose, no markdown fences.
- Each item: { "slug": "kebab-case-slug", "title": "Title Case Name", "description": "1-2 sentences, 80-160 chars", "address": "Number Street, City, ST 12345", "tags": ["short","array","optional"] }.
- Slugs lowercase, kebab-case, no special chars, max 60 chars, unique within the array.
- Address format: "{number} {street}, {city}, {state} {zip}". Use the city/state the operator gave you.
- Descriptions: action-driven, no marketing fluff. Max 160 chars.
- Tags (optional): 0-3 short keywords ("brunch", "dog-friendly", "family"). All lowercase.
- For 'restaurants': vary cuisines. For 'things-to-do': mix outdoor/indoor/family. For 'stay': hotel/B&B/airbnb-style. For 'events': pick titles that fit the city's vibe. For 'deals': "% off X at Y" style titles.
- Never use real brand names without making clear it's example data ("Acme Diner" style).
- Never duplicate slugs from the exclude list provided by the user.`;

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      {
        error:
          'AI suggestions require ANTHROPIC_API_KEY. Set it in .env.local and restart.',
      },
      { status: 503 },
    );
  }

  let body: {
    kind?: string;
    count?: number;
    city?: string;
    state?: string;
    exclude?: string[];
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!body.kind || !VALID_KINDS.includes(body.kind as SuggestKind)) {
    return NextResponse.json(
      { error: `kind must be one of: ${VALID_KINDS.join(', ')}` },
      { status: 400 },
    );
  }
  const count = Math.max(MIN_ITEMS, Math.min(MAX_ITEMS, Math.round(body.count ?? 5)));
  const city = (body.city ?? '').trim();
  const state = (body.state ?? '').trim();
  if (!city || !state) {
    return NextResponse.json({ error: 'city and state are required' }, { status: 400 });
  }
  const exclude = Array.isArray(body.exclude) ? body.exclude.slice(0, 100) : [];

  const userPrompt = [
    `Generate ${count} ${body.kind} items for a kiosk in ${city}, ${state}.`,
    exclude.length > 0
      ? `Exclude these slugs (already exist in this kiosk): ${exclude.join(', ')}`
      : null,
    'Output only the JSON array.',
  ]
    .filter(Boolean)
    .join('\n');

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const res = await client.messages.create({
      model: ANTHROPIC_MODEL,
      max_tokens: 2048,
      system: [
        {
          type: 'text',
          text: SYSTEM_PROMPT,
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: [{ role: 'user', content: userPrompt }],
    });
    const textBlock = res.content.find((b) => b.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      return NextResponse.json(
        { error: 'Anthropic returned no text content' },
        { status: 502 },
      );
    }
    const items = parseAndValidate(textBlock.text, body.kind as SuggestKind, exclude);
    if (items.length === 0) {
      return NextResponse.json(
        { error: 'AI returned no parseable items. Try again.' },
        { status: 502 },
      );
    }
    return NextResponse.json({
      items,
      tokensUsed: res.usage.input_tokens + res.usage.output_tokens,
    });
  } catch (err) {
    console.error('[ai/suggest] failed:', err);
    const message = err instanceof Error ? err.message : 'AI request failed';
    const status = message.includes('401') ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

/** Parsea el array que Anthropic devolvió, valida shape, dedupe contra
 *  exclude. Tolerante a basura around (markdown fences, prosa, etc.). */
function parseAndValidate(
  raw: string,
  _kind: SuggestKind,
  exclude: string[],
): SuggestedItem[] {
  // Strip code fences si llegan.
  const cleaned = raw
    .replace(/^[\s\S]*?```(?:json)?/i, '')
    .replace(/```[\s\S]*$/, '')
    .trim();
  // Si no había fences, intentamos parsear el raw.
  const candidates = [cleaned, raw];
  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate) as unknown;
      if (!Array.isArray(parsed)) continue;
      const excludeSet = new Set(exclude);
      const seenSlugs = new Set<string>();
      const valid: SuggestedItem[] = [];
      for (const item of parsed) {
        if (!item || typeof item !== 'object') continue;
        const o = item as Record<string, unknown>;
        const slug = typeof o.slug === 'string' ? o.slug.trim() : '';
        const title = typeof o.title === 'string' ? o.title.trim() : '';
        const description = typeof o.description === 'string' ? o.description.trim() : '';
        const address = typeof o.address === 'string' ? o.address.trim() : '';
        if (!slug || !title || !description || !address) continue;
        if (!/^[a-z0-9][a-z0-9-]{0,62}[a-z0-9]?$/.test(slug)) continue;
        if (excludeSet.has(slug) || seenSlugs.has(slug)) continue;
        seenSlugs.add(slug);
        const tags = Array.isArray(o.tags)
          ? o.tags.filter((t): t is string => typeof t === 'string').slice(0, 5)
          : undefined;
        valid.push({ slug, title, description, address, tags, _aiGenerated: true });
      }
      return valid;
    } catch {
      // probar siguiente candidato
    }
  }
  return [];
}
