# DS3-SUMMARY.md — Template `01-full-events` pixel-perfect

**Fecha:** 2026-05-06
**Estado:** ✅ completado, aprobado visualmente
**Plan:** `.planning/DS3-PLAN.md` (no escrito formalmente — ejecutado directo del DS3 en plan principal)

---

## Hecho

- **5 imágenes extraídas** del SVG embedded base64 → `clients-signage/default/assets/events/{yoga,baseball,ski,music,dog}.jpg`.
- **Asset route** `/signage-assets/[client]/[...path]` espejo del kiosk `/assets`. Sirve archivos de `clients-signage/<slug>/...` con MIME types correctos + cache 1h. Fallback a `default` si el cliente no tiene el asset.
- **Template `01-full-events`** (`src/components/signage/templates/01-full-events.tsx`):
  - Inline `<svg viewBox="0 155 1920 925">` con paths verbatim del group `Events_Listing` del SVG.
  - 5 patterns SVG (1 por imagen) con dimensiones y viewBox copiadas verbatim del XD.
  - Hero izquierda 1144×925 + label olive 205×178 + bottom band azul cyan 1144×100.
  - Sub-hero 774×463 + label 160×138 + bottom band 774×100.
  - 3 small cards 258×462 + label 130×112 + bottom band 258×100 cada una.
  - Event_3 con clipPath (la imagen es 495×462, clip a 258×462).
  - Tokens consumidos: `--signage-events-accent` (olive), `--signage-text-on-brand`. `#1796d6` overlay del bottom band hardcoded (es overlay, no brand del cliente — TODO tokenize en sub-fase tardía).
- **Token olive**: `--signage-events-accent: 62 53% 48%` (#b9bd39) corregido del default cyan que tenía DS0.
- **Helper `parseAsWallClock`**: parsea ISO sin zona como UTC y formatea con `timeZone: 'UTC'` para que la hora literal del JSON se muestre tal cual (sin shift de timezone del servidor/navegador).
- **Helper `wrapTitle`**: parte titles >18 chars en 2 líneas en el último espacio. Aplicado a las 3 small cards (Park Ski / Tournament, Big Music Festival in / Downtown, Walk Your Dog With / Your Neighbors).
- **`text-anchor="middle"`** aplicado a las 10 etiquetas day+weekday del label olive. Reemplaza los x-offsets hardcoded que el SVG tenía tuneados para texto literal específico ("4", "Saturday", etc.) y que rompían el alineado al sustituir por contenido dinámico de longitud variable.
- **`display.json` default** ahora tiene 2 slides: `01-full-events` (12s) + `placeholder-b` (5s) para verificar la rotación entre template real y placeholder.
- **Auto-load** del registry actualizado: import de `01-full-events` activado.

---

## Verificado

| Check                                                       | Resultado                              |
| ----------------------------------------------------------- | -------------------------------------- |
| `pnpm typecheck && pnpm lint`                               | ✅ limpios                             |
| GET `/signage/default/lobby-tv`                             | ✅ HTTP 200                            |
| GET `/signage-assets/default/assets/events/yoga.jpg`        | ✅ HTTP 200 image/jpeg                 |
| Render del template muestra 5 events con imágenes correctas | ✅                                     |
| Hora coincide con events.json (11:00 am, 7:00 pm, 11:00 pm) | ✅ corregido tras parseAsWallClock     |
| Titles de small cards en 2 líneas                           | ✅                                     |
| Labels olive (no cyan)                                      | ✅ corregido tras token update         |
| Day y weekday centrados en el label                         | ✅ corregido tras text-anchor="middle" |
| Aprobación visual de Rubén                                  | ✅                                     |

---

## Decisiones

- **Imágenes embedded extraídas a JPGs reales en disco** (vs mantenerlas inline base64). White-label model: el cliente sustituye sus propios assets en `clients-signage/<slug>/assets/events/`. El asset route resuelve por slug.
- **`text-anchor="middle"` uniforme** en lugar de x-offsets hardcoded. El SVG fuente tenía offsets calculados para textos específicos ("4", "27", "Saturday"). Con texto dinámico esos valores rompían el alineado. Recoloqué cada `<text>` al centro horizontal del rect padre (calculado de width/2) y dejé text-anchor middle hacer el resto.
- **`parseAsWallClock`**: ISOs sin zona se tratan como wall-clock invariante. Forzamos UTC parse + UTC format → la hora del string aparece literal. Justifica que el operador puede setear `2026-05-09T11:00:00` y siempre verá `11:00 am` independientemente del server/cliente.
- **Sub-hero es el segundo evento (`events[1]`)**, no el primero. Mapping del SVG: hero=events[0] (yoga), sub-hero=events[1] (cubs), small=events[2..4] (ski/music/dog).
- **Wrap title naive at 18 chars**: para "Big Music Festival in Downtown" produce "Big Music Festival" / "in Downtown" — no idéntico al SVG (que tiene "Big Music Festival in" / "Downtown") pero close enough. El SVG era hardcoded; un cliente con otros titles tendrá su propio wrap natural.

---

## Pendiente / siguiente

- **DS4 — Template `02-full-ad`**: anuncio fullscreen. Es el segundo template, también fullscreen-de-un-módulo. Replica `designs/signage/02-full-ad.svg` (anuncio Travelife).
- **Tokenizar `#1796d6`** del bottom band overlay → `--signage-events-band-overlay` con default. Sub-fase tardía cuando el resto de templates lo usen también (composed templates lo comparten).
- **Iconos weather dinámicos por código**: deferred.
- **Header position toggle**: DS11.
