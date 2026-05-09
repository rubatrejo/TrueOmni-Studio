# DS14-SUMMARY.md — Audio toggle + Sleep schedule + i18n

**Fecha:** 2026-05-07
**Estado:** ✅ aprobado visualmente

## Hecho

### 1. i18n signage

- **`src/lib/signage/i18n.ts`** (nuevo): `loadSignageI18n(slug, locale)` server-only,
  cascada de fallbacks `slug+locale → slug+en → default+locale → default+en`,
  merge con prioridad inversa, `cache()` por petición.
- **`src/components/signage/i18n/SignageI18nProvider.tsx`** (nuevo):
  client component, context React, hooks `useSignageT()` y `useSignageLocale()`.
  `t(key, fallback?)` retorna `bag[key] ?? fallback ?? key`.
- **`SignagePlayer`** ahora usa `t()` para 5 strings (no_slides title/body,
  no_active title/body, unknown_template title) — antes hardcoded en EN.
- **i18n bags extendidos** en `_template/i18n/{en,es}.json` y
  `default/i18n/{en,es}.json` con las 5 keys nuevas.
- **`page.tsx`** carga `i18nBag` paralelo con weather. `<SignageRuntime>` recibe
  el bag y envuelve todo con `<SignageI18nProvider>`.

### 2. Audio toggle global

- **Template 03 (`03-full-video-image`)**: cuando el asset es video, el `<video>`
  respeta `muted={!display.settings.audio}`. Default `audio:false` (signage en
  lobby/airport no debe sorprender).
- Solo template 03 tiene `<video>` real (los otros templates con "video" en el
  nombre usan imágenes estáticas como mock).

### 3. Sleep schedule

- **`<SignageSleepGate>`** (nuevo, client) lee `display.settings.sleepSchedule`,
  evalúa cada minuto alineado al boundary HH:MM:00 (reusa `msUntilNextMinute`).
  Si dentro de la ventana → renderiza overlay `absolute inset-0 z-50 bg-black`
  (cubre header + body uniformemente).
- **`isInSleepWindow(now, timezone, start, end)`** exportado en
  `src/lib/signage/schedule.ts` (reusa la lógica `isInTimeWindow` con wrap
  medianoche que ya existía para dayparting).
- **`<SignageRuntime>`** ahora envuelve el flex en `relative` y monta el
  `<SignageSleepGate>` como hermano del header+body para que el overlay funcione.

### 4. Fix hydration mismatch (locale `es`)

- **Bug detectado durante QA**: `Intl.DateTimeFormat` con locale `es-ES` puede
  devolver caracteres Unicode whitespace distintos entre el ICU del Node
  (server) y el del navegador (client) — típicamente NBSP (U+00A0) ↔ narrow
  no-break space (U+202F) ↔ thin space (U+2009) en strings como "11:00 a. m.".
  Provocaba `Hydration failed because the server rendered text didn't match
the client` en `<text fontSize="20">` del template events y en el clock del
  header.
- **Fix**: helper `normalizeIntlWhitespace(str)` exportado en
  `src/lib/signage/dates.ts` que reemplaza los 3 caracteres por space ASCII.
  Aplicado en `formatSignageClock`, `formatSignageDate`, `formatDayAbbr`
  (header), `formatDayLabel` + `formatTime` de templates 01 y 04.
- **Resultado**: hydration limpio en ambos locales, render visualmente idéntico.

## Archivos tocados

