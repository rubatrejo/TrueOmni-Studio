# Billboard slot v2.1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hacer que el color sólido y el icono de B1 slots 2 y 3 reaccionen al módulo asignado en el Studio, manteniendo el SVG original como fallback.

**Architecture:** Extender `MODULE_BILLBOARD_INFO` con `icon` (componente con interface `{ size, color }`) y `accentColor` (hex). Extraer los 2 SVG inline actuales de `billboard-1.tsx` a componentes reusables. Añadir 2 resolvers (`resolveSlotIcon`, `resolveSlotAccent`) con fallback al original. Refactor de B1 slots 2-3 para usar los resolvers.

**Tech Stack:** Next.js 15 + React 19 + TypeScript estricto + Tailwind. lucide-react ya en deps.

**Spec:** `docs/superpowers/specs/2026-05-01-billboard-slot-v2.1-design.md`

**Verificación:** este proyecto no tiene unit tests para componentes UI (regla del repo). Verificación = `pnpm typecheck` + `pnpm lint` + smoke en navegador con HMR + diff visual contra SVG. Cada tarea define el comando concreto.

---

## File Structure

```
src/components/billboard/
├── icons/                         # NUEVO directorio
│   ├── route-icon.tsx             # NUEVO — paths verbatim de Itinery-Icon.svg
│   └── camera-icon.tsx            # NUEVO — paths verbatim de Photo_Booth-Icon.svg
├── module-info.ts                 # MODIFICAR — extender tipo, catálogo, resolvers
└── billboard-1.tsx                # MODIFICAR — slots 2 y 3 reactivos
```

Cero archivos eliminados. Cero cambios en schemas, persistencia, editor del Studio, otros billboards.

---

### Task 1: Extraer `RouteIcon` componente (verbatim)

Convertir el `<svg>` inline del slot 2 actual de `billboard-1.tsx` (icono "ruta" del Itinerary Builder) en un componente reusable con interface `{ size, color }`. Paths copiados literalmente del SVG actual.

**Files:**

- Create: `src/components/billboard/icons/route-icon.tsx`

- [ ] **Step 1: Crear el componente**

Contenido completo del archivo:

```tsx
/**
 * Icono de ruta — paths verbatim del SVG `designs/TNT/Billboard/Itinery-Icon.svg`.
 *
 * Extraído del JSX inline original de Billboard 1 slot 2 para hacerlo
 * reusable como icono del módulo `itinerary-builder` en el catálogo
 * `MODULE_BILLBOARD_INFO`. El path SVG es idéntico al original — solo
 * cambia la envoltura (componente con props `{ size, color }`).
 */
export function RouteIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 101.998 102.58"
      fill={color}
      role="img"
      aria-label="Ruta"
    >
      <g transform="translate(-1.377)">
        <path
          d="M136.294,71.716H101.052a5.914,5.914,0,0,1,0-11.828h29.012a9.517,9.517,0,1,0,12.145-12.145V0H109.857V27.761h26.007V47.744a9.563,9.563,0,0,0-5.8,5.8H101.052a12.259,12.259,0,0,0,0,24.519h35.242a5.914,5.914,0,0,1,0,11.828H77.165a9.518,9.518,0,1,0,0,6.345h59.129a12.259,12.259,0,0,0,0-24.519ZM116.2,21.416V6.345h19.662V21.416Zm22.834,32.127a3.173,3.173,0,1,1-3.173,3.173A3.176,3.176,0,0,1,139.036,53.543ZM68.193,96.235a3.173,3.173,0,1,1,3.173-3.173A3.176,3.176,0,0,1,68.193,96.235Z"
          transform="translate(-45.179)"
        />
        <path
          d="M83.481,161.9a7.4,7.4,0,1,0-7.4,7.4A7.411,7.411,0,0,0,83.481,161.9Z"
          transform="translate(-53.064 -121.821)"
        />
        <path
          d="M39.99,122.237a21.4,21.4,0,0,0,4.66-13.4,21.637,21.637,0,1,0-43.273,0,21.407,21.407,0,0,0,4.666,13.409l16.971,21.337Zm-32.268-13.4a15.292,15.292,0,0,1,30.583,0,15.111,15.111,0,0,1-3.286,9.459L23.014,133.388l-12-15.087A15.116,15.116,0,0,1,7.722,108.836Z"
          transform="translate(0 -68.756)"
        />
      </g>
    </svg>
  );
}
```

