# Fase 3.12 — Summary (Deals module)

**Fecha cierre:** 2026-04-23
**Commit(s):** pendiente

## Alcance

Módulo Deals: grid de cupones/descuentos de negocios locales con modal
"redeem" que muestra QR escaneable + botones SEND TO PHONE / SEND TO EMAIL.

Pantallas cubiertas (verbatim del XD):

- `Deals.svg` — listing con grid 3-col.
- `Deals-Filter.svg` — overlay de filtros (1 sección Features).
- `Deals–Details_Send.svg` — modal redeem con QR + 2 botones send.

## Decisiones arquitectónicas

1. **`kind: 'deals'`** en `HomeModuleVariant`. No usa `[slug]/page.tsx` —
   el detalle ES el modal, no una ruta.
2. **Modal redeem custom** (NO reusa `QrPurchaseModal` de Passes/Tickets) — el
   shape es distinto: QR + 2 botones SEND simultáneos + cover con overlay
   del title + sin telemetría.
3. **Send flows reusan** `SendToPhoneModal` + `SendToEmailModal` + `SendConfirmationPopup`
   de listings. El orquestador `DealRedeemHost` maneja la máquina de estados.
4. **Auto-filter de expirados** (`filterActiveDeals`) al inicio del pipeline.
   Deals con `expiresAt < today()` no llegan al filter/sort/search.
5. **Sort custom** `DEAL_SORT_OPTIONS`: expiring-soon (default), recent, a-z,
   best-discount. No reusa `SORT_OPTIONS` de listings (opciones distintas).
6. **CustomEvent `kiosk:deal-redeem-open`** para orquestar el modal a nivel
   KioskCanvas (patrón de Survey/Passes/Tickets).
7. **Sin bucket de favoritos** — los deals caducan; guardarlos no tiene sentido.

## Archivos creados

- `src/lib/deals.ts` — filter/sort/search + constantes + `todayISO` + `formatDealExpiry`.
- `src/components/deals/deals-module.tsx` — compose del módulo.
- `src/components/deals/deals-grid.tsx` — grid 3-col.
- `src/components/deals/deal-card.tsx` — card con tap → CustomEvent.
- `src/components/deals/deals-filter-overlay.tsx` — 1 sección features.
- `src/components/deals/deal-redeem-modal.tsx` — modal custom.
- `src/components/deals/deal-redeem-host.tsx` — máquina de estados.
- `docs/superpowers/specs/2026-04-23-deals-module-design.md` — spec.
- `.planning/3-12-COVERAGE.md` — checklist de groups.
- `.planning/3-12-SUMMARY.md` — este archivo.

## Archivos modificados

- `src/lib/config.ts` — tipos `Deal` + `HomeDealsModule` + union extendida.
- `src/app/(kiosk)/home/[module]/page.tsx` — rama `kind === 'deals'`.
- `src/app/(kiosk)/home/[module]/[slug]/page.tsx` — guard `if (kind === 'deals') notFound()`.
- `clients/default/config.json` — 15 textos `deals_*` + `modules.deals` con 20 deals seed + featureCatalog.
- `clients/_template/config.json` — textos `deals_*`.
- `clients/demo-cliente-a/config.json` — textos `deals_*` traducidos al español.

## Verificación

- `pnpm check` (typecheck + lint + format:check) limpio.
- Playwright MCP: listing `/home/deals` renderea grid con 20 deals sorted ascending por fecha de expiración.
- Tap card → modal redeem con data correcta (title, subtitle, description, QR).
- SEND TO PHONE → NumericKeypad modal.
- SEND TO EMAIL → QWERTY modal.
- Filter overlay: 8 pills features.
- Screenshots en raíz: `3-12-ola2-deals-listing.png`, `3-12-ola2-filter-overlay.png`, `3-12-ola3-redeem-modal.png`, `3-12-ola3-send-phone.png`.

## Pendientes / deuda

- Verificación visual con `KIOSK_CLIENT=demo-cliente-a` pendiente (requiere
  reiniciar dev server con env var). Los textos están traducidos; los colores
  cambiarán según `tokens.css` del cliente (reusa los tokens globales del
  kiosk).
- 1 cover de Unsplash (Sephora `photo-1522335789203-aaa95c1cb28a`) muestra
  alt-text en vez de imagen — posible 404 de Unsplash. Fallback gradient
  azul se activa vía `onError`. Verificar y reemplazar URL si persiste.
- QR logo path (`assets/logo.svg`) normalizado vía `resolveAssetPath` helper
  en `deal-redeem-modal.tsx`. Patrón replicable a PassShareModal si el log
  de 404 resulta consistente.
- Auditor white-label: reportar hallazgos heredados en `.planning/STATE.md`.
