# Fase 3.16 — Photo Booth · COVERAGE checklist

Se completa por pantalla durante las Olas 2, 4 y 5. Antes de declarar una pantalla "hecha" TODOS los groups deben tener un check.

## Pantalla 0 — Start (`0-Photo_Booth-Start.svg`)

_TBD — se rellena al abrir Ola 2. Inventariar `<g>` con `pnpm exec tsx scripts/svg-groups.ts` (o read + grep) y listar aquí con su propósito._

- [ ] Header branding (logo TrueOmni)
- [ ] Weather + clock (esquina derecha)
- [ ] Home button (esquina izq inferior)
- [ ] Live camera preview (fullscreen bg)
- [ ] Background carousel (fila circular inferior con 5 opciones)
- [ ] START button central (círculo blanco con icono cámara)
- [ ] TIMER toggle (pill inferior izquierda)
- [ ] EXPERIENCE button (pill inferior derecha)

## Pantallas 1/2/3 — Countdown (`{1,2,3}-Photo_Booth-Countdown-{3,2,1}.svg`)

Las 3 SVGs comparten la misma estructura con el número distinto.

- [ ] Live camera preview (blurred o dimmed)
- [ ] Overlay semitransparente (`--photo-countdown-bg`)
- [ ] Número gigante (3 / 2 / 1) centrado
- [ ] Transición 1s entre cada uno (framer-motion opacity + scale)

## Pantalla 4 — Experience editor (`4-Photo_Booth-Experience.svg`)

_TBD — se rellena al abrir Ola 4._

- [ ] Header branding + weather
- [ ] Back arrow (esquina izq superior)
- [ ] Row 1: carrusel circular superior (opciones del tab activo)
- [ ] Row 2: stickers emoji (🍷🎈❤️🕶️⚽💛🌿)
- [ ] Tabs: Backgrounds | Frames | Filters
- [ ] Hero foto central con frame/background/filter aplicados
- [ ] Share sidebar derecha (flechas + botón QR)

## Pantalla 5 — Share (`5-Photo_Booth-Share.png.svg`)

_TBD — se rellena al abrir Ola 5._

- [ ] Header branding + weather
- [ ] Home button
- [ ] Título "SHARE YOUR MEMORIES"
- [ ] Foto final en tarjeta brandeada (con logo TrueOmni arriba)
- [ ] Sección "Follow us" + iconos sociales (X, Facebook, Instagram)
- [ ] QR code grande (qrcode.react)
- [ ] CTA EMAIL
- [ ] CTA TEXT

## Verificación visual (revisor-visual)

Por cada pantalla:

1. `pnpm kiosk:dev` + navegar a la ruta de prueba.
2. Playwright screenshot 1080×1920 sin escalado.
3. Comparar contra el PNG del SVG original con `revisor-visual`.
4. Tolerancia ±2 px.
5. Guardar capturas en `.planning/verifications/3-16-<screen>-<n>.png`.