- [ ] **Step 2: Verificar typecheck**

Run: `pnpm typecheck`
Expected: limpio, sin errores nuevos.

- [ ] **Step 3: Commit**

```bash
git add src/components/billboard/icons/route-icon.tsx
git commit -m "feat(billboard): extrae RouteIcon como componente reusable"
```

---

### Task 2: Extraer `CameraIcon` componente (verbatim)

Convertir el `<svg>` inline del slot 3 actual de `billboard-1.tsx` (icono "cámara" del Photo Booth) en un componente reusable.

**Files:**

- Create: `src/components/billboard/icons/camera-icon.tsx`

- [ ] **Step 1: Crear el componente**

Contenido completo del archivo:

```tsx
/**
 * Icono de cámara — paths verbatim del SVG `designs/TNT/Billboard/Photo_Booth-Icon.svg`.
 *
 * Extraído del JSX inline original de Billboard 1 slot 3 para hacerlo
 * reusable como icono del módulo `photo-booth` en el catálogo
 * `MODULE_BILLBOARD_INFO`. El path es idéntico al original — solo
 * cambia la envoltura (componente con props `{ size, color }`).
 *
 * Nota: el SVG original tiene viewBox 110.382×104.639 (no cuadrado).
 * Mantenemos esa proporción ajustando height proporcional al size.
 */
export function CameraIcon({ size, color }: { size: number; color: string }) {
  // Mantiene la proporción 110.382:104.639 (≈ 1:0.948) del SVG original.
  const height = Math.round(size * (104.639 / 110.382));
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={height}
      viewBox="0 0 110.382 104.639"
      fill="none"
      stroke={color}
      strokeWidth={7}
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label="Cámara"
    >
      <path
        d="M3,43.2H8.743c5.352,0,8.028,0,10.139.874A11.488,11.488,0,0,1,25.1,50.3c.874,2.111.874,4.787.874,10.139s0,8.028-.874,10.139a11.488,11.488,0,0,1-6.217,6.217c-2.111.874-4.787.874-10.139.874H3M94.9,20.23V14.487A11.487,11.487,0,0,0,83.408,3H71.921A11.487,11.487,0,0,0,60.435,14.487V20.23M21.379,100.639H88c6.433,0,9.65,0,12.107-1.252a11.485,11.485,0,0,0,5.02-5.02c1.252-2.457,1.252-5.674,1.252-12.107V38.609c0-6.433,0-9.65-1.252-12.107a11.485,11.485,0,0,0-5.02-5.02C97.653,20.23,94.436,20.23,88,20.23H21.379c-6.433,0-9.65,0-12.107,1.252a11.486,11.486,0,0,0-5.02,5.02C3,28.959,3,32.176,3,38.609V82.26c0,6.433,0,9.65,1.252,12.107a11.485,11.485,0,0,0,5.02,5.02C11.729,100.639,14.946,100.639,21.379,100.639Zm62.029-40.2A17.23,17.23,0,1,1,66.178,43.2,17.23,17.23,0,0,1,83.408,60.435Z"
        transform="translate(0.5 0.5)"
      />
    </svg>
  );
}
```

- [ ] **Step 2: Verificar typecheck**

Run: `pnpm typecheck`
Expected: limpio.

- [ ] **Step 3: Commit**

```bash
git add src/components/billboard/icons/camera-icon.tsx
git commit -m "feat(billboard): extrae CameraIcon como componente reusable"
```

