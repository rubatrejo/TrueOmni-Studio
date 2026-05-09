import { NextResponse } from 'next/server';

import { bootstrapStudioFromFs, readClientFs } from '@/lib/studio/bootstrap-from-fs';
import { kv, kvKeys } from '@/lib/studio/kv';
import {
  AiAvatarSchema,
  BillboardSchema,
  BrandingSchema,
  BrochuresModuleSchema,
  DEFAULT_AI_AVATAR,
  DEFAULT_BILLBOARD,
  DEFAULT_BROCHURES,
  DEFAULT_DEALS,
  DEFAULT_GUESTBOOK,
  DEFAULT_PHOTO_BOOTH,
  DEFAULT_SOCIAL_WALL,
  DEFAULT_SURVEY,
  DEFAULT_SYSTEM_MODULES,
  DealsModuleSchema,
  EventsModuleSchema,
  GuestbookSchema,
  KioskConfigSchema,
  ListingsModuleSchema,
  ModulesSchema,
  PassesModuleSchema,
  PhotoBoothSchema,
  SocialWallSchema,
  SurveySchema,
  TicketsModuleSchema,
  AdsModuleSchema,
  IntegrationsConfigSchema,
  TrailsModuleSchema,
  defaultAds,
  defaultEvents,
  defaultIntegrations,
  defaultListings,
  defaultModules,
  defaultPasses,
  defaultTickets,
  defaultTrails,
  migrateListings,
  type ConfigMeta,
  type KioskConfig,
} from '@/lib/studio/schema';
import { takeSnapshot } from '@/lib/studio/snapshots';

/** Hard cap to keep KV values under the 1 MB Upstash hobby limit (10% buffer
 *  para meta + headers Redis). Subido de 480KB tras añadir hero header
 *  image/video y B0 background — un kiosk con todos los binarios cabía justo
 *  por encima del límite anterior. */
const KV_VALUE_BYTE_CAP = 950_000;

/** Cache en memoria del FS read del template para que múltiples PATCHes
 *  consecutivos no relean el filesystem. TTL 60s — si el template cambia,
 *  la siguiente PATCH después del TTL ya lo agarra (un reinicio del server
 *  también invalida).
 *
 *  Hallazgo #4 del audit: PATCH no re-bootstrap from FS hacía que cuando el
 *  template cambiaba, los kiosks viejos en KV quedaban stale. Re-correr
 *  bootstrapStudioFromFs antes de aplicar el patch garantiza que campos no
 *  customizados (igual a default) se actualicen al siguiente save. */
const FS_CACHE_TTL_MS = 60_000;
type FsCache = { at: number; slug: string; result: Awaited<ReturnType<typeof readClientFs>> };
let fsCache: FsCache | null = null;
async function getFsTemplateCached(slug: string) {
  const now = Date.now();
  if (fsCache && fsCache.slug === slug && now - fsCache.at < FS_CACHE_TTL_MS) {
    return fsCache.result;
  }
  const result = await readClientFs(slug);
  fsCache = { at: now, slug, result };
  return result;
}

/**
 * `/api/studio/configs/[slug]`
 *
 *   GET    → devuelve el KioskConfig actual + meta del slug.
 *   PATCH  → actualiza una sección parcial. Hoy soporta `{ branding }`;
 *            en fases siguientes se irán añadiendo modules/content/i18n/etc.
 *   DELETE → borra el cliente del KV (cfg + meta + entry en clients:list).
 *
 * NOTA: la "publicación" a `clients/<slug>/` (filesystem o GitHub PR) se
 * hará en `/api/studio/publish` (Fase S7). Estos endpoints solo manejan
 * la working copy en KV.
 */

type RouteParams = { params: Promise<{ slug: string }> };

export async function GET(_req: Request, { params }: RouteParams) {
  const { slug } = await params;
  try {
    const cfg = await kv.get<KioskConfig>(kvKeys.cfg(slug));
    if (!cfg) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const meta = await kv.get<ConfigMeta>(kvKeys.cfgMeta(slug));
    // Backfill defensivo: clientes legacy / pre-S2 pueden no tener algunos campos
    // o tener `systemModules` con shape antiguo (solo {ads,languages,aiAvatar}).
    const hydrated = await hydrateConfig(slug, cfg);
    return NextResponse.json({ config: hydrated, meta });
  } catch (error) {
    console.error('[api/studio/configs/[slug] GET]', error);
    return NextResponse.json({ error: 'Failed to load config' }, { status: 500 });
  }
}

