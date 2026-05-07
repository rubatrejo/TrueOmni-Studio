# DS2-SUMMARY.md — `<SignagePlayer>` rotación básica

**Fecha:** 2026-05-06
**Estado:** ✅ completado, aprobado visualmente
**Plan:** `.planning/DS2-PLAN.md`

---

## Hecho

- **Tipos públicos** (`src/components/signage/templates/types.ts`): `SlotKind`, `TemplateSlot`, `SignageTemplateRenderProps`, `SignageTemplate`. Body region declarada @ 1920×925 (sin header).
- **Registry singleton** (`src/components/signage/templates/registry.ts`): API pura `registerTemplate` / `getTemplate` / `getAllTemplates` sobre un `Map<string, SignageTemplate>`.
- **Auto-load** (`src/components/signage/templates/load-templates.ts`): side-effect imports separados del registry para evitar dep circular ESM. El player importa `load-templates` y queda asegurado el registro antes del primer `getTemplate`.
- **2 templates placeholder** (`PlaceholderA.tsx`, `PlaceholderB.tsx`): Render simple con bg distinto (brand-primary vs brand-accent) + texto centrado. Auto-registro en module-eval.
- **`<SignagePlayer>`** (`src/components/signage/player/SignagePlayer.tsx`): client component con `setTimeout` que avanza `index = (index + 1) % playlist.length` cada `slide.durationMs` (fallback a `settings.defaultDurationMs`). Cleanup correcto. Render del template via `getTemplate(slide.templateId).Render`. Estados de error visibles: playlist vacío, templateId desconocido.
- **`<SignageRuntime>`** (`src/components/signage/runtime/SignageRuntime.tsx`): rename de `SignagePlaceholder`. Compone `<SignageHeader>` + `<SignagePlayer>`. El player rellena el espacio bajo el header (`flex-1`).
- **page.tsx**: importa `SignageRuntime` en lugar de `SignagePlaceholder`.
- **`displays/lobby-tv/display.json`**: 2 slides con templateIds `placeholder-a` y `placeholder-b`, durationMs 5000, schedule always.

---

## Verificado

| Check | Resultado |
|---|---|
| `pnpm typecheck` | ✅ limpio |
| `pnpm lint` (signage files) | ✅ cero issues nuevos |
| GET `/signage/default/lobby-tv` | ✅ HTTP 200, 612KB |
| GET `/` (kiosk) | ✅ HTTP 200 (no rompí kiosk) |
| Render inicial muestra Slide A | ✅ "DS2 placeholder" visible |
| Rotación a Slide B tras 5s | ✅ confirmado por Rubén en pantalla |
| Cero touch handlers en árbol signage | ✅ |

---

## Decisiones

- **Registry split en 2 archivos**: `registry.ts` (API + Map) y `load-templates.ts` (side-effect imports). Evita el `Cannot access REGISTRY before initialization` que ocurría con auto-import al final de registry.ts (ESM hoist los imports al top, ejecutándolos antes del `new Map()`).
- **`setTimeout` en lugar de `setInterval`**: cada slide tiene su propia duración. `setTimeout` recurrente con dep en `[duration, index]` permite que el siguiente schedule respete `slide.durationMs` del slide entrante.
- **Cut transition (no animación)**: cambio instantáneo entre slides. Fade/slide vienen en DS12.
- **Sin filtro dayparting**: el player rota TODA la playlist sin importar `slide.schedule`. DS13 cablea `effectivePlaylist`.
- **`SignageRuntime` rename**: el componente ya no es placeholder — es el runtime real (header + player). El nombre antiguo confundía.

---

## Pendiente / siguiente

- **DS3 — Template `01-full-events` pixel-perfect**: replica el body del SVG `01-full-events.svg` (módulo Events fullscreen con hero event izq + grid 4 events der). Es el primer template real que reemplaza al PlaceholderA en el catálogo del player.
- **DS4..DS10**: el resto de templates uno por sub-fase.
- **DS11**: header position toggle runtime.
- **DS12**: transitions reales.
- **DS13**: dayparting filter.