---

### Task 3: Extender `BillboardModuleInfo` + resolvers + catálogo completo

Añadir `icon` y `accentColor` al tipo, popular las 15 entradas del catálogo (2 verbatim + 13 lucide), y crear los 2 resolvers nuevos. Esta tarea no consume aún el catálogo nuevo — eso pasa en Task 4.

**Files:**

- Modify: `src/components/billboard/module-info.ts`

- [ ] **Step 1: Reemplazar el archivo entero**

Contenido completo:

```ts
/**
 * Mapa estático de keys de módulos (KIOSK_MODULES) → metadata visible en
 * los slots del Billboard idle.
 *
 * Lo usan B1/B2/B3 para reemplazar label, imagen, icono, color de acento y
 * href cuando el usuario asigna un módulo distinto al hardcoded del SVG en
 * `billboard.modules[i]`.
 *
 * `image` referencia paths del cliente activo (`/assets/billboard-N/...`),
 * que `src/app/assets/[...path]/route.ts` resuelve contra
 * `clients/<slug>/assets/`. Si el cliente no tiene la imagen, el `<img>`
 * dispara el `onError` y el fallback del slot (color/imagen original) sigue
 * activo.
 *
 * `icon` y `accentColor` (v2.1) permiten que slots con color sólido + icono
 * (B1 slots 2-3) reaccionen al módulo asignado. Los 2 iconos verbatim del
 * SVG original (route, camera) viven en `./icons/`. Los 13 restantes usan
 * lucide-react.
 *
 * `href` usa el patrón estándar de tiles del Home (`/home/{key}`).
 */

import {
  BadgeCheck,
  BedDouble,
  BookHeart,
  BookOpen,
  CalendarDays,
  ClipboardList,
  MapPin,
  Mountain,
  Share2,
  Sparkles,
  Tag,
  Ticket,
  Utensils,
} from 'lucide-react';
import type { ComponentType } from 'react';

import { CameraIcon } from './icons/camera-icon';
import { RouteIcon } from './icons/route-icon';

/** Componente icono usado en slots con color sólido (B1 slots 2-3). */
export type BillboardIcon = ComponentType<{ size: number; color: string }>;

/**
 * Wrapper que adapta cualquier lucide-react al contrato `{ size, color }`
 * que usan los slots del Billboard. lucide acepta `size` y `color` directamente,
 * pero los recibe como props sueltas — esto centraliza el bridging para que el
 * catálogo trate verbatim y lucide igual.
 */
function lucide(
  LucideIcon: ComponentType<{ size?: number; color?: string; strokeWidth?: number }>,
): BillboardIcon {
  const Wrapped: BillboardIcon = ({ size, color }) => (
    <LucideIcon size={size} color={color} strokeWidth={1.6} />
  );
  Wrapped.displayName = `Lucide(${LucideIcon.displayName ?? 'Icon'})`;
  return Wrapped;
}

export type BillboardModuleInfo = {
  /** Texto principal del slot (uppercase, viene del SVG). */
  label: string;
  /** Segunda línea opcional para evitar truncar en cards estrechas. */
  labelLine2?: string;
  /** Imagen sugerida para el slot. Path tipo `/assets/billboard-N/foo.jpg`. */
  image?: string;
  /** Ruta a la que navegar cuando el usuario toca el slot. */
  href: string;
  /** Icono del módulo (verbatim SVG o lucide). v2.1. */
  icon: BillboardIcon;
  /** Color sólido del slot cuando el slot original tiene fondo plano. v2.1. */
  accentColor: string;
};

/**
 * Pool de imágenes existentes en `clients/default/assets/billboard-{1,2,3}/`.
 * El route handler `/assets/[...path]` cae a default cuando el cliente activo
 * no tiene la imagen, así que estos paths son seguros para todos los kiosks.
 */
const IMG = {
  eat: '/assets/billboard-3/eat.jpg',
  events: '/assets/billboard-2/events.jpg',
  hero: '/assets/billboard-1/hero.jpg',
  hotels: '/assets/billboard-2/hotels.jpg',
  itinerary: '/assets/billboard-2/itinerary.jpg',
  play: '/assets/billboard-3/play.jpg',
  thingsToDo: '/assets/billboard-2/things-to-do.jpg',
} as const;

export const MODULE_BILLBOARD_INFO: Record<string, BillboardModuleInfo> = {
  restaurants: {
    label: 'Food &',
    labelLine2: 'Drink',
    image: IMG.eat,
    href: '/home/restaurants',
    icon: lucide(Utensils),
    accentColor: '#d63b3b',
  },
  'things-to-do': {
    label: 'Things to do',
    image: IMG.thingsToDo,
    href: '/home/things-to-do',
    icon: lucide(Sparkles),
    accentColor: '#7c4dff',
  },
  'itinerary-builder': {
    label: 'Itinerary',
    labelLine2: 'Builder',
    image: IMG.itinerary,
    href: '/home/itinerary-builder',
    icon: RouteIcon,
    accentColor: '#b9bd39',
  },
  events: {
    label: 'Events',
    image: IMG.events,
    href: '/home/events',
    icon: lucide(CalendarDays),
    accentColor: '#ff6f3c',
  },
  tickets: {
    label: 'Tickets',
    image: IMG.events,
    href: '/home/tickets',
    icon: lucide(Ticket),
    accentColor: '#e91e63',
  },
  passes: {
    label: 'Passes',
    image: IMG.hero,
    href: '/home/passes',
    icon: lucide(BadgeCheck),
    accentColor: '#d4a017',
  },
  guestbook: {
    label: 'Guestbook',
    image: IMG.hero,
    href: '/home/guestbook',
    icon: lucide(BookHeart),
    accentColor: '#26a69a',
  },
  'social-wall': {
    label: 'Social',
    labelLine2: 'Wall',
    image: IMG.hero,
    href: '/home/social-wall',
    icon: lucide(Share2),
    accentColor: '#ec407a',
  },
  'digital-brochure': {
    label: 'Brochure',
    image: IMG.thingsToDo,
    href: '/home/digital-brochure',
    icon: lucide(BookOpen),
    accentColor: '#455a64',
  },
  map: {
    label: 'Map',
    image: IMG.hotels,
    href: '/home/map',
    icon: lucide(MapPin),
    accentColor: '#43a047',
  },
  stay: {
    label: 'Stay',
    image: IMG.hotels,
    href: '/home/stay',
    icon: lucide(BedDouble),
    accentColor: '#a1887f',
  },
  survey: {
    label: 'Survey',
    image: IMG.hero,
    href: '/home/survey',
    icon: lucide(ClipboardList),
    accentColor: '#5c6bc0',
  },
  deals: {
    label: 'Deals',
    image: IMG.eat,
    href: '/home/deals',
    icon: lucide(Tag),
    accentColor: '#ff8f00',
  },
  'photo-booth': {
    label: 'Photo',
    labelLine2: 'Booth',
    image: IMG.hero,
    href: '/home/photo-booth',
    icon: CameraIcon,
    accentColor: '#1796d6',
  },
  trails: {
    label: 'Trails',
    image: IMG.play,
    href: '/home/trails',
    icon: lucide(Mountain),
    accentColor: '#558b2f',
  },
};

/** Devuelve el label resuelto del slot con fallback al original del SVG. */
export function resolveSlotLabel(
  slotKey: string | undefined,
  fallback: { label: string; labelLine2?: string },
): { label: string; labelLine2?: string } {
  if (!slotKey) return fallback;
  const info = MODULE_BILLBOARD_INFO[slotKey];
  if (!info) return fallback;
  return { label: info.label, labelLine2: info.labelLine2 };
}

/** Devuelve la imagen resuelta del slot. Si no hay módulo o el módulo no
 *  tiene imagen específica, devuelve el fallback (la imagen original del
 *  SVG). Esto preserva el pixel-perfect cuando el slot está sin asignar. */
export function resolveSlotImage(slotKey: string | undefined, fallback: string): string {
  if (!slotKey) return fallback;
  return MODULE_BILLBOARD_INFO[slotKey]?.image ?? fallback;
}

/** Devuelve la ruta de navegación del slot. Si no hay módulo, devuelve la
 *  ruta default del Billboard (`/home`, el dashboard). */
export function resolveSlotHref(slotKey: string | undefined): string {
  if (!slotKey) return '/home';
  return MODULE_BILLBOARD_INFO[slotKey]?.href ?? '/home';
}

/** Devuelve el componente icono del slot. v2.1. Fallback al icono original
 *  del SVG (route para Itinerary, camera para Photo Booth). */
export function resolveSlotIcon(
  slotKey: string | undefined,
  fallback: BillboardIcon,
): BillboardIcon {
  if (!slotKey) return fallback;
  return MODULE_BILLBOARD_INFO[slotKey]?.icon ?? fallback;
}

/** Devuelve el color sólido del slot. v2.1. Fallback al color original del
 *  SVG (#b9bd39 olive para slot 2, #1796d6 azul para slot 3 de B1). */
export function resolveSlotAccent(
  slotKey: string | undefined,
  fallback: string,
): string {
  if (!slotKey) return fallback;
  return MODULE_BILLBOARD_INFO[slotKey]?.accentColor ?? fallback;
}
```

