# Spec — Opacidad editable de la capa oscura de los tiles del Home (kiosk + PWA)

**Fecha:** 2026-06-15 · **Aprobado por:** Rubén (en sesión)

## Objetivo

Hacer editable desde el Studio la **opacidad de la capa oscura** que va entre la foto
y el título de los tiles del Home Dashboard, **independiente por producto** (kiosk y
PWA), calcando end-to-end el patrón ya existente de `tileTitleFontSize`.

## Decisiones (aprobadas)

- **Alcance:** un setting global por producto (todos los tiles igual), NO por-tile.
- **Independiente por producto:** un slider en el editor del kiosk y otro en el de la PWA.
- **Solo opacidad** es editable; el color de la capa se mantiene:
  - Kiosk: tinte cálido `#11100d` (rgb 17,16,13).
  - PWA: negro puro.
- **Default = valor actual** (cero cambio visual para configs existentes):
  - Kiosk: `0.352` (≈35%). Cuando el campo es `undefined` se renderiza el literal
    `rgba(17,16,13,0.352)` exacto; el slider muestra 35.
  - PWA: `0.40` (40% exacto, integer).
- **Rango del slider:** 0–100% (0 = sin capa, foto a tope; 100 = sólido).

## Cadena KIOSK (mirror de `tileTitleFontSize`)

1. `src/lib/studio/schema/modules.ts` — `tileOverlayOpacity: z.number().int().min(0).max(100).optional()`.
2. `src/lib/config.ts` (~1979, `home`) — type `tileOverlayOpacity?: number`.
3. `src/lib/studio/publish-merger.ts` (~339) — mapear `modules.tileOverlayOpacity → home.tileOverlayOpacity` (delete si undefined).
4. `src/app/(kiosk)/home/page.tsx` (~59) — pasar `tileOverlayOpacity={home.tileOverlayOpacity}`.
5. `src/components/home/home-shell.tsx` — añadir al `ModulesOverridePayload`, a la firma, y pasar a `CategoryGrid` (`override?.tileOverlayOpacity ?? tileOverlayOpacity`).
6. `src/components/home/category-grid.tsx` — prop pasante → `CategoryTile`.
7. `src/components/home/category-tile.tsx:42` — `rgba(17,16,13, alpha)` con `alpha = opacity==null ? 0.352 : opacity/100`. Export `DEFAULT_TILE_OVERLAY_OPACITY = 35`.
8. `src/components/studio-bridge.tsx` (~415, ~496) — añadir `tileOverlayOpacity` a `ModulesPatch` y a `tilesDetail`.
9. `src/app/studio/_components/ModulesEditor.tsx` (~160) — slider 0–100 + reset (default 35), junto a "Title size".

## Cadena PWA (config propia, sin Zod — slice `.passthrough()`)

1. `src/lib/config.ts` (~916, `PwaDashboardConfig`) — type `tileOverlayOpacity?: number`.
2. `src/components/pwa/dashboard-screen.tsx` — prop en `DashboardScreenProps`; línea ~232 `bg-black/40` → `rgba(0,0,0, (opacity??40)/100)`.
3. `src/components/pwa/dashboard-live.tsx` (~34) — pasar `tileOverlayOpacity={d.tileOverlayOpacity}`.
4. `src/app/studio/[slug]/mobile-pwa/_components/ModulesEditor.tsx` (~113) — slider 0–100 + reset (default 40), junto a los controles de logo.
5. Bridge: `usePwaSection('dashboard')` ya trae el slice entero → sin cambios.
6. Publish: `features.pwa` se publica tal cual → sin cambios.

## Retrocompat (lección 2026-06-15)

Campo opcional + default al valor actual en CADA lectura (runtime Y estado del editor).
Verificar el editor con un config VIEJO, no solo el runtime.

## Tests

- `schema.test.ts` (o el de modules): bounds de `tileOverlayOpacity` (0–100, rechaza fuera de rango).
- Mapeo de publish-merger (kiosk): set + delete-when-undefined.
- Visual en preview: kiosk y PWA a 0% / default / 100%.
- typecheck + lint + suite completa + validate:configs.
