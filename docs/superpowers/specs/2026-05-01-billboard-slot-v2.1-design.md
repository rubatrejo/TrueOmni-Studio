# Billboard slot v2.1 — Reactividad completa por módulo asignado

**Fecha:** 2026-05-01
**Autor:** Rubén (designers@trueomni.com)
**Estado:** aprobado, pendiente de plan

---

## Contexto

El editor Idle/Billboard del Studio (sesión 2026-04-30 sesión 2) introdujo
`billboard.modules: string[]` para que el operador asigne hasta 4 módulos a los
slots de un Billboard. Hoy los slots reaccionan parcialmente: label, imagen y
href cambian con el módulo asignado en B1 slots 0-1 y B3 slots 0-3.

**Lo que falta:** B1 slot 2 (Itinerary Builder) y slot 3 (Photo Booth) tienen
**color sólido** (`#b9bd39` olive y `#1796d6` azul) y **icono SVG verbatim**
(route, camera) hardcoded del SVG original. Si el operador asigna Map al slot
3, el slot conserva la cámara y el azul pero el label dice "Map" — incoherente
visual y semánticamente.

Esta spec extiende el catálogo de módulos para que el color sólido y el icono
también reaccionen al módulo asignado, manteniendo el fallback al SVG original
cuando el slot no se toca.

## Alcance

**Dentro:**
- 2 slots: B1 slot 2 y B1 slot 3.
- Catálogo `MODULE_BILLBOARD_INFO` extendido con `icon` y `accentColor`.
- 2 componentes nuevos en `src/components/billboard/icons/` para preservar los
  paths verbatim del SVG original (route + camera).
- 13 iconos lucide-react para los módulos restantes.
- 2 resolvers nuevos (`resolveSlotIcon`, `resolveSlotAccent`) con la misma
  semántica de fallback que `resolveSlotLabel`/`resolveSlotImage`.

**Fuera:**
- B0 (no tiene slots con color sólido + icono).
- B2 (carousel — no aplica).
- B3 (todos sus slots ya son imagen + reactivos).
- "Navy banner" de B3 — es decoración del logo TrueOmni, no un slot asignable.
- Editor del Studio (`BillboardEditor.tsx`) — no se toca; el contrato del
  dropdown de módulos sigue siendo `modules: string[]`.
- Schema persistencia (`bootstrap-from-fs.ts`, `publish-merger.ts`) — no se
  toca; no hay campos nuevos en la persistencia.
- B1 slots 0-1 — ya reactivos (imagen + label + href).

## Modelo de datos

### `BillboardModuleInfo` extendido

```ts
import type { ComponentType } from 'react';

export type BillboardIcon = ComponentType<{ size: number; color: string }>;

export type BillboardModuleInfo = {
  /** Texto principal del slot (uppercase, viene del SVG). */
  label: string;
  /** Segunda línea opcional para evitar truncar en cards estrechas. */
  labelLine2?: string;
  /** Imagen sugerida para el slot (path tipo `/assets/billboard-N/foo.jpg`). */
  image?: string;
  /** Ruta a la que navegar cuando el usuario toca el slot. */
  href: string;
  /** Icono del módulo (lucide o componente verbatim). NUEVO. */
  icon: BillboardIcon;
  /** Color sólido del slot (hex). NUEVO. */
  accentColor: string;
};
```

Tanto los iconos verbatim (extracción de los paths SVG actuales a componentes)
como los lucide-react cumplen la interface `{ size, color }`. Para lucide
envolvemos: `(props) => <Utensils size={props.size} color={props.color} />`.

### Resolvers nuevos

```ts
/** Devuelve el componente icono del slot. Fallback al icono original del SVG. */
export function resolveSlotIcon(
  slotKey: string | undefined,
  fallback: BillboardIcon,
): BillboardIcon { ... }

/** Devuelve el color hex del slot. Fallback al color original del SVG. */
export function resolveSlotAccent(
  slotKey: string | undefined,
  fallback: string,
): string { ... }
```

Patrón idéntico al ya validado en `resolveSlotLabel`/`resolveSlotImage`: si
`slotKey` está vacío o no existe en el catálogo, devuelve `fallback`.

## Catálogo de iconos por módulo

### Verbatim (componentes nuevos)

| Módulo | Componente | Origen |
|---|---|---|
| `itinerary-builder` | `RouteIcon` | extraído de `billboard-1.tsx` (paths verbatim de `Itinery-Icon.svg`) |
| `photo-booth` | `CameraIcon` | extraído de `billboard-1.tsx` (paths verbatim de `Photo_Booth-Icon.svg`) |

Los componentes viven en `src/components/billboard/icons/route-icon.tsx` y
`camera-icon.tsx`. Sus paths SVG son **idénticos** a los actuales en
`billboard-1.tsx`; solo cambia la envoltura (componente exportable con props
`{ size, color }`). El pixel-perfect del slot 2-3 con su módulo "natural"
asignado queda preservado.

### Lucide-react (los 13 restantes)

| Módulo | Lucide |
|---|---|
| `restaurants` | `Utensils` |
| `things-to-do` | `Sparkles` |
| `events` | `CalendarDays` |
| `tickets` | `Ticket` |
| `passes` | `BadgeCheck` |
| `guestbook` | `BookHeart` |
| `social-wall` | `Share2` |
| `digital-brochure` | `BookOpen` |
| `map` | `MapPin` |
| `stay` | `BedDouble` |
| `survey` | `ClipboardList` |
| `deals` | `Tag` |
| `trails` | `Mountain` |