- [ ] **Step 2: Verificar typecheck**

Run: `pnpm typecheck`
Expected: limpio. El archivo aún no se consume → solo valida que tipos y imports compilen.

- [ ] **Step 3: Verificar lint**

Run: `pnpm lint`
Expected: sin errores nuevos. lucide-react ya está en deps.

- [ ] **Step 4: Commit**

```bash
git add src/components/billboard/module-info.ts
git commit -m "feat(billboard): catálogo extendido con icon + accentColor por módulo"
```

---

### Task 4: Refactor B1 slot 2 — usar resolvers para icono + color sólido

Reemplazar el `backgroundColor: '#b9bd39'` y el SVG inline del slot 2 por los resolvers nuevos. Mantener el resto del slot intacto (label/labelLine2 ya reactivo, posición, padding, tamaño del icono).

**Files:**

- Modify: `src/components/billboard/billboard-1.tsx`

- [ ] **Step 1: Actualizar imports**

Reemplazar el bloque actual de imports relativos a billboard:

```tsx
import { resolveSlotHref, resolveSlotImage, resolveSlotLabel } from './module-info';
import { SlotImage } from './slot-image';
```

por:

```tsx
import {
  resolveSlotAccent,
  resolveSlotHref,
  resolveSlotIcon,
  resolveSlotImage,
  resolveSlotLabel,
} from './module-info';
import { CameraIcon } from './icons/camera-icon';
import { RouteIcon } from './icons/route-icon';
import { SlotImage } from './slot-image';
```

