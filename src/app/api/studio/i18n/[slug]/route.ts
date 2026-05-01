import { NextResponse } from 'next/server';

import { loadLocale } from '@/lib/i18n-server';
import { kv, kvKeys } from '@/lib/studio/kv';
import {
  I18nBundleSchema,
  LOCALES,
  defaultI18nBundle,
  type I18nBundle,
  type Locale,
} from '@/lib/studio/schema';

/** Hard cap to keep KV values comfortably under the 512 KB Upstash limit. */
const KV_VALUE_BYTE_CAP = 480_000;

/**
 * `/api/studio/i18n/[slug]`
 *
 *   GET   → devuelve el bundle de i18n del slug. Si no existe en KV, hace
 *           bootstrap leyendo `clients/<slug>/i18n/<locale>.json`. Fallback
 *           a `clients/_template/i18n/<locale>.json`.
 *   PATCH → reemplaza el bundle completo (`{ bundle }`) o aplica un parche
 *           parcial (`{ patch: { locale: { key: value } } }`). Cap 480KB.
 */

type RouteParams = { params: Promise<{ slug: string }> };

export async function GET(_req: Request, { params }: RouteParams) {
  const { slug } = await params;
  try {
    const stored = await kv.get<I18nBundle>(kvKeys.i18n(slug));
    if (stored) {
      const parsed = I18nBundleSchema.safeParse(stored);
      if (parsed.success) {
        return NextResponse.json({ bundle: parsed.data });
      }
      // valor en KV corrupto — caemos al bootstrap
    }
    const bootstrapped = await bootstrapBundleFromFs(slug);
    return NextResponse.json({ bundle: bootstrapped });
  } catch (error) {
    console.error('[api/studio/i18n GET]', error);
    return NextResponse.json({ error: 'Failed to load i18n bundle' }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: RouteParams) {
  const { slug } = await params;
  try {
    const body = (await req.json()) as
      | { bundle?: unknown; patch?: Record<string, Record<string, string>> };

    const current =
      (await kv.get<I18nBundle>(kvKeys.i18n(slug))) ?? (await bootstrapBundleFromFs(slug));

    let nextBundle: I18nBundle;
    if (body.bundle !== undefined) {
      nextBundle = current; // start from current, then validate + replace
      const parsed = I18nBundleSchema.safeParse(body.bundle);
      if (!parsed.success) {
        return NextResponse.json(
          { error: 'Invalid bundle', details: parsed.error.flatten() },
          { status: 400 },
        );
      }
      nextBundle = parsed.data;
    } else if (body.patch && typeof body.patch === 'object') {
      const merged = mergeBundle(current, body.patch);
      const parsed = I18nBundleSchema.safeParse(merged);
      if (!parsed.success) {
        return NextResponse.json(
          { error: 'Invalid patch', details: parsed.error.flatten() },
          { status: 400 },
        );
      }
      nextBundle = parsed.data;
    } else {
      return NextResponse.json(
        { error: 'Body must include `bundle` or `patch`' },
        { status: 400 },
      );
    }

    const serialized = JSON.stringify(nextBundle);
    if (serialized.length > KV_VALUE_BYTE_CAP) {
      return NextResponse.json(
        {
          error: `Bundle exceeds cap (${serialized.length} bytes > ${KV_VALUE_BYTE_CAP}).`,
        },
        { status: 413 },
      );
    }

    await kv.set(kvKeys.i18n(slug), nextBundle);
    return NextResponse.json({ bundle: nextBundle });
  } catch (error) {
    console.error('[api/studio/i18n PATCH]', error);
    return NextResponse.json({ error: 'Failed to save i18n bundle' }, { status: 500 });
  }
}

/* ──────────────────────────────────────────────────────────────────────── */
/*  Helpers                                                                 */
/* ──────────────────────────────────────────────────────────────────────── */

async function bootstrapBundleFromFs(slug: string): Promise<I18nBundle> {
  // Solo bootstrappeamos los DEFAULT_LOCALES desde filesystem. Los locales
  // custom añadidos por el operador viven en KV exclusivamente hasta el
  // primer publish (donde se escriben como nuevos archivos i18n/<loc>.json).
  const bundle: I18nBundle = defaultI18nBundle();
  const targets: Array<[Locale, string]> = LOCALES.map((loc) => [loc, slug]);
  for (const [locale, s] of targets) {
    const fromClient = await loadLocale(s, locale);
    if (Object.keys(fromClient).length > 0) {
      bundle[locale] = fromClient;
      continue;
    }
    const fromTemplate = await loadLocale('_template', locale);
    bundle[locale] = fromTemplate; // puede ser {} si tampoco existe; aceptable
  }
  return bundle;
}

function mergeBundle(
  current: I18nBundle,
  patch: Record<string, Record<string, string>>,
): I18nBundle {
  // Spread dinámico — soporta locales custom además de los 6 default.
  const next: I18nBundle = {};
  for (const loc of Object.keys(current)) {
    next[loc] = { ...current[loc] };
  }
  // Si el patch trae locales nuevos (operador añadió un idioma), inicializa.
  for (const loc of Object.keys(patch)) {
    if (!next[loc]) next[loc] = {};
  }
  for (const locale of Object.keys(next)) {
    const localePatch = patch[locale];
    if (!localePatch || typeof localePatch !== 'object') continue;
    for (const [key, value] of Object.entries(localePatch)) {
      if (value === undefined || value === null) {
        delete next[locale][key];
      } else if (typeof value === 'string') {
        next[locale][key] = value;
      }
    }
  }
  return next;
}
