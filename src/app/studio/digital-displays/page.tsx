import {
  listSignageClients,
  listSignageDisplays,
  loadSignageClient,
  loadSignageTokensCss,
} from '@/lib/signage/config';

import { DisplaysDashboard } from './_components/DisplaysDashboard';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Digital Displays · TrueOmni Studio',
};

/**
 * `<DisplayCardEntry>` — Datos de una card del dashboard signage.
 *
 * Cada card representa un display individual (no un theme/client). El cliente
 * subyacente (`clientSlug`) es un detalle interno que no se muestra al usuario;
 * solo se usa para construir la URL del editor.
 */
export interface DisplayCardEntry {
  clientSlug: string;
  clientName: string;
  displaySlug: string;
  displayName: string;
  slidesCount: number;
  brandPrimary: string;
  brandSecondary: string;
  brandAccent: string;
  logoUrl: string | null;
  isReserved: boolean;
}

/**
 * `/studio/digital-displays` — Único punto de entrada del editor signage.
 *
 * Listado plano de displays cross-clients. Cada display = una card; click
 * abre el display editor en `/digital-displays/[client]/displays/[display]`.
 *
 * Botón "+ New display" en el header + card "+" al final del grid (mismo
 * patrón visual que el kiosks dashboard).
 */
export default async function DigitalDisplaysPage() {
  const clients = await listSignageClients();
  const cards: DisplayCardEntry[] = [];

  for (const c of clients) {
    const [resolved, displays, tokensCss] = await Promise.all([
      loadSignageClient(c.slug).catch(() => null),
      listSignageDisplays(c.slug),
      loadSignageTokensCss(c.slug).catch(() => ''),
    ]);
    if (!resolved) continue;
    const branding = resolved.branding;
    const baseTokens = parseTokensCssMap(tokensCss);
    const overrides = branding.tokens ?? {};
    const tok = (key: string, fallback: string): string =>
      overrides[key] ?? baseTokens[key] ?? fallback;
    const logoRaw = branding.logos?.default ?? null;
    const logoUrl = logoRaw
      ? logoRaw.startsWith('http') || logoRaw.startsWith('/')
        ? logoRaw
        : `/signage-assets/${c.slug}/${logoRaw}`
      : null;
    for (const d of displays) {
      cards.push({
        clientSlug: c.slug,
        clientName: resolved.name,
        displaySlug: d.slug,
        displayName: d.name,
        slidesCount: d.slidesCount,
        brandPrimary: `hsl(${tok('brand-primary', '211 100% 25%')})`,
        brandSecondary: `hsl(${tok('brand-secondary', '200 100% 50%')})`,
        brandAccent: `hsl(${tok('brand-accent', '35 92% 55%')})`,
        logoUrl,
        isReserved: c.slug === 'default' && d.slug === 'lobby-tv',
      });
    }
  }

  // Sort: reserved first (default-lobby-tv), then alphabetical by display name.
  cards.sort((a, b) => {
    if (a.isReserved && !b.isReserved) return -1;
    if (!a.isReserved && b.isReserved) return 1;
    return a.displayName.localeCompare(b.displayName);
  });

  return <DisplaysDashboard cards={cards} />;
}

/** Parsea tokens.css en `{ <key sin --signage->: <value> }`. */
function parseTokensCssMap(css: string): Record<string, string> {
  const result: Record<string, string> = {};
  const declRegex = /--signage-([a-z0-9-]+)\s*:\s*([^;]+);/gi;
  let m: RegExpExecArray | null;
  while ((m = declRegex.exec(css)) !== null) {
    result[m[1]] = m[2].trim();
  }
  return result;
}