- [ ] **Step 2: Resolver icono y color del slot 2**

Inmediatamente debajo de los `slot0`/`slot1`/`slot2`/`slot3` de `resolveSlotLabel`, añadir:

```tsx
const slot2Icon = resolveSlotIcon(modules?.[2], RouteIcon);
const slot2Accent = resolveSlotAccent(modules?.[2], '#b9bd39');
```

(El nombre `Icon2`/`Slot2Icon` evitamos para no chocar con convenciones; uso `slot2Icon` como variable que asignamos a `<Icon />` localmente.)

- [ ] **Step 3: Reemplazar el bloque del slot 2**

Buscar el comentario `{/* Slot 2 — original SVG: ITINERARY BUILDER (495×208 @ 30, 1250) olive #b9bd39 */}` y reemplazar el bloque entero del `<Link>` (desde ese comentario hasta el `</Link>` correspondiente) por:

```tsx
{
  /* Slot 2 — original SVG: ITINERARY BUILDER (495×208 @ 30, 1250) olive #b9bd39.
    v2.1: color e icono se resuelven desde el catálogo MODULE_BILLBOARD_INFO si
    el operador asigna un módulo distinto al hardcoded del SVG. Fallback al
    olive + RouteIcon original. */
}
<Link
  href={resolveSlotHref(modules?.[2])}
  className="absolute flex items-center overflow-hidden"
  style={{
    left: '30px',
    top: '1250px',
    width: '495px',
    height: '208px',
    borderRadius: '9px',
    backgroundColor: slot2Accent,
    paddingLeft: '36px',
    paddingRight: '36px',
  }}
  aria-label={`${slot2.label} ${slot2.labelLine2 ?? ''}`.trim()}
>
  <div
    className="font-display font-bold uppercase leading-[1.05] text-white"
    style={{ fontSize: '50px' }}
  >
    {slot2.label}
    {slot2.labelLine2 ? (
      <>
        <br />
        {slot2.labelLine2}
      </>
    ) : null}
  </div>
  <div className="ml-auto">
    {(() => {
      const Icon = slot2Icon;
      return <Icon size={120} color="#fff" />;
    })()}
  </div>
</Link>;
```

