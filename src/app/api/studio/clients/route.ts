import { NextResponse } from 'next/server';
import { z } from 'zod';

import { findPalette } from '@/app/studio/_lib/preset-palettes';
import { findStarter, type Starter } from '@/app/studio/_lib/starters';
import { loadSignageClient } from '@/lib/signage/config';
import { kSignageClient, kSignageClientList } from '@/lib/signage/kv-keys';
import { SignageClientFileSchema, type SignageClientFile } from '@/lib/signage/schema';
import { autoMigrateClients } from '@/lib/studio/auto-migrate-clients';
import { bootstrapStudioFromFs, readClientFs } from '@/lib/studio/bootstrap-from-fs';
import {
  kioskToUnifiedBranding,
  loadUnifiedBranding,
  saveUnifiedBrandingOnly,
  toHex,
  type UnifiedClientBranding,
} from '@/lib/studio/client-branding-sync';
import {
  ClientProductsSchema,
  defaultClientProducts,
  listClientSlugs,
  loadClientManifest,
  makeBlankManifest,
  saveClientManifest,
  type ClientManifest,
} from '@/lib/studio/client-manifest';
import { kv, kvKeys } from '@/lib/studio/kv';
import {
  emptyDemoContentInPlace,
  geocodeLocation,
  rewriteAddressesInPlace,
  rewriteContentInPlace,
} from '@/lib/studio/rewrite-client-content';
import {
  DEFAULT_SYSTEM_MODULES,
  KioskConfigSchema,
  makeBlankConfig,
  type ConfigMeta,
  type KioskConfig,
  type SystemModules,
} from '@/lib/studio/schema';
import {
  applyClonedDisplays,
  cloneSignageContentFromTemplate,
} from '@/lib/studio/signage-bootstrap';
import { STUDIO_SLUG_REGEX } from '@/lib/studio/slug';
import { applyClonedWalls, cloneVideoWallsFromFs } from '@/lib/video-walls/bootstrap-from-fs';
import { loadVideoWallClient } from '@/lib/video-walls/config';
import { kVideoWallClient, kVideoWallClientList } from '@/lib/video-walls/kv-keys';
import { VideoWallClientFileSchema, type VideoWallClientFile } from '@/lib/video-walls/schema';

export const dynamic = 'force-dynamic';

export interface ClientSummary {
  slug: string;
  name: string;
  products: ClientManifest['products'];
  brandPrimaryHex: string;
  brandSecondaryHex: string;
  brandAccentHex: string;
  logoUrl: string;
  lastEditedAt: string;
  lastEditor?: string;
  pinned: boolean;
}

const SLUG_REGEX = STUDIO_SLUG_REGEX;
const TEMPLATE_SLUG = 'default';

/**
 * `GET /api/studio/clients` — lista de clientes unificados (post-Fase 2).
 * Auto-migra clientes pre-refactor antes de servir la respuesta.
 */
export async function GET() {
  await autoMigrateClients();

  const slugs = await listClientSlugs();
  const summaries = await Promise.all(
    slugs.map(async (slug): Promise<ClientSummary | null> => {
      const [manifest, branding] = await Promise.all([
        loadClientManifest(slug),
        loadUnifiedBranding(slug),
      ]);
      if (!manifest || !branding) return null;
      return {
        slug,
        name: manifest.name,
        products: manifest.products,
        brandPrimaryHex: toHex(branding.brand.primary),
        brandSecondaryHex: toHex(branding.brand.secondary),
        brandAccentHex: toHex(branding.brand.accent),
        logoUrl: branding.logos.default ?? '',
        lastEditedAt: manifest.lastEditedAt,
        lastEditor: manifest.lastEditor,
        pinned: manifest.pinned ?? false,
      };
    }),
  );

  // Sort: pinned > default > recientes (por lastEditedAt) > alfabético.
  // Hallazgo S-13 del audit panorámico v2.
  const clients = summaries
    .filter((s): s is ClientSummary => s !== null)
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      if (a.slug === 'default' && !b.pinned) return -1;
      if (b.slug === 'default' && !a.pinned) return 1;
      const recencyDiff = new Date(b.lastEditedAt).getTime() - new Date(a.lastEditedAt).getTime();
      if (Math.abs(recencyDiff) > 60_000) return recencyDiff; // > 1 min de diff
      return a.name.localeCompare(b.name);
    });

  return NextResponse.json({ clients });
}

// ---------------------------------------------------------------------------
//  POST — crear cliente unificado (Fase 4)
// ---------------------------------------------------------------------------