| Archivo                                                    | Tipo                                              |
| ---------------------------------------------------------- | ------------------------------------------------- |
| `src/lib/signage/i18n.ts`                                  | NUEVO                                             |
| `src/components/signage/i18n/SignageI18nProvider.tsx`      | NUEVO                                             |
| `src/components/signage/runtime/SignageSleepGate.tsx`      | NUEVO                                             |
| `src/lib/signage/schedule.ts`                              | export `isInTimeWindow` + `isInSleepWindow`       |
| `src/lib/signage/dates.ts`                                 | export `normalizeIntlWhitespace` aplicado a 3 fns |
| `src/components/signage/runtime/SignageRuntime.tsx`        | i18n provider + sleep gate                        |
| `src/components/signage/player/SignagePlayer.tsx`          | `t()` en 5 placeholders                           |
| `src/components/signage/templates/01-full-events.tsx`      | normalizeIntlWhitespace                           |
| `src/components/signage/templates/04-video-events-ad.tsx`  | normalizeIntlWhitespace                           |
| `src/components/signage/templates/03-full-video-image.tsx` | `muted={!display.settings.audio}`                 |
| `src/app/(signage)/signage/[client]/[display]/page.tsx`    | loadSignageI18n                                   |
| `clients-signage/_template/i18n/en.json`                   | +5 keys runtime                                   |
| `clients-signage/_template/i18n/es.json`                   | +5 keys runtime                                   |
| `clients-signage/default/i18n/en.json`                     | +5 keys runtime                                   |
| `clients-signage/default/i18n/es.json`                     | +5 keys runtime                                   |
| `clients-signage/default/displays/lobby-tv/display.json`   | sleepSchedule shape                               |

## Verificado

- `pnpm typecheck` ✅ limpio
- `pnpm exec eslint` archivos tocados ✅
- `pnpm kiosk:dev` arranca limpio (`Ready in 1322ms`)
- 4 vectores QA via displays de prueba (creados temporalmente y borrados al cierre):
  - `/signage/default/lobby-tv` → rotación normal con dayparting + transitions, hydration limpio
  - `/signage/default/sleep-demo` (efímero) → pantalla **negra uniforme** sobre header+body, hydration limpio
  - `/signage/default/dayparting-demo` (efímero) → placeholder en **español** "Sin slides activos en este momento" (locale `es`)
  - `/signage/default/dayparting-demo?clock=23:52` (efímero) → slide visible (override afecta dayparting, NO el reloj del header — by design)
- Aprobación visual de Rubén ✅

## Decisiones

- **Whitespace normalization en lugar de `suppressHydrationWarning`**: el flag
  silenciaría el warning sin arreglar la divergencia, dejando posibles bugs
  invisibles. Normalizar es predecible y no escala mal.
- **Override `?clock` NO afecta el reloj del header**: el reloj refleja la
  realidad del visitante. Si el cliente quiere otra hora, ajusta `client.timezone`
  en `client.json`. Documentado en DS13-SUMMARY y reafirmado en DS14 review.
- **Audio default false**: kiosko no-touch en lobby. Si el cliente activa
  `audio:true` debe configurar el navegador del kiosko con flag de autoplay
  con sonido (típicamente `--autoplay-policy=no-user-gesture-required` en
  Chromium).
- **Sleep gate como overlay z-50**: un display dormido es uniformemente negro,
  cubre header + body. Si v2 quiere "dimmed" o "next-event countdown", se
  cablea entonces.
- **i18n bag plano `Record<string,string>`** vs nested object: consistente con
  el sistema del kiosk. Sin pluralización en v1.
- **Fallback en `t()`**: si una key no existe, retorna `fallback ?? key` en
  lugar de tirar excepción. El runtime nunca se rompe por traducción faltante.
- **Sleep gate sólo evalúa si `enabled === true`**: si la config no lo trae,
  el componente no agenda interval — overhead nulo en el hot path.

## Pendiente / siguiente sub-fase

**DS15** — Smoke E2E local + **GATE** del Milestone Local.

- Player corriendo 5 minutos en localhost sin memory leak.
- Diff visual de cada slide en rotación.
- Aprobación visual final con Rubén en pantalla.
- Render verificado en 1080p y 4K.
- Dayparting verificado con `?clock=HH:MM`.
- Audio toggle verificado on/off.
- Sleep gate verificado activando ventana ahora.