(El wrapper `ml-auto` reemplaza al `className="ml-auto"` que tenía el `<svg>` inline. La IIFE `(() => { const Icon = slot2Icon; return <Icon /> })()` permite usar el componente como JSX — alternativa más limpia es renombrar la variable a PascalCase, pero en TS strict React requiere variable PascalCase para JSX, por eso uso la IIFE local. Alternativa válida: sacar el `const Icon2 = slot2Icon` justo encima del `return` del componente.)

**Alternativa más limpia (recomendada):** declarar `Icon2` PascalCase en el cuerpo del componente al lado de `slot2Icon`:

```tsx
const Slot2Icon = resolveSlotIcon(modules?.[2], RouteIcon);
const slot2Accent = resolveSlotAccent(modules?.[2], '#b9bd39');
```

Y en el JSX:

```tsx
<Slot2Icon size={120} color="#fff" />
```

Usa esta variante. Borra la IIFE.

- [ ] **Step 4: Verificar typecheck**

Run: `pnpm typecheck`
Expected: limpio.

- [ ] **Step 5: Verificar lint**

Run: `pnpm lint`
Expected: sin errores nuevos.

- [ ] **Step 6: Smoke en navegador**

Asegurar que `pnpm kiosk:dev` está corriendo (si no, levantarlo con `pnpm kiosk:dev` en background). Abrir `http://localhost:3000/billboard/1` en navegador. Validar visualmente:

- Default state (sin Studio): slot 2 sigue olive con route icon a la derecha y label "Itinerary Builder". Idéntico al SVG.
- Con Studio override (en otra pestaña, abrir `/studio/default` → editor → Billboard tab → asignar `survey` al slot 2): slot 2 pasa a indigo `#5c6bc0` + ClipboardList icon + label "Survey". HMR debe reflejarlo en vivo.

Si el icono lucide se ve sobre-escalado a 120px (más grueso que el verbatim), bajar el `strokeWidth` del `lucide()` wrapper de `1.6` a `1.4` o `1.2`. Si el tamaño visual es excesivo, bajar `size` a `104` solo en este slot. Decidir tras inspección.

- [ ] **Step 7: Commit**

```bash
git add src/components/billboard/billboard-1.tsx
git commit -m "feat(billboard): B1 slot 2 reactivo a módulo asignado (color + icono)"
```

---

### Task 5: Refactor B1 slot 3 — mismo patrón

