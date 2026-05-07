# SIGNAGE-PROJECT.md — Digital Displays (Signage) white-label

## Visión

Producto paralelo al kiosk dentro del mismo TrueOmni Studio: **Digital Displays**
(signage) para TVs de lobby/restaurant/spa. **No-touch**, auto-rotativo, con
dayparting. Cada cliente gestiona N displays con playlists independientes desde el
mismo Studio en un dropdown del header (`Kiosks ↔ Digital Displays`).

## ¿Por qué existe?

El kiosk cubre interactividad touch en pantallas verticales 1080×1920. Pero los
hoteles, restaurantes y spas también tienen pantallas horizontales 1920×1080
ambient (lobby TVs, video walls, conference room screens) que necesitan contenido
rotativo white-label. Hoy no tenemos producto para eso. Digital Displays cubre
esa familia con la misma infra del Studio (auth, shell, primitives, bridge,
publish), pero entidad y datos completamente independientes del kiosk.

## Principios

1. **Pixel-perfect contra los SVGs del XD** dentro de ±2px @ 1080p baseline.
2. **Cero hardcoded.** Tokens propios (`--signage-*`), strings i18n (`signage.*`), assets en `clients-signage/<slug>/`.
3. **No-touch obligatorio.** Cero `onClick` / `onTouchStart` / `onPointerDown` en árbol signage.
4. **Responsive por `transform: scale`** uniforme — preserva pixel-perfect a 4K.
5. **Editor signage = mismo UI que editor kiosk.** Solo cambia el contenido.
6. **Independencia total del kiosk.** Folder `clients-signage/` paralelo, KV namespace `signage:*`, tokens propios, runtime URL distinta.

## Fuera de alcance

- Touch interactivity, keyboard, idle reset.
- Compartir clientes con kiosk.
- Compartir tokens / branding con kiosk.
- Render server-side a video MP4 (delivery es URL en vivo, igual que kiosk).
- Modo portrait (signage v1 es solo landscape; portrait queda para v2 si surge demanda).

## Éxito = cuando pueda

1. Levantar `pnpm kiosk:dev` y abrir `/signage/default/lobby-tv` viendo los 8 templates rotando pixel-perfect.
2. Crear un cliente signage real desde el Studio sin tocar código.
3. Publicarlo a producción y que el TV abra la URL → playlist live con dayparting funcionando.
4. Cambiar tokens en el Studio → todos los displays del cliente cambian de identidad visual sin redeploy.
