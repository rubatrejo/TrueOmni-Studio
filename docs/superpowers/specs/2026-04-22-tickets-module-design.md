# Spec — Módulo Tickets (Fase 3.11)

**Fecha:** 2026-04-22 · **Autor:** Rubén + Claude (brainstorming sesión)
**Fase propuesta:** 3.11 · **Precedente:** 3.10 Passes (spec en `docs/superpowers/specs/2026-04-22-passes-module-design.md`).

## Context

El kiosk ya tiene un módulo **Events** (Fase 3.4) que muestra todos los eventos de un cliente. Algunos eventos venden boletos; otros solo son informativos. El módulo **Tickets** es una vista filtrada sobre el superset de eventos: muestra únicamente los que tienen venta de boletos activa, con precio visible en la card y un CTA de compra en el detail que abre un popup con QR (mismo patrón del share de Passes) para que el usuario complete la compra en su teléfono (escaneo) o reciba el link por SMS.

**Decisiones arquitecturales base:**
1. Tickets ⊂ Events — filtrado por la presencia del campo `ticket` en `EventItem`. Fuente de verdad única en `modules.events.events[]`.
2. El flow QR + teléfono se **extrae** del módulo Passes a un componente compartido (`QrPurchaseModal` + `QrPurchaseHost`) reutilizable por Passes, Tickets y Events.
3. Events con `ticket` configurado **también** usa el QR popup (no `ticketsUrl` externo). `ticketsUrl` queda como legacy: si solo ese está presente, comportamiento viejo.
4. Favoritos: bucket compartido `kiosk_event_favorites`. Un mismo event = un mismo estado de favorito sin importar el módulo.

---

## 1. Tipos y data shape

**Archivo:** `src/lib/config.ts`

Añadir campo opcional a `EventItem`:

```ts
export interface EventItem {
  // ...campos existentes
  /** Si está presente, el evento vende boletos y aparece en el módulo Tickets. */
  ticket?: {
    /** Texto libre a mostrar en la card/detail: "$25", "$15–30", "From $10". */
    priceDisplay: string;
    /** URL absoluta que va codificada en el QR del popup de compra. */
    purchaseUrl: string;
  };
}
```

Nueva variante de módulo:

```ts
export interface HomeTicketsModule {
  kind: 'tickets';
  label: string;
  heroImage: string;
  categories?: string[];
  venues?: string[];
  features?: string[];
}
```

Añadir `HomeTicketsModule` al union `HomeModuleVariant`.

`HomeTicketsModule` **no lleva** `events[]`. `TicketsModule` consume `modules.events.events[]` y filtra por `e.ticket != null`. Si `modules.events` no está configurado, Tickets renderiza empty state.

---

## 2. Componente compartido: QR purchase modal

**Refactor:** mover `PassShareModal` + `PassShareHost` a `src/components/shared/` como componente genérico.

**Archivos nuevos:**
- `src/components/shared/qr-purchase-modal.tsx` — renombrado desde `PassShareModal`.
- `src/components/shared/qr-purchase-host.tsx` — renombrado desde `PassShareHost`; acepta prop `eventName` para escuchar el `CustomEvent` correcto.

**Props genéricas:**
```ts
interface QrPurchaseModalProps {
  open: boolean;
  title: string;
  purchaseUrl: string;       // valor del QR + payload SMS
  priceDisplay?: string;     // opcional, visible arriba del QR en Tickets
  textos: Record<string, string>;
  qrLogo?: string;
  onCancel: () => void;
  onSent: (phoneDigits: string) => void;
}
```

**Eventos emitidos por cada consumidor:**
- Passes: `kiosk:pass-share-open` (detail: `{passSlug, passTitle, purchaseUrl}`).
- Tickets / Events ticketable: `kiosk:ticket-purchase-open` (detail: `{eventSlug, eventTitle, purchaseUrl, priceDisplay}`).

**Archivos de Passes a actualizar** (cambio de imports + nombres):
- `src/components/passes/pass-detail-with-share.tsx`
- `src/app/(kiosk)/home/[module]/[slug]/page.tsx` (rama `passes`)

