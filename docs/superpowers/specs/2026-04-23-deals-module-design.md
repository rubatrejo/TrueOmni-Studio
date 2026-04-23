# Deals Module — Design Spec

**Fecha:** 2026-04-23
**Autor:** Rubén (designers@trueomni.com) + Claude
**Fase:** 3.12

## Context

Los clientes del kiosk necesitan promocionar **cupones/descuentos de negocios locales**.
El usuario explora un grid de cupones y, al elegir uno, recibe un QR escaneable con
la opción de enviarlo también por SMS o email.

Entregables del XD en `/Users/rubenramirez/Desktop/Deals/`:

- `Deals.{svg,png}` — listing.
- `Deals-Filter.{svg,png}` — overlay filtros.
- `Deals–Details_Send.{svg,png}` — modal "redeem" con QR + 2 botones send.

## Goal

Implementar el módulo Deals dentro del patrón establecido (listings/events/tickets/passes)
con reuso máximo, pixel-perfect contra el XD, y **sin cambios de infraestructura**.

## Flow

```
/home/deals
  ├─ grid 3-col (card con cover + title + shortDescription + expiry + originalPrice tachado)
  ├─ tap card → CustomEvent 'kiosk:deal-redeem-open' { dealSlug }
  │
  └─ DealRedeemHost escucha el event
      ├─ stage 'redeem' → DealRedeemModal
      │   ├─ SEND TO MY PHONE → stage 'send-phone' → SendToPhoneModal (NumericKeypad)
      │   ├─ SEND TO MY EMAIL → stage 'send-email' → SendToEmailModal (QWERTY)
      │   └─ CANCEL → stage 'closed'
      │
      └─ onSent (phone/email) → stage 'sent' → SendConfirmationPopup 5s → redirect /home
```

## Data model

```ts
interface Deal {
  slug: string;
  title: string;
  shortDescription: string; // card
  headline: string; // modal H1
  subtitle: string; // modal h2
  longDescription: string; // modal body
  cover: string;
  expiresAt: string; // 'YYYY-MM-DD'; deals expired se auto-filtran
  originalPrice?: string; // tachado en card
  promoCode?: string; // pill opcional en modal
  qrUrl: string;
  features: string[];
  popularity?: number;
  discountValue?: number; // % para sort best-discount
}

interface HomeDealsModule {
  kind: 'deals';
  label: string;
  heroImage: string;
  featureCatalog: string[];
  deals: Deal[];
  qrLogo?: string;
}
```

Unión: `HomeModuleVariant |= HomeDealsModule`.

## Pipeline

```ts
filterActiveDeals(deals)         // elimina expired
  → applyDealsFilter(filter)     // AND de features
  → searchDeals(query)           // title + shortDescription
  → sortDeals(order)             // 4 opciones
```

Sort por defecto: `expiring-soon` (asc por `expiresAt`).

## Componentes

| Archivo                                         | Rol                                               |
| ----------------------------------------------- | ------------------------------------------------- |
| `src/lib/deals.ts`                              | Pipeline + sort + `todayISO` + `formatDealExpiry` |
| `src/components/deals/deals-module.tsx`         | Compose + CustomEvent host                        |
| `src/components/deals/deals-grid.tsx`           | Grid 3-col                                        |
| `src/components/deals/deal-card.tsx`            | Card con tap → CustomEvent                        |
| `src/components/deals/deals-filter-overlay.tsx` | 1 sección Features                                |
| `src/components/deals/deal-redeem-modal.tsx`    | Modal con cover + QR + 2 SEND + CANCEL            |
| `src/components/deals/deal-redeem-host.tsx`     | Máquina de estados                                |

## Reuso (sin cambios)

- `ListingsToolbar` — 4 celdas (label + search + sort + filter).
- `SearchOverlay` del Home + `DealsSearchAdapter` para interceptar el Link.
- `SortOverlay` genérico.
- `SendToPhoneModal` + `SendToEmailModal` + `SendConfirmationPopup`.
- `FloatingHomeButton`, `HomeHeader`, `AdsSlot`.

## Routing

- `src/app/(kiosk)/home/[module]/page.tsx` — añadir `case 'deals' → DealsModule`.
- `src/app/(kiosk)/home/[module]/[slug]/page.tsx` — guard `if (kind === 'deals') notFound()`.

## Strings tokenizados

15 keys `deals_*` en `textos`: `deals_label`, `deals_expires_prefix`, `deals_promo_code_label`,
`deals_send_phone`, `deals_send_email`, `deals_cancel`, `deals_empty`, `deals_sort_expiring`,
`deals_sort_recent`, `deals_sort_az`, `deals_sort_best`, `deals_filters_title`,
`deals_filter_features`, `deals_clear_all`, `deals_apply`.

## Out of scope (v1)

- Telemetría de envío (ni en este modal ni en Tickets actual).
- Favoritos de deals (los cupones caducan).
- Detail fullscreen intermedio (el modal ES el detail).
- `[slug]/page.tsx` de deals (404 explícito).

## Verification

- `pnpm check` limpio.
- Playwright MCP: 4 screenshots clave (listing, filter, redeem modal, send-phone flow).
- Auditor white-label sin strings nuevos hardcoded (fallbacks `??` toleradas).
- Toggle `KIOSK_CLIENT=demo-cliente-a` confirma tokens + textos traducidos.
- Deal con `expiresAt < todayISO()` no aparece en grid.

## Implementation order (4 olas)

1. Tipos + data layer + config seed (20 deals).
2. Grid + card + toolbar + filter + sort + search + ruta.
3. Modal redeem + host + send flows.
4. QA visual + SUMMARY + STATE + ROADMAP.
