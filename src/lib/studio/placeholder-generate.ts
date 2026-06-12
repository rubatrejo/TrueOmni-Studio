import 'server-only';

import { put } from '@vercel/blob';

import { loadUnifiedBranding, toHex } from '@/lib/studio/client-branding-sync';
import {
  loadClientContentOrEmpty,
  saveClientContent,
  syncContentToProducts,
} from '@/lib/studio/client-content-sync';
import {
  composePlaceholder,
  normalizeWebsiteUrl,
  resolveLogoBuffer,
  scrapeBestImage,
} from '@/lib/studio/placeholder-image';

/**
 * Orquestación de la generación automática del Fallback/Placeholder image:
 * branding del KV → scrape del website → composición sharp → Vercel Blob →
 * `content.placeholderImage` + sync a productos. Compartida por el endpoint
 * `POST /content/placeholder` (botón del Studio) y el hook de creación de
 * cliente (`POST /api/studio/clients`).
 */

export interface PlaceholderGenerateResult {
  ok: boolean;
  /** URL pública del blob generado. */
  url?: string;
  /** De dónde salió el fondo: foto del website o gradiente brand. */
  source?: 'website' | 'gradient';
  /** Si el centro fue el logo real (false → nombre del cliente en texto). */
  usedLogo?: boolean;
  /** HTTP status sugerido para el caller cuando `ok` es false. */
  status?: number;
  error?: string;
}

export async function generateAndSavePlaceholder(
  slug: string,
  opts?: {
    /**
     * Fuerza el nombre del cliente como centro aunque haya logo en el
     * branding. Lo usa el flujo de creación: en ese momento el logo del KV
     * es el del template clonado, no el del cliente real.
     */
    forceNameText?: boolean;
  },
): Promise<PlaceholderGenerateResult> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return {
      ok: false,
      status: 503,
      error:
        'Vercel Blob no configurado. Conecta un Blob store al proyecto o establece BLOB_READ_WRITE_TOKEN.',
    };
  }

  const unified = await loadUnifiedBranding(slug);
  if (!unified) {
    return { ok: false, status: 404, error: `No branding found for client "${slug}".` };
  }

  const website = normalizeWebsiteUrl(unified.website ?? '');
  if (!website) {
    return {
      ok: false,
      status: 400,
      error: 'El cliente no tiene website configurado (Branding → Website).',
    };
  }

  const photo = await scrapeBestImage(website);
  const logo = opts?.forceNameText ? null : await resolveLogoBuffer(unified.logos?.default ?? '');

  const jpeg = await composePlaceholder({
    photo,
    logo,
    clientName: unified.name || slug,
    brandPrimaryHex: toHex(unified.brand.primary),
    brandSecondaryHex: toHex(unified.brand.secondary),
  });

  const blob = await put(`kiosks/${slug}/image/placeholder-${Date.now()}.jpg`, jpeg, {
    access: 'public',
    contentType: 'image/jpeg',
    addRandomSuffix: false,
    allowOverwrite: true,
  });

  const content = await loadClientContentOrEmpty(slug);
  const saved = await saveClientContent(slug, { ...content, placeholderImage: blob.url });
  if (!saved.ok) {
    return { ok: false, status: 409, error: 'Conflicto de versión guardando el contenido.' };
  }
  await syncContentToProducts(slug);

  return {
    ok: true,
    url: blob.url,
    source: photo ? 'website' : 'gradient',
    usedLogo: Boolean(logo),
  };
}
