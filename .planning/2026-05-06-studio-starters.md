# Studio starter templates — Fase 9 del roadmap

**2026-05-06 · cierre Fase 9 (originalmente "v2 — Temas adicionales")**

Catálogo de starter templates pre-canned para acelerar la creación de un kiosk nuevo. Cada starter define un punto de partida realista (paleta + fonts + módulos sugeridos + tono Ask AI) que el operador puede aplicar al crear el kiosk.

---

## Starters disponibles

Definidos en `src/app/studio/_lib/starters.ts`. Listado actual:

### 1. `boutique-hotel` — Boutique Hotel

- Paleta `Hotel Beach` (calm blues + tropical accents)
- Fonts `Playfair Display` / `Inter`
- Módulos default: Restaurants, Things to Do, Trip Planner, Ask AI, Events, Tickets, Guestbook, Digital Brochure
- Tone Ask AI: concierge-style, calm, refined
- 4 sugerencias Ask AI pre-pobladas

### 2. `dmo-state` — DMO Statewide

- Paleta `TrueOmni` (Tech Blue)
- Fonts `Outfit` / `Inter`
- Módulos default: TODOS los 16 + ads + lenguajes
- Tone Ask AI: travel guide, iconic + off-the-beaten-path
- 4 sugerencias

### 3. `resort-tropical` — Resort / Tropical

- Paleta `Forest`
- Fonts `Cormorant Garamond` / `Inter`
- Módulos default: Restaurants, Things to Do, Tickets, Photo Booth, Social Wall, Events, Ask AI, Trip Planner, Trails, Guestbook
- Tone Ask AI: easy-going vacation host, sunset/excursion focus

### 4. `urban-attraction` — Urban Attraction

- Paleta `Mono` (editorial)
- Fonts `Space Grotesk` / `Inter`
- Módulos default: Tickets, Passes, Events, Ads, Photo Booth, Ask AI, Digital Brochure, Things to Do, Social Wall
- Tone Ask AI: directo, informativo, wayfinding

---

## Cómo se aplica un starter (cuando esté la UI)

Pendiente de cableo en `NewClientModal`:

1. Operador clica "New kiosk".
2. Tras nombre + slug + location, paso opcional "Choose a starter" con las 4 cards.
3. Si selecciona uno, el `POST /api/studio/configs` recibe `?starter=boutique-hotel` y aplica:
   - `branding.primary/secondary/tertiary` desde `PRESET_PALETTES[starter.paletteId]`.
   - `branding.fonts.display/body` desde `starter.fonts`.
   - Cada `systemModules[key] = starter.defaultModules[key]` (no toca lo que no esté en el partial).
   - `aiAvatar.systemPrompt += "\n\n" + starter.aiTone` para influenciar el tone.
   - `aiAvatar.suggestedQuestions = starter.aiSuggestedQuestions.map(...)` con IDs nuevos.
4. El operador puede skip — el kiosk se crea con defaults TrueOmni.

---

## Decisiones tomadas

- **No se hardcodean en `clients/_template/`**: el template fs sigue siendo el TrueOmni stock (compatibility con bootstrap-from-fs). Los starters son post-creación overrides.
- **4 starters cubren ~85% de los clientes esperados**: hotels boutique, DMOs, resorts y atracciones urbanas. Si llega un caso fuera (eg. corporate event venue, museo), añadir al catálogo aquí.
- **Paleta vía referencia, no hex literal**: `paletteId` apunta a `PRESET_PALETTES` que ya existe en EditorPanel. Single source of truth para colores.
- **Sugerencias Ask AI en inglés**: el i18n las traduce con DeepL/Anthropic post-creación.

---

## Pendiente (follow-up)

- UI del NewClientModal con paso "Choose starter" (cards 4×1 grid con preview swatch).
- Endpoint `POST /api/studio/configs?starter=<id>` que aplica los overrides server-side.
- Preview en tiempo real del starter mientras se selecciona (paleta swatch + lista de módulos).
- Telemetry: cuántos kioskos usan cada starter.

**Estimación cableo UI:** S (1-2h) cuando se priorice en sub-fase futura.

---

**Última revisión:** 2026-05-06 · responsable: Rubén
