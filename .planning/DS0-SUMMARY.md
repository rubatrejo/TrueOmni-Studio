# DS0-SUMMARY.md — Bootstrap del módulo Signage

**Fecha:** 2026-05-06
**Estado:** ✅ completado, listo para commit (pendiente aprobación de Rubén)
**Plan ejecutado:** `.planning/DS0-PLAN.md`

---

## Hecho

### 1. Folder `clients-signage/` (paralelo a `clients/`)

- `clients-signage/_template/` con files mínimos válidos por Zod:
  - `client.json` (slug, name, locale `en`, timezone `America/Phoenix`, location Phoenix, branding mínimo, header position=`top` height=80, displays=['lobby-tv'])
  - `tokens.css` con paleta `--signage-*` (brand-primary dark blue #003F7E, secondary cyan, accent naranja, surface white, header-bg + accents por módulo)
  - `events.json` (5 placeholders coincidentes con los eventos visibles en SVG `01-full-events`)
  - `social.json` (6 posts Instagram + featured tweet con shape Jane Doe del SVG `08-video-social`)
  - `news.json` (source `manual` con 2 items + rotationIntervalSec=8 — coincide con SVG `06-video-news-ad`)
  - `i18n/{en,es}.json` con namespace `signage.*` (placeholder + header.day.\* + modules.title)
  - `displays/_template/display.json` (settings 1080p + audio off + cut transition + playlist vacío)

- `clients-signage/default/` clonado del template con un display real:
  - `displays/lobby-tv/display.json` (settings + playlist vacío para que DS2 lo rellene)

### 2. Schema Zod (`src/lib/signage/schema.ts`)

- `SignageHeaderSchema` con `position: 'top'|'bottom'` (constraint nuevo) + height 80|100|120 + layout 3 presets + background discriminated union (color/gradient/image) + toggles + clockFormat + weatherUnits + forecastDays 0|3|5
- `SignageBrandingSchema`, `SignageLocationSchema`
- `SignageDisplaySettingsSchema` con sleepSchedule opcional
- `SignageSlideScheduleSchema` (always | hours | date-range con daysOfWeek + start/end + hideOutsideSchedule)
- `SignageModuleInstanceSchema` discriminated union de **6 módulos**: events, social, video-image, ads, news, weather (cada uno con shape mínima forward-compatible — DS3..DS10 los refinan sin breaking)
- `SignageNewsSourceSchema` discriminated union manual | rss | api + `SignageNewsConfigSchema` (source + rotationIntervalSec)
- `SignageSlideSchema`, `SignageDisplayConfigSchema`
- `SignageClientFileSchema` + `SignageClientResolvedSchema` (extiende con events/social/news cargados)
- Tipos `z.infer` exportados para todo el repo

### 3. Loader fs-only (`src/lib/signage/config.ts`)

- `loadSignageClient(slug)`: lee `client.json` + `events.json` + `social.json` + `news.json`, valida con Zod, fallback a `default` si el slug no existe (mismo patrón del kiosk `client-tokens.ts`).
- `loadSignageDisplay(client, display)`: lee `displays/<display>/display.json`. Sin fallback automático — devuelve null si no existe (la página usa `notFound()`).
- `loadSignageTokensCss(slug)`: contenido raw para inyectar como `<style>` en el layout del runtime.
- Cacheado por render con `cache()` de React.
- Marcado `'server-only'` para evitar leak a cliente.

### 4. KV keys (`src/lib/signage/kv-keys.ts`)

Constantes listas para Fase Studio (DSS0+): `signage:client:<slug>`, `signage:display:<c>:<d>`, `signage:displayRaw:...`, `signage:cfgSnap:...`, `signage:cfgSnapList:...`, `signage:events:<c>`, `signage:social:<c>`, `signage:news:<c>`. NO se usan en DS0.

### 5. Tailwind extension (`tailwind.config.ts`)

Bloque `signage` añadido en `theme.extend.colors` mapeando `hsl(var(--signage-*))` para 24 tokens (brand-primary/secondary/accent/neutral, surface/surface-alt/surface-dark, stage-bg, text/text-muted/text-on-brand/text-on-dark, header-bg/header-text, 6 accents por módulo, border, ring, success, warning, destructive). Cero modificación al kiosk existente.

### 6. Componente `<SignageStage>` (`src/components/signage/stage/SignageStage.tsx`)

- 'use client'
- Wrapper canvas 1920×1080 fijo + `transform: scale(N)` calculado por viewport
- `Math.min(width/1920, height/1080)` → letterbox uniforme preservando aspect
- Listener resize + ResizeObserver con cleanup
- Background del contenedor = `hsl(var(--signage-stage-bg))` (letterbox tokenizado)
- `transformOrigin: center` (la tarjeta queda centrada al escalar, encaja con `place-items-center`)
- Cero handlers touch/pointer/keyboard
- Prop `debug` opcional con overlay scale (útil para QA visual)

### 7. Placeholder runtime (`src/components/signage/runtime/SignagePlaceholder.tsx`)

Cliente component que renderea metadata del cliente y display dentro del SignageStage:

- Header con bg `hsl(var(--signage-header-bg))` y text `hsl(var(--signage-header-text))`, mostrando nombre del cliente y reloj con timezone+locale aplicados.
- Body con tarjeta de info (slug client, slug display, locale, timezone, header position, forecast days, target resolution, audio, slides count, default duration).
- Reloj refresca cada 1s con `Intl.DateTimeFormat`.
- Cero handlers touch.

Será reemplazado por `<SignagePlayer>` en DS2 y por templates pixel-perfect en DS3..DS10.

### 8. Route group `(signage)` y rutas

- `src/app/(signage)/signage/[client]/[display]/layout.tsx`: server component async que carga `loadSignageTokensCss(client)` e inyecta `<style data-signage-tokens>` en el árbol del display. Las variables `--signage-*` quedan disponibles para los hijos.
- `src/app/(signage)/signage/[client]/[display]/page.tsx`: server component async que carga client + display en paralelo, llama `notFound()` si falla, y renderea `<SignageStage><SignagePlaceholder /></SignageStage>`. Soporta query `?debug=1` para mostrar overlay de scale.
- `dynamic = 'force-dynamic'` heredado del root layout — runtime fs read funciona en cada request.

### 9. Designs templates (`designs/signage/`)

- 8 SVGs + 8 PNGs del usuario depositados con naming `NN-<name>.{svg,png}`:
  - `01-full-events`, `02-full-ad`, `03-full-video-image`, `04-video-events-ad`, `05-video-2ads`, `06-video-news-ad`, `07-video-social-ad`, `08-video-social`
- `_template.md` con plantilla de specs (header común, slots, tokens, i18n, notas).
- `_coverage-template.md` con checklist pixel-perfect (groups, paths, tokens, no-touch, diff visual, audit).

### 10. Planning docs

- `.planning/SIGNAGE-PROJECT.md` — visión.
- `.planning/SIGNAGE-ROADMAP.md` — milestone Local (DS0..DS15) + Studio (DSS0..DSS9).
- `.planning/DS0-PLAN.md` — plan ejecutado.
- `.planning/DS0-SUMMARY.md` — este doc.

---

## Verificado

| Check                                                                      | Resultado                                                                                                                                             |
| -------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm typecheck`                                                           | ✅ limpio                                                                                                                                             |
| `pnpm lint` (signage files)                                                | ✅ cero issues nuevos (errores preexistentes en kiosk no afectados)                                                                                   |
| `pnpm kiosk:dev` arranca limpio                                            | ✅ Ready in 1.4s (regla CLAUDE.md sec 9)                                                                                                              |
| GET `/signage/default/lobby-tv`                                            | ✅ HTTP 200 (595KB, contiene "Signage runtime", "signage-tokens" inyectado, tokens visibles, "Default Signage Client", "Lobby TV", "America/Phoenix") |
| GET `/signage/no-existe/no-existe`                                         | ✅ HTTP 404                                                                                                                                           |
| GET `/signage/default/no-existe`                                           | ✅ HTTP 404                                                                                                                                           |
| Cero `onClick`/`onTouchStart`/`onPointerDown`/`onKeyDown` en árbol signage | ✅ grep limpio                                                                                                                                        |
| Cero hex hardcoded en `src/components/signage/` y `src/app/(signage)/`     | ✅ grep limpio                                                                                                                                        |
| Cero tokens del kiosk (`bg-primary`, `text-foreground`, etc.) en signage   | ✅ grep limpio                                                                                                                                        |
| Tokens `--signage-*` resueltos en runtime                                  | ✅ verificable en HTML retornado                                                                                                                      |

Pendiente verificación visual manual en navegador (Rubén): viewport 1920×1080 → stage llena pantalla; viewport 3840×2160 → escala 2x sin pixelar; viewport ultrawide → letterbox negro.

---

## Decisiones tomadas

- **Tokens del kiosk y signage coexisten en el árbol** — el root `src/app/layout.tsx` sigue inyectando `<style data-kiosk-tokens>` con `--brand-*` etc.; el layout signage añade `<style data-signage-tokens>` con `--signage-*`. Cero colisión porque los prefijos son distintos. Bonus: si en algún momento queremos componentes shared (ej: error boundaries), funcionan sin más.
- **Fallback de cliente con slug preservado** — `loadSignageClient('foo')` cuando `foo` no existe retorna config de `default` pero conserva el slug solicitado en el resultado, para que el runtime sepa qué pidió y pueda mostrarlo en logs.
- **Tipos forward-compatible en módulos** — los 6 módulos del Zod tienen shape mínima válida con defaults via `.default(...)`. Las sub-fases de template (DS3+) refinan sin breaking. Esto evita refactor del schema cada sub-fase.
- **`SignageStage` usa `place-items-center` y `transformOrigin: center`** — facilita el QA visual: la tarjeta escalada queda visualmente centrada en cualquier viewport.
- **Cero KV en DS0** — los loaders son fs-only, las kv-keys quedan listas pero sin uso. La transición a KV se hace en DSS0 sin cambio de firma pública.

---

## Pendiente / siguiente

1. **Verificación visual manual de Rubén** en navegador (1080p, 4K, ultrawide).
2. **Commit propuesto** — `feat(signage): bootstrap del módulo Digital Displays (DS0)` (esperando autorización de Rubén).
3. **Marcar DS0 [x] en `.planning/SIGNAGE-ROADMAP.md`** post-commit.
4. **Actualizar `.planning/STATE.md`** con entrada de la sesión (vía `/terminar`).
5. **Siguiente sub-fase: DS1** — `<SignageHeader>` pixel-perfect (logo + 5-day weather + clock + position toggle). Necesita el SVG del header que vive embedded en cada uno de los 8 templates (extracción del group del header del SVG).

---

## Riesgos / observaciones para futuras sub-fases

- **Carga dinámica de tokens.css por slug** ya funciona (vía layout `[client]/[display]/layout.tsx`). NO necesita estrategia adicional cuando entren más clientes fs.
- **`loadSignageDisplay` no hace fallback automático a un display de otro cliente**. Esto es intencional — un slug de display debería estar dentro del cliente al que pertenece. La mini-fallback que sí existe (cliente cayó a default → buscar el display en `default/displays/<displaySlug>`) cubre el caso edge donde el operador linkea un slug "lobby-tv" y solo existe en default.
- **Auditor white-label NO está extendido aún** para detectar `--signage-*` válidos. En DS0 no hay módulos suficientes para que importe; lo extiendo en una sub-fase tardía o cuando aparezca primera violación. Hoy el grep manual sustituye.
- **i18n no se consume en DS0** — los `en.json` y `es.json` están listos pero `<SignagePlaceholder>` no los lee aún. DS1 (header) los conecta vía `I18nProvider` cuando renderee `signage.header.day.*`.
