import { z } from 'zod';

/* ────────────────────────────────────────────────────────────────────────── */
/*  Integrations (weather, mapbox, analytics, external API)                  */
/* ────────────────────────────────────────────────────────────────────────── */

export const WEATHER_PROVIDERS = ['open-meteo', 'openweather'] as const;
export type WeatherProvider = (typeof WEATHER_PROVIDERS)[number];

export const WEATHER_UNITS = ['metric', 'imperial'] as const;
export type WeatherUnits = (typeof WEATHER_UNITS)[number];

/**
 * Token OAuth de una plataforma social. `connected: false` = el operador
 * no completó el flow (o el token expiró sin refresh). El refresh token,
 * cuando aplica, se guarda en `refreshToken` y se usa en `/api/oauth/{platform}/refresh`.
 *
 * Hallazgo #13 audit Studio (2026-05-05). Schema preparado para activación
 * — endpoints OAuth pendientes de credenciales de developer (ver doc handoff).
 */
export const SocialOauthTokenSchema = z.object({
  connected: z.boolean().default(false),
  /** Access token (ofuscado en UI; nunca cruza al iframe del preview). */
  accessToken: z.string().default(''),
  /** Refresh token (cuando la plataforma lo soporta — IG, FB largos, X). */
  refreshToken: z.string().default(''),
  /** ISO timestamp de expiración del access token. */
  expiresAt: z.string().default(''),
  /** Scopes concedidos (auditing). */
  scopes: z.array(z.string()).default([]),
  /** Username/handle conectado (para mostrar en UI: "@miusuario"). */
  handle: z.string().max(128).default(''),
});
export type SocialOauthToken = z.infer<typeof SocialOauthTokenSchema>;

export function defaultSocialOauthToken(): SocialOauthToken {
  return {
    connected: false,
    accessToken: '',
    refreshToken: '',
    expiresAt: '',
    scopes: [],
    handle: '',
  };
}

export const IntegrationsConfigSchema = z.object({
  api: z
    .object({
      baseUrl: z.string().max(2048).default(''),
    })
    .default({ baseUrl: '' }),
  mapbox: z
    .object({
      token: z.string().max(2048).default(''),
    })
    .default({ token: '' }),
  analytics: z
    .object({
      gaId: z.string().max(64).default(''),
    })
    .default({ gaId: '' }),
  weather: z
    .object({
      provider: z.enum(WEATHER_PROVIDERS).default('open-meteo'),
      apiKey: z.string().max(256).default(''),
      city: z.string().max(120).default(''),
      units: z.enum(WEATHER_UNITS).default('metric'),
    })
    .default({ provider: 'open-meteo', apiKey: '', city: '', units: 'metric' }),
  /** Satisfi Labs — chatbot backend. No UI — only credentials stored for the runtime. */
  satisfi: z
    .object({
      apiKey: z.string().max(256).default(''),
      hubId: z.string().max(128).default(''),
    })
    .default({ apiKey: '', hubId: '' }),
  /** Tavus — replica/persona used by the AI Avatar module. */
  tavus: z
    .object({
      apiKey: z.string().max(256).default(''),
      replicaId: z.string().max(128).default(''),
      personaId: z.string().max(128).default(''),
    })
    .default({ apiKey: '', replicaId: '', personaId: '' }),
  /** Bandwango — partner data feed (passes, deals, listings). */
  bandwango: z
    .object({
      apiKey: z.string().max(256).default(''),
      partnerId: z.string().max(128).default(''),
    })
    .default({ apiKey: '', partnerId: '' }),
  /** CrowdRiff — social media aggregator that powers the Social Wall. */
  crowdriff: z
    .object({
      apiKey: z.string().max(256).default(''),
      galleryId: z.string().max(128).default(''),
    })
    .default({ apiKey: '', galleryId: '' }),
  /** Viator — tours & tickets feed. */
  viator: z
    .object({
      apiKey: z.string().max(256).default(''),
      partnerId: z.string().max(128).default(''),
    })
    .default({ apiKey: '', partnerId: '' }),
  /**
   * OAuth tokens per social platform — usados para que el Social Wall
   * jale feeds reales (en lugar del aggregator CrowdRiff). Hallazgo #13
   * del audit (2026-05-05).
   *
   * El flow OAuth real está bloqueado por infra externa: cada plataforma
   * requiere registro de app de developer + scopes + manejo de refresh
   * tokens. Ver `.planning/2026-05-06-social-oauth-handoff.md` para la
   * lista de credenciales que el operador (Rubén) debe crear.
   *
   * El schema vive aquí para que el endpoint `/api/oauth/[platform]/callback`
   * (cuando se implemente) tenga dónde persistir los tokens y el editor
   * sepa el "connection state" del kiosk.
   */
  socialOauth: z
    .object({
      instagram: SocialOauthTokenSchema,
      facebook: SocialOauthTokenSchema,
      tiktok: SocialOauthTokenSchema,
      x: SocialOauthTokenSchema,
    })
    .default({
      instagram: defaultSocialOauthToken(),
      facebook: defaultSocialOauthToken(),
      tiktok: defaultSocialOauthToken(),
      x: defaultSocialOauthToken(),
    }),
});
export type IntegrationsConfig = z.infer<typeof IntegrationsConfigSchema>;

export function defaultIntegrations(): IntegrationsConfig {
  return {
    api: { baseUrl: '' },
    mapbox: { token: '' },
    analytics: { gaId: '' },
    weather: { provider: 'open-meteo', apiKey: '', city: '', units: 'metric' },
    satisfi: { apiKey: '', hubId: '' },
    tavus: { apiKey: '', replicaId: '', personaId: '' },
    bandwango: { apiKey: '', partnerId: '' },
    crowdriff: { apiKey: '', galleryId: '' },
    viator: { apiKey: '', partnerId: '' },
    socialOauth: {
      instagram: defaultSocialOauthToken(),
      facebook: defaultSocialOauthToken(),
      tiktok: defaultSocialOauthToken(),
      x: defaultSocialOauthToken(),
    },
  };
}
