# Social Wall OAuth — handoff a Rubén

**Hallazgo #13 audit Studio (2026-05-05) · estado: schema preparado, activación requiere app credentials**

El audit marcó este hallazgo como "XL+ por plataforma · spec separado" porque cada red social tiene su propio flow de OAuth, scopes y handling de refresh tokens. El código del Studio está preparado (schema + UI placeholder) pero el flow real requiere que crees las apps de developer.

Este doc lista exactamente qué necesitas hacer en cada plataforma para activar el flow.

---

## Estado actual del código

### Schema (✅ listo)

`src/lib/studio/schema.ts` añade `integrations.socialOauth.{instagram,facebook,tiktok,x}` con shape:

```ts
{
  connected: boolean,
  accessToken: string,        // ofuscado en UI
  refreshToken: string,       // cuando la plataforma lo soporta
  expiresAt: string,           // ISO timestamp
  scopes: string[],
  handle: string,              // @username conectado
}
```

`defaultSocialOauthToken()` devuelve el shape vacío inicial.

### UI (🟡 placeholder)

`SocialWallEditor.tsx` muestra un Group **"OAuth feeds (preview)"** con 4 botones disabled (Instagram / Facebook / TikTok / X). El tooltip de cada botón apunta a este doc.

Cuando las credenciales estén configuradas, sustituir el `disabled` por un `onClick` que dispare:

```ts
window.location.href = `/api/oauth/${platform}/start?slug=${kioskSlug}`;
```

### Endpoints (⏳ pendientes)

A crear:
- `src/app/api/oauth/[platform]/start/route.ts` — redirect al consent screen.
- `src/app/api/oauth/[platform]/callback/route.ts` — recibe el code, intercambia por tokens, persiste en KV bajo `integrations.socialOauth.{platform}`.
- `src/app/api/oauth/[platform]/refresh/route.ts` — usa refreshToken cuando expiresAt < now.

Todos validan session (NextAuth) + `STUDIO_ADMIN_EMAILS`.

---

## Lo que necesito de ti, Rubén

Para cada plataforma necesito **`{PLATFORM}_CLIENT_ID`** y **`{PLATFORM}_CLIENT_SECRET`** en `.env.local` y en Vercel (Production + Preview, no Development).

### 1. Instagram (vía Meta — Instagram Basic Display API)

⚠️ Meta deprecated Instagram Basic Display el 2024-12-04. Para producción nueva hay que usar **Instagram Graph API** (cuenta Business obligatoria).

1. Ir a https://developers.facebook.com/apps → Create App → tipo **Business**.
2. Add Product → **Instagram Graph API**.
3. Settings → Basic → copiar `App ID` (= `INSTAGRAM_CLIENT_ID`) y `App Secret` (= `INSTAGRAM_CLIENT_SECRET`).
4. Instagram → Basic Display → Add OAuth Redirect URI:
   - Local: `http://localhost:3000/api/oauth/instagram/callback`
   - Prod: `https://trueomni-studio.vercel.app/api/oauth/instagram/callback`
5. Scopes mínimos: `instagram_basic`, `pages_show_list`, `instagram_manage_insights` (si quieres engagement metrics).
6. App Review: scopes públicos requieren Meta Business Verification + privacy policy URL pública.

**Tiempo estimado:** 2-4h (incluye Business verification si la app es nueva).

### 2. Facebook Pages (vía Meta — Graph API)

Reusa la misma app de Instagram. Permisos extra:

1. Same Meta app.
2. Add Product → **Facebook Login**.
3. OAuth redirect: `https://trueomni-studio.vercel.app/api/oauth/facebook/callback`
4. Scopes: `pages_read_engagement`, `pages_show_list`, `public_profile`.
5. Variables en .env: `FACEBOOK_CLIENT_ID` (= App ID), `FACEBOOK_CLIENT_SECRET` (= App Secret).

App review necesario para `pages_*` scopes en producción.

**Tiempo estimado:** 1-2h adicionales (la app de Meta ya existe).

### 3. TikTok (TikTok for Developers)