const CreateClientBodySchema = z.object({
  slug: z.string().min(1).regex(SLUG_REGEX, 'kebab-case slug required'),
  name: z.string().min(1).max(120),
  website: z.string().max(2048).optional(),
  location: z
    .object({
      city: z.string().max(120).optional(),
      lat: z.number().optional(),
      lon: z.number().optional(),
    })
    .partial()
    .optional(),
  /**
   * Location en formato "City, ST" para el rewrite del contenido del template
   * Arizona (addresses + Phoenix/Mesa/etc. en titles/descriptions). Si se
   * omite, el cliente nuevo arrastra las referencias geográficas del default
   * — útil para clientes que también son de Arizona o que van a poblar todo
   * a mano (emptyMode).
   */
  locationFull: z.string().max(160).optional(),
  /**
   * Vacía las colecciones de mock data del template (listings/events/passes/
   * deals/trails/itineraryBuilder.localListings/socialWall.posts). Branding,
   * módulos y estructura se preservan para que el editor no quede roto.
   */
  emptyMode: z.boolean().optional(),
  /**
   * Starter por vertical (F-HUB-1): aplica paleta + fonts + módulos + preguntas
   * de Ask AI del catálogo `STARTERS` sobre el template recién clonado. Vacío /
   * ausente = "Start empty" (solo el default del template).
   */
  starterId: z.string().max(64).optional(),
  products: ClientProductsSchema.partial().default({ kiosks: true }),
});

/**
 * Aplica los overrides de un starter sobre el config recién bootstrapeado:
 * paleta (resuelta de `PRESET_PALETTES`), fonts, módulos activos y las preguntas
 * sugeridas del Ask AI. El `aiTone` del starter no tiene campo en el schema del
 * kiosk, así que se omite (queda como hint para una fase futura).
 */
function applyStarterOverrides(cfg: KioskConfig, starter: Starter): void {
  const palette = findPalette(starter.paletteId);
  if (palette) {
    cfg.branding.primary = palette.primary;
    cfg.branding.secondary = palette.secondary;
    cfg.branding.tertiary = palette.tertiary;
  }
  cfg.branding.fonts = { display: starter.fonts.display, body: starter.fonts.body };
  if (cfg.modules) {
    cfg.modules.systemModules = {
      ...DEFAULT_SYSTEM_MODULES,
      ...(cfg.modules.systemModules ?? {}),
      ...starter.defaultModules,
    } as SystemModules;
  }
  if (cfg.aiAvatar) {
    cfg.aiAvatar.suggestedQuestions = starter.aiSuggestedQuestions.map((text, i) => ({
      id: `starter-q${i + 1}`,
      text,
    }));
  }
}

