# PWA-PROJECT.md — Mobile PWA (white-label)

> Milestone hermano de "Studio" y "Signage". Detalle de fases en `PWA-ROADMAP.md`.
> Brainstorming aprobado 2026-05-25 (plan `~/.claude/plans/quiero-que-ahora-dise-emos-lazy-harbor.md`).

## Visión

La **Mobile PWA** es la _companion app_ del kiosk: un producto white-label que comparte
**branding (tokens) + data (config/JSON)** con el kiosk portrait, pero con su **propio diseño
mobile** y un **flujo distinto** (Welcome → Login → Dashboard, navegación por Bottom Nav,
módulos exclusivos de PWA).

## ¿Por qué existe?

El visitante se lleva el kiosk en el bolsillo: explora listings, eventos, mapa, deals y pases
desde su teléfono, con login propio, perfil, notificaciones y mecánicas de engagement
(Scavenger Hunt). Igual que el kiosk, **un cliente nuevo se reconfigura solo con JSON + tokens**,
sin tocar código.

## Principios

1. **Pixel-perfect con el diseño original.** Cada pantalla mobile es indistinguible del XD dentro de ±2px.
2. **Cero hardcoded.** Colores → `tokens.css`; textos → `config.json`; assets → `clients/{slug}/assets/`.
3. **El kiosk no se toca.** La PWA vive en su propio route group `(pwa)` con componentes mobile propios.
   Solo comparte la capa de datos + tokens + config + i18n.
4. **Reutilizar sin duplicar lógica.** Los módulos reusados (Listings, Events, Map…) consumen la
   misma data layer del kiosk; cambia el **diseño**, no el contrato de datos.

## Alcance de este milestone

**Solo frontend pixel-perfect.** Datos y auth **mockeados localmente** (como el kiosk hoy con su
data seed). Se clona el diseño, se navega, se valida visualmente. La integración al Studio es la
**última fase** (Pz), tras aprobación visual del runtime local.

### Decisiones fijadas (2026-05-25)

- **Diseños fuente:** SVG de Adobe XD → `designs/mobile-pwa/NN-pantalla.{svg,md}`.
- **Canvas de referencia:** **390×844**. Los artboards están a 375×812; se **adaptan a 390×844**
  (aspect ratio casi idéntico 0.4618→0.4621 ≈ escalado uniforme 1.04× sin re-layout).
- **Arranque:** Welcome → Login → Dashboard. Sin idle/billboard.
- **Cliente activo:** `KIOSK_CLIENT` (igual que el kiosk). Ruta de servido: `/pwa`.
- **Granularidad de módulos:** el operador (Rubén) va indicando qué pantalla sigue, una a la vez.

## Inventario de módulos

- **🔁 Reutilizados (diseño mobile propio):** Home/Dashboard · Listings (Restaurants / Things to Do /
  Stay) + detalle · Events · Map · Deals · Passes · Tickets · Trails · Digital Brochure · Ask AI ·
  Itinerary/Favoritos · Multi-idioma (transversal) · Ads (transversal).
- **🆕 PWA-only (nuevos):** Login Flow (mock passwordless) · Profile/Account · Notifications ·
  More Module · Scavenger Hunt · Bottom Nav Menu (transversal). _(Se añadirán más sobre la marcha.)_
- **🚫 Excluidos:** Photo Booth · Guestbook · Social Wall · Billboards · Survey.

## Fuera de alcance (milestone posterior)

Backend real: login passwordless funcional (código del kiosk → sesión), sync de favoritos
kiosk↔phone, push notifications, wallet (Apple/Google), offline maps + service worker.
En este milestone van **mockeados localmente**.

## Éxito = cuando pueda

1. Abrir `/pwa` y recorrer Welcome → Login → Dashboard → módulos, idéntico al XD (±2px).
2. Cambiar `KIOSK_CLIENT` y/o `tokens.css` y reconfigurar la PWA entera sin tocar un `.tsx`.
3. (Cierre del milestone) Activar "Mobile PWA" desde el Studio y previsualizarla en el iframe 390×844.
