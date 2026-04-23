# 3-10 SUMMARY — Módulo Passes (listado · detail · share QR · sent confirmation)

**Fecha:** 2026-04-22 · **Commits:** `678b8f6` (ola 1) · `90d0c46` (ola 2) · `731d3ee` (olas 3+4) · TBD (QA visual + fixes auditor + SUMMARY).
**Spec:** `docs/superpowers/specs/2026-04-22-passes-module-design.md`.
**Plan:** `.planning/3-10-1-PLAN.md` (15 tasks en 4 olas).

---

## Hecho

**Ola 1 — Foundations** (`678b8f6`):

- `src/lib/config.ts` — tipos `PassActivity`, `PassItem`, `HomePassesModule` (kind `'passes'`) + variante añadida a `HomeModuleVariant`.
- `clients/default/config.json` — seed con 3 passes × 4 activities (Museum · City Tour · Food & Drink) + 13 strings `passes_*` en `textos`.
- `src/lib/passes.ts` — `isValidPhone`, `buildShareResult`, `dispatchShareResult` (CustomEvent `kiosk:pass-share` con `{client, passSlug, phone, bandwangoUrl, timestamp}` para telemetría futura).
- `pnpm add qrcode.react@4.2`.

**Ola 2 — Listing** (`90d0c46`):

- `pass-card.tsx` — card 898×400 con cover full-bleed + overlay gradient azul + título uppercase centrado.
- `passes-grid.tsx` — stack vertical rowGap 30, 898px con márgenes 91px; empty state con fallback tokenizado.
- `passes-toolbar.tsx` — label + search icon (estilo `ListingsToolbar`).
- `passes-module.tsx` — compose header + toolbar + grid + FloatingHomeButton + `SearchOverlay` reutilizado del Home (pool derivado de passes).
- Rama `passes` en `src/app/(kiosk)/home/[module]/page.tsx` que renderiza `PassesModule` cuando el módulo activo es de kind `'passes'`.

**Olas 3+4 — Detail + Share modal + Sent confirmation** (`731d3ee`):

- `activity-row.tsx` — card 898×168 con thumb 180×168 izquierda + título bold + descripción + pill "View Website" olive.
- `pass-detail.tsx` — overlay absolute `inset-0` sobre el módulo: hero 620 con cover + gradient + CTA `GET YOURS` sticky; barra azul 118 con título; lista scrollable de activities; BackButton flotante.
- `pass-detail-with-share.tsx` — wrapper client que dispara `CustomEvent('kiosk:pass-share-open')` al tap de `GET YOURS` (evita pasar funciones Server→Client).
- `pass-share-modal.tsx` — reusa `SendModalChrome` + `NumericKeypad` + `TermsCheckbox` + `CancelSendButtons`; QR `QRCodeSVG` level H con `bandwangoUrl`; input teléfono con country pill + tap-to-backspace; validación `isValidPhone` + accept terms.
- `pass-sent-confirmation.tsx` — overlay confirmación 640×auto con check lime (`hsl(var(--survey-success))`) + título + mensaje + auto-close 3s.
- `pass-share-host.tsx` — orquesta phases `closed → share → sent` escuchando el CustomEvent; sibling del detail en `[slug]/page.tsx`.
- Rama `passes` en `src/app/(kiosk)/home/[module]/[slug]/page.tsx` (monta `PassesModule` + `PassDetailWithShare` + `PassShareHost` + `AdsSlot`).

**Post-QA — Fixes del auditor white-label** (TBD commit):

- `config.ts` — nuevo campo opcional `HomePassesModule.qrLogo?: string`.
- `pass-share-modal.tsx`:
  - `#fff` inline (wrapper del QR e input teléfono) → clase Tailwind `bg-white`.
  - `imageSettings.src: '/assets/logo.svg'` hardcoded (y **404 en consola**) → prop opcional `qrLogo`; si no se declara, `imageSettings` se omite.
  - `aria-label` literal → `textos.passes_share_phone_aria` con fallback.
- `pass-detail.tsx` — `"Activities coming soon."` literal → `textos.passes_activities_empty` con fallback.
- `passes-module.tsx` — pasa `emptyLabel={textos.passes_empty}` al grid.
- `pass-share-host.tsx` + `[slug]/page.tsx` — propagan `qrLogo={mod.qrLogo}`.
- `clients/default/config.json` + `clients/_template/config.json` — 3 keys nuevas: `passes_empty`, `passes_activities_empty`, `passes_share_phone_aria`.

---

## Verificado

