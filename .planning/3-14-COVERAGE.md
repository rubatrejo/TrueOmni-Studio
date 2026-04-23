# Fase 3.14 — Coverage checklist (Guestbook)

SVGs del XD cubiertos (originales en `/Users/rubenramirez/Desktop/Guestbook/`):

## Pantalla 0 — Start

- [x] Hero image (HomeHeader con heroImage).
- [x] Título "Sign our Guestbook!" (tokenizado).
- [x] Subtítulo tokenizado.
- [x] Botón START azul (`#1796d6`).
- [x] Globo visible abajo (Mapbox globe projection).

## Pantalla 1 — Form Empty

- [x] HomeHeader compacto.
- [x] Título "Start your Guestbook!".
- [x] Fields: Complete Name, Email, Phone, Country, Zip Code (grid 2-row).
- [x] Checkboxes Privacy + Updates.
- [x] Botón NEXT azul (disabled hasta que se cumple validación).
- [x] Globo visible abajo entre form y teclado.

## Pantalla 2 — Form Filled

- [x] Input con valor muestra `color: #1a1a1a` bold en lugar de placeholder.
- [x] Active field tiene border azul.
- [x] QWERTY keyboard abajo (OnScreenKeyboard reusado).
- [x] NEXT se habilita cuando Name + Email + Zip + Privacy son válidos.

## Pantalla 3 — Map Transition

- [x] Globo fullscreen durante phase `transition`.
- [x] `flyTo` con curve 1.6, speed 0.55 (animación ~4s).
- [x] Switch automático satellite → streets-v12 al terminar moveend.
- [x] Mensaje de fallback si geocoding falla.

## Pantalla 4 — Map Pins Interaction

- [x] Mapa urbano (streets-v12) centrado en coord del zip.
- [x] seedPins renderizados como markers DOM circulares con avatar + stem azul.
- [x] Pin rail inferior con 5 pins del catálogo.
- [x] Tap en seedPin abre modal readonly con su comment.

## Pantalla 5 — Map Pins Dragged

- [x] Drag & drop del pin desde el rail al mapa.
- [x] `unproject([x, y])` → lat/lng.
- [x] Pin del catálogo usado aparece atenuado en el rail (opacity 0.25 + grayscale).
- [x] Botón FINISH verde olive (`#b9bd39`) aparece tras confirmar comentario.

## Pantalla 6 — Map Pins Comment

- [x] Modal con avatar circular flotante arriba, nombre, "Today", address.
- [x] Textarea con placeholder tokenizado.
- [x] CONFIRM button azul.
- [x] X para cerrar.
- [x] QWERTY keyboard abajo con ENTER → newline.

## Flows verificados

- [x] START → form.
- [x] Fill form → NEXT habilitado → submit → transition phase.
- [x] Geocode real via Mapbox API (con fallback a `config.client.coords`).
- [x] flyTo + style switch al terminar.
- [x] Map shows seedPins filtered by proximity to user coord.
- [x] Drag pin from rail → drop on map → comment modal.
- [x] Confirm → pin queda en map + FINISH visible.
- [x] FINISH → user pin persistido en sessionStorage + redirect `/home`.
- [x] Tap en seedPin existente → modal readonly.

## Deuda / pendientes

- [ ] Assets custom (pins + hero) del XD reemplazando placeholders SVG.
- [ ] Test end-to-end automatizado (requiere 40+ taps QWERTY).
- [ ] Auditor white-label sobre `src/components/guestbook/` (fallbacks `??` esperables).
