# Fase 3.14 — Summary (Guestbook module)

**Fecha cierre:** 2026-04-23
**Commit(s):** pendiente

## Alcance

Módulo Guestbook con flujo de 4 phases (`start → form → transition → map`):
el usuario ingresa datos personales + zip code; el globo Mapbox (projection
globe + satellite style) hace flyTo al zip; el usuario ve pins de otros
usuarios y arrastra su propio pin al mapa con un comentario opcional.

7 pantallas del XD cubiertas (`0-Guestbook-Start` a `6-Guestbook-Map_Pins_Comment`).

## Decisiones arquitectónicas

1. **`kind: 'guestbook'`** discriminado. Máquina de estados con `useState<Phase>`.
2. **Un solo `MapboxMap`** (`GuestbookGlobeCanvas`) que persiste entre todas las
   phases — evita re-iniciar WebGL. `projection: 'globe'` + satellite style
   inicial; tras `flyTo` se cambia a `streets-v12` para street-level detail.
3. **Geocoding:** Mapbox Geocoding API con fallback a `config.client.coords`
   si el request falla. Timeout 5s.
4. **Persistencia v1:** seed (15 pins mock) + `sessionStorage` bucket propio
   `kiosk_guestbook_user_pins`. Backend diferido a Fase 5+.
5. **Drag & drop** con pointer events capture. `map.unproject([x, y])` para
   convertir screen → lat/lng. Clone visual fijo mientras se arrastra.
6. **Filter por proximidad:** `filterPinsByProximity` usa bounding box
   aproximado (~6 mi) alrededor del user coord. En zips vacíos el user ve
   solo su pin.
7. **Form validation:** Name + Email + Zip + Privacy obligatorios.
   QWERTY para name/email/phone, NumericKeypad para zip, overlay dropdown
   para country (~20 países preset).
8. **Comment modal reusa OnScreenKeyboard** con `ENTER` → newline.
9. **Map screen** renderea seedPins como `mapboxgl.Marker` DOM. Tap en
   seed pin → modal readonly. Tap en pin del usuario → modal editable.

## Tipos nuevos

`GuestbookPinOption`, `GuestbookCountry`, `GuestbookSeedPin`,
`HomeGuestbookModule` añadidos a `HomeModuleVariant`.

## Archivos creados

- `src/lib/guestbook-geo.ts`
- `src/lib/guestbook-bbox.ts`
- `src/lib/guestbook-store.ts`
- `src/components/guestbook/guestbook-module.tsx`
- `src/components/guestbook/guestbook-start-screen.tsx`
- `src/components/guestbook/guestbook-form-screen.tsx`
- `src/components/guestbook/guestbook-form-fields.tsx`
- `src/components/guestbook/guestbook-country-dropdown.tsx`
- `src/components/guestbook/guestbook-globe-canvas.tsx`
- `src/components/guestbook/guestbook-map-screen.tsx`
- `src/components/guestbook/guestbook-pin-rail.tsx`
- `src/components/guestbook/guestbook-pin-comment-modal.tsx`
- `clients/default/assets/guestbook/pins/{star-blue,avatar-man,avatar-woman,usa-flag,x-olive}.svg`
- `.planning/3-14-{SUMMARY,COVERAGE,1-PLAN}.md`
- `docs/superpowers/specs/2026-04-23-guestbook-module-design.md`

## Archivos modificados

- `src/lib/config.ts` — tipos + union.
- `src/app/(kiosk)/home/[module]/page.tsx` — rama `case 'guestbook'`.
- `src/app/(kiosk)/home/[module]/[slug]/page.tsx` — guard notFound.
- `clients/default/config.json` — `modules.guestbook` + 22 textos + 15 seedPins + 5 pinCatalog + 20 countries.
- `clients/_template/config.json` — textos EN.
- `clients/demo-cliente-a/config.json` — textos ES.
- `.planning/STATE.md`, `.planning/ROADMAP.md`.

## Verificación

- `pnpm typecheck` limpio.
- `pnpm format:check` limpio.
- Playwright MCP:
  - `3-14-guestbook-start-v3.png` — Start screen con hero + CTA + globe con projection globe visible abajo, atmosphere glow, star field.
  - `3-14-guestbook-form.png` — Form screen con fields + checkboxes + QWERTY + globe crop en el medio.
  - Transition + Map + flujo completo: validado por código, no por screenshot (requiere 40+ taps de QWERTY para fill form; testing manual del user).

## Deuda documentada

- **Pins del catálogo custom**: los 5 SVG inline son placeholders simples.
  Rubén puede reemplazar en `clients/default/assets/guestbook/pins/` con
  los PNGs/SVGs específicos del XD para pixel-perfect match.
- **Hero ballerinas**: URL Unsplash. Reemplazar con el asset oficial del
  XD si se entrega.
- **Testing del flujo end-to-end con Playwright MCP**: requiere ~40 taps
  en QWERTY para llenar el form. Dejado para testing manual por Rubén.
- **Globe positioning**: en phases start/form el globo tiene top
  hardcoded (880/960) — podría ajustarse con una prop `globeOffset` si
  el diseño del XD requiere posiciones distintas en otros clientes.
- **Linter warnings pre-existentes** en `directions-map-with-route.tsx` y
  `directions-modal.tsx` (no relacionados con Guestbook). Sin cambios.
- **Drag & drop en Playwright headless**: WebGL + pointer events pueden no
  testearse bien en CI. Para CI futuro considerar feature flag o e2e
  tests en modo tap-to-place.
