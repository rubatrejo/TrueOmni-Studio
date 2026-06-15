# PLAN — Servir los assets fs de `clients/*` desde Blob/estático

> Deuda de infra del audit `STUDIO-AUDIT-2026-06-09`. **Fix de fondo del cap de
> 250 MB de la lambda de Vercel.** Sesión dedicada — NO meter en un remate de
> sesión: cambia cómo se sirve CADA imagen en prod para TODOS los clientes
> (blast radius máximo). Creado 2026-06-15.

## Contexto / por qué

- La lambda `api/studio/clients` (y los catch-all de assets) cargan **~190 MB**
  porque el file-tracer de Next incluye `clients/*/assets/**` (los routes hacen
  `fs.readFile(process.cwd()/clients/<slug>/assets/...)`). Cualquier dep nativa
  nueva (pasó con `sharp`) revienta el cap de 250 MB → deploy ERROR.
- Los uploads de runtime del Studio YA van a Blob (F-PWA-3). Lo que queda en el
  fs son los assets **seed/commiteados** de cada cliente.

## Estado actual (mapa verificado 2026-06-15)

- Catch-all que sirven assets fs (3):
  - `src/app/assets/[...path]/route.ts` (kiosk; `clients/<KIOSK_CLIENT>/assets/*`, fallback a `default`)
  - `src/app/signage-assets/[client]/[...path]/route.ts`
  - `src/app/video-wall-assets/[client]/[...path]/route.ts`
- `src/lib/asset-url.ts` → `resolveAssetUrl(raw)`: relativo `assets/x` → `/assets/x`; http/`/`/`data:`/`blob:` pass-through. God node (consumido por ~50 componentes PWA + kiosk + signage).
- Blob hoy: `@vercel/blob` `put` en `upload/route.ts`, `placeholder-generate.ts`, `materialize-images.ts`. Prefijos `kiosks/<slug>/...`, `signage/<slug>/...`. GC por cliente en `blob-gc.ts`.
- `next.config.mjs:38-43` `outputFileTracingExcludes` excluye solo libvips musl.

## Estrategia recomendada (incremental, reversible)

Cutover en 3 fases con fallback, para que NUNCA se rompa prod:

### Fase 1 — Blob-aware con fallback a fs (additivo, cero riesgo)

- Migrar los 3 catch-all a: **intentar Blob primero** (pathname determinista
  `clientassets/<slug>/<relpath>`), y si 404 → `fs.readFile` actual.
- Script `scripts/migrate-client-assets-to-blob.mjs`: sube `clients/*/assets/**`
  a Blob bajo `clientassets/<slug>/<relpath>` (idempotente: `head` antes de `put`).
- En este punto nada cambia para el usuario; los assets se sirven igual (fs),
  pero ya existen en Blob. Verificable cliente por cliente.

### Fase 2 — Cortar a Blob + redirect (verificación en prod)

- Que los catch-all hagan `redirect(308)` o stream desde Blob (no fs) cuando el
  blob existe. Verificar en prod que todas las imágenes cargan (revisor-visual /
  agent-browser sobre kiosk + PWA + signage de `default` y un cliente real).

### Fase 3 — Excluir assets del tracing (el ahorro real)

- Una vez confirmado que el 100% de assets se sirven desde Blob:
  `outputFileTracingExcludes['*'] += ['./clients/**/assets/**']`.
- Esto saca los ~190 MB de las lambdas → cap holgado.
- **Punto de no retorno:** si un asset no estaba en Blob, su `fs.readFile`
  fallará en prod (el archivo ya no viaja en la lambda). Por eso Fase 1+2 deben
  estar 100% completas y verificadas antes.

## Decisiones abiertas (resolver al arrancar)

- ¿`redirect(308)` a la URL pública del Blob vs stream/proxy desde la lambda?
  - redirect = lambda mínima, pero expone el dominio `*.blob.vercel-storage.com`
    y añade un round-trip. stream = oculta el origen pero la lambda lee el blob
    (sigue siendo poco peso, no infla el bundle).
  - Recomendación inicial: `redirect(308)` (más barato, el bundle es lo que importa).
- ¿Mantener `clients/*/assets/**` en el repo (seed) o sacarlos también del git?
  - Mantenerlos en git como fuente de verdad; Blob es solo el canal de servido.
- ¿`resolveAssetUrl` cambia? No debería: sigue devolviendo `/assets/...`; el
  cambio es interno al catch-all (de fs a Blob).

## Verificación / done

- Cada fase: `typecheck` + `lint` + `validate:configs` + tests.
- Fase 2: QA visual en prod (kiosk + PWA + signage) — todas las imágenes cargan.
- Fase 3: deploy READY + medir el tamaño de la lambda `api/studio/clients`
  (debe bajar de ~190 MB) + re-verificar imágenes en prod.
- Rollback: revertir el commit de Fase 3 restaura el fallback a fs (los archivos
  siguen en el repo).

## Pendientes relacionados (no bloquean)

- GC de huérfanos en cliente VIVO (blobs ya no referenciados): herramienta con
  **dry-run** que cruza `list(kiosks/<slug>/)` contra las URLs referenciadas en
  KV (config kiosk + pwa + content + branding + signage). Report-only por
  default; borrar solo con `?confirm=true`. Riesgo de falso positivo → exige
  recolección exhaustiva de referencias.
