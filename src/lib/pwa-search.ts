import type { KioskConfig } from './config';
import { resolvePwaTileRoute } from './pwa-routes';

/** Item unificado del índice de búsqueda de la PWA. */
export interface PwaSearchItem {
  id: string;
  type: 'place' | 'event' | 'section';
  title: string;
  subtitle: string;
  image?: string;
  /** Ruta destino al tocar el resultado. Ausente = no navegable (C2). */
  href?: string;
}

/** Categorías de `home.listings` que tienen página de detalle `/pwa/{category}/{slug}`. */
const DETAIL_MODULES = new Set([
  'restaurants',
  'things-to-do',
  'stay',
  'trails',
  'events',
  'tickets',
]);

interface IndexLabels {
  section: string;
  event: string;
}

const titleCase = (key: string) =>
  key
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();

/** "2026-04-30" → "Thu 30" (parse local para no desfasar por timezone). */
function shortDate(date: string): string {
  const [y, m, d] = date.split('-').map(Number);
  if (!y || !m || !d) return '';
  const dt = new Date(y, m - 1, d);
  const wd = dt.toLocaleDateString('en-US', { weekday: 'short' });
  return `${wd} ${d}`;
}

/**
 * Aplana la config a un índice buscable mock (sin backend): secciones del dashboard PWA,
 * listings del Home y eventos. Se construye server-side y se pasa al cliente.
 */
export function buildSearchIndex(config: KioskConfig, labels: IndexLabels): PwaSearchItem[] {
  const items: PwaSearchItem[] = [];

  // Secciones del dashboard PWA (tiles + quick access). El href reutiliza el mismo
  // resolvedor config-driven que el Dashboard (C1) → `""` queda no navegable.
  const dash = config.features?.pwa?.dashboard;
  for (const t of dash?.tiles ?? []) {
    const route = resolvePwaTileRoute(t);
    items.push({
      id: `section-${t.key}`,
      type: 'section',
      title: t.label,
      subtitle: labels.section,
      image: t.image,
      href: route || undefined,
    });
  }
  for (const q of dash?.quickAccess ?? []) {
    if (items.some((it) => it.title.toLowerCase() === q.label.toLowerCase())) continue;
    const route = resolvePwaTileRoute(q);
    items.push({
      id: `quick-${q.key}`,
      type: 'section',
      title: q.label,
      subtitle: labels.section,
      image: q.image,
      href: route || undefined,
    });
  }

  // Listings del Home (restaurants / things to do / stay). `category` ya es el moduleSlug.
  for (const l of config.features?.home?.listings ?? []) {
    items.push({
      id: `place-${l.slug}`,
      type: 'place',
      title: l.title,
      subtitle: titleCase(l.category),
      image: l.image,
      href: DETAIL_MODULES.has(l.category) ? `/pwa/${l.category}/${l.slug}` : undefined,
    });
  }

  // Eventos (módulo con kind 'events').
  const modules = config.features?.home?.modules ?? {};
  for (const mod of Object.values(modules)) {
    if (mod && typeof mod === 'object' && 'kind' in mod && mod.kind === 'events') {
      for (const e of mod.events ?? []) {
        const when = shortDate(e.date);
        items.push({
          id: `event-${e.slug}`,
          type: 'event',
          title: e.title,
          subtitle: when ? `${labels.event} · ${when}` : labels.event,
          image: e.image,
          href: `/pwa/events/${e.slug}`,
        });
      }
    }
  }

  return items;
}

/** Filtro mock: substring case-insensitive sobre título (prioriza prefijo) + subtítulo. */
export function filterSearchIndex(
  index: PwaSearchItem[],
  query: string,
  limit = 20,
): PwaSearchItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const matches = index.filter(
    (it) => it.title.toLowerCase().includes(q) || it.subtitle.toLowerCase().includes(q),
  );
  matches.sort((a, b) => {
    const ap = a.title.toLowerCase().startsWith(q) ? 0 : 1;
    const bp = b.title.toLowerCase().startsWith(q) ? 0 : 1;
    return ap - bp;
  });
  return matches.slice(0, limit);
}
