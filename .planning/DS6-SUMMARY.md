# DS6-SUMMARY.md — Template `04-video-events-ad`

**Fecha:** 2026-05-07
**Estado:** ✅ aprobado visualmente

## Hecho

- Booking.com banner extraído del SVG → `clients-signage/default/assets/ads/bottom-banner.jpg` (798×313 JPEG, 65KB).
- Template `04-video-events-ad.tsx` con 3 zonas:
  - **Video top-left** (1145×644 @ y=155): pattern reusa pool.png + Play_Icon decorativo.
  - **Bottom Ad** (1144×281 @ y=799): pattern verbatim del XD (viewBox 0 22.154 1144 281, image 1144×448.712).
  - **Right column events** (translate 1145 155): replica el right column de `01-full-events` (sub-hero baseball + 3 small cards ski/music/dog).
- Helpers locales (parseAsWallClock, formatDayLabel, formatTime, wrapTitle) duplicados del `01-full-events.tsx`. Refactor a util compartido posible en sub-fase tardía.
- Slot definitions: video (hero), ad (strip), events (sidebar). Cada uno con `acceptedModules`.
- Override per-slide: `slots[0].module` para video y ad permite que el slide especifique URL distinta.
- Auto-load del registry actualizado.
- `display.json` con 4 slides ahora; **duraciones bajadas a 7s** uniformes (Rubén pidió cadencia rápida para review; el usuario final lo ajustará en el editor DSS4).

## Verificado

- `pnpm typecheck` ✅
- GET `/signage/default/lobby-tv` ✅ HTTP 200
- GET `/signage-assets/default/assets/ads/bottom-banner.jpg` ✅ HTTP 200
- Aprobación visual de Rubén ✅

## Decisiones

- **Eventos reusados de `01-full-events`**: las posiciones del sub-hero + 3 small cards son IDÉNTICAS al right column de DS3. Misma serie de transforms (Event_1 -160 -58.5, Event_2 -156 349.5, etc.). Cuando otros composed templates compartan el patrón se factorará a un componente shared.
- **Helpers duplicados**: parseAsWallClock, formatDayLabel, etc. están copiados literalmente. Tech debt aceptable para mantener cada template self-contained durante la fase de replicación pixel-perfect; refactor diferido.
- **Bottom banner como single image**: el ad horizontal se trata igual que el fullscreen ad de DS4 — un único asset que el cliente reemplaza.

## Pendiente / siguiente

- **DS7 — `05-video-2ads`**: video top-left + 2 ads (right grande + bottom horizontal).
- Refactor: extract events column shared component.