Los textos `passes_share_*` del config pasan a ser props `textos` (cada módulo pasa los suyos). Se añaden keys `tickets_share_*` en paralelo.

---

## 3. Componentes nuevos del módulo Tickets

Directorio: `src/components/tickets/`

| Archivo | Propósito | Basado en |
|---|---|---|
| `tickets-module.tsx` | Root client. Lee `modules.events.events[]`, filtra `e.ticket != null`, renderiza toolbar + week-picker + grid + scroll-hint. | `events-module.tsx` |
| `ticket-card.tsx` | Card horizontal (dims de `EventCard`) + **badge de precio** pill blanco con texto primary en esquina top-right del cover. | `event-card.tsx` |
| `tickets-list.tsx` | Lista vertical de `TicketCard`, empty state propio. | `events-list.tsx` |
| `tickets-filter-overlay.tsx` | Idéntico a `EventsFilterOverlay`: Category / Venue / Price / Features. | `events-filter-overlay.tsx` |
**Toolbar:** reuso directo de `ListingsToolbar` (la misma que usa Events). Label parametrizado vía prop `label`. No se crea archivo nuevo.

**Reuso directo** (sin modificar): `ListingsToolbar`, `WeekPicker`, `BackButton`, `FloatingHomeButton`, `SearchOverlay`, `AdsSlot`.

---

## 4. Routing

**`src/app/(kiosk)/home/[module]/page.tsx`**: añadir rama `if (mod.kind === 'tickets') return <TicketsModule ... />`.

**`src/app/(kiosk)/home/[module]/[slug]/page.tsx`**:
- **Rama `tickets`** nueva. Resuelve el event en `modules.events.events[]`. Si no existe o no tiene `ticket`, `notFound()`. Renderiza `ListingDetail` con `eventMeta` + `secondaryCta = { label: textos.tickets_buy_cta, onClick: dispatch('kiosk:ticket-purchase-open', {...}) }`. Monta `<QrPurchaseHost eventName="kiosk:ticket-purchase-open" ... />` sibling al detail.
- **Rama `events` existente**: dispara el mismo `kiosk:ticket-purchase-open` si `event.ticket` está presente. Si solo tiene `ticketsUrl` legacy → comportamiento viejo (URL externa). Monta `<QrPurchaseHost>` sibling siempre que `event.ticket` exista.

**`src/components/listings/listing-detail.tsx`**: ampliar prop `secondaryCta` para aceptar `onClick` alternativo a `href`. Si `onClick` presente, dispara callback en vez de navegar.

---

## 5. Favoritos

**Archivo:** `src/lib/favorites.ts`. **Sin cambios.** Tickets reusa `useEventFavorites()`.

Un event con `ticket` marcado como favorito aparece favorito en ambos módulos (Events y Tickets). `TicketCard` y el detail heredan este comportamiento del hook existente.

---

## 6. Seed data

**`clients/default/config.json`** — crear 10 events **nuevos ticketables** y **mezclarlos distribuidamente** (no al final) entre los 46 existentes en `modules.events.events[]`.

Cada ticketable event incluye los campos de `EventItem` más:

```json
"ticket": {
  "priceDisplay": "$25" | "$15–30" | "From $10" | "$45–80",
  "purchaseUrl": "https://tickets.example.com/..."
}
```

**Mix de precios (variedad de formato):**
- 3× `"$XX"` (precio único)
- 3× `"$XX–YY"` (rango)
- 2× `"From $XX"` (desde)
- 2× `"$XXX"` (premium)

Las 10 URLs de imágenes se verifican con `fetch HEAD` antes de cerrar fase — cero rotas.

**Añadir bloque `modules.tickets`:**
```json
"tickets": {
  "kind": "tickets",
  "label": "Tickets",
  "heroImage": "https://images.unsplash.com/...",
  "categories": [...],
  "venues": [...],
  "features": [...]
}
```

---

## 7. Home tile