/** Backfill defensivo de un KioskConfig leído del KV.
 *
 * Aplica defaults para campos undefined (cliente legacy pre-S2) y luego
 * llama a `bootstrapStudioFromFs` para hidratar campos que sigan en
 * factory default con datos del filesystem (caso típico: cliente recién
 * creado por el seed o por `makeBlankConfig`, cuyo Studio tiene events=[]
 * y nombre="TrueOmni Default" pero el filesystem tiene 69 events y un
 * nombre real).
 */
async function hydrateConfig(slug: string, cfg: KioskConfig): Promise<KioskConfig> {
  const baseModules = cfg.modules ?? defaultModules();
  const mergedSystemModules = {
    ...DEFAULT_SYSTEM_MODULES,
    ...(baseModules.systemModules ?? {}),
  };

  // Aplica defaults para todo undefined → estado consistente para el bootstrap.
  const filled: KioskConfig = {
    ...cfg,
    modules: { ...baseModules, systemModules: mergedSystemModules },
    // Spread DEFAULT_BILLBOARD primero para que los campos nuevos (eg.
    // `background` shared) se inyecten en kiosks viejos que ya tenían
    // `billboard` en KV pero sin esos campos.
    billboard: cfg.billboard
      ? { ...DEFAULT_BILLBOARD, ...cfg.billboard }
      : { ...DEFAULT_BILLBOARD },
    aiAvatar: cfg.aiAvatar ?? { ...DEFAULT_AI_AVATAR },
    survey: cfg.survey ?? structuredClone(DEFAULT_SURVEY),
    deals: cfg.deals ?? structuredClone(DEFAULT_DEALS),
    photoBooth: cfg.photoBooth ?? structuredClone(DEFAULT_PHOTO_BOOTH),
    brochures: cfg.brochures ?? structuredClone(DEFAULT_BROCHURES),
    socialWall: cfg.socialWall ?? structuredClone(DEFAULT_SOCIAL_WALL),
    guestbook: cfg.guestbook ?? structuredClone(DEFAULT_GUESTBOOK),
    listings: migrateListings(cfg.listings ?? defaultListings()),
    events: cfg.events ?? defaultEvents(),
    tickets: cfg.tickets ?? defaultTickets(),
    passes: cfg.passes ?? defaultPasses(),
    trails: cfg.trails ?? defaultTrails(),
    ads: cfg.ads ?? defaultAds(),
    integrations: cfg.integrations ?? defaultIntegrations(),
  };

  // Hidrata desde filesystem todo lo que sigue siendo factory default.
  const { config: fsConfig, tokensCss } = await readClientFs(slug);
  return bootstrapStudioFromFs(filled, fsConfig, tokensCss);
}