Espejo del slot 2 con orden invertido (icono primero, label `ml-auto`). Mantiene el fallback `CameraIcon` + `#1796d6`.

**Files:**

- Modify: `src/components/billboard/billboard-1.tsx`

- [ ] **Step 1: Resolver icono y color del slot 3**

Justo después de los resolvers del slot 2 que añadimos en Task 4, añadir:

```tsx
const Slot3Icon = resolveSlotIcon(modules?.[3], CameraIcon);
const slot3Accent = resolveSlotAccent(modules?.[3], '#1796d6');
```

- [ ] **Step 2: Reemplazar el bloque del slot 3**

Buscar el comentario `{/* Slot 3 — original SVG: PHOTO BOOTH (495×208 @ 30, 1488) blue #1796d6 */}` y reemplazar el bloque entero del `<Link>` por:

```tsx
{
  /* Slot 3 — original SVG: PHOTO BOOTH (495×208 @ 30, 1488) blue #1796d6.
    v2.1: color e icono reactivos al módulo asignado (catálogo MODULE_BILLBOARD_INFO).
    Fallback al azul + CameraIcon original. */
}
<Link
  href={resolveSlotHref(modules?.[3])}
  className="absolute flex items-center overflow-hidden"
  style={{
    left: '30px',
    top: '1488px',
    width: '495px',
    height: '208px',
    borderRadius: '9px',
    backgroundColor: slot3Accent,
    paddingLeft: '36px',
    paddingRight: '36px',
  }}
  aria-label={`${slot3.label} ${slot3.labelLine2 ?? ''}`.trim()}
>
  <Slot3Icon size={120} color="#fff" />
  <div
    className="ml-auto font-display font-bold uppercase leading-[1.05] text-white"
    style={{ fontSize: '50px' }}
  >
    {slot3.label}
    {slot3.labelLine2 ? (
      <>
        <br />
        {slot3.labelLine2}
      </>
    ) : null}
  </div>
</Link>;
```

- [ ] **Step 3: Verificar typecheck**

Run: `pnpm typecheck`
Expected: limpio.

- [ ] **Step 4: Verificar lint**

Run: `pnpm lint`
Expected: sin errores nuevos.

- [ ] **Step 5: Smoke en navegador**

Abrir `http://localhost:3000/billboard/1`. Validar:

- Default: slot 3 sigue azul con cámara y label "Photo Booth". Idéntico al SVG.
- Override desde Studio (asignar `map` al slot 3): slot 3 pasa a verde `#43a047` + MapPin + label "Map". HMR refleja en vivo.

Si el `CameraIcon` original aparece desalineado verticalmente vs cuando estaba inline (porque ahora va dentro de un componente con altura proporcional 110.382:104.639), comparar contra screenshot pre-refactor. Diferencia esperada: ≤ 3px (height proporcional 113.7px vs original 114px).

- [ ] **Step 6: Commit**

```bash
git add src/components/billboard/billboard-1.tsx
git commit -m "feat(billboard): B1 slot 3 reactivo a módulo asignado (color + icono)"
```

---

### Task 6: Verificación final + diff visual

Cierre del feature: build limpio, smoke E2E del editor → kiosk, opcional diff visual contra SVG original.

**Files:** ninguno (solo verificación).

- [ ] **Step 1: Typecheck + lint finales**

Run: `pnpm typecheck && pnpm lint`
Expected: ambos limpios. Sin warnings nuevos en `src/components/billboard/`.

- [ ] **Step 2: Dev server arranca limpio**

Si `pnpm kiosk:dev` ya está corriendo, comprobar logs en busca de `ENOENT`/`Module not found`. Si no, levantarlo de cero:

```bash
pnpm kiosk:dev
```

Expected: `Ready in <2000ms`, sin errores de import o ENOENT (regla CLAUDE.md sección 9).

- [ ] **Step 3: Smoke E2E con Studio**

