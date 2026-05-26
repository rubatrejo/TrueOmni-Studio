# Specs — Welcome (Splash de arranque)

## Identidad

- **Nombre interno:** `welcome` (splash).
- **Ruta Next.js:** `/pwa`.
- **Milestone:** PWA Mobile · Fase P1 (`PWA-ROADMAP.md`).
- **Pantalla XD original:** `designs/mobile-pwa/01-welcome.svg` (= "Welcome 2" del XD).
  Referencias PNG: `01-welcome-a-bg.png` (solo fondo), `01-welcome-b-logo.png` (fondo + logo).
- **Medidas del canvas:** **390 × 844** (artboard XD 375×812 → ×≈1.04).
- **Tipo:** 🆕 PWA-only (no existe en el kiosk).

## Comportamiento (confirmado 2026-05-25)

Es un **splash animado** de una sola pantalla:

1. Aparece el **fondo** fullscreen (frame "Welcome 1").
2. El **logo** del cliente hace **fade-in** centrado (frame "Welcome 2").
3. Tras `autoAdvanceMs` (~2.5s) **auto-avanza a Login** (`/pwa/login`).

No es swipeable. El **status bar** (hora/batería/señal) del XD es un placeholder del teléfono
real → **no se dibuja como mock**; se deja la safe-area arriba (el fondo la cubre).

> Nota: el SVG arrastra capas ocultas de un form de login (CREATE NEW ACCOUNT, email/password,
> social). Son residuales del XD y **no se renderizan** (opacity 0 / tapadas por el overlay).
> Se ignoran por completo; el Login real llega en su propia pantalla.

## Medidas clave (coords del canvas 375×812, medidas del render)

| Bloque   | x  | y   | w     | h   | Notas |
|----------|----|-----|-------|-----|-------|
| Fondo    | 0  | 0   | 375   | 812 | imagen fullscreen (`object-cover`) |
| Overlay  | 0  | 0   | 375   | 812 | **negro `rgb(0,0,0)` opacity 0.5** (scrim) |
| Logo     | 62 | 383 | 251.4 | 46.2 | **centrado** (cx 187.7≈187.5, cy 406≈406). Ancho = 67% del canvas |

Adaptado a 390×844: logo ≈ 261×48, centrado en (195, 422). Por estar centrado exacto,
se implementa con centrado flex + ancho relativo (67%), no con coords absolutas.

## Colores / Tipografía

- Sin texto (salvo el status bar que se omite). Solo fondo + scrim + logo.
- Overlay: scrim negro 50% (`bg-black/50`, neutro — no es color de marca).

## Contenido (white-label — qué se lee de `config.json`)

- `features.pwa.welcome.background` → imagen de fondo (default `assets/pwa/welcome-bg.jpg`).
- `features.pwa.welcome.autoAdvanceMs` → ms antes de avanzar a Login (default 2500).
- `branding.idleLogo` (fallback `branding.logo.default`) → logo blanco centrado.
- `branding.logo.alt` → alt del logo.

El logo y el fondo son **assets del cliente**: cambiar el cliente cambia ambos sin tocar código.

## Interacciones / Animaciones

- **Logo fade-in:** opacity 0→1 (+ leve scale 0.96→1), ~600ms, ease-out, tras montar.
- **Auto-advance:** `router.push('/pwa/login')` tras `autoAdvanceMs`. *(Se cablea cuando exista
  la pantalla Login; por ahora el splash queda mostrando el logo.)*

## Accesibilidad

- Logo con `alt` desde `config`.
- Contraste del logo blanco sobre scrim 50% → AA cumplido.

## Verificación

- [ ] Diff visual < ±2px vs `01-welcome-b-logo.png` (`revisor-visual`).
- [ ] `pnpm typecheck && pnpm lint && pnpm format:check` limpios.
- [ ] Cero hardcoded (fondo/logo desde config; scrim neutro).
- [ ] Probada con `KIOSK_CLIENT=default` (logo blanco + desierto).
- [ ] Screenshot en `.planning/verifications/pwa-01-welcome.png`.

**Notas:** imagen de fondo extraída del SVG embebido (JPEG 2.95MB) → `clients/default/assets/pwa/welcome-bg.jpg`.