1. Ir a https://developers.tiktok.com/apps → Create app.
2. Verificar identidad (puede tomar 1-3 días).
3. Add product → **Login Kit** + **Display API**.
4. Sandbox URL: `http://localhost:3000/api/oauth/tiktok/callback`.
5. Production URL: `https://trueomni-studio.vercel.app/api/oauth/tiktok/callback`.
6. Scopes: `user.info.basic`, `video.list`.
7. Variables: `TIKTOK_CLIENT_KEY`, `TIKTOK_CLIENT_SECRET`.

⚠️ TikTok solo permite owners de la cuenta loguearse — no se puede ingerir posts de cuentas ajenas sin que el dueño autorice. Para feeds de terceros usar oEmbed (sin OAuth) o pegar URLs manualmente.

**Tiempo estimado:** 3-7 días incluyendo verificación de identidad.

### 4. X (formerly Twitter)

⚠️ **Costo:** la API de X dejó de ser gratuita el 2023-04. El plan Basic ($100/mes) permite 10k tweets/mes en lectura; el Free tier solo permite escritura, no lectura del timeline. Si no vas a pagar, **omite X** y mantén el botón disabled — los kiosks pueden usar embed widgets (sin OAuth).

Si vas a pagar:

1. https://developer.x.com/en/portal/dashboard → Create project + app.
2. User authentication settings → Type: **Web App** + **Read** scope.
3. Callback URL: `https://trueomni-studio.vercel.app/api/oauth/x/callback`.
4. Variables: `X_CLIENT_ID`, `X_CLIENT_SECRET`.
5. Scopes: `tweet.read`, `users.read`, `offline.access` (refresh tokens).

**Tiempo estimado:** 1h + setup de billing.

---

## Implementación recomendada cuando tengas las credenciales

Recomiendo integrar **NextAuth** (ya en uso para el login al Studio) en lugar de implementar OAuth a mano:

```ts
// src/app/api/auth/[...nextauth]/route.ts
import InstagramProvider from 'next-auth/providers/instagram';
import FacebookProvider from 'next-auth/providers/facebook';
// TikTok y X requieren provider custom (no son built-in en NextAuth)
```

Para TikTok: https://github.com/nextauthjs/next-auth/discussions/4849 (custom provider).
Para X (v2 OAuth 2.0): https://next-auth.js.org/providers/twitter (Twitter v2 está soportado).

El callback de NextAuth puede escribir directo al `integrations.socialOauth.{platform}` del KV via PATCH al endpoint del Studio.

**Estimación implementación:** 4-6h una vez que las 4 apps de developer existan.

---

## Alternativa sin OAuth (recomendada para v1)

Mientras tanto, **CrowdRiff** (ya cableado en el Studio) actúa como aggregator de las 4 plataformas con un solo API key. Es el flow que usan la mayoría de DMOs (Visit Phoenix, Visit Florida, etc.). Entrega:

- Posts con foto/video.
- Engagement metrics.
- Sin OAuth — el operador de la cuenta CrowdRiff los ingiere.

Coste: ~$500-2000/mes según volumen. Si el cliente final ya tiene CrowdRiff, simplemente pones el API key en `Integrations → CrowdRiff` y el Social Wall lo consume sin tocar el OAuth flow nuestro.

**Recomendación:** mantener OAuth como feature opcional para clientes que quieran auto-ingestion de SUS propias cuentas (handle único), y dejar CrowdRiff como el path por default.

---

## Próximos pasos

1. Decidir: ¿OAuth propio o CrowdRiff-only para v1?
2. Si OAuth propio: crear las 4 apps de developer siguiendo arriba (~5-10 días total con verificaciones).
3. Pasarme las 8 envvars (4 client_id + 4 client_secret).
4. Yo implemento los 12 endpoints (start/callback/refresh × 4 plataformas) + cableo NextAuth providers.
5. Smoke por plataforma: connect → ingestion → disconnect.

**Última revisión:** 2026-05-06 · responsable: Rubén (`ruba.trejo@gmail.com`)