export async function PATCH(req: Request, { params }: RouteParams) {
  const { slug } = await params;
  try {
    const cfgRaw = await kv.get<KioskConfig>(kvKeys.cfg(slug));
    if (!cfgRaw) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    // Re-bootstrap from FS para que campos no customizados absorban cambios
    // recientes del template (`bootstrap-from-fs.ts` solo pisa fields que
    // siguen igual al factory default — customizaciones del operador NO se
    // pierden). El cache de 60s evita re-leer el FS en PATCHes consecutivos.
    const fsTemplate = await getFsTemplateCached(slug);
    const cfg = fsTemplate.config
      ? bootstrapStudioFromFs(cfgRaw, fsTemplate.config, fsTemplate.tokensCss)
      : cfgRaw;

    const body = (await req.json()) as {
      nombre?: unknown;
      branding?: unknown;
      modules?: unknown;
      billboard?: unknown;
      aiAvatar?: unknown;
      survey?: unknown;
      deals?: unknown;
      photoBooth?: unknown;
      brochures?: unknown;
      socialWall?: unknown;
      guestbook?: unknown;
      listings?: unknown;
      events?: unknown;
      tickets?: unknown;
      passes?: unknown;
      trails?: unknown;
      ads?: unknown;
      integrations?: unknown;
    };

    let next: KioskConfig = cfg;
    if (typeof body.nombre === 'string') {
      const trimmed = body.nombre.trim();
      if (trimmed.length === 0 || trimmed.length > 120) {
        return NextResponse.json({ error: 'nombre must be 1-120 chars' }, { status: 400 });
      }
      next = { ...next, nombre: trimmed };
    }
    if (body.branding !== undefined) {
      const parsed = BrandingSchema.safeParse(body.branding);
      if (!parsed.success) {
        return NextResponse.json(
          { error: 'Invalid branding', issues: parsed.error.issues },
          { status: 400 },
        );
      }
      next = { ...next, branding: parsed.data };
    }
    if (body.modules !== undefined) {
      const parsed = ModulesSchema.safeParse(body.modules);
      if (!parsed.success) {
        return NextResponse.json(
          { error: 'Invalid modules', issues: parsed.error.issues },
          { status: 400 },
        );
      }
      // keys deben ser únicos
      const keys = parsed.data.tiles.map((t) => t.key);
      if (new Set(keys).size !== keys.length) {
        return NextResponse.json(
          { error: 'Duplicate module keys are not allowed' },
          { status: 400 },
        );
      }
      next = { ...next, modules: parsed.data };
    }
    if (body.billboard !== undefined) {
      const parsed = BillboardSchema.safeParse(body.billboard);
      if (!parsed.success) {
        return NextResponse.json(
          { error: 'Invalid billboard', issues: parsed.error.issues },
          { status: 400 },
        );
      }
      next = { ...next, billboard: parsed.data };
    }
    if (body.aiAvatar !== undefined) {
      const parsed = AiAvatarSchema.safeParse(body.aiAvatar);
      if (!parsed.success) {
        return NextResponse.json(
          { error: 'Invalid aiAvatar', issues: parsed.error.issues },
          { status: 400 },
        );
      }
      next = { ...next, aiAvatar: parsed.data };
    }
    if (body.survey !== undefined) {
      const parsed = SurveySchema.safeParse(body.survey);
      if (!parsed.success) {
        return NextResponse.json(
          { error: 'Invalid survey', issues: parsed.error.issues },
          { status: 400 },
        );
      }
      // ids deben ser únicos
      const ids = parsed.data.questions.map((q) => q.id);
      if (new Set(ids).size !== ids.length) {
        return NextResponse.json(
          { error: 'Duplicate question ids are not allowed' },
          { status: 400 },
        );
      }
      next = { ...next, survey: parsed.data };
    }
    if (body.deals !== undefined) {
      const parsed = DealsModuleSchema.safeParse(body.deals);
      if (!parsed.success) {
        return NextResponse.json(
          { error: 'Invalid deals', issues: parsed.error.issues },
          { status: 400 },
        );
      }
      const slugs = parsed.data.deals.map((d) => d.slug);
      if (new Set(slugs).size !== slugs.length) {
        return NextResponse.json(
          { error: 'Duplicate deal slugs are not allowed' },
          { status: 400 },
        );
      }
      next = { ...next, deals: parsed.data };
    }
    if (body.photoBooth !== undefined) {
      const parsed = PhotoBoothSchema.safeParse(body.photoBooth);
      if (!parsed.success) {
        return NextResponse.json(
          { error: 'Invalid photoBooth', issues: parsed.error.issues },
          { status: 400 },
        );
      }
      // ids únicos por sub-lista
      const checkUnique = (arr: Array<{ id: string }>, kind: string): NextResponse | null => {
        const ids = arr.map((x) => x.id);
        if (new Set(ids).size !== ids.length) {
          return NextResponse.json(
            { error: `Duplicate ${kind} ids are not allowed` },
            { status: 400 },
          );
        }
        return null;
      };
      const errs =
        checkUnique(parsed.data.backgrounds, 'background') ??
        checkUnique(parsed.data.frames, 'frame') ??
        checkUnique(parsed.data.filters, 'filter') ??
        checkUnique(parsed.data.stickers, 'sticker');
      if (errs) return errs;
      // timer.default debe estar dentro de timer.options
      if (parsed.data.timer && !parsed.data.timer.options.includes(parsed.data.timer.default)) {
        return NextResponse.json(
          { error: 'photoBooth.timer.default must be one of timer.options' },
          { status: 400 },
        );
      }
      next = { ...next, photoBooth: parsed.data };
    }
    if (body.brochures !== undefined) {
      const parsed = BrochuresModuleSchema.safeParse(body.brochures);
      if (!parsed.success) {
        return NextResponse.json(
          { error: 'Invalid brochures', issues: parsed.error.issues },
          { status: 400 },
        );
      }
      const slugs = parsed.data.brochures.map((b) => b.slug);
      if (new Set(slugs).size !== slugs.length) {
        return NextResponse.json(
          { error: 'Duplicate brochure slugs are not allowed' },
          { status: 400 },
        );
      }
      // Cada brochure.category debe existir en categories[]
      const cats = new Set(parsed.data.categories);
      const orphan = parsed.data.brochures.find((b) => !cats.has(b.category));
      if (orphan) {
        return NextResponse.json(
          { error: `Brochure "${orphan.slug}" has unknown category "${orphan.category}"` },
          { status: 400 },
        );
      }
      next = { ...next, brochures: parsed.data };
    }
    if (body.socialWall !== undefined) {
      const parsed = SocialWallSchema.safeParse(body.socialWall);
      if (!parsed.success) {
        return NextResponse.json(
          { error: 'Invalid socialWall', issues: parsed.error.issues },
          { status: 400 },
        );
      }
      const postIds = parsed.data.posts.map((p) => p.id);
      if (new Set(postIds).size !== postIds.length) {
        return NextResponse.json({ error: 'Duplicate post ids are not allowed' }, { status: 400 });
      }
      const hlIds = parsed.data.highlights.map((h) => h.id);
      if (new Set(hlIds).size !== hlIds.length) {
        return NextResponse.json(
          { error: 'Duplicate highlight ids are not allowed' },
          { status: 400 },
        );
      }
      next = { ...next, socialWall: parsed.data };
    }
    if (body.guestbook !== undefined) {
      const parsed = GuestbookSchema.safeParse(body.guestbook);
      if (!parsed.success) {
        return NextResponse.json(
          { error: 'Invalid guestbook', issues: parsed.error.issues },
          { status: 400 },
        );
      }
      const checkUnique = (arr: Array<{ id: string }>, kind: string): NextResponse | null => {
        const ids = arr.map((x) => x.id);
        if (new Set(ids).size !== ids.length) {
          return NextResponse.json(
            { error: `Duplicate ${kind} ids are not allowed` },
            { status: 400 },
          );
        }
        return null;
      };
      const errs =
        checkUnique(parsed.data.pinCatalog, 'pin option') ??
        checkUnique(parsed.data.seedPins, 'seed pin');
      if (errs) return errs;
      // Country codes únicos
      const codes = parsed.data.countries.map((c) => c.code);
      if (new Set(codes).size !== codes.length) {
        return NextResponse.json(
          { error: 'Duplicate country codes are not allowed' },
          { status: 400 },
        );
      }
      next = { ...next, guestbook: parsed.data };
    }
    if (body.listings !== undefined) {
      const parsed = ListingsModuleSchema.safeParse(body.listings);
      if (!parsed.success) {
        return NextResponse.json(
          { error: 'Invalid listings', issues: parsed.error.issues },
          { status: 400 },
        );
      }
      next = { ...next, listings: parsed.data };
    }
    if (body.events !== undefined) {
      const parsed = EventsModuleSchema.safeParse(body.events);
      if (!parsed.success) {
        return NextResponse.json(
          { error: 'Invalid events', issues: parsed.error.issues },
          { status: 400 },
        );
      }
      next = { ...next, events: parsed.data };
    }
    if (body.tickets !== undefined) {
      const parsed = TicketsModuleSchema.safeParse(body.tickets);
      if (!parsed.success) {
        return NextResponse.json(
          { error: 'Invalid tickets', issues: parsed.error.issues },
          { status: 400 },
        );
      }
      next = { ...next, tickets: parsed.data };
    }
    if (body.passes !== undefined) {
      const parsed = PassesModuleSchema.safeParse(body.passes);
      if (!parsed.success) {
        return NextResponse.json(
          { error: 'Invalid passes', issues: parsed.error.issues },
          { status: 400 },
        );
      }
      next = { ...next, passes: parsed.data };
    }
    if (body.trails !== undefined) {
      const parsed = TrailsModuleSchema.safeParse(body.trails);
      if (!parsed.success) {
        return NextResponse.json(
          { error: 'Invalid trails', issues: parsed.error.issues },
          { status: 400 },
        );
      }
      next = { ...next, trails: parsed.data };
    }
    if (body.ads !== undefined) {
      const parsed = AdsModuleSchema.safeParse(body.ads);
      if (!parsed.success) {
        return NextResponse.json(
          { error: 'Invalid ads', issues: parsed.error.issues },
          { status: 400 },
        );
      }
      next = { ...next, ads: parsed.data };
    }
    if (body.integrations !== undefined) {
      const parsed = IntegrationsConfigSchema.safeParse(body.integrations);
      if (!parsed.success) {
        return NextResponse.json(
          { error: 'Invalid integrations', issues: parsed.error.issues },
          { status: 400 },
        );
      }
      next = { ...next, integrations: parsed.data };
    }

    const validated = KioskConfigSchema.safeParse(next);
    if (!validated.success) {
      return NextResponse.json(
        { error: 'Invalid config after patch', issues: validated.error.issues },
        { status: 400 },
      );
    }

    const serialized = JSON.stringify(validated.data);
    if (serialized.length > KV_VALUE_BYTE_CAP) {
      const sizeKb = Math.round(serialized.length / 1024);
      const capKb = Math.round(KV_VALUE_BYTE_CAP / 1024);
      // Pista para el operador: enumerar los campos pesados detectados.
      const heavyFields: string[] = [];
      const cfg = validated.data as unknown as Record<string, unknown>;
      const isHeavy = (v: unknown) =>
        typeof v === 'string' && v.startsWith('data:') && v.length > 200_000;
      const branding = cfg.branding as Record<string, unknown> | undefined;
      if (branding) {
        if (isHeavy(branding.logo)) heavyFields.push('branding.logo');
        if (isHeavy(branding.idleLogo)) heavyFields.push('branding.idleLogo');
        if (isHeavy(branding.footerLogo)) heavyFields.push('branding.footerLogo');
        const hh = branding.homeHero as { src?: string } | undefined;
        if (isHeavy(hh?.src)) heavyFields.push('branding.homeHero (use CDN URL)');
      }
      const billboard = cfg.billboard as { b0?: { background?: { src?: string } } } | undefined;
      if (isHeavy(billboard?.b0?.background?.src))
        heavyFields.push('billboard.b0.background (use CDN URL)');
      const heavyHint = heavyFields.length > 0 ? ` Heavy fields: ${heavyFields.join(', ')}.` : '';
      return NextResponse.json(
        {
          error: `Config too large for KV: ${sizeKb}KB (cap ${capKb}KB). Replace heavy uploads with CDN URLs (the "Or paste URL" input below each media field).${heavyHint}`,
          size: serialized.length,
          cap: KV_VALUE_BYTE_CAP,
          heavyFields,
        },
        { status: 413 },
      );
    }

    // Snapshot del estado anterior ANTES de sobreescribirlo (#9 audit). Si el
    // operador hace un "Revert" después, restauramos a esto. cfgRaw es el
    // valor literal del KV (no el bootstrap re-aplicado) — eso es lo que el
    // operador espera ver al revertir, sin re-templating del FS.
    if (cfgRaw) await takeSnapshot(slug, cfgRaw, 'patch');

    await kv.set(kvKeys.cfg(slug), validated.data);

    // Actualizar meta.lastEditedAt
    const meta = (await kv.get<ConfigMeta>(kvKeys.cfgMeta(slug))) ?? null;
    if (meta) {
      const updatedMeta: ConfigMeta = {
        ...meta,
        lastEditedAt: new Date().toISOString(),
      };
      await kv.set(kvKeys.cfgMeta(slug), updatedMeta);
    }

    // Sync hook (Fase 4 del refactor cliente-primero): si el PATCH tocó
    // `branding`, `nombre` o `clientInfo`, propaga al unified branding +
    // signage. Best-effort: errores no abortan el save del kiosk. Solo
    // se ejecuta si el cliente ya tiene manifest unificado.
    const bodyShape = body as {
      branding?: unknown;
      nombre?: unknown;
      clientInfo?: unknown;
    };
    const touchedSyncableField =
      bodyShape.branding != null || bodyShape.nombre != null || bodyShape.clientInfo != null;
    if (touchedSyncableField) {
      try {
        const { syncFromKioskSave } = await import('@/lib/studio/client-branding-sync');
        const { loadClientManifest } = await import('@/lib/studio/client-manifest');
        const manifest = await loadClientManifest(slug);
        if (manifest) {
          await syncFromKioskSave(slug, validated.data);
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('[api/studio/configs/[slug] PATCH] sync hook failed', e);
      }
    }

    return NextResponse.json({ config: validated.data });
  } catch (error) {
    console.error('[api/studio/configs/[slug] PATCH]', error);
    return NextResponse.json({ error: 'Failed to update config' }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: RouteParams) {
  const { slug } = await params;
  try {
    await kv.del(kvKeys.cfg(slug));
    await kv.del(kvKeys.cfgMeta(slug));
    await kv.srem(kvKeys.clientsList, slug);

    // Sync al modelo unified: si el cliente tiene manifest, marcar `kiosks`
    // como inactivo. Si tras eso ya no quedan productos activos (ningún
    // signage / mobile-pwa / etc.), purgar también el cliente unified
    // entero (manifest + unified branding + entry en `client:list`) para
    // que no queden "fantasmas" en el dashboard. Hallazgo S-03 del audit.
    try {
      const { kSignageClient } = await import('@/lib/signage/kv-keys');
      const { clientKeys, CLIENT_LIST_KEY, loadClientManifest, saveClientManifest } =
        await import('@/lib/studio/client-manifest');
      const manifest = await loadClientManifest(slug);
      if (manifest) {
        const updatedProducts = { ...manifest.products, kiosks: false };
        const stillHasProducts = Object.values(updatedProducts).some(Boolean);

        if (!stillHasProducts) {
          // El cliente queda sin productos activos. Si tampoco hay signage
          // KV residual, purgar todo el cliente unified.
          const signageStillExists = await kv.get(kSignageClient(slug));
          if (!signageStillExists) {
            await kv.del(clientKeys.manifest(slug));
            await kv.del(clientKeys.branding(slug));
            const list = (await kv.get<string[]>(CLIENT_LIST_KEY)) ?? [];
            if (Array.isArray(list)) {
              await kv.set(
                CLIENT_LIST_KEY,
                list.filter((s) => s !== slug),
              );
            }
          } else {
            // Hay signage pero el manifest no lo refleja — corrige + flip.
            await saveClientManifest({
              ...manifest,
              products: { ...updatedProducts, digitalDisplays: true },
              lastEditedAt: new Date().toISOString(),
            });
          }
        } else {
          await saveClientManifest({
            ...manifest,
            products: updatedProducts,
            lastEditedAt: new Date().toISOString(),
          });
        }
      }
    } catch (syncErr) {
      console.warn('[api/studio/configs/[slug] DELETE] unified cleanup failed', syncErr);
    }

    // Hallazgo S-37: invalidar cache para que el dashboard refleje el delete
    // sin esperar el TTL.
    try {
      const { invalidateAutoMigrateCache } = await import('@/lib/studio/auto-migrate-clients');
      invalidateAutoMigrateCache();
    } catch {
      /* noop */
    }

    return NextResponse.json({ slug, deleted: true });
  } catch (error) {
    console.error('[api/studio/configs/[slug] DELETE]', error);
    return NextResponse.json({ error: 'Failed to delete config' }, { status: 500 });
  }
}
