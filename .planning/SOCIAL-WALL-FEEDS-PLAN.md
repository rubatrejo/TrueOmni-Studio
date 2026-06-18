# Plan — Social Wall: conectar feeds reales por cliente (CrowdRiff) + iconos solo de redes conectadas

## Context

Hoy los posts del Social Wall son **100% estáticos** del `config.json` del cliente (no hay fetch en runtime). Los tabs/iconos por red se derivan de `config.socialWall.handles` (un `@username` por red), NO de si la red está realmente "conectada". El operador quiere:

1. Cargar **contenido REAL** de las redes de cada cliente.
2. Que en los tabs solo aparezcan los iconos de las redes **conectadas** (no de las que solo tienen un handle escrito).

**Decisión del operador (brainstorming):** usar **CrowdRiff** (agregador de UGC) como fuente, en vez de OAuth directo por plataforma. CrowdRiff ya tiene credenciales cableadas en el schema/editor del Studio (`integrations.crowdriff.{apiKey, galleryId}` → fs `integraciones.crowdriff_*`), pero **nunca se cableó al fetch real** del Social Wall.

### ⚠️ Riesgo de cobertura (confirmar antes de implementar)

CrowdRiff agrega UGC principalmente de **Instagram / Facebook / X / TikTok**. **Normalmente NO cubre YouTube ni Pinterest.** Como el operador pidió IG/X/Pinterest/YouTube, el diseño realista es:

- **CrowdRiff** → IG / X (y FB/TikTok si el gallery los trae).
- **YouTube** → su propia API (YouTube Data API v3 con API key pública; fácil, sin OAuth) — fase 2 opcional.
- **Pinterest** → requiere OAuth/app aprobada; queda fuera de v1 (igual que en el handoff doc).
  Verificar con la cuenta CrowdRiff de Rubén qué redes entrega realmente el gallery antes de prometer las 4.

### Dependencia externa (bloqueante para el adapter)

Falta el **contrato real de la API de CrowdRiff**: endpoint del gallery, header de auth, y shape del JSON de respuesta. Hay que obtenerlo de la cuenta/docs de CrowdRiff de Rubén (o un response de muestra) para escribir el adapter con precisión. El plan asume un adapter aislado y testeado contra un fixture.

## Approach (CrowdRiff-primary, server-side, con fallback)

**Principio:** el `crowdriff.apiKey` es **secreto** → el fetch va **server-side** (nunca al iframe/cliente). Reutilizar el patrón de credenciales existente (`config.integraciones.crowdriff_*`) y el patrón de "dynamic content" de listings (cache + placeholder hidratado).

### 1. Adapter CrowdRiff (nuevo, puro, testeable)

- `src/lib/crowdriff.ts`: `fetchCrowdriffPosts({ apiKey, galleryId })` → llama la API del gallery (con timeout, como `checkTavus` en `api/studio/integrations/check/route.ts`) y mapea cada item de CrowdRiff → **`SocialPost`** (shape en `src/lib/studio/schema/social-wall.ts:28-41`: `source`, `type`, `author{name,username,avatar}`, `publishedAt`, `caption`, `mediaUrl`, `videoPoster`, `galleryUrls`, `aspectRatio`, `permalink`). Mapear el `network`/`source` de CrowdRiff a `SocialSource` (`src/lib/social-sources.ts`). Best-effort: items sin media o de red desconocida se omiten. Devuelve también el **set de sources presentes**.
- Test con fixture (un JSON de muestra de CrowdRiff) en `src/lib/crowdriff.test.ts`.

### 2. API route proxy (nuevo)

- `src/app/api/social-wall/feed/[slug]/route.ts`: lee `config.integraciones.crowdriff_api_key` + `crowdriff_gallery_id` del cliente; si faltan → `204`/`{posts:null}` (señal de "no conectado" → el runtime usa el fallback estático). Si están → llama el adapter, **cachea en KV con TTL ~15 min** (respeta rate limits de CrowdRiff; reusar el patrón KV existente). Devuelve `{ posts: SocialPost[], sources: SocialSource[] }`.

