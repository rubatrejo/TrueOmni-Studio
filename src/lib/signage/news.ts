import 'server-only';

import type { SignageNewsConfig, SignageNewsItem } from './schema';

/**
 * Resuelve los items de news del cliente signage según el `source.kind`:
 *   - `manual`: devuelve `source.items` tal cual
 *   - `rss`:    fetch del feed RSS, parsea `<item>` nodes y mapea
 *   - `api`:    fetch del endpoint JSON, espera `{ items: [...] }`
 *
 * Cacheado a 5 min vía Next `revalidate` para no martillar feeds externos.
 * Errores devuelven array vacío + warn en server console.
 */

const CACHE_SECONDS = 300;

export async function resolveNewsItems(config: SignageNewsConfig): Promise<SignageNewsItem[]> {
  const src = config.source;

  if (src.kind === 'manual') {
    return src.items;
  }

  if (src.kind === 'rss') {
    try {
      const res = await fetch(src.url, { next: { revalidate: CACHE_SECONDS } });
      if (!res.ok) throw new Error(`rss ${res.status}`);
      const xml = await res.text();
      const items = parseRssItems(xml, src.maxItems ?? 10);
      return items;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('[signage:news] rss fetch falló:', (err as Error).message);
      return [];
    }
  }

  if (src.kind === 'api') {
    try {
      const res = await fetch(src.url, {
        headers: src.headers,
        next: { revalidate: CACHE_SECONDS },
      });
      if (!res.ok) throw new Error(`api ${res.status}`);
      const data = (await res.json()) as { items?: SignageNewsItem[] };
      const items = Array.isArray(data.items) ? data.items : [];
      const max = src.maxItems ?? items.length;
      return items.slice(0, max);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('[signage:news] api fetch falló:', (err as Error).message);
      return [];
    }
  }

  return [];
}

/**
 * Parser simple de RSS (suficiente para feeds estándar). Extrae <item> nodes
 * y mapea title / description / pubDate. Strip HTML básico de la descripción.
 */
function parseRssItems(xml: string, max: number): SignageNewsItem[] {
  const items: SignageNewsItem[] = [];
  const itemRe = /<item\b[^>]*>([\s\S]*?)<\/item>/gi;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = itemRe.exec(xml)) !== null && i < max) {
    const inner = m[1] ?? '';
    const title = stripCData(extractTag(inner, 'title')).trim();
    const description = stripHtml(stripCData(extractTag(inner, 'description'))).trim();
    const pubDate = extractTag(inner, 'pubDate').trim();
    const link = extractTag(inner, 'link').trim();
    if (!title || !description) continue;
    items.push({
      id: `rss-${i}`,
      title,
      body: description,
      publishedAt: pubDate || undefined,
      url: link || undefined,
    });
    i++;
  }
  return items;
}

function extractTag(xml: string, tag: string): string {
  const re = new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
  return (xml.match(re)?.[1] ?? '').trim();
}

function stripCData(s: string): string {
  return s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1');
}

function stripHtml(s: string): string {
  return s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
}
