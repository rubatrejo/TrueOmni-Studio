# Diseño — Pantalla "Connect With Us" (PWA Mobile)

> Fecha: 2026-05-27 · Milestone PWA Mobile · Pantalla PWA-only (sub-pantalla del More).
> Diseño fuente: `~/Desktop/PWA/Connect With Us/Connect With Us.{png,svg}` (canvas XD 375×812).

## 1. Objetivo

Clonar pixel-perfect la pantalla "Connect With Us" del XD y cablearla como destino del
item `connect-with-us` del More Menu. Pantalla de contacto/branding del cliente: redes
sociales, acciones (Call/Website/Directions), horario, mapa, dirección, copyright y
footer del producto.

## 2. Ruta y navegación

- **Página**: `src/app/(pwa)/pwa/connect-with-us/page.tsx` (server component).
  Lee `getConfig()` + `integrations.mapbox.token` → pasa props al client component.
- **Componente**: `src/components/pwa/connect-with-us-screen.tsx` (`'use client'`:
  necesita Mapbox + estado del modal de horarios).
- **Cableo del More**: hoy los `items` del More (`more-screen.tsx`) son botones sin
  destino. Se añade un mapa `key → href` (solo `connect-with-us → /pwa/connect-with-us`
  por ahora; el resto sin destino hasta que existan). El item navega con `useRouter`.
- **Back**: el chevron-left del header vuelve a `/pwa/more`.

## 3. Datos (white-label) — nuevo bloque `config.features.pwa.connectWithUs`

```jsonc
"connectWithUs": {
  "social": {                 // solo se renderiza el icono si la URL existe
    "x": "https://x.com/...",
    "facebook": "https://facebook.com/...",
    "instagram": "https://instagram.com/...",
    "pinterest": "https://pinterest.com/..."
  },
  "orgName": "Arizona",        // nombre bajo el logo; si se omite → config.client.nombre
  "phone": "+16025550100",     // botón Call → tel:
  "website": "https://...",    // botón Website → abre en nueva pestaña
  "address": "Street Address, City, State, 12345, Country",
  "hours": {
    "statusTemplate": "Open Now until {close}",          // texto de la barra
    "schedule": [                                        // modal de horarios
      { "day": "Monday", "open": "9:00 am", "close": "11:00 pm" }
      // … 7 días
    ]
  },
  "copyright": "{client_name} is the official travel authority for the state of {city}©. {year}. All rights reserved."
}
```

- **Tipos** nuevos en `src/lib/config.ts`: `PwaConnectSocial`, `PwaConnectHours`,
  `PwaConnectHoursDay`, `PwaConnectWithUsConfig`; `PwaConfig.connectWithUs?`.
- **Mapa + Directions** reutilizan `config.client.coords` (ya existe) — no se duplican.
- **Interpolación** `{client_name}` / `{city}` / `{year}` en el copyright (regla CLAUDE.md:
  cero nombres geográficos hardcoded). `{city}` sale de un campo del config o del nombre;
  `{year}` del año actual; `{client_name}` de `config.client.nombre`.
- **Schema**: actualizar `clients/_template/config.schema.json` + sembrar en
  `clients/default/config.json`.

## 4. Anatomía visual (verbatim XD, patrón `Layer` 375-space ×1.04)

1. **Header** (h≈90) brand-primary: chevron-left (back, izq) + título "Connect With Us"
   centrado (Montserrat bold, blanco). Status bar del SO no se dibuja (safe-area azul).
2. **Hero social** (fondo blanco): logo del cliente grande centrado (`TrueOmniLogo`
   `slot="default"`, tokenizado) + 2 iconos sociales a cada lado (X·FB izq | IG·Pinterest
   der) en círculos outline brand con glyph brand (monocromo → `--brand-primary`),
   paths verbatim del SVG. Nombre de la org centrado debajo (brand, bold).
3. **Fila 3 acciones**: Call · Website · Directions — icono + label en brand. Paths del SVG
   (o FA6 oficiales equivalentes: phone, bookmark/window, location-dot).
4. **Divider** + **barra horario**: icono reloj + "Open Now until 11:00 pm" + chevron-right.
   Tap → abre **modal de horarios**.
5. **Mapa**: Mapbox GL interactivo (pan/zoom) centrado en `config.client.coords`, pin rojo
   (marcador teardrop verbatim del diseño). Sin token → placeholder "Map unavailable"
   (mismo fallback que `directions-map-with-route.tsx`).
6. **Dirección**: `address` (texto, Open Sans).
7. **Copyright** del cliente (interpolado, gris, centrado).
8. **Divider** + **footer del producto**: "Designed and built by" + `TrueOmniLogo
slot="brand"` (negro, `text-foreground`/`text-black`) + "trueomni.com". **FIJO, no
   white-label** — branding del fabricante (excepción documentada; `slot="brand"` nunca
   se sobrescribe por el Studio). Typo del XD ("build") corregido a "built".
9. **Bottom nav** compartido (`PwaBottomNav`) — **sin celda activa** (es sub-pantalla del
   More, no un tab principal). Requiere hacer `active` opcional en `PwaBottomNav`.

## 5. Modal de horarios

- Overlay dentro del `MobileCanvas` (no full-window): scrim + tarjeta con los 7 días y su
  rango (`hours.schedule`). Cabecera brand + lista Open Sans. Cierra con tap en scrim / X.
- Estado local (`useState`) en el componente client.

## 6. Iconos nuevos

- `connect-icons.tsx` (o ampliar `social-icons.tsx`): **X, Instagram, Pinterest** + versión
  outline-brand de **Facebook** (la existente es relleno azul del Login, otro estilo).
  Paths verbatim del SVG; círculo + glyph en `currentColor` (tokenizable a brand).
- Acciones: phone, website (bookmark/window), location-dot (Directions), clock, chevron-left,
  chevron-right — paths verbatim del SVG o FA6 oficiales si coinciden.

## 7. White-label (reglas CLAUDE.md)

- Todo texto/URL → `config`. Todo color → token (`--brand-primary`, etc.). Cero hex en JSX
  salvo: marcador rojo del pin (estándar de mapa, no branding) y el negro del footer-producto.
- Cambiar `tokens.css` cambia la identidad; cambiar `config` cambia el contenido.
- Única excepción de hardcode permitida: footer "Designed and built by TrueOmni /
  trueomni.com" (branding del producto, documentado en el componente).

## 8. Verificación (protocolo pixel-perfect)

1. Inventario de groups del SVG → checklist de coverage.
2. Paths/coords verbatim del SVG con sus `transform`.
3. `pnpm kiosk:dev` + screenshot `agent-browser` de `/pwa/connect-with-us` vs
   `Connect With Us.png` → diff ±2px (subagent `revisor-visual`).
4. `pnpm typecheck && pnpm lint && pnpm format:check` limpios.
5. `auditor-white-label` sin hallazgos (excepto footer-producto documentado).
6. Smoke: `/pwa/more` → tap "Connect With Us" → pantalla; back → More; kiosk `/` sin regresión.

## 9. Fuera de alcance

- Backend real (las URLs sociales/website abren; no hay analítica de clics).
- Datos de horario reales por integración (se siembran en config; mock).
- Integración al Studio (editor de `connectWithUs`) → milestone Pz.
