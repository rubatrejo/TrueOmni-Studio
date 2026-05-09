import 'server-only';

import { z } from 'zod';

import { kSignageClient } from '@/lib/signage/kv-keys';
import { SignageClientFileSchema } from '@/lib/signage/schema';
import type {
  SignageBranding,
  SignageClientFile,
} from '@/lib/signage/schema';

import { clientKeys } from './client-manifest';
import { hexToHsl, hslToHex } from './hex-to-hsl';
import { kv, kvKeys } from './kv';
import { studioLog } from './logger';
import { CustomFontSchema } from './schema';
import type { Branding, KioskConfig } from './schema';

/**
 * Layer de branding unificado del Cliente — Fase 2 del refactor
 * cliente-primero (plan en `~/.claude/plans/ok-listo-ahora-quiero-wondrous-sphinx.md`).
 *
 * El cliente es la entidad top-level y posee UN branding (nombre, website,
 * location, brand colors, logos, fonts, hero image/video). Cada producto
 * (kiosk, signage, futuros mobile-pwa/video-walls/tablets) consume ese
 * branding unificado. Sync bidireccional: editar en la Vista de Cliente o
 * dentro del editor de un producto propaga al unified + a los otros productos.
 *
 * Source of truth: `client:{slug}:branding`. Valores derivados se reflejan
 * en `cfg:{slug}.branding` (kiosk, hex) y `signage:client:{slug}.branding`
 * (HSL records + logos object).
 */

// ---------------------------------------------------------------------------
//  Schema
// ---------------------------------------------------------------------------

/**
 * Acepta tanto formato HSL kiosk-style ("H S% L%") como hex (#rrggbb / #rgb).
 * Internamente el unified branding guarda HSL canónico para evitar drift.
 */
const HslOrHex = z
  .string()
  .min(1)
  .refine(
    (v) =>
      /^\d+(\.\d+)?\s+\d+(\.\d+)?%\s+\d+(\.\d+)?%$/.test(v.trim()) ||
      /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(v.trim()),
    'must be HSL "H S% L%" or hex (#RGB/#RRGGBB)',
  );

export const UnifiedClientBrandingSchema = z.object({
  // Identidad
  name: z.string().min(1).max(120),
  website: z.string().max(2048).optional().default(''),
  location: z
    .object({
      city: z.string().max(120).optional().default(''),
      lat: z.number().optional(),
      lon: z.number().optional(),
    })
    .partial()
    .default({ city: '' }),

  // Brand colors (HSL canónico).
  brand: z.object({
    primary: HslOrHex,
    secondary: HslOrHex,
    accent: HslOrHex,
    neutral: HslOrHex.optional(),
  }),

  // Logos
  logos: z.object({
    /** Logo principal del cliente — usado por todos los productos como base. */
    default: z.string().default(''),
    /** Variante para fondos claros (signage). Cae al default si vacío. */
    dark: z.string().optional().default(''),
    /** Variante grande para Billboard idle (kiosk). Cae al default si vacío. */
    idle: z.string().optional().default(''),
    /** Variante compacta para footer (kiosk). Cae al default si vacío. */
    footer: z.string().optional().default(''),
  }),

  // Fonts
  fonts: z
    .object({
      display: z.string().default('Montserrat'),
      body: z.string().default('Open Sans'),
      displayCustom: CustomFontSchema.optional(),
      bodyCustom: CustomFontSchema.optional(),
    })
    .default({ display: 'Montserrat', body: 'Open Sans' }),

  // Media
  homeHero: z
    .object({
      kind: z.enum(['image', 'video']).default('image'),
      src: z.string().default(''),
    })
    .optional(),
  heroGradient: z
    .object({
      from: z.string(),
      to: z.string(),
      angle: z.number().min(0).max(360),
    })
    .optional(),

  /** Favicon — usado por kiosk; ignorado por signage. */
  favicon: z.string().optional().default(''),
});
export type UnifiedClientBranding = z.infer<typeof UnifiedClientBrandingSchema>;

// ---------------------------------------------------------------------------
//  Coerciones HSL ↔ Hex
// ---------------------------------------------------------------------------

