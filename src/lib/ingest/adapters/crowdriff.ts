import type { FeedAdapter, FeedTestResult, ProviderConfig } from '../types';

/**
 * Adaptador de Crowdriff.
 *
 * HONESTIDAD DELIBERADA: Crowdriff NO es un feed de listings/events
 * estructurados, sino una plataforma de UGC (contenido generado por usuarios) y
 * galerías de imágenes. Su valor real es el *enriquecimiento de imágenes*: hacer
 * matching de assets visuales contra listings que ya existen (por nombre, tag o
 * geolocalización).
 *
 * Ese matching queda como FASE FUTURA. Por eso `fetch()` devuelve listas vacías
 * de forma intencionada (no inventamos listings a partir de fotos). Lo único que
 * se deja listo es `parseCrowdriffAssets`, el parser puro de la galería, para
 * cuando se implemente el enriquecimiento.
 */

// ---------------------------------------------------------------------------
//  Helpers puros de narrowing
// ---------------------------------------------------------------------------

function asString(value: unknown): string | undefined {
  if (typeof value === 'string') {
    const t = value.trim();
    return t === '' ? undefined : t;
  }
  return undefined;
}

/** Saca el array de assets de las envolturas comunes de Crowdriff. */
function extractArray(json: unknown): Record<string, unknown>[] {
  let candidate: unknown = json;
  if (json && typeof json === 'object' && !Array.isArray(json)) {
    const obj = json as Record<string, unknown>;
    candidate = obj.assets ?? obj.media ?? obj.data ?? obj.results ?? json;
  }
  if (!Array.isArray(candidate)) return [];
  return candidate.filter(
    (entry): entry is Record<string, unknown> =>
      entry != null && typeof entry === 'object' && !Array.isArray(entry),
  );
}

/** Normaliza los tags a string[] (acepta array de strings o de objetos `{name|tag}`). */
function parseTags(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const tags: string[] = [];
  for (const entry of value) {
    if (typeof entry === 'string') {
      const t = entry.trim();
      if (t) tags.push(t);
    } else if (entry && typeof entry === 'object') {
      const obj = entry as Record<string, unknown>;
      const t = asString(obj.name) ?? asString(obj.tag) ?? asString(obj.label);
      if (t) tags.push(t);
    }
  }
  return tags;
}

// ---------------------------------------------------------------------------
//  Parseo puro (preparado para la fase futura de enriquecimiento)
// ---------------------------------------------------------------------------

/**
 * Mapea la galería cruda de Crowdriff a `{ url, tags }[]`. Puro y defensivo;
 * descarta assets sin URL. No produce listings/events: solo el inventario de
 * imágenes que el futuro paso de matching cruzará con los listings existentes.
 */
export function parseCrowdriffAssets(json: unknown): Array<{ url: string; tags: string[] }> {
  const out: Array<{ url: string; tags: string[] }> = [];
  for (const asset of extractArray(json)) {
    const url =
      asString(asset.url) ??
      asString(asset.imageUrl) ??
      asString(asset.image_url) ??
      asString(asset.src);
    if (!url) continue;
    out.push({ url, tags: parseTags(asset.tags) });
  }
  return out;
}

// ---------------------------------------------------------------------------
//  Adaptador
// ---------------------------------------------------------------------------

export const crowdriffAdapter: FeedAdapter = {
  provider: 'crowdriff',

  async test(config: ProviderConfig): Promise<FeedTestResult> {
    const apiKey = config.apiKey?.trim();
    if (!apiKey) {
      return { ok: false, message: 'Falta "apiKey" en la configuración del feed de Crowdriff.' };
    }
    // No hacemos fetch real: el matching de imágenes es fase futura. Validamos
    // solo que la credencial esté presente para no dar un falso "todo ok".
    return {
      ok: true,
      message:
        'Credencial de Crowdriff registrada. El enriquecimiento de imágenes es una fase futura: ' +
        'aún no se ingieren listings/events desde Crowdriff.',
    };
  },

  async fetch() {
    // Intencionadamente vacío: Crowdriff aporta imágenes para enriquecer
    // listings existentes (matching por nombre/tag/geo), no listings ni events
    // estructurados. Ese matching queda pendiente para una fase futura.
    return { listings: [], events: [] };
  },
};
