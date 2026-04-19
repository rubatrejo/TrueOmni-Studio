# REQUIREMENTS.md — Kiosk Portrait

Requerimientos divididos en v1 (MVP shippeable) y v2 (siguiente iteración).

## v1 — MVP

### R1. Ingesta de diseños desde Adobe XD

- Los exports SVG se depositan en `designs/{nn-pantalla}.svg`.
- Cada pantalla tiene su `designs/{nn-pantalla}.md` con medidas, estados e interacciones.
- Claude debe poder leer el SVG y replicarlo fielmente.

### R2. Clonado pixel-perfect en Next.js

- Stack: Next.js (App Router) + TypeScript + Tailwind + shadcn/ui.
- Cada pantalla es una ruta del App Router bajo `src/app/(kiosk)/`.
- Tolerancia visual: ±2px en cualquier elemento respecto al SVG original.

### R3. Sistema de tokens de diseño

- Variables CSS declaradas en `clients/{slug}/tokens.css`.
- Tailwind consume los tokens via `hsl(var(--...))`.
- Tokens cubren: colores (primary, secondary, bg, text, accent, etc.), tipografía (familia, escalas), radios, sombras, espaciados, transiciones.

### R4. Sistema de contenido JSON

- `clients/{slug}/config.json` con estructura tipada.
- Textos, paths de assets, feature flags.
- Cargado por `src/lib/config.ts` y accesible en server components.

### R5. Selector de cliente por build

- Variable de entorno `KIOSK_CLIENT=slug` elige el cliente al buildear.
- `KIOSK_CLIENT=default` debe funcionar sin configurar nada extra.

### R6. Plantilla de cliente

- `clients/_template/` contiene el esqueleto completo (tokens + config + assets).
- Documentado cómo copiarla y rellenarla.

### R7. Verificación visual

- Comando/script para generar screenshot del render y compararlo con el SVG.
- Al menos una verificación visual por pantalla antes de cerrarla.

### R8. Pantallas del kiosk v1

- _(Pendiente de definir al recibir los SVGs. A completar en fase 1.)_

## v2 — Próxima iteración

### R9. Multi-idioma

- `config.json` acepta estructura `{ "texts": { "es": {...}, "en": {...} } }`.
- Flag para activar selector de idioma en el kiosk.

### R10. Editor visual de tokens

- Página interna donde el cliente ve un preview de cada pantalla y puede ajustar tokens.

### R11. Integración con APIs externas

- `config.json` define endpoints; un `data-layer` los consume.

### R12. Variantes de tema (light/dark / alto contraste)

- Tokens con sufijo de modo.

### R13. Modo landscape opcional

- Breakpoints para pantalla horizontal.

## No-requerimientos

- ❌ Panel de administración.
- ❌ Base de datos propia.
- ❌ Autenticación de usuarios del kiosk (son terminales públicas).
- ❌ Responsive para móvil. Kiosk es pantalla fija en retrato.

## Trazabilidad

Cada fase del `ROADMAP.md` debe referenciar qué requerimientos cubre (ej. _"Fase 2: cubre R1, R3, R4"_).