/** Devuelve el value normalizado a `H S% L%` (HSL). Idempotente. */
export function toHsl(value: string): string {
  const trimmed = value.trim();
  if (/^#/.test(trimmed)) return hexToHsl(trimmed);
  return trimmed;
}

/** Devuelve el value normalizado a hex `#RRGGBB`. Idempotente. */
export function toHex(value: string): string {
  const trimmed = value.trim();
  if (/^#/.test(trimmed)) return trimmed.length === 4
    ? `#${trimmed[1]}${trimmed[1]}${trimmed[2]}${trimmed[2]}${trimmed[3]}${trimmed[3]}`
    : trimmed;
  return hslToHex(trimmed);
}

// ---------------------------------------------------------------------------
//  Mapeo unified → kiosk branding
// ---------------------------------------------------------------------------

/**
 * Deriva el shape `Branding` (kiosk) desde el unified branding. El kiosk usa
 * hex para los 3 brand colors + logos separados por uso (logo/idleLogo/
 * footerLogo). El campo `neutral` no tiene equivalente directo en el kiosk
 * y se ignora; el favicon sí se preserva.
 */
export function unifiedToKioskBranding(unified: UnifiedClientBranding): Branding {
  const out: Branding = {
    primary: toHex(unified.brand.primary),
    secondary: toHex(unified.brand.secondary),
    tertiary: toHex(unified.brand.accent),
  };
  if (unified.logos.default) out.logo = unified.logos.default;
  if (unified.logos.idle) out.idleLogo = unified.logos.idle;
  if (unified.logos.footer) out.footerLogo = unified.logos.footer;
  if (unified.favicon) out.favicon = unified.favicon;
  if (unified.fonts) {
    out.fonts = {
      display: unified.fonts.display,
      body: unified.fonts.body,
      displayCustom: unified.fonts.displayCustom,
      bodyCustom: unified.fonts.bodyCustom,
    };
  }
  if (unified.homeHero) out.homeHero = unified.homeHero;
  if (unified.heroGradient) out.heroGradient = unified.heroGradient;
  return out;
}

/**
 * Deriva el unified branding desde un `Branding` kiosk + `nombre` +
 * `clientInfo` (website/location). Usado durante migración y sync inverso.
 */
export function kioskToUnifiedBranding(
  kioskBranding: Branding,
  meta: {
    nombre: string;
    website?: string;
    location?: string;
    coords?: { lat: number; lng: number };
  },
): UnifiedClientBranding {
  return UnifiedClientBrandingSchema.parse({
    name: meta.nombre,
    website: meta.website ?? '',
    location: {
      city: meta.location ?? '',
      lat: meta.coords?.lat,
      lon: meta.coords?.lng,
    },
    brand: {
      primary: hexToHsl(kioskBranding.primary),
      secondary: hexToHsl(kioskBranding.secondary),
      accent: hexToHsl(kioskBranding.tertiary),
    },
    logos: {
      default: kioskBranding.logo ?? '',
      dark: '',
      idle: kioskBranding.idleLogo ?? '',
      footer: kioskBranding.footerLogo ?? '',
    },
    fonts: kioskBranding.fonts ?? { display: 'Montserrat', body: 'Open Sans' },
    homeHero: kioskBranding.homeHero,
    heroGradient: kioskBranding.heroGradient,
    favicon: kioskBranding.favicon ?? '',
  });
}

// ---------------------------------------------------------------------------
//  Mapeo unified → signage branding
// ---------------------------------------------------------------------------

/**
 * Deriva el shape `SignageBranding` desde el unified branding. Signage usa
 * tokens HSL records y logos object (default + dark). Los campos kiosk-only
 * (idle, footer, homeHero, heroGradient, favicon) no se propagan a signage.
 */
export function unifiedToSignageBranding(
  unified: UnifiedClientBranding,
): SignageBranding {
  const tokens: Record<string, string> = {
    'brand-primary': toHsl(unified.brand.primary),
    'brand-secondary': toHsl(unified.brand.secondary),
    'brand-accent': toHsl(unified.brand.accent),
  };
  if (unified.brand.neutral) {
    tokens['brand-neutral'] = toHsl(unified.brand.neutral);
  }
  return {
    logos: {
      default: unified.logos.default || 'assets/logo.svg',
      ...(unified.logos.dark ? { dark: unified.logos.dark } : null),
    },
    fonts: {
      display: unified.fonts.display,
      body: unified.fonts.body,
      displayCustom: unified.fonts.displayCustom,
      bodyCustom: unified.fonts.bodyCustom,
    },
    tokens,
  };
}

/**
 * Deriva el unified branding desde un signage client (full file). Usado
 * durante migración cuando solo existe signage (no kiosk).
 */
export function signageToUnifiedBranding(
  signageClient: SignageClientFile,
): UnifiedClientBranding {
  const t = signageClient.branding.tokens ?? {};
  return UnifiedClientBrandingSchema.parse({
    name: signageClient.name,
    website: signageClient.website ?? '',
    location: {
      city: signageClient.location?.city ?? '',
      lat: signageClient.location?.lat,
      lon: signageClient.location?.lon,
    },
    brand: {
      primary: t['brand-primary'] ?? '211 100% 25%',
      secondary: t['brand-secondary'] ?? '200 100% 50%',
      accent: t['brand-accent'] ?? '62 53% 48%',
      neutral: t['brand-neutral'] ?? '0 0% 7%',
    },
    logos: {
      default: signageClient.branding.logos.default,
      dark: signageClient.branding.logos.dark ?? '',
      idle: '',
      footer: '',
    },
    fonts: {
      display: signageClient.branding.fonts.display ?? 'Montserrat',
      body: signageClient.branding.fonts.body ?? 'Open Sans',
      displayCustom: signageClient.branding.fonts.displayCustom,
      bodyCustom: signageClient.branding.fonts.bodyCustom,
    },
  });
}

// ---------------------------------------------------------------------------
//  KV CRUD del unified branding
// ---------------------------------------------------------------------------

export async function loadUnifiedBranding(
  slug: string,
): Promise<UnifiedClientBranding | null> {
  const raw = await kv.get<unknown>(clientKeys.branding(slug));
  if (!raw) return null;
  const parsed = UnifiedClientBrandingSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

export async function saveUnifiedBrandingOnly(
  slug: string,
  branding: UnifiedClientBranding,
): Promise<void> {
  await kv.set(clientKeys.branding(slug), branding);
}

// ---------------------------------------------------------------------------
//  Sync bidireccional
// ---------------------------------------------------------------------------

export interface SyncResult {
  unified: 'ok' | 'skipped' | 'failed';
  kiosk: 'ok' | 'skipped' | 'failed' | 'absent';
  signage: 'ok' | 'skipped' | 'failed' | 'absent';
  errors: Array<{ target: 'unified' | 'kiosk' | 'signage'; message: string }>;
}

/**
 * Persiste el unified branding como source of truth y propaga a los configs
 * de los productos activos (kiosk + signage). Si un producto no existe, se
 * marca como `absent` y se ignora — no se crea automáticamente. Los errores
 * de un producto no abortan los otros (best-effort), pero se reportan en
 * `errors[]` y se persisten en `client:{slug}:sync-errors` para diagnóstico.
 */
export async function saveUnifiedBranding(
  slug: string,
  branding: UnifiedClientBranding,
  options: { skipKiosk?: boolean; skipSignage?: boolean } = {},
): Promise<SyncResult> {
  const result: SyncResult = {
    unified: 'failed',
    kiosk: 'absent',
    signage: 'absent',
    errors: [],
  };

  // 1. Source of truth.
  try {
    await saveUnifiedBrandingOnly(slug, branding);
    result.unified = 'ok';
  } catch (e) {
    result.errors.push({
      target: 'unified',
      message: e instanceof Error ? e.message : String(e),
    });
    return result; // sin source of truth, no propagamos.
  }

  // 2. Propagación al kiosk (solo si existe `cfg:{slug}`).
  if (!options.skipKiosk) {
    try {
      const kioskCfg = await kv.get<KioskConfig>(kvKeys.cfg(slug));
      if (kioskCfg) {
        const next: KioskConfig = {
          ...kioskCfg,
          nombre: branding.name,
          branding: {
            ...kioskCfg.branding,
            ...unifiedToKioskBranding(branding),
          },
          clientInfo: {
            website: branding.website ?? '',
            location: branding.location?.city ?? '',
            coords:
              branding.location?.lat != null && branding.location?.lon != null
                ? { lat: branding.location.lat, lng: branding.location.lon }
                : kioskCfg.clientInfo?.coords,
          },
        };
        await kv.set(kvKeys.cfg(slug), next);
        result.kiosk = 'ok';
      } else {
        result.kiosk = 'absent';
      }
    } catch (e) {
      result.kiosk = 'failed';
      result.errors.push({
        target: 'kiosk',
        message: e instanceof Error ? e.message : String(e),
      });
    }
  } else {
    result.kiosk = 'skipped';
  }

  // 3. Propagación al signage (solo si existe `signage:client:{slug}`).
  if (!options.skipSignage) {
    try {
      const signageRaw = await kv.get<unknown>(kSignageClient(slug));
      if (signageRaw) {
        const parsed = SignageClientFileSchema.safeParse(signageRaw);
        if (parsed.success) {
          const next: SignageClientFile = {
            ...parsed.data,
            name: branding.name,
            website: branding.website ?? parsed.data.website,
            location: {
              ...parsed.data.location,
              ...(branding.location?.city
                ? { city: branding.location.city }
                : null),
              ...(branding.location?.lat != null
                ? { lat: branding.location.lat }
                : null),
              ...(branding.location?.lon != null
                ? { lon: branding.location.lon }
                : null),
            },
            branding: {
              ...parsed.data.branding,
              ...unifiedToSignageBranding(branding),
            },
          };
          await kv.set(kSignageClient(slug), next);
          result.signage = 'ok';
        } else {
          result.signage = 'failed';
          result.errors.push({
            target: 'signage',
            message: `parse failed: ${parsed.error.message}`,
          });
        }
      } else {
        result.signage = 'absent';
      }
    } catch (e) {
      result.signage = 'failed';
      result.errors.push({
        target: 'signage',
        message: e instanceof Error ? e.message : String(e),
      });
    }
  } else {
    result.signage = 'skipped';
  }

  // 4. Si hubo errores, persistir últimos 10 para diagnóstico + log
  // estructurado. Hallazgo S-38: antes los errores se guardaban en KV
  // pero el operador no los veía a menos que abriera /studio/diagnostics.
  // Ahora también van al logger con level=alert si superan el threshold
  // de fallos consecutivos para que `vercel logs --follow` los muestre.
  if (result.errors.length > 0) {
    let priorErrorCount = 0;
    try {
      const log = await kv.get<Array<{ at: string; errors: SyncResult['errors'] }>>(
        clientKeys.syncErrors(slug),
      );
      const prior = Array.isArray(log) ? log : [];
      priorErrorCount = prior.length;
      const next = [
        { at: new Date().toISOString(), errors: result.errors },
        ...prior,
      ].slice(0, 10);
      await kv.set(clientKeys.syncErrors(slug), next);
    } catch {
      // ignoramos: la persistencia del log es nice-to-have.
    }

    // Threshold: 1er fallo = warn, 2+ consecutivos = alert (señal para
    // alarmar a oncall en logs aggregators).
    studioLog(priorErrorCount >= 1 ? 'alert' : 'warn', {
      event: 'sync.failed',
      slug,
      message: `branding sync failed (${result.errors.length} target${
        result.errors.length === 1 ? '' : 's'
      }, ${priorErrorCount + 1} consecutive)`,
      details: {
        unified: result.unified,
        kiosk: result.kiosk,
        signage: result.signage,
        errors: result.errors,
        priorErrorCount,
      },
    });
  } else if (result.unified === 'ok') {
    studioLog.info({
      event: 'sync.ok',
      slug,
      details: { kiosk: result.kiosk, signage: result.signage },
    });
  }

  return result;
}

/**
 * Hook desde el editor del kiosk: el operator guardó cambios en la sección
 * `branding` del kiosk; reconstruimos el unified y propagamos al signage.
 */
export async function syncFromKioskSave(
  slug: string,
  kioskCfg: KioskConfig,
): Promise<SyncResult> {
  const unified = kioskToUnifiedBranding(kioskCfg.branding, {
    nombre: kioskCfg.nombre,
    website: kioskCfg.clientInfo?.website,
    location: kioskCfg.clientInfo?.location,
    coords: kioskCfg.clientInfo?.coords,
  });
  return saveUnifiedBranding(slug, unified, { skipKiosk: true });
}

/**
 * Hook desde el editor de signage: el operator guardó cambios en `branding`
 * del signage; reconstruimos el unified y propagamos al kiosk.
 */
export async function syncFromSignageSave(
  slug: string,
  signageClient: SignageClientFile,
): Promise<SyncResult> {
  const unified = signageToUnifiedBranding(signageClient);
  return saveUnifiedBranding(slug, unified, { skipSignage: true });
}
