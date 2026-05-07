# DS14-PLAN.md — Audio toggle + Sleep schedule + i18n strings

Atomic plan ejecutable en sesión fresca. Cierra los 3 polish-features que
faltan antes del gate del Milestone Local.

```xml
<task type="auto">
  <name>DS14 — Audio toggle global · Sleep schedule overlay · i18n strings de signage modules</name>
  <files>
    src/lib/signage/i18n.ts                                   (NUEVO — loader fs-only del bag por locale)
    src/components/signage/i18n/SignageI18nProvider.tsx       (NUEVO — context + useSignageT)
    src/components/signage/runtime/SignageRuntime.tsx          (recibe i18n bag + envuelve con provider + sleep gate)
    src/components/signage/runtime/SignageSleepGate.tsx        (NUEVO — overlay black-screen client cuando sleep activo)
    src/components/signage/player/SignagePlayer.tsx            (placeholders via t())
    src/components/signage/templates/03-full-video-image.tsx   (muted={!display.settings.audio})
    src/app/(signage)/signage/[client]/[display]/page.tsx     (loadSignageI18n + pasar al runtime)
    clients-signage/_template/i18n/en.json                     (extender claves DS14)
    clients-signage/_template/i18n/es.json                     (extender claves DS14)
    clients-signage/default/i18n/en.json                       (mismo)
    clients-signage/default/i18n/es.json                       (mismo)
    clients-signage/default/displays/lobby-tv/display.json     (sleepSchedule de prueba)
    .planning/DS14-SUMMARY.md
    .planning/SIGNAGE-ROADMAP.md
  </files>
  <action>
    ## 1. i18n
    1.1. `src/lib/signage/i18n.ts`:
         - `loadSignageI18n(slug: string, locale: string): Promise<Record<string,string>>`
         - Lee `clients-signage/<slug>/i18n/<locale>.json`. Fallback a `<slug>/i18n/en.json`.
           Fallback final a `default/i18n/en.json`. Cachea con `cache()`.
         - Server-only.
    1.2. `src/components/signage/i18n/SignageI18nProvider.tsx`:
         - Client component. `<SignageI18nProvider bag locale>{children}</SignageI18nProvider>`.
         - Context React. Hook `useSignageT()` → `(key, fallback?) => string`.
         - Si key no existe: retorna `fallback ?? key`.
    1.3. Reemplazar strings hardcoded en `<SignagePlayer>`:
         - "No slides configured" → key `signage.runtime.no_slides.title`
         - "Add slides to displays/..." → key `signage.runtime.no_slides.body`
         - "No active slides at this time" → key `signage.runtime.no_active.title`
         - "All scheduled slides..." → key `signage.runtime.no_active.body`
         - "Unknown template" → key `signage.runtime.unknown_template.title`
    1.4. Extender `_template/i18n/en.json` + `default/i18n/en.json` con nuevas claves.
         Idem `es.json`.

    ## 2. Audio toggle
    2.1. Template 03 lee `display.settings.audio`. `muted={!display.settings.audio}`.
         Default permanece `false` (signage no-touch sin audio por defecto).
    2.2. Documentar en CLAUDE.md / SIGNAGE-PROJECT.md que cuando el cliente
         active audio:true debe asegurar que el navegador permite autoplay con
         sound (típicamente solo OK con interacción previa o flag `--autoplay-policy=no-user-gesture-required` en kioskos Chromium).

    ## 3. Sleep schedule
    3.1. `src/components/signage/runtime/SignageSleepGate.tsx` (client):
         - Props: `sleepSchedule: SignageDisplaySettings['sleepSchedule']`, `timezone`.
         - useState `isAsleep`. useEffect tick alineado al minuto (reusa
           `msUntilNextMinute`).
         - Si sleepSchedule.enabled && wall-clock ∈ window → render
           `<div className="absolute inset-0 z-50 bg-black" aria-hidden />`.
         - Reusa `isInTimeWindow` (export desde `src/lib/signage/schedule.ts`).
    3.2. `<SignageRuntime>` envuelve el children con `<SignageSleepGate>`
         si `display.settings.sleepSchedule?.enabled`. El gate va por encima
         del header — un display dormido es uniformemente negro.
    3.3. `display.json` default: añadir `sleepSchedule.enabled: false` pero con
         start/end definidos para QA. El usuario puede activar manualmente para
         probar.

    ## 4. Página
    4.1. `page.tsx`: `loadSignageI18n(clientSlug, clientCfg.locale)` paralelo
         con weather. Pasar bag al runtime.
    4.2. `<SignageRuntime>` recibe `i18nBag` y `locale`, envuelve el children
         con `<SignageI18nProvider>`.

    ## 5. Out of scope
    No tokenizar las strings dinámicas que vienen del JSON del cliente
    (events.title, news.title, social.caption — esos son data, no UI).
    El "Local News" badge del news ticker viene del news.json del cliente,
    no se tokeniza aquí.
  </action>
  <verify>
    - `pnpm typecheck` ✅ limpio.
    - `pnpm exec eslint` archivos tocados ✅.
    - `pnpm kiosk:dev` arranca limpio.
    - Smoke i18n: cambiar `clients-signage/default/client.json` `locale: "es"` →
      placeholders y "No active slides" en español. Restaurar a `en`.
    - Smoke audio: `display.settings.audio: true` + visitar slide 03 con video real
      → audio audible (si el navegador deja). Restaurar a false.
    - Smoke sleep: configurar `sleepSchedule.enabled: true` start/end cubriendo
      ahora → screen black total. Restaurar enabled:false.
    - Cero touch handlers, cero hex hardcoded.
  </verify>
  <done>
    - 5 placeholders del runtime tokenizados.
    - Audio del template 03 respeta settings.audio.
    - Sleep gate funcional con re-eval por minuto.
    - i18n bag llega al runtime con fallback a en y a default.
    - Aprobación visual de Rubén ✅.
    - DS14 marcado ✅ en SIGNAGE-ROADMAP.md.
  </done>
</task>
```

## Notas de diseño

- **El gate va sobre el header**: un display dormido se comporta como apagado.
  Si el cliente quiere "screen muy dimmed" en lugar de black, sería v2.
- **i18n como bag plano** vs nested: schema actual es `Record<string, string>`
  con keys puntuadas. Mantener consistente. Sin pluralización en v1.
- **Provider client-side**: el bag se carga server-side y se pasa serializado
  al provider. El runtime ya es client en su mayor parte (player, sleep gate),
  el provider es trivial.
- **Audio default false**: kiosko en lobby/airport no debe sorprender con audio.
  El toggle es per-display (no por slide) — si el cliente quiere video con
  sonido, configura `audio:true` y solo ese display lo reproduce.

## Out of scope (DS15)

- Smoke E2E + gate del Milestone Local (5 min sin leak en dev + aprobación
  visual final).