Lucide-react ya es dependencia del proyecto (importado en TopBar, ProductDropdown,
etc.). Cero dependencias nuevas.

## Catálogo de colores accent

| Módulo | Hex | Notas |
|---|---|---|
| `itinerary-builder` | `#b9bd39` | verbatim SVG (olive) |
| `photo-booth` | `#1796d6` | verbatim SVG (azul cámara) |
| `restaurants` | `#d63b3b` | rojo cálido |
| `things-to-do` | `#7c4dff` | violeta |
| `events` | `#ff6f3c` | coral |
| `tickets` | `#e91e63` | magenta |
| `passes` | `#d4a017` | gold |
| `guestbook` | `#26a69a` | teal |
| `social-wall` | `#ec407a` | rose |
| `digital-brochure` | `#455a64` | slate |
| `map` | `#43a047` | verde |
| `stay` | `#a1887f` | terracotta |
| `survey` | `#5c6bc0` | indigo |
| `deals` | `#ff8f00` | naranja |
| `trails` | `#558b2f` | verde bosque |

Todos pasan contraste AA con texto blanco (`#fff`) — el label del slot
mantiene `color: white` sin cambios.

## Refactor de `billboard-1.tsx`

### Slot 2 (actual: olive + route + label "Itinerary Builder")

```tsx
// Antes
backgroundColor: '#b9bd39'
<svg ... fill="#fff" ...>{paths verbatim}</svg>

// Después
const Icon2 = resolveSlotIcon(modules?.[2], RouteIcon);
backgroundColor: resolveSlotAccent(modules?.[2], '#b9bd39')
<Icon2 size={120} color="#fff" />
```

El icono mantiene su `className="ml-auto"` para alinear a la derecha del label.

### Slot 3 (actual: azul + camera + label "Photo Booth")

```tsx
const Icon3 = resolveSlotIcon(modules?.[3], CameraIcon);
backgroundColor: resolveSlotAccent(modules?.[3], '#1796d6')
<Icon3 size={120} color="#fff" />
```

El icono mantiene su orden (icono antes del label, label `ml-auto`).

### Tamaños y posiciones

Slot 2 actual: icono `120×120` con `ml-auto`. → mantengo `size={120}`.
Slot 3 actual: icono `120×114` con orden invertido (icono primero, label después).
→ uso `size={120}` (lucide es cuadrado por default; la diferencia de 6px no
afecta el layout porque ambos viven en un flex container con padding).

Si la inspección visual muestra desalineación, ajustamos el tamaño en el
plan, no aquí.

## Comportamiento de fallback

| Estado | Resultado |
|---|---|
| `modules` undefined o array vacío | Slot idéntico al SVG original |
| `modules[i]` undefined / string vacío | Slot idéntico al SVG original |
| `modules[i]` no existe en el catálogo | Slot idéntico al SVG original |
| `modules[i]` existe en el catálogo | label + image + href + icon + accent del módulo |

El slot **nunca queda apagado** ni en estado "empty". El SVG original
siempre es el fallback final. Esto preserva el render del kiosk fresco
(sin Studio) idéntico al diseño aprobado.

## Verificación

- `pnpm typecheck` limpio.
- `pnpm lint` sin errores nuevos.
- `pnpm kiosk:dev` arranca sin ENOENT (regla CLAUDE.md sección 9).
- Smoke en `/?client=default` con `/billboard/1` (Billboard 1 idle):
  - **Default state** (sin `billboard.modules` configurado): slot 2 olive +
    route + "Itinerary Builder", slot 3 azul + camera + "Photo Booth".
    Idéntico al SVG.
  - **Override state** (Studio asigna `survey` a slot 2 y `map` a slot 3):
    slot 2 indigo `#5c6bc0` + ClipboardList + "Survey", slot 3 verde
    `#43a047` + MapPin + "Map".
- HMR validado en navegador editando un módulo desde el Studio en vivo.
- Diff visual ±2px contra `designs/TNT/Billboard/Billboard 1.svg` con
  `modules` vacío.

## Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Componentes verbatim no idénticos a paths inline | Copy-paste literal de los `<path>`. Diff visual antes/después. |
| Lucide icon a 120px se ve sobre-escalado vs verbatim | Inspección visual; si chirría, bajar a `size={104}` para los lucide y mantener `120` solo en verbatim. Decisión durante el plan. |
| Algún color accent no contrasta con `#fff` | Todos los hex propuestos tienen luminosidad ≤ 65 con `#fff` text → AA. Validable con contrast checker en el plan si surge duda. |
| Schema persistencia rompe | No se toca el schema. `modules: string[]` ya existe. |

## Trabajo fuera de scope (deuda anotada)

- Si en el futuro el operador quiere customizar el icono o color de un
  módulo (ej. "quiero que mi Photo Booth sea verde"), requeriría tocar el
  catálogo `MODULE_BILLBOARD_INFO`. Hoy es estático. Habilitar override
  per-cliente queda para v2.2 si surge la necesidad.
- Slot vacío explícito ("nada asignado, mostrar placeholder") no entra en
  v2.1; el comportamiento es siempre fallback al SVG.
