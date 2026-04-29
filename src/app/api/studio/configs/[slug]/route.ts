import { NextResponse } from 'next/server';

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
  GuestbookSchema,
  KioskConfigSchema,
  ModulesSchema,
  PhotoBoothSchema,
  SocialWallSchema,
  SurveySchema,
  defaultModules,
  type ConfigMeta,
  type KioskConfig,
} from '@/lib/studio/schema';

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
    const hydrated = hydrateConfig(cfg);
    return NextResponse.json({ config: hydrated, meta });
  } catch (error) {
    console.error('[api/studio/configs/[slug] GET]', error);
    return NextResponse.json({ error: 'Failed to load config' }, { status: 500 });
  }
}

/** Backfill defensivo de un KioskConfig leído del KV. */
function hydrateConfig(cfg: KioskConfig): KioskConfig {
  const baseModules = cfg.modules ?? defaultModules();
  // Merge de systemModules: legacy clients pueden tener solo 3 campos.
  const mergedSystemModules = {
    ...DEFAULT_SYSTEM_MODULES,
    ...(baseModules.systemModules ?? {}),
  };
  return {
    ...cfg,
    modules: { ...baseModules, systemModules: mergedSystemModules },
    billboard: cfg.billboard ?? { ...DEFAULT_BILLBOARD },
    aiAvatar: cfg.aiAvatar ?? { ...DEFAULT_AI_AVATAR },
    survey: cfg.survey ?? structuredClone(DEFAULT_SURVEY),
    deals: cfg.deals ?? structuredClone(DEFAULT_DEALS),
    photoBooth: cfg.photoBooth ?? structuredClone(DEFAULT_PHOTO_BOOTH),
    brochures: cfg.brochures ?? structuredClone(DEFAULT_BROCHURES),
    socialWall: cfg.socialWall ?? structuredClone(DEFAULT_SOCIAL_WALL),
    guestbook: cfg.guestbook ?? structuredClone(DEFAULT_GUESTBOOK),
  };
}

export async function PATCH(req: Request, { params }: RouteParams) {
  const { slug } = await params;
  try {
    const cfg = await kv.get<KioskConfig>(kvKeys.cfg(slug));
    if (!cfg) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const body = (await req.json()) as {
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
    };

    let next: KioskConfig = cfg;
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
      const checkUnique = (
        arr: Array<{ id: string }>,
        kind: string,
      ): NextResponse | null => {
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
        return NextResponse.json(
          { error: 'Duplicate post ids are not allowed' },
          { status: 400 },
        );
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
      const checkUnique = (
        arr: Array<{ id: string }>,
        kind: string,
      ): NextResponse | null => {
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

    const validated = KioskConfigSchema.safeParse(next);
    if (!validated.success) {
      return NextResponse.json(
        { error: 'Invalid config after patch', issues: validated.error.issues },
        { status: 400 },
      );
    }

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
    return NextResponse.json({ slug, deleted: true });
  } catch (error) {
    console.error('[api/studio/configs/[slug] DELETE]', error);
    return NextResponse.json({ error: 'Failed to delete config' }, { status: 500 });
  }
}