### 3. Runtime: fetch + fallback (modificar `social-wall-module.tsx`)

- Al montar, hacer fetch client-side a `/api/social-wall/feed/<slug>` (patrón de `DynamicListings*Placeholder`/`getCachedListings`).
  - Si devuelve posts → usar esos (`liveposts`) y derivar los **tabs de los `sources` presentes en el feed** = "solo redes conectadas".
  - Si no (no configurado / vacío / error) → **fallback** a `effective.posts` estáticos + tabs por `handles` (comportamiento actual, sin regresión).
- NO romper el override del Studio (el `effective`/cache de hero ya implementado se mantiene). El live feed es ortogonal al override de edición.

### 4. Iconos/tabs solo de redes conectadas (modificar `social-wall-module.tsx:64-68`)

- Cambiar la derivación de `sources`: cuando hay live feed → `sources = distinct(liveposts.map(p => p.source))`. Cuando no → mantener `order.filter(s => Boolean(handles[s]))`. Así los tabs reflejan lo realmente conectado.
- `social-wall-tabs.tsx` / `social-source-icon.tsx` no cambian (ya renderizan la lista de `sources`).

### 5. Editor del Studio (mínimo)

- La card de **CrowdRiff** ya existe en `IntegrationsEditor.tsx` (apiKey + galleryId + health check). Añadir en `SocialWallEditor.tsx` una nota/estado: "Live feed via CrowdRiff — configúralo en Integrations" + (opcional) un indicador de si está conectado. Sin OAuth, sin campos nuevos de credenciales.
- Los `handles` y los posts manuales siguen como **fallback/seed** cuando no hay CrowdRiff.

### 6. (Fase 2, opcional) YouTube directo

- Si se quiere YouTube real: `youtube` integration (API key) + `fetchYoutubePosts(channelId, apiKey)` detrás de la MISMA forma (`SocialPost[]`), mergeado con el feed de CrowdRiff en el API route. Diseñar la interfaz del adapter genérica (`SocialFeedProvider`) para que YouTube/otros entren igual. No bloquea v1.

## Archivos a tocar (representativos)

- **Nuevo** `src/lib/crowdriff.ts` (+ `.test.ts`) — adapter CrowdRiff → `SocialPost[]`.
- **Nuevo** `src/app/api/social-wall/feed/[slug]/route.ts` — proxy server-side + cache KV.
- `src/components/social-wall/social-wall-module.tsx` — fetch live + fallback + tabs por sources presentes.
- `src/app/studio/_components/SocialWallEditor.tsx` — nota de estado "live via CrowdRiff" (mínimo).
- Reutiliza: `config.integraciones.crowdriff_*` (ya existe en schema/publish-merger/editor), `social-sources.ts`, patrón KV cache, `fetchWithTimeout`.

## Verification

1. **Adapter**: test unitario contra un fixture JSON real de CrowdRiff → mapea a `SocialPost[]` correcto + sources.
2. **E2E con cuenta real**: poner `crowdriff_api_key` + `crowdriff_gallery_id` de un cliente de prueba en Integrations → publicar → abrir `/home/social-wall` → ver posts REALES y que los tabs muestren **solo** las redes presentes en el feed.
3. **Fallback**: cliente SIN CrowdRiff → siguen los posts estáticos + tabs por handles (sin regresión). Verificar con `agent-browser` en `pnpm kiosk:dev`.
4. **Cache**: confirmar TTL en KV (no re-fetch en cada carga).
5. `pnpm typecheck` + tests.

## Pendiente de Rubén antes de ejecutar

- **Contrato de la API de CrowdRiff** (endpoint del gallery + auth + sample JSON) — bloqueante para el adapter.
- Confirmar **qué redes** entrega su gallery (¿IG/X sí? ¿YouTube/Pinterest?) para fijar el alcance real de v1.
- API key + gallery ID de un cliente de prueba para el E2E.
