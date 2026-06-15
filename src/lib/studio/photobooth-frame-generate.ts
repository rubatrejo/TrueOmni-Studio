import 'server-only';

import { put } from '@vercel/blob';

import { loadUnifiedBranding, toHex } from '@/lib/studio/client-branding-sync';
import { kv, kvKeys } from '@/lib/studio/kv';
import { resolveBrandDisplayFont } from '@/lib/studio/photobooth-frame-fonts';
import { defaultFrameText, FRAME_TEXT_KIND } from '@/lib/studio/photobooth-frame-meta';
import {
  FRAME_TEMPLATES,
  renderFramePng,
  renderFrameThumbnail,
  type FrameTemplateInput,
} from '@/lib/studio/photobooth-frame-templates';
import {
  normalizeWebsiteUrl,
  resolveLogoBuffer,
  scrapeBestImage,
} from '@/lib/studio/placeholder-image';
import {
  DEFAULT_PHOTO_BOOTH,
  PhotoBoothSchema,
  type ConfigMeta,
  type KioskConfig,
  type PhotoBoothFrame,
} from '@/lib/studio/schema';

/**
 * Orquestación de la auto-generación de los frames branded del Photo Booth:
 * branding del KV → (scrape foto del website) → render N plantillas SVG con
 * sharp → Vercel Blob → escribe `cfg.photoBooth.frames` (write-path del config,
 * NO `content`/`syncContentToProducts` — los frames viven en el kiosk config).
 *
 * Compartida por el endpoint `POST /content/photobooth-frames` (botón del
 * editor) y el hook de creación de cliente (`POST /api/studio/clients`).
 */

/** Mismo cap que la PATCH route de configs (Upstash hobby ~1MB con buffer). */
const KV_VALUE_BYTE_CAP = 950_000;

export interface FrameGenerateResult {
  ok: boolean;
  /** Nº de frames branded generados. */
  count?: number;
  /** De dónde salió la foto de las plantillas: website o gradiente brand. */
  source?: 'website' | 'gradient';
  usedLogo?: boolean;
  status?: number;
  error?: string;
}

export async function generateAndSavePhotoBoothFrames(
  slug: string,
  opts?: {
    /** Fuerza nombre en texto (el logo del KV es el del template al crear). */
    forceNameText?: boolean;
  },
): Promise<FrameGenerateResult> {
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
  const cfg = await kv.get<KioskConfig>(kvKeys.cfg(slug));
  if (!cfg) {
    return { ok: false, status: 404, error: `No kiosk config found for client "${slug}".` };
  }

  const logoBuffer = opts?.forceNameText
    ? null
    : await resolveLogoBuffer(unified.logos?.default ?? '');

  // Foto del website, una sola vez, compartida por las plantillas con foto.
  let photoBuffer: Buffer | null = null;
  if (FRAME_TEMPLATES.some((t) => t.usesPhoto)) {
    const website = normalizeWebsiteUrl(unified.website ?? '');
    if (website) photoBuffer = await scrapeBestImage(website);
  }

  // Fuente de marca para el tagline (best-effort; null = sans del sistema).
  const taglineFont = await resolveBrandDisplayFont(unified.fonts);

  const clientName = unified.name || slug;
  const baseInput: Omit<FrameTemplateInput, 'text'> = {
    primaryHex: toHex(unified.brand.primary),
    secondaryHex: toHex(unified.brand.secondary),
    tertiaryHex: toHex(unified.brand.accent),
    logoBuffer,
    clientName,
    photoBuffer,
    taglineFont,
  };

  // Frames branded-auto previos por templateId → para preservar el texto
  // editado por el operador y el label renombrado al regenerar.
  const existing = cfg.photoBooth?.frames ?? [];
  const prevByTemplate = new Map(
    existing
      .filter((f) => f.source === 'branded-auto' && f.templateId)
      .map((f) => [f.templateId as string, f]),
  );

  // Render + subida a Blob, SECUENCIAL (acota RAM/picos de sharp en la lambda).
  const ts = Date.now();
  const branded: PhotoBoothFrame[] = [];
  for (const tpl of FRAME_TEMPLATES) {
    const prev = prevByTemplate.get(tpl.id);
    // Texto por frame: el editado por el operador gana; luego el campo global
    // (retrocompat) y, por último, el default basado en el nombre del cliente.
    const kind = FRAME_TEXT_KIND[tpl.id];
    const text = kind
      ? prev?.text?.trim() ||
        (kind === 'hashtag'
          ? cfg.photoBooth?.frameHashtag?.trim()
          : cfg.photoBooth?.frameTagline?.trim()) ||
        defaultFrameText(kind, clientName)
      : '';

    const framePng = await renderFramePng(tpl, { ...baseInput, text });
    const thumbPng = await renderFrameThumbnail(framePng, {
      primaryHex: baseInput.primaryHex,
      secondaryHex: baseInput.secondaryHex,
    });
    const frameBlob = await put(`kiosks/${slug}/photobooth/frame-${tpl.id}-${ts}.png`, framePng, {
      access: 'public',
      contentType: 'image/png',
      addRandomSuffix: false,
      allowOverwrite: true,
    });
    const thumbBlob = await put(`kiosks/${slug}/photobooth/thumb-${tpl.id}-${ts}.png`, thumbPng, {
      access: 'public',
      contentType: 'image/png',
      addRandomSuffix: false,
      allowOverwrite: true,
    });
    // Preserva el label si el operador lo renombró.
    const label = prev?.label && prev.label !== tpl.label ? prev.label : tpl.label;
    branded.push({
      id: tpl.id,
      image: frameBlob.url,
      thumbnail: thumbBlob.url,
      label,
      source: 'branded-auto',
      templateId: tpl.id,
      ...(text ? { text } : {}),
    });
  }

  // Tanto en creación como al regenerar desde el editor, los frames que vienen
  // del THEME/template (source undefined) y los branded-auto previos se BORRAN
  // y se reemplazan por el set nuevo. Solo se conserva la opción "None"
  // (image vacío) y los frames que el operador subió a mano (source 'custom').
  // (Feedback Rubén 2026-06-15: "Generate tiene que borrar los que ya estaban".)
  const preserved = existing.filter((f) => f.image === '' || f.source === 'custom');

  const nextFrames = [...preserved, ...branded];

  const parsed = PhotoBoothSchema.safeParse({
    ...(cfg.photoBooth ?? DEFAULT_PHOTO_BOOTH),
    frames: nextFrames,
  });
  if (!parsed.success) {
    return { ok: false, status: 500, error: 'photoBooth inválido tras generar frames.' };
  }

  const next: KioskConfig = { ...cfg, photoBooth: parsed.data };
  if (JSON.stringify(next).length > KV_VALUE_BYTE_CAP) {
    return { ok: false, status: 413, error: 'Config too large for KV tras generar frames.' };
  }

  const meta = await kv.get<ConfigMeta>(kvKeys.cfgMeta(slug));
  const updatedMeta: ConfigMeta | null = meta
    ? { ...meta, lastEditedAt: new Date().toISOString(), currentVersion: meta.currentVersion + 1 }
    : null;
  await Promise.all([
    kv.set(kvKeys.cfg(slug), next),
    updatedMeta ? kv.set(kvKeys.cfgMeta(slug), updatedMeta) : Promise.resolve(),
  ]);

  return {
    ok: true,
    count: branded.length,
    source: photoBuffer ? 'website' : 'gradient',
    usedLogo: Boolean(logoBuffer),
  };
}
