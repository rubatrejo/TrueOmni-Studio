# Guestbook Module — Design Spec

**Fecha:** 2026-04-23 · **Autor:** Rubén + Claude · **Fase:** 3.14

## Context

Módulo interactivo que permite al usuario firmar un libro de visitas
virtual con su ubicación geográfica. Flujo inmersivo tipo Google Earth
zoom-in desde globo a zip code específico, donde puede ver pins de otros
usuarios y añadir el suyo con un comentario.

7 pantallas del XD entregadas (Start, Form Empty/Filled, Transition, Map
Pins Interaction/Dragged/Comment).

## Flow (4 phases)

```
start: hero + CTA + globe crop
  ↓ tap START
form: inputs + QWERTY/Keypad + checkboxes + NEXT + globe crop
  ↓ NEXT (validación: name + email + zip + privacy)
transition: geocode zip + map.flyTo() + satellite → streets style swap
  ↓ moveend
map: seedPins markers + pin rail drag&drop + comment modal + FINISH
  ↓ FINISH
done: userPin → sessionStorage + redirect /home
```

## Data model

Ver `src/lib/config.ts` — `GuestbookPinOption`, `GuestbookCountry`,
`GuestbookSeedPin`, `HomeGuestbookModule`.

## Reuso

- `OnScreenKeyboard` — QWERTY para name/email/phone/comment.
- `NumericKeypad` — zip code.
- `HomeHeader` — hero de start + minimal del form.
- `createFavoritesStore` patrón → `useGuestbookUserPins`.
- `useEscapeToClose` — dropdown + modal.
- Mapbox GL JS (ya usado en Map/Trails modules).

## Componentes nuevos

| Archivo                           | Rol                                |
| --------------------------------- | ---------------------------------- |
| `guestbook-module.tsx`            | State machine + compose            |
| `guestbook-start-screen.tsx`      | Phase start                        |
| `guestbook-form-screen.tsx`       | Phase form + QWERTY/Keypad         |
| `guestbook-form-fields.tsx`       | Grid readonly inputs               |
| `guestbook-country-dropdown.tsx`  | Overlay países                     |
| `guestbook-globe-canvas.tsx`      | MapboxMap único (projection globe) |
| `guestbook-map-screen.tsx`        | Map + rail + modal + FINISH        |
| `guestbook-pin-rail.tsx`          | Drag&drop pins                     |
| `guestbook-pin-comment-modal.tsx` | Comment input + readonly view      |

## Persistencia

- **v1**: seed + sessionStorage (`kiosk_guestbook_user_pins`).
- **v2** (Fase 5+): backend real.

## Geocoding

Mapbox Geocoding API v5 (`types=postcode`), token en `config.integraciones.mapbox_token`.
Fallback a `config.client.coords` si el request falla o no hay resultados.

## Animación Earth

Mapbox globe projection + satellite-streets-v12 estilo inicial. `flyTo`
con curve 1.6, speed 0.55. Al completar, switch a `streets-v12` para
visibilidad de calles. Atmosphere setFog con horizon-blend 0.04 +
star-intensity 0.6 para efecto espacial.

## Drag & drop

- `onPointerDown` en pin del rail → setPointerCapture + clone visual fijo.
- `onPointerMove` → updates position del clone.
- `onPointerUp` → `map.getCanvasContainer().getBoundingClientRect()` para
  verificar si el drop cae dentro del mapa. Si sí, `map.unproject([x, y])`
  → `{lng, lat}`. Abre comment modal con `pendingDrop` state.
- `onPointerCancel` → cleanup.
- `touchAction: 'none'` para evitar scroll interference.

## Validación form

- name: trim length > 1
- email: `^[^\s@]+@[^\s@]+\.[^\s@]{2,}$`
- zip: `^[0-9A-Za-z -]{3,10}$`
- privacy: true

Todos requeridos. Phone y Country opcionales en validación.

## Strings tokenizados

22 keys `guestbook_*` en `textos`: start*title/subtitle/cta, form_title,
field*{name,email,phone,country,zip}, terms*{privacy,updates}, next_cta,
pin*{title,subtitle,comment_placeholder,today,confirm,close}, finish_cta,
thanks_title, invalid_zip_fallback, country_select_title, label.

## Routing

- `[module]/page.tsx` — `case 'guestbook' → GuestbookModule`. Sin AdsSlot
  (el flujo es inmersivo y no debe interrumpirse).
- `[module]/[slug]/page.tsx` — `notFound` para kind guestbook.

## Out of scope (v1)

- Backend real.
- Validación email via API (confirm code).
- Moderación de comentarios.
- Fotos subidas por el usuario.
- Sync cross-kiosk (cada kiosk es independiente en v1).

## Verification

- `pnpm typecheck` limpio.
- Playwright MCP: Start + Form screens visibles con globe crop.
- Flujo end-to-end testeable manualmente (QWERTY onscreen requiere 40+
  clicks para automatizar).