/**
 * `POST /api/studio/clients` body `{ slug, name, website?, location?, products }`.
 *
 * Crea un cliente unificado:
 *  1. Valida que el slug no exista (en `client:list` ni en KV legacy).
 *  2. Clona configs de los productos seleccionados desde el template `default`:
 *     - kiosks → `cfg:{slug}` con bootstrap del filesystem.
 *     - digitalDisplays → `signage:client:{slug}` con clone del template.
 *  3. Crea unified branding como source of truth (`client:{slug}:branding`)
 *     derivando del kiosk template (o defaults TrueOmni si no hay kiosk).
 *  4. Crea manifest (`client:{slug}:manifest`) con los productos activos.
 *  5. Añade el slug a `client:list` + listas legacy de cada producto activo.
 *
 * Falla con 409 si el slug ya existe.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 });
  }

  const parsed = CreateClientBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'validation failed', details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const { slug, name } = parsed.data;
  if (slug === TEMPLATE_SLUG) {
    return NextResponse.json(
      { error: `"${TEMPLATE_SLUG}" is reserved for the system template.` },
      { status: 400 },
    );
  }

  const products = { ...defaultClientProducts(), ...parsed.data.products };

  // Conflict check: slug ya tiene manifest, kiosk config, signage client o
  // video-walls client. G4 (audit 2026-05-12): el chequeo previo no incluía
  // VW, así que un cliente legacy solo-VW podría re-crearse y pisar su KV.
  const [existingManifest, existingKiosk, existingSignage, existingVideoWalls] = await Promise.all([
    loadClientManifest(slug),
    kv.get(kvKeys.cfg(slug)),
    kv.get(kSignageClient(slug)),
    kv.get(kVideoWallClient(slug)),
  ]);

  // Cliente válido (con manifest) → conflicto real, bloquear el create.
  if (existingManifest) {
    return NextResponse.json({ error: `slug "${slug}" already exists` }, { status: 409 });
  }

  // Orphan recovery: si NO existe el manifest pero sí alguna key legacy de
  // kiosk/signage/videowall, fue un DELETE parcial (catch silencioso o
  // network flake). Auto-purga esos huérfanos en lugar de bloquear el
  // create — el operador ya borró el cliente en su mental model y solo
  // quiere recrearlo. Mantener un 409 aquí lo dejaba sin recurso.
  if (existingKiosk || existingSignage || existingVideoWalls) {
    const { buildPrefixesToPurge, purgePrefix } = await import('@/lib/studio/purge-client');
    const orphanedBuckets = [
      existingKiosk ? 'kiosk' : null,
      existingSignage ? 'signage' : null,
      existingVideoWalls ? 'video-walls' : null,
    ].filter(Boolean);
    console.warn(
      `[POST /api/studio/clients] Orphan keys detected for slug "${slug}" (${orphanedBuckets.join(', ')}). Auto-purging before create.`,
    );
    for (const prefix of buildPrefixesToPurge(slug)) {
      try {
        await purgePrefix(prefix);
      } catch (err) {
        console.warn(`[POST /api/studio/clients] orphan purgePrefix(${prefix}) failed`, err);
      }
    }
    // GC de los blobs huérfanos del slug (uploads/placeholder/feed previos).
    try {
      const { purgeClientBlobs } = await import('@/lib/studio/blob-gc');
      await purgeClientBlobs(slug);
    } catch (err) {
      console.warn(`[POST /api/studio/clients] orphan purgeClientBlobs failed`, err);
    }
    // También limpia membership en SETs por si quedaron stale.
    try {
      await kv.srem('clients:list', slug);
      await kv.srem(kSignageClientList, slug);
      await kv.srem(kVideoWallClientList, slug);
    } catch (err) {
      console.warn('[POST /api/studio/clients] orphan srem cleanup failed', err);
    }
  }

  // 1. Clonar kiosk si toca.
  let kioskConfig: KioskConfig | null = null;
  const locationFull = parsed.data.locationFull?.trim() ?? '';
  if (products.kiosks) {
    try {
      const fsTemplate = await readClientFs(TEMPLATE_SLUG);
      let cfg = makeBlankConfig(slug, name, 'portrait');
      if (fsTemplate.config) {
        cfg = bootstrapStudioFromFs(cfg, fsTemplate.config, fsTemplate.tokensCss);
        cfg.slug = slug;
        cfg.nombre = name;
        cfg.currentVersion = 0;
      }
      // F-HUB-1: si se eligió un starter por vertical, aplicar su paleta/fonts/
      // módulos/preguntas ANTES del rewrite de location (que reescribe sobre la
      // estructura ya configurada del starter).
      if (parsed.data.starterId) {
        const starter = findStarter(parsed.data.starterId);
        if (starter) applyStarterOverrides(cfg, starter);
      }
      const trimmedLocation = locationFull || parsed.data.location?.city || '';
      const trimmedWebsite = parsed.data.website ?? '';
      // Geocoding: si el operador no envió coords explícitas pero sí
      // "City, ST", resolvemos lat/lon via Nominatim para que el módulo
      // Map y los address pickers arranquen centrados en el cliente.
      let resolvedCoords: { lat: number; lng: number } | undefined;
      if (parsed.data.location?.lat != null && parsed.data.location?.lon != null) {
        resolvedCoords = { lat: parsed.data.location.lat, lng: parsed.data.location.lon };
      } else if (locationFull) {
        resolvedCoords = (await geocodeLocation(locationFull)) ?? undefined;
      }
      if (trimmedWebsite || trimmedLocation || resolvedCoords) {
        cfg.clientInfo = {
          website: trimmedWebsite,
          location: trimmedLocation,
          ...(resolvedCoords ? { coords: resolvedCoords } : {}),
        };
      }

      // Empty mode: vaciar mock data antes del rewrite (no hay nada
      // Phoenix-specific que reescribir si las colecciones están vacías).
      if (parsed.data.emptyMode) {
        emptyDemoContentInPlace(cfg);
      }

      // Rewrite del contenido del template (Phoenix/Arizona → location del
      // cliente nuevo). Garantiza que un kiosk de "Davenport, FL" no vea
      // "North Phoenix, AZ" en addresses ni "Arizona Science Center" en
      // titles. Solo aplica si el operador envió locationFull en formato
      // "City, ST".
      if (locationFull) {
        rewriteAddressesInPlace(cfg, locationFull);
        rewriteContentInPlace(cfg, locationFull);
      }

      const validated = KioskConfigSchema.safeParse(cfg);
      if (!validated.success) {
        return NextResponse.json(
          { error: 'kiosk config validation failed', issues: validated.error.issues },
          { status: 500 },
        );
      }
      kioskConfig = validated.data;
      const created = await kv.set(kvKeys.cfg(slug), kioskConfig, { nx: true });
      if (created !== 'OK') {
        return NextResponse.json({ error: `kiosk slug "${slug}" already exists` }, { status: 409 });
      }
      const meta: ConfigMeta = {
        slug,
        createdAt: new Date().toISOString(),
        lastEditedAt: new Date().toISOString(),
        currentVersion: 0,
      };
      await kv.set(kvKeys.cfgMeta(slug), meta);
      await kv.sadd(kvKeys.clientsList, slug);
    } catch (e) {
      return NextResponse.json(
        { error: 'failed to create kiosk', message: (e as Error).message },
        { status: 500 },
      );
    }
  }

  // 2. Clonar signage si toca.
  if (products.digitalDisplays) {
    try {
      const template = await loadSignageClient(TEMPLATE_SLUG);
      if (!template) {
        return NextResponse.json(
          { error: `signage template "${TEMPLATE_SLUG}" not available` },
          { status: 500 },
        );
      }
      const clone: SignageClientFile = {
        slug,
        name,
        locale: template.locale,
        timezone: template.timezone,
        location: {
          ...template.location,
          ...(parsed.data.location?.city ? { city: parsed.data.location.city } : null),
          ...(parsed.data.location?.lat != null ? { lat: parsed.data.location.lat } : null),
          ...(parsed.data.location?.lon != null ? { lon: parsed.data.location.lon } : null),
        },
        website:
          (parsed.data.website && parsed.data.website.trim().length > 0
            ? parsed.data.website.trim()
            : undefined) ??
          (template.website && template.website.trim().length > 0
            ? template.website.trim()
            : undefined),
        branding: structuredClone(template.branding),
        header: structuredClone(template.header),
        displays: [],
      };

      // Clonar displays + events/social/news del template al KV del cliente
      // nuevo. Sin esto el operador abría el editor signage "limpio" en
      // lugar de heredar el contenido demo de TrueOmni (lobby-tv playlist
      // + eventos + posts + news).
      const clonedDisplays = await cloneSignageContentFromTemplate(slug);
      applyClonedDisplays(clone, clonedDisplays);

      const validated = SignageClientFileSchema.safeParse(clone);
      if (!validated.success) {
        return NextResponse.json(
          { error: 'signage clone validation failed', issues: validated.error.issues },
          { status: 500 },
        );
      }
      await kv.set(kSignageClient(slug), validated.data);
      // Set legacy de signage clients (sadd, no overwrite).
      await kv.sadd(kSignageClientList, slug);
    } catch (e) {
      return NextResponse.json(
        { error: 'failed to create signage client', message: (e as Error).message },
        { status: 500 },
      );
    }
  }

  // 2b. Clonar video-walls si toca. G3 (audit 2026-05-12): antes este POST
  // ignoraba `products.videoWalls = true` y dejaba `videowall:client:<slug>`
  // vacío. El drift recovery del page lo compensaba lazy; ahora persistimos
  // de entrada para que el dashboard `clients` no muestre "VW activo" antes
  // de que el KV exista.
  if (products.videoWalls) {
    try {
      const template = await loadVideoWallClient(TEMPLATE_SLUG);
      if (!template) {
        return NextResponse.json(
          { error: `video-walls template "${TEMPLATE_SLUG}" not available` },
          { status: 500 },
        );
      }
      const clone: VideoWallClientFile = {
        slug,
        name,
        locale: template.locale,
        timezone: template.timezone,
        location: {
          ...template.location,
          ...(parsed.data.location?.city ? { city: parsed.data.location.city } : null),
          ...(parsed.data.location?.lat != null ? { lat: parsed.data.location.lat } : null),
          ...(parsed.data.location?.lon != null ? { lon: parsed.data.location.lon } : null),
        },
        website:
          (parsed.data.website && parsed.data.website.trim().length > 0
            ? parsed.data.website.trim()
            : undefined) ??
          (template.website && template.website.trim().length > 0
            ? template.website.trim()
            : undefined),
        branding: structuredClone(template.branding),
        header: structuredClone(template.header),
        walls: [],
      };

      // Clonar walls del template fs al KV (idempotente). Reusa el helper
      // que también usa el endpoint `activate`.
      const clonedWalls = await cloneVideoWallsFromFs(TEMPLATE_SLUG, slug);
      applyClonedWalls(clone, clonedWalls);

      const validated = VideoWallClientFileSchema.safeParse(clone);
      if (!validated.success) {
        return NextResponse.json(
          { error: 'video-walls clone validation failed', issues: validated.error.issues },
          { status: 500 },
        );
      }
      await kv.set(kVideoWallClient(slug), validated.data);
      await kv.sadd(kVideoWallClientList, slug);
    } catch (e) {
      return NextResponse.json(
        { error: 'failed to create video-walls client', message: (e as Error).message },
        { status: 500 },
      );
    }
  }

  // 2c. Sembrar el slice Mobile PWA si toca. A diferencia de signage/video-walls,
  // la PWA NO clona un cliente aparte: reutiliza la data del kiosk y solo siembra
  // el slice editable `features.pwa` en KV (desde el config.json del propio cliente
  // si está publicado, o el template default). Mismo helper que usa `activate`.
  if (products.mobilePwa) {
    try {
      const { ensurePwaSlice } = await import('@/lib/studio/pwa-config');
      await ensurePwaSlice(slug);
    } catch (e) {
      return NextResponse.json(
        { error: 'failed to create pwa slice', message: (e as Error).message },
        { status: 500 },
      );
    }
  }

  // 3. Unified branding como source of truth.
  let unified: UnifiedClientBranding;
  if (kioskConfig) {
    unified = kioskToUnifiedBranding(kioskConfig.branding, {
      nombre: kioskConfig.nombre,
      website: kioskConfig.clientInfo?.website,
      location: kioskConfig.clientInfo?.location,
      coords: kioskConfig.clientInfo?.coords,
    });
  } else {
    // Solo signage o ningún producto — defaults TrueOmni.
    unified = {
      name,
      website: parsed.data.website ?? '',
      location: {
        city: parsed.data.location?.city ?? '',
        lat: parsed.data.location?.lat,
        lon: parsed.data.location?.lon,
      },
      brand: {
        primary: '211 100% 25%',
        secondary: '200 100% 50%',
        accent: '62 53% 48%',
        neutral: '0 0% 7%',
      },
      logos: { default: '', dark: '', idle: '', footer: '' },
      fonts: { display: 'Montserrat', body: 'Open Sans' },
      favicon: '',
    };
  }
  await saveUnifiedBrandingOnly(slug, unified);

  // 4. Manifest.
  const manifest = makeBlankManifest(slug, name, products);
  await saveClientManifest(manifest);

  // 5. Placeholder image automático (best-effort, no-fatal): foto del website
  // del cliente + capa oscura + su NOMBRE en texto — el logo del KV en este
  // punto es el del template clonado, no el del cliente real, así que
  // `forceNameText` evita quemar un logo ajeno. El operador puede regenerar
  // con su logo desde Data feeds → Placeholder. Timeout duro para no colgar
  // la creación si el website del cliente responde lento.
  const websiteForPlaceholder = parsed.data.website?.trim() ?? '';
  if (websiteForPlaceholder && (products.kiosks || products.mobilePwa)) {
    try {
      const { generateAndSavePlaceholder } = await import('@/lib/studio/placeholder-generate');
      await Promise.race([
        generateAndSavePlaceholder(slug, { forceNameText: true }),
        new Promise((resolve) => setTimeout(resolve, 15_000, null)),
      ]);
    } catch (e) {
      console.warn('[api/studio/clients] placeholder generation skipped:', e);
    }
  }

  // 6. Frames branded del Photo Booth automáticos (best-effort, no-fatal):
  // reemplaza los 5 frames genéricos bespoke por 5 plantillas con el branding
  // del cliente (brand colors + nombre en texto + foto del website), conservando
  // la opción "None". `forceNameText` por la misma razón que el placeholder (el
  // logo del KV aún es el del template). El operador regenera con su logo desde
  // el editor (Photo Booth → Frames). Timeout mayor: son 5 frames + thumbs.
  if (products.kiosks) {
    try {
      const { generateAndSavePhotoBoothFrames } =
        await import('@/lib/studio/photobooth-frame-generate');
      await Promise.race([
        generateAndSavePhotoBoothFrames(slug, { forceNameText: true, replaceGenerics: true }),
        new Promise((resolve) => setTimeout(resolve, 20_000, null)),
      ]);
    } catch (e) {
      console.warn('[api/studio/clients] photo booth frame generation skipped:', e);
    }
  }

  return NextResponse.json(
    {
      slug,
      manifest,
      branding: unified,
    },
    { status: 201 },
  );
}
