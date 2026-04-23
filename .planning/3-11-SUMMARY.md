# 3-11 SUMMARY — Módulo Tickets (subset de Events con venta de boletos via QR)

**Fecha:** 2026-04-22 · **Commits:** `ad2a926` (spec) · `44e79a2` (plan) · `741687e` (ola 1) · `4826f73` (ola 2) · `ba6577a` (ola 3) · TBD (ola 4 + SUMMARY).
**Spec:** `docs/superpowers/specs/2026-04-22-tickets-module-design.md`.
**Plan:** `.planning/3-11-1-PLAN.md`.

---

## Hecho

**Ola 1 — Foundations + refactor QR + seed** (`741687e`):

- `EventItem.ticket?` opcional (`priceDisplay` + `purchaseUrl`) en `src/lib/config.ts`.
- `HomeTicketsModule` interface (`kind: 'tickets'` + `label` + `heroImage` + catálogos opcionales) añadida al union `HomeModuleVariant`.
- Extracción del flow QR de Passes → `src/components/shared/`:
  - `qr-purchase-modal.tsx` (antes `PassShareModal`) — props genéricas `title`, `purchaseUrl`, `priceDisplay?`, `textos` con keys `qr_*`.
  - `qr-purchase-host.tsx` (antes `PassShareHost`) — prop `eventName` parametrizable.
  - `sent-confirmation.tsx` (antes `PassSentConfirmation`) — genérico reutilizable.
- `src/components/passes/pass-qr-host.tsx` nuevo wrapper client para Passes — mapea `passes_share_*` → `qr_*` y ejecuta `buildShareResult`/`dispatchShareResult`. (Resuelve error "Event handlers cannot be passed to Client Component props" cuando el host viene del Server.)
- Eliminados: `pass-share-modal.tsx`, `pass-share-host.tsx`, `pass-sent-confirmation.tsx`.
- Passes rama en `[slug]/page.tsx` migrada a `<PassQrHost>`. **Sin regresión visual** (verificado con Playwright — modal idéntico al pre-refactor).
- 12 keys `tickets_*` añadidas a `clients/default/config.json` y `clients/_template/config.json`.
- Bloque `features.home.modules.tickets` en config default (label + heroImage, sin `events[]` propio — lee del superset).
- 10 events ticketables nuevos **mezclados distribuidos** (posiciones 4, 9, 13, 17, 21, 25, 29, 33, 38, 43) entre los 46 existentes → total 56 events. Mix de precios: 3× `"$XX"` (`$25`, `$18`, `$40`), 3× `"$XX–YY"` (`$15–30`, `$45–80`, `$20–35`), 2× `"From $XX"` (`From $10`, `From $22`), 2× `"$XXX"` (`$120`, `$150`).
- 11 URLs nuevas verificadas HTTP 200 (hero tickets + 10 covers).
- Tile `"tickets"` en `features.home.tiles[]` (el asset `tickets.jpg` ya existía).

**Ola 2 — Tickets listing** (`4826f73`):

- `src/lib/tickets.ts` — `filterTicketableEvents` + `deriveTicketCategories/Venues/Features` + type guard `TicketableEvent = EventItem & { ticket: NonNullable<...> }`.
- `src/components/tickets/ticket-card.tsx` — reusa layout `EventCard` + **badge de precio pill blanco top-right** sobre el cover con `priceDisplay` (text `#004f8b` bold).
- `src/components/tickets/tickets-list.tsx` — mismo padding que `EventsList` + empty state tokenizado.
- `src/components/tickets/tickets-filter-overlay.tsx` — clon de `EventsFilterOverlay` con `catalogue` derivado del pool visible (no del superset) para no mostrar categorías sin tickets activos.
- `src/components/tickets/tickets-module.tsx` — filtra `allEvents` por `ticket != null`, reusa `WeekPicker`, `ListingsToolbar`, `SortOverlay`, `SearchOverlay`, `FavoriteAddedToast`.
- Rama `tickets` en `[module]/page.tsx`: resuelve `allEvents` desde `modules.events.events[]` y los pasa a `TicketsModule`.

**Ola 3 — Detail + buy flow + Events dispatcha QR** (`ba6577a`):

- `SecondaryCta` ampliado: acepta `onClick?: () => void` **OR** `href?: string` (mutuamente exclusivos). `SecondaryCtaButton` renderiza `<button>` si `onClick`, `<a>` si `href`.
- `src/components/tickets/ticket-detail-with-buy.tsx` — wrapper client que renderiza `ListingDetail` con `favoritesKind="event"` (bucket compartido) + CTA `"BUY TICKET"` disparando `CustomEvent('kiosk:ticket-purchase-open')`.
- Rama `tickets` en `[slug]/page.tsx`: monta `TicketsModule` + `TicketDetailWithBuy` + `QrPurchaseHost` con `priceDisplay`, `title` uppercase, textos `tickets_share_*` mapeados a keys genéricas `qr_*`.
- Rama `events` en `[slug]/page.tsx` actualizada: si `event.ticket` presente → usa `TicketDetailWithBuy` + `QrPurchaseHost` (mismo flow que Tickets). Si solo `ticketsUrl` legacy → comportamiento viejo (URL externa). Sin regresión para events no-ticketables.

