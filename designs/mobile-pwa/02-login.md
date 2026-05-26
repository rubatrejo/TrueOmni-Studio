# Specs — Login

## Identidad

- **Nombre interno:** `login`.
- **Ruta Next.js:** `/pwa/login`.
- **Milestone:** PWA Mobile · Fase P1.
- **Pantalla XD:** `designs/mobile-pwa/02-login.svg` + `02-login.png`.
- **Canvas:** **390 × 844** (artboard XD 375×812 → layer escalado ×1.04).
- **Tipo:** 🆕 PWA-only. **Auth mockeado** (sin backend en este milestone).

## Comportamiento

- Se llega desde el Welcome (auto-advance) o directo.
- Inputs email/password editables (estado local, no autentican).
- **LOGIN** y **Skip Login** → Dashboard (`dashboardHref`, aún sin cablear → no navegan).
- **CREATE NEW ACCOUNT** → pantalla de registro (no existe aún → sin acción).
- Botones sociales: mock (sin OAuth real).
- Status bar del XD = placeholder del SO → no se dibuja.

## Medidas clave (coords del canvas 375×812, medidas del render)

| Bloque               | x    | y     | w     | h    | Notas |
|----------------------|------|-------|-------|------|-------|
| Overlay (scrim)      | 0    | 0     | 375   | 812  | negro `rgb(0,0,0)` **opacity 0.8** |
| Logo                 | 62   | 122   | 251.4 | 46.2 | centrado horiz. (cx 187.7) |
| "LOGIN WITH"         | —    | 221.7 | 85.8  | 19   | centrado (cx 185.9) |
| Apple icon           | 100  | 272.9 | 40    | 40   | círculo #004e8a ≈ `--brand-primary` |
| Facebook icon        | 166  | 271.9 | 40    | 40   | círculo #3c5193 (logo marca) |
| Google icon          | 228  | 271.9 | 40    | 40   | círculo blanco + G multicolor (logo marca) |
| Campo Email          | 24   | 349   | 328   | 46   | blanco 29.6%, rx 2; icono x38, placeholder x76 |
| Campo Password       | 24   | 415   | 328   | 46   | idem (icono candado) |
| Forgot your password?| 24.5 | 471   | 129.6 | 17   | izq., 12px medium, underline |
| LOGIN (botón)        | 23.1 | 569   | 328   | 44   | **#079EE2 = `--pwa-primary`**, rx 4 |
| CREATE NEW ACCOUNT   | 23   | 633   | 328   | 44   | outline blanco 1px, rx 4 |
| Skip Login           | —    | 753   | 71.1  | 19   | centrado (cx 187), bold, underline |

Márgenes laterales 24px. El layer 375×812 se escala ×1.04 al canvas 390×844.

## Tipografía

- "LOGIN WITH" / placeholders / Forgot / Skip → **Open Sans** (`--font-open-sans`).
- Botones LOGIN/CREATE → 14px bold (Helvetica en XD → font sans del proyecto).

## Colores (tokens)

- Botón LOGIN → `--pwa-primary` (#079EE2, añadido a `tokens.css` default + `_template`).
- Círculo Apple → `--brand-primary`.
- Facebook (#3c5193) y Google (multicolor) → **logos de marca de terceros** (no white-label).
- Campos → blanco 30% (`bg-white/30`); scrim → `bg-black/80`. Texto → blanco.

## Contenido (white-label — `config.features.pwa.login`)

`loginWith` · `emailPlaceholder` · `passwordPlaceholder` · `forgotPassword` · `loginCta` ·
`createAccountCta` · `skipLogin` · `background?` (fallback `welcome.background`).
Logo desde `branding` (vía `<TrueOmniLogo slot="idle">`).

## Verificación

- [ ] Diff visual < ±2px vs `02-login.png` (`revisor-visual`).
- [ ] `pnpm typecheck && pnpm lint && pnpm format:check` limpios.
- [ ] Cero hardcoded del cliente (textos en config; colores token; salvo logos de marca).
- [ ] Screenshot en `.planning/verifications/pwa-02-login.png`.

**Notas:** los iconos sociales se extrajeron verbatim del SVG (paths + transforms,
viewBox = bbox absoluto). El form de login también aparecía oculto en `01-welcome.svg`.