- `pnpm check` (typecheck + lint + format:check) limpio tras fixes.
- Playwright MCP manual — 5 screenshots en `.planning/verifications/`:
  - `3-10-passes-listing.png` — grid con 3 pass-cards, toolbar y hero.
  - `3-10-passes-detail.png` — overlay detail con hero + GET YOURS + 4 activity-rows.
  - `3-10-passes-search.png` — `SearchOverlay` del Home reutilizado sobre el listing.
  - `3-10-passes-share-modal.png` — modal con QR + country pill + input + checkbox + CANCEL/SEND + NumericKeypad.
  - `3-10-passes-sent.png` — confirmación con check lime y mensaje.
- Auditor white-label `auditor-white-label` pasó sobre `src/components/passes/` + `src/lib/passes.ts` + ramas `passes` de las dos rutas; hallazgos accionables resueltos (1 bug real: 404 del QR + 2 `#fff` inline + 3 strings sin tokenizar). Excepciones documentadas (grises y focus-ring heredados de `send-modal-chrome`; QR `#0a1e3a`/`#ffffff` fijos por contraste escaneable).
- Consola limpia tras fixes (no más `GET /assets/logo.svg 404`).
- CustomEvent `kiosk:pass-share` emite con shape esperado (verificado en consola durante el flujo SEND).

**No verificado:**

- Branding `KIOSK_CLIENT=demo-cliente-a` sobre `/home/passes`: demo-cliente-a no tiene `features.home.modules` configurado — requeriría clonar seed de passes sólo para test. Se omite porque el white-label ya está validado desde Fase 2 y los componentes usan tokens (`hsl(var(--primary))`, `font-display`, etc.).

---

## Pendiente / siguiente

- **Apagar `alwaysShowWelcome={true}`** del MapModule antes de Fase 4 (TODO heredado).
- **Fase 4 — primer cliente real** con branding + Lighthouse en producción + handoff, O siguiente módulo del home (Tickets, Guestbook, Deals, Photo Booth, Trails, Itinerary Builder).
- **Itinerary Builder** consumirá los buckets `kiosk_favorites` + `kiosk_event_favorites` ya existentes; el módulo Passes es el siguiente candidato natural a enlazar si se introduce un bucket `kiosk_pass_favorites` (no creado aún).
- **TODO i18n** (Fase 5 — validador zod + migración general a `config.textos`):
  - `pass.title.toUpperCase()` en el share modal — política de diseño, mantener tal cual.
  - `focus-visible:ring-blue-300` heredado del `send-modal-chrome` — se tokeniza al refactorizar el chrome (toca también Listings y Events).
  - Grises `#d0d0d0` / `#9a9a9a` del mismo chrome — misma excepción heredada.
  - Country code `USA (+1)` fijo por `textos.passes_share_country`; abrir `config.client.country_code` en Fase 5.

---

## Decisiones

- **QR logo opcional via `HomePassesModule.qrLogo`** en vez de leer `branding.logo.default` como default: `branding.logo.default` apunta a `assets/logo.svg` que aún no existe físicamente en `clients/default/assets/` (bug de data arrastrado desde Fase 2). Hacerlo opcional al nivel del módulo es más limpio white-label: cada cliente decide si quiere logo en su QR, independiente del logo del header.
- **No reuso de `ListingDetail` para Passes**: estructura distinta (CTA sticky en hero, sin map/directions, lista de activities en vez de description). `PassDetail` específico es más mantenible.
- **CustomEvent para orquestación cross-component** (`kiosk:pass-share-open`): permite al host del overlay vivir a nivel `KioskCanvas` (sibling de `AdsSlot`) sin pasar funciones Server→Client. Mismo patrón que `kiosk:survey-open` de Fase 3.9.
- **`qrcode.react@4.2` con named export `QRCodeSVG`** (no default `QRCode` como proponía el plan inicial — ajuste al ejecutar).
- **Tap-to-backspace en el input del teléfono**: el `NumericKeypad` no emite BACKSPACE; el botón del input actúa como delete del último dígito. Affordance kiosko táctil.
- **`PassShareModal` y `PassSentConfirmation` usan grises fijos** del chrome del `send-modal-chrome` (`#9a9a9a`, `#d0d0d0`) — consistente con la excepción ya aceptada en `send-to-phone-modal` de Listings.
- **Auto-close 3 s en `PassSentConfirmation`** — suficiente para leer el mensaje + breve impresión de éxito; el usuario puede salir manualmente cerrando el detail con Back.

---

**Fase:** 3.10 Passes — cerrada con QA visual + fixes de auditor aplicados.
