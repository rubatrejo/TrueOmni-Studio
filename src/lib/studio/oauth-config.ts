/**
 * Configuración OAuth por plataforma social. Hallazgo #13 audit Studio
 * (2026-05-05) · activación pendiente de credenciales de developer
 * — ver `.planning/2026-05-06-social-oauth-handoff.md`.
 *
 * Las URLs y scopes son los OFICIALES de cada plataforma a 2026-05-06.
 * Si una plataforma cambia su flow, sólo hay que actualizar este archivo.
 */

export const SOCIAL_PLATFORMS = ['instagram', 'facebook', 'tiktok', 'x'] as const;
export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number];

export interface OAuthConfig {
  platform: SocialPlatform;
  /** Display name para mensajes de error / logs. */
  label: string;
  /** Endpoint de consent screen. */
  authUrl: string;
  /** Endpoint de exchange code → token. */
  tokenUrl: string;
  /** Scopes default cuando el operador hace "Connect". */
  scopes: string[];
  /** envvar name que guarda el client id. */
  clientIdEnv: string;
  /** envvar name que guarda el client secret. */
  clientSecretEnv: string;
  /** Soporta refresh token? IG y X sí; FB long-lived es 60d sin refresh; TikTok sí. */
  supportsRefresh: boolean;
}

export const OAUTH_CONFIGS: Record<SocialPlatform, OAuthConfig> = {
  instagram: {
    platform: 'instagram',
    label: 'Instagram',
    // Instagram Graph API (cuenta Business). Basic Display fue deprecated 2024-12.
    authUrl: 'https://www.facebook.com/v19.0/dialog/oauth',
    tokenUrl: 'https://graph.facebook.com/v19.0/oauth/access_token',
    scopes: ['instagram_basic', 'pages_show_list', 'instagram_manage_insights'],
    clientIdEnv: 'INSTAGRAM_CLIENT_ID',
    clientSecretEnv: 'INSTAGRAM_CLIENT_SECRET',
    supportsRefresh: true,
  },
  facebook: {
    platform: 'facebook',
    label: 'Facebook',
    authUrl: 'https://www.facebook.com/v19.0/dialog/oauth',
    tokenUrl: 'https://graph.facebook.com/v19.0/oauth/access_token',
    scopes: ['pages_read_engagement', 'pages_show_list', 'public_profile'],
    clientIdEnv: 'FACEBOOK_CLIENT_ID',
    clientSecretEnv: 'FACEBOOK_CLIENT_SECRET',
    supportsRefresh: false,
  },
  tiktok: {
    platform: 'tiktok',
    label: 'TikTok',
    authUrl: 'https://www.tiktok.com/v2/auth/authorize/',
    tokenUrl: 'https://open.tiktokapis.com/v2/oauth/token/',
    scopes: ['user.info.basic', 'video.list'],
    clientIdEnv: 'TIKTOK_CLIENT_KEY',
    clientSecretEnv: 'TIKTOK_CLIENT_SECRET',
    supportsRefresh: true,
  },
  x: {
    platform: 'x',
    label: 'X (Twitter)',
    authUrl: 'https://twitter.com/i/oauth2/authorize',
    tokenUrl: 'https://api.x.com/2/oauth2/token',
    scopes: ['tweet.read', 'users.read', 'offline.access'],
    clientIdEnv: 'X_CLIENT_ID',
    clientSecretEnv: 'X_CLIENT_SECRET',
    supportsRefresh: true,
  },
};

export function isSocialPlatform(value: string): value is SocialPlatform {
  return (SOCIAL_PLATFORMS as readonly string[]).includes(value);
}

/**
 * Devuelve `{ ok: true, clientId, clientSecret }` si las credenciales están
 * configuradas en envvars, o `{ ok: false, missing: [...] }` con la lista
 * de envvars que el operador debe añadir.
 */
export function readPlatformCredentials(
  platform: SocialPlatform,
):
  | { ok: true; clientId: string; clientSecret: string }
  | { ok: false; missing: string[] } {
  const cfg = OAUTH_CONFIGS[platform];
  const clientId = process.env[cfg.clientIdEnv] ?? '';
  const clientSecret = process.env[cfg.clientSecretEnv] ?? '';
  const missing: string[] = [];
  if (!clientId) missing.push(cfg.clientIdEnv);
  if (!clientSecret) missing.push(cfg.clientSecretEnv);
  if (missing.length > 0) return { ok: false, missing };
  return { ok: true, clientId, clientSecret };
}

/**
 * Construye el callback URL absoluto para una plataforma. Lee
 * `NEXT_PUBLIC_STUDIO_BASE_URL` (cuando set) o cae al request origin.
 */
export function buildCallbackUrl(platform: SocialPlatform, originFromReq: string): string {
  const base =
    process.env.NEXT_PUBLIC_STUDIO_BASE_URL?.replace(/\/$/, '') ??
    originFromReq.replace(/\/$/, '');
  return `${base}/api/oauth/${platform}/callback`;
}
