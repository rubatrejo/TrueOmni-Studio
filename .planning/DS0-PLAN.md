# DS0-PLAN.md — Bootstrap del módulo Signage

Atomic plan ejecutable en sesión fresca. Bootstrap del producto Digital Displays:
infra mínima funcional con render placeholder en `/signage/default/lobby-tv`.

```xml
<task type="auto">
  <name>DS0 — Bootstrap del módulo Signage (route group + schema + tokens + stage + loader fs-only + placeholder)</name>
  <files>
    src/app/(signage)/layout.tsx
    src/app/(signage)/signage/[client]/[display]/layout.tsx
    src/app/(signage)/signage/[client]/[display]/page.tsx
    src/components/signage/stage/SignageStage.tsx
    src/lib/signage/schema.ts
    src/lib/signage/config.ts
    src/lib/signage/kv-keys.ts
    clients-signage/_template/client.json
    clients-signage/_template/tokens.css
    clients-signage/_template/events.json
    clients-signage/_template/social.json
    clients-signage/_template/news.json
    clients-signage/_template/i18n/en.json
    clients-signage/_template/i18n/es.json
    clients-signage/_template/displays/_template/display.json
    clients-signage/default/                                    (clon de _template)
    designs/signage/_template.md
    designs/signage/_coverage-template.md
    tailwind.config.ts                                          (extender con signage-*)
    src/app/layout.tsx                                          (importar tokens.css de signage si la ruta lo requiere — verificar)
  </files>
  <action>
    1. Crear `clients-signage/_template/` con files mínimos validables por Zod:
       - `client.json` (slug, name, locale, timezone, location, branding mínimo, header, displays=['lobby-tv'])
       - `tokens.css` con `--signage-*` (paleta dark blue header del XD)
       - `events.json` (3 eventos placeholder con título + fecha + image stub)
       - `social.json` (2 posts placeholder)
       - `news.json` (source: manual, items: 2 placeholder, rotationIntervalSec: 8)
       - `i18n/{en,es}.json` con namespace `signage.*` mínimo (header.weather.fri/sat/sun, etc.)
       - `displays/_template/display.json` (settings + playlist vacío)

    2. Clonar `_template/` → `clients-signage/default/` con un display real:
       - Cambiar slug a "default" en client.json
       - `displays/lobby-tv/display.json` (settings: 1080p, audio off, defaultDuration 10000, defaultTransition cut, playlist=[])

    3. Schema Zod (`src/lib/signage/schema.ts`):
       - SignageHeaderSchema (position 'top'|'bottom', height 80|100|120, layout 'logo-left'|'logo-center'|'logo-right', background discriminated union, toggles, clockFormat, weatherUnits, forecastDays 0|3|5)
       - SignageBrandingSchema (logos: default+dark, fonts, tokens record opcional)
       - SignageLocationSchema (city, lat, lon)
       - DisplaySettingsSchema (targetResolution 1080p|4k, audio bool, defaultDurationMs, defaultTransition, sleepSchedule opcional)
       - SlideScheduleSchema (kind always|hours|date-range, daysOfWeek?, startTime?, endTime?, startDate?, endDate?, hideOutsideSchedule)
       - ModuleInstanceSchema (placeholder discriminated union — los 6 módulos con shape mínima válida; cada sub-fase los expandirá)
       - SlotConfigSchema (slotKey, module)
       - SlideSchema (id, templateId, slots[], durationMs 1000-600000, schedule, transition?)
       - DisplayConfigSchema (slug, name, settings, playlist[])
       - SignageClientSchema (slug, name, locale, timezone, location, branding, header, displays[])
       - NewsSourceSchema (discriminated union manual|rss|api + rotationIntervalSec)

    4. Loaders (`src/lib/signage/config.ts`):
       - `loadSignageClient(slug)` → fs-only en DS0: lee `clients-signage/<slug>/client.json` y mezcla `events.json`, `social.json`, `news.json`. Fallback a `default`. Validar con Zod, lanzar 404 si falla.
       - `loadSignageDisplay(client, display)` → fs-only: lee `clients-signage/<client>/displays/<display>/display.json`. Fallback a null (la página resuelve notFound).
       - Pendiente para Fase Studio: hook KV (TODO comments con kv-keys ready).

    5. KV keys (`src/lib/signage/kv-keys.ts`):
       - Constantes export: `kSignageClient(slug)`, `kSignageDisplay(client, display)`, `kSignageDisplayRaw(...)`, `kSignageClientList`, `kSignageSnap(...)`, `kSignageSnapList(...)`. NO se usan en DS0 (loader es fs-only) pero quedan listas.

    6. Tailwind extension (`tailwind.config.ts`):
       - Añadir `signage` namespace en theme.extend.colors mapeando `hsl(var(--signage-*))` para brand-primary/secondary/accent/surface/text/header-bg/header-text.
       - Añadir `signageStageBg` para letterbox.

    7. Componente `<SignageStage>` (`src/components/signage/stage/SignageStage.tsx`):
       - 'use client'
       - Wrapper 1920×1080 fijo + transform: scale(N)
       - Calcula scale en useEffect via Math.min(window.innerWidth/1920, window.innerHeight/1080)
       - Listener de `resize` con cleanup
       - Body de page = bg-[hsl(var(--signage-stage-bg))] (letterbox tokenizado)
       - transformOrigin: 'top left'
       - aria-hidden='true' en chrome (display puramente decorativo, no interactivo)

    8. Route group `(signage)` (`src/app/(signage)/layout.tsx`):
       - HTML root mínimo: importar `clients-signage/<KIOSK_CLIENT|default>/tokens.css`. Pero como DS0 es fs-only y multi-cliente por URL, NO usamos KIOSK_CLIENT — el tokens se importa desde el slug del URL en el page (server component).
       - Solución simplificada para DS0: importar `clients-signage/default/tokens.css` en el route group `(signage)`. La carga dinámica por slug se difiere a una sub-fase posterior cuando haya >1 cliente fs.
       - body className: bg-stage-letterbox + text-signage-text + cursor: none (kiosk-style)

    9. Layout signage `[client]/[display]/layout.tsx`:
       - Server component minimal. Children dentro del `<SignageStage>`.
       - NO incluye providers de idle / keyboard del kiosk.

    10. Page signage `[client]/[display]/page.tsx`:
        - Server component async
        - Cargar clientCfg + displayCfg, si !displayCfg → notFound()
        - Render placeholder: "Signage runtime — {client} / {display}" + meta (locale, timezone, header position, # slides) en un div centrado.
        - Pasar la config como prop a un `<SignagePlayerPlaceholder>` client component (skeleton — DS2 lo reemplaza por player real).

    11. Designs templates:
        - `designs/signage/_template.md` con plantilla específica para signage (1920×1080, 8 templates, slot kinds, header common).
        - `designs/signage/_coverage-template.md` con checklist pixel-perfect signage (groups, paths, transforms, slots).

    12. Verificar que `pnpm kiosk:dev` arranca y `/signage/default/lobby-tv` responde 200 con el placeholder visible. Render verificado a 1080p y 4K (devtools device toolbar).
  </action>
  <verify>
    - `pnpm typecheck` limpio.
    - `pnpm lint` limpio (puede haber warnings preexistentes — NO añadir nuevos).
    - `pnpm kiosk:dev` arranca limpio (regla CLAUDE.md sec 9 — verificar antes de commit).
    - GET `http://localhost:3000/signage/default/lobby-tv` → 200, render visible.
    - GET `http://localhost:3000/signage/no-existe/no-existe` → 404 (notFound).
    - Devtools: cambiar viewport a 1920×1080 → stage llena pantalla, cero scroll. Cambiar a 3840×2160 → stage escala 2x sin pixelar.
    - Auditor white-label sobre `src/components/signage/`, `src/app/(signage)/` y `src/lib/signage/` — sin hallazgos (esperar `bg-signage-*` y `hsl(var(--signage-*))`, NO `bg-primary` o hex).
    - `grep -rE "onClick|onTouchStart|onPointerDown" src/components/signage src/app/\\(signage\\)` → cero resultados.
  </verify>
  <done>
    - Folder `clients-signage/` creado con `_template/` y `default/` válidos por Zod.
    - Schema Zod compilado sin errores.
    - Tailwind extendido con `signage-*`; tokens.css consumido vía `hsl(var(--signage-*))`.
    - Route `/signage/default/lobby-tv` responde 200 con placeholder.
    - `<SignageStage>` escala 1.0 a 1080p y 2.0 a 4K, letterbox correcto en aspect raros.
    - Cero touch handlers en código signage.
    - Cero hardcoded en código signage.
    - Documentos planning creados: SIGNAGE-PROJECT.md, SIGNAGE-ROADMAP.md, DS0-PLAN.md.
    - DS0-SUMMARY.md escrito con resultado.
    - Update STATE.md y ROADMAP.md (sección Milestone Signage Local con DS0 marcada [x]).
    - Commit propuesto al usuario en español Conventional Commits.
  </done>