1. Abrir `http://localhost:3000/studio/default` en navegador.
2. Ir al editor → tab "Idle / Billboard" → seleccionar variant `1`.
3. Asignar a los 4 slots módulos distintos a los hardcoded:
   - Slot 0: `restaurants`
   - Slot 1: `tickets`
   - Slot 2: `survey` (era olive + route)
   - Slot 3: `map` (era azul + camera)
4. Cmd+S para guardar.
5. Click "Open <screen>" → abrir Billboard 1 del kiosk.
6. Validar visualmente:
   - Slot 0: imagen `eat.jpg` (de billboard-3) + label "Food & Drink" + href `/home/restaurants`.
   - Slot 1: imagen `events.jpg` + label "Tickets" + href `/home/tickets`.
   - Slot 2: fondo indigo `#5c6bc0` + ClipboardList icon blanco + label "Survey" + href `/home/survey`.
   - Slot 3: fondo verde `#43a047` + MapPin icon blanco + label "Map" + href `/home/map`.
7. Volver al editor, **deselecciónarlos todos** (módulos vacíos en los 4 slots) y guardar.
8. Recargar Billboard 1: debe quedar idéntico al SVG original (Things to Do / Events / Itinerary olive / Photo Booth azul).

- [ ] **Step 4: Diff visual contra SVG (opcional pero recomendado)**

Si el subagente `revisor-visual` está disponible:

```
Usa el subagente revisor-visual para comparar /billboard/1 (default state, sin
override de modules) contra designs/TNT/Billboard/Billboard 1.svg. Reporta diff
en px y bloques fuera de tolerancia ±2px.
```

Expected: diff dentro de ±2px global (regla pixel-perfect del proyecto).

- [ ] **Step 5: Auditor white-label**

```
Usa el subagente auditor-white-label sobre src/components/billboard/. Confirma
que los hex añadidos están en archivos de catálogo (módulo info), no en JSX.
```

Expected: solo `accentColor` hex como datos del catálogo. Cero violaciones nuevas en JSX.

- [ ] **Step 6: Cleanup en STATE.md (lo hace `/terminar`)**

No commitear cambios de STATE.md aquí — eso lo dispara el comando `/terminar` al cerrar la sesión. Solo dejar nota de que el TODO "v2.1 Billboard slot rendering" del bloque "Pendiente de la sesión 2026-04-30" pasa a hecho.

---

## Self-Review

**Spec coverage:**

- Modelo de datos extendido (`icon` + `accentColor`) → Task 3 ✓
- Resolvers nuevos (`resolveSlotIcon`, `resolveSlotAccent`) → Task 3 ✓
- Componentes verbatim (`RouteIcon`, `CameraIcon`) → Tasks 1 y 2 ✓
- 13 lucide icons + 15 accent colors → Task 3 ✓
- Refactor B1 slot 2 → Task 4 ✓
- Refactor B1 slot 3 → Task 5 ✓
- Fallback semantics (slot vacío/desconocido → SVG original) → Tasks 4 y 5 (uso de fallback positional en resolvers) ✓
- Verificación pixel-perfect ±2px + AA contrast → Task 6 ✓
- Editor del Studio NO se toca → confirmed (ningún task lo edita) ✓
- Schema persistencia NO se toca → confirmed ✓

**Type consistency:**

- `BillboardIcon = ComponentType<{ size: number; color: string }>` definido en Task 3, consumido en Tasks 4 y 5 con misma signature ✓
- `RouteIcon` y `CameraIcon` exportados con misma interface ✓
- Resolvers retornan tipos consistentes con catálogo ✓
- Variables PascalCase (`Slot2Icon`, `Slot3Icon`) coherentes en Tasks 4 y 5 ✓

**Placeholder scan:** sin TBD/TODO sin código. Único deferral explícito: ajuste fino de `size`/`strokeWidth` del lucide en Task 4 step 6, decisión visual durante ejecución (acceptable — depende de juicio en navegador).

Plan listo.
