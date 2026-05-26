# Specs — Home / Dashboard

## Identidad

- **Nombre interno:** `dashboard` (home).
- **Ruta Next.js:** `/pwa/dashboard`.
- **Milestone:** PWA Mobile · Fase P1.
- **Pantalla XD:** `Dashboard-Home.svg` (84MB, **no versionado** por tamaño) + `03-dashboard.png`.
- **Canvas:** **390 × 844** (artboard XD 375×812).
- **Tipo:** 🆕 PWA-only (home con módulos reutilizados del kiosk).

## Comportamiento

- Destino del Login/Skip. Es la home con bottom nav.
- Pantalla **scrolleable**: header fijo arriba, bottom nav fijo abajo, contenido scroll en medio.
- Tiles y quick-access → sus módulos (aún sin cablear; los módulos llegan en P2+).
- Status bar del XD = placeholder del SO → no se dibuja.

## Estructura (coords del canvas 375×812)

| Bloque | x | y | w | h | Notas |
|--------|---|---|---|---|-------|
| Header | 0 | 0 | 375 | 110 | `bg --brand-primary` (#004F8B). Logo (20,62) 154×29 + 3 iconos der (x266/299/334, y67) |
| Hero foto | 0 | 96 | 375 | 245 | `object-cover` + gradiente azul (fade a brand-primary) |
| Hero título | 24 | 128 | 141 | 84 | "Interactive Self-Service Solutions", blanco extrabold, 3 líneas |
| Quick-access ×4 | 32/115/198/278 | 257 | 66 | 74 | squircle **rx 15**, thumbnail; labels debajo (y342, blanco ~9px) |
| Tiles (grid 2-col) | 20/198 | 391+ | 158 | 100 | **rx 5**, scrim negro ~0.35–0.5, label blanco bold uppercase |
| THINGS TO DO | 20 | 631 | 335 | 100 | tile **full-width** |
| Bottom nav | 0 | 756 | 375 | 56 | `bg --brand-primary`; 5 celdas de 75; **celda activa = `--pwa-primary`** (#079EE2) |

Grid (orden): RESTAURANTS, MAP, WAYFINDING, SOCIAL WALL, THINGS TO DO (full), DIGITAL BROCHURE,
TRAILS, PASSES, TICKETS, DEALS, SCAVENGER HUNT. Márgenes 20, gap 20.

## Colores (tokens)

- Header + nav → `--brand-primary`. Celda activa del nav → `--pwa-primary`.
- Scrim de tiles → negro neutro (`bg-black/40`, equivale al #11100D ~0.4 del XD).
- Gradiente del hero → fade a `--brand-primary` (usa `hsl(var(--brand-primary)/0)`, no `transparent`).
- Logo + iconos + labels → blanco.

## Contenido (white-label — `config.features.pwa.dashboard`)

`heroTitle` · `heroImage` · `quickAccess[]` ({key,label,image}) · `tiles[]` ({key,label,image,wide?}).
Logo desde `branding`. **17 imágenes extraídas del SVG** (mapeadas por tamaño de bytes, determinista)
→ `clients/default/assets/pwa/dashboard/` (redimensionadas para web: hero 1000w, tiles 600w, quick 240w).

## Decisiones / pendientes

- **Labels de tiles centrados** (decisión): el XD tiene posiciones de label custom por tile (según el
  punto focal de cada foto). Se centraron para un patrón limpio y white-label. Ajustable si se requiere
  fidelidad exacta por tile (añadiendo `labelAlign` a `PwaTile`).
- Bottom nav (home/passes/dining/map/more) e iconos del header: glyphs del XD → SVG inline equivalentes.
- Navegación de tiles/quick/nav → pendiente hasta que existan los módulos (P2+).

## Verificación

- [ ] Diff visual vs `03-dashboard.png` (`revisor-visual`).
- [ ] `pnpm typecheck && pnpm lint && pnpm format:check` limpios.
- [ ] Cero hardcoded del cliente (contenido en config; colores token).
- [ ] Screenshot en `.planning/verifications/pwa-03-dashboard.png`.