</task>
```

## Skills cargadas

DS0 es infra (no UI design pixel-perfect aún). Cargar **solo Tier 3 on-demand** si surge necesidad. Tier 1 (`frontend-design`, `ui-ux-pro-max`, `theme-factory`) se cargará en DS1 (header).

## Riesgos / decisiones diferidas

- **Carga dinámica de tokens.css por slug**: hoy en DS0 importamos solo el de `default`. Cuando haya >1 cliente fs, se requiere strategy: server component que injecta `<style>` con tokens del slug, similar a `client-tokens.ts` del kiosk. Diferido a una sub-fase de "multi-client fs runtime" o directamente al DSS0 cuando KV entre.
- **Schema News completo**: `NewsSourceSchema` se define mínimo en DS0; el parser RSS y adapter API se construyen en DS8. Mantener compatible.
- **Auditor extension**: el subagent `auditor-white-label` necesita extender prefijos `signage-*`. Se hace en una sub-fase tardía o cuando aparezca primera violación. En DS0 no hay módulos signage suficientes para que importe.
- **i18n loader signage**: hoy `clients-signage/<slug>/i18n/` no se carga automáticamente. Para DS0 los i18n.json existen pero no se consumen (placeholder). DS1 los integra cuando renderemos el header con keys i18n.