**`clients/default/config.json`** — añadir tile `tickets` al array `features.home.tiles[]` después del tile `events`. Grid pasa de 16 a 17 tiles.

```json
{ "slug": "tickets", "label": "Tickets", "icon": "...", "image": "..." }
```

Asset icon: `clients/default/assets/home/tickets.svg` (placeholder inicial reusa icon de Events; refinar con diseño del cliente).

---

## 8. Textos (white-label)

Nuevas keys en `textos` de `clients/default/config.json` y `clients/_template/config.json`:

- `tickets_label`
- `tickets_buy_cta` → "BUY TICKET"
- `tickets_share_instruction` → "SCAN QR OR GET SMS TO BUY YOUR TICKET"
- `tickets_share_phone_label`
- `tickets_share_phone_placeholder` → "000-555-0115"
- `tickets_share_country` → "USA (+1)"
- `tickets_share_terms` → "I accept details"
- `tickets_share_send` → "SEND"
- `tickets_sent_title` → "Link sent!"
- `tickets_sent_message` → "Check your phone to complete the purchase."
- `tickets_empty` → "No tickets available right now."
- `tickets_share_phone_aria` → "Phone number. Tap to edit via keypad."

---

## 9. Archivos a crear

```
src/components/shared/qr-purchase-modal.tsx        (refactor desde passes/pass-share-modal)
src/components/shared/qr-purchase-host.tsx         (refactor desde passes/pass-share-host)
src/components/tickets/tickets-module.tsx
src/components/tickets/ticket-card.tsx
src/components/tickets/tickets-list.tsx
src/components/tickets/tickets-filter-overlay.tsx
src/lib/tickets.ts                                  (helpers: filterTicketableEvents)
```

## 10. Archivos a modificar

```
src/lib/config.ts                                    (+ticket, +HomeTicketsModule, +variant)
src/components/listings/listing-detail.tsx          (secondaryCta acepta onClick)
src/app/(kiosk)/home/[module]/page.tsx              (+rama 'tickets')
src/app/(kiosk)/home/[module]/[slug]/page.tsx       (+rama 'tickets', events dispatcha QR)
src/components/passes/pass-detail-with-share.tsx    (imports → shared/)
clients/default/config.json                          (+10 events con ticket, +modules.tickets, +tile, +textos)
clients/_template/config.json                        (+textos tickets_*)
```

## 11. Archivos a eliminar (movidos a shared/)

```
src/components/passes/pass-share-modal.tsx
src/components/passes/pass-share-host.tsx
```

---

## Verification

### Typecheck + lint + format
```bash
pnpm check
```

### Visual (Playwright MCP) — screenshots mínimos:
1. `/home/tickets` listing con ticket-cards y badge de precio visible.
2. `/home/tickets/<slug>` detail con CTA "BUY TICKET" grande.
3. QR purchase modal abierto con título del event + price + QR + phone input.
4. Confirmación "Link sent!" tras completar envío SMS.
5. `/home/events/<slug-ticketable>` con el mismo CTA "BUY TICKET" disparando el mismo QR modal.

### Integridad de data
Playwright `evaluate` con `fetch HEAD` sobre las ~11 URLs nuevas (10 covers + 1 hero tickets). Cero rotas antes de cerrar fase.

### Regresión Passes
1. `/home/passes/museum-pass` → GET YOURS → el `QrPurchaseModal` refactorizado funciona igual.
2. Completar flow SMS → `PassSentConfirmation` sigue apareciendo.

### Filtros
1. `/home/tickets` → filter overlay → Category "Music" → solo tickets music.
2. Clear all → todos.

### Favoritos compartidos
1. `/home/events/<slug-ticketable>` tap heart → favorito.
2. `/home/tickets` → ese event con heart filled.
3. Tap heart en Tickets → desaparece también en Events.

### Auditor white-label
Ejecutar `auditor-white-label` sobre `src/components/tickets/` y `src/components/shared/qr-*.tsx`. Cero hex/strings/paths hardcoded esperados (excepto excepciones heredadas del `send-modal-chrome`).