**Ola 4 — QA + cierre**:

- 5 screenshots Playwright en `.planning/verifications/3-11-*.png` (listing, detail, qr-modal, events-ticket-reuse, sent-confirmation).
- `auditor-white-label` subagent ejecutado (resultado en commit final).
- `.planning/3-11-SUMMARY.md` (este archivo).
- Update `.planning/STATE.md` con entrada de sesión y siguiente acción.

---

## Verificado

- `pnpm check` (typecheck + lint + format) limpio tras cada ola.
- Playwright MCP — 5 screenshots críticos:
  - `3-11-tickets-listing.png` — toolbar `#004f8b` + WeekPicker + `TicketCard` con badge `$20–35` pill blanco sobre cover.
  - `3-11-tickets-detail.png` — `ListingDetail` con CTA `BUY TICKET` azul + WEBSITE pill + sharing row + map.
  - `3-11-tickets-qr-modal.png` — header azul `JAZZ IN THE PARK` + `$20–35` encima del QR + QR 260px + phone input + SEND.
  - `3-11-tickets-sent.png` — círculo lime + `Link sent!` + `Check your phone to complete the purchase.`
  - `3-11-events-ticket-reuse.png` — `/home/events/jazz-in-the-park` dispara el mismo QR modal.
- **Regresión Passes verificada:** `/home/passes/museum-pass` → GET YOURS → QR modal idéntico al pre-refactor. Sin cambios visuales.
- **Integridad URLs:** 11 URLs nuevas del módulo Tickets responden HTTP 200 (verificado con `fetch HEAD` desde Playwright).
- **Favoritos compartidos:** `favoritesKind="event"` en `TicketDetailWithBuy` confirma que un event con `ticket` favorito desde Tickets aparece favorito desde Events (mismo bucket `kiosk_event_favorites`).

---

## Pendiente / siguiente

- **Siguiente módulo del home** (Guestbook, Deals, Photo Booth, Trails, Itinerary Builder) o **Fase 4** (primer cliente real con branding + Lighthouse + handoff).
- **Itinerary Builder** consumirá los buckets `kiosk_favorites` + `kiosk_event_favorites` (ya usados por Tickets — sin nuevo bucket requerido).
- **Apagar `alwaysShowWelcome={true}`** del MapModule antes de Fase 4 (TODO heredado).
- **TODO i18n aplazado a Fase 5** (validador zod + migración general a `config.textos`):
  - `(602) 555-XXXX` en los 10 seed ticketables es telefono US fijo — queda como data de cliente en la misma Fase 4.
  - `"Music" | "Sports" | "Festival" | "Family" | "Arts"` como `category` en el seed — texto en inglés pendiente de i18n.
  - `"GET TICKETS"` legacy del events sin `.ticket` sigue literal — se tokeniza si el cliente real lo pide.

---

## Decisiones

- **Tickets ⊂ Events** — sin duplicación de data. `modules.tickets` solo declara label/heroImage/catálogos opcionales; el pool se lee de `modules.events.events[]` y se filtra en cliente. Si el cliente no configura `modules.events`, Tickets queda vacío con empty state.
- **QR purchase flow extraído a `shared/`** — evita duplicación entre Passes y Tickets. Props genéricas (`title`, `purchaseUrl`, `priceDisplay?`, `textos` con keys `qr_*`). Cada consumidor (Passes via `PassQrHost`, Tickets directo) mapea sus propias keys de `config.textos` al shape genérico.
- **`PassQrHost` client wrapper** para Passes — necesario porque el `onSent` callback (telemetría `buildShareResult`/`dispatchShareResult`) no puede cruzar la frontera Server→Client Component en Next 15. Tickets no necesita wrapper análogo porque no ejecuta telemetría downstream en v1.
- **Events con `.ticket` también usa QR popup** — consistencia de UX. `ticketsUrl` legacy queda activo solo si `.ticket` no está presente (zero regresión para events sin venta directa).
- **Badge de precio pill blanco sobre cover** (no banda `priceBand`) — priceDisplay string es más flexible (`$25`, `$15–30`, `From $10`, `$150`) que la banda 1-4. La banda sigue usándose para el filter overlay de precio porque agrupa rangos.
- **Favoritos bucket único `kiosk_event_favorites`** — un event con `ticket` es el mismo objeto sin importar el módulo de entrada; el estado de favorito debe ser único.
- **Catálogo derivado del pool visible** en `TicketsFilterOverlay` — evita mostrar categorías/venues sin tickets activos (UX clara). El filtro final sigue usando `applyEventsFilters` + `EventsFilterState` de Fase 3.4 sin duplicación.
- **Toolbar `ListingsToolbar` reusada** (no crear `tickets-toolbar.tsx`) — el chrome `#004f8b` con search/sort/filter ya es el patrón de Events; sin valor en duplicar.
- **`SecondaryCta.onClick` mutuamente exclusivo con `href`** — tipo opcional permite mantener retrocompatibilidad (RESERVE NOW + GET TICKETS legacy siguen funcionando con `href`).

---

**Fase:** 3.11 Tickets — cerrada con QA visual + auditor white-label.
