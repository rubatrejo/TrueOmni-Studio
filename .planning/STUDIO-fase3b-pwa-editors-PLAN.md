# Fase 3b — Editores PWA (add/remove + validación Zod) · Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: usa `superpowers:subagent-driven-development` (recomendado) o `superpowers:executing-plans` para ejecutar tarea por tarea. Los steps usan checkbox (`- [ ]`).
> **Idioma:** español (CLAUDE.md). **Spec origen:** `.planning/STUDIO-fase3b-pwa-editors-DESIGN.md`. **Audit:** F-PWA-5 / F-PWA-6.

**Goal:** Dar al editor PWA del Studio validación Zod en el PATCH + add/remove real de items (con pickers de coords) en los cinco editores PWA-only, sin romper configs existentes ni el runtime.

**Architecture:** (1) Nuevo `pwa-schema.ts` con `PwaConfigSchema` permisivo (`.optional()` + `.passthrough()`), enganchado en el PATCH vía `safeParse`. (2) Plumbing del `mapboxToken` desde `page.tsx` → `PwaShell` → `PwaEditorPanel` → editores. (3) Dos pickers de coords reusables. (4) Add/remove con toast Undo (patrón `ListingsEditor`) en Scavenger/Wayfinding/Notifications/Profile; validación inline en Connect.

**Tech Stack:** Next.js 15 (App Router) · TypeScript estricto · Zod · Mapbox GL + mapbox-gl-draw · Tailwind (tema zinc del editor) · pnpm.

**Convenciones del repo (no romper):**

- Editores PWA = Client Components `(value, onChange)` con spread defensivo sobre un `EMPTY`.
- Helpers UI en `pwa-ui.tsx` (`PwaField`, `PwaNumberField`, `PwaGroup`, `move`, `ReorderButtons`).
- Toast: `import { useToast } from '../../../_components/Toast'`; `const { show } = useToast(); show(msg, { variant, durationMs, action: { label, onClick } })`.
- Token Mapbox SIEMPRE por prop desde `config.integraciones?.mapbox_token` (jamás `process.env` en client).
- Verificación por commit: `pnpm typecheck && pnpm lint`. Sin TDD (no hay vitest); el schema se valida con smoke `curl` en dev.
- Auto-push a `origin/main` tras cada commit verificado (memoria `feedback_auto_push_vercel`); vigilar deploy Vercel READY antes del siguiente bloque.

---

## File Structure

**Crear:**

- `src/lib/studio/pwa-schema.ts` — `PwaConfigSchema` + sub-schemas (Scavenger/Wayfinding/Notifications/Profile/Connect). Responsabilidad única: validar el slice `features.pwa`.
- `src/app/studio/[slug]/mobile-pwa/_components/ScavengerCoordsField.tsx` — picker Mapbox single-point (lat/lng) + fallback numérico.
- `src/app/studio/[slug]/mobile-pwa/_components/FloorPointField.tsx` — picker click-sobre-imagen (x/y %) + fallback numérico.
- `src/app/studio/[slug]/mobile-pwa/_components/pwa-list-helpers.tsx` — `uid()`, `AddItemButton`, `DeleteItemButton`, `makeBlank*()`.

**Modificar:**

- `src/app/api/studio/pwa/[slug]/route.ts:35-38` — safeParse.
- `src/app/studio/[slug]/mobile-pwa/page.tsx` — leer `mapboxToken` del fs config y pasarlo a `PwaShell`.
- `src/app/studio/[slug]/mobile-pwa/_components/PwaShell.tsx` — recibir `mapboxToken`, pasarlo a `PwaEditorPanel`.
- `src/app/studio/[slug]/mobile-pwa/_components/PwaEditorPanel.tsx` — recibir `mapboxToken`, pasarlo a Scavenger/Wayfinding.
- `ScavengerHuntEditor.tsx`, `WayfindingEditor.tsx`, `NotificationsEditor.tsx`, `ProfileEditor.tsx`, `ConnectWithUsEditor.tsx`.

---

## PARTE A — F-PWA-6: schema Zod + validación

### Task A1: Crear `pwa-schema.ts` (slices clave + passthrough)

**Files:**

- Create: `src/lib/studio/pwa-schema.ts`

- [ ] **Step 1: Escribir el schema.** El raíz valida en detalle los 5 slices tocados por F-PWA-5 y deja el resto del `PwaConfig` pasar con `.passthrough()` (estrategia permisiva del spec: validar forma sin rechazar configs guardados).

```ts
import { z } from 'zod';

/**
 * Schema Zod del slice `features.pwa` (F-PWA-6). Estrategia permisiva: casi todo
 * `.optional()` y `.passthrough()` por slice, para validar forma sin rechazar
 * configs ya guardados en KV con campos extra. Se valida en detalle solo los 5
 * slices que el editor PWA muta con add/remove (F-PWA-5); el resto pasa tal cual.
 * Endurecer (campos desconocidos → error) es trabajo posterior.
 */

const Url = z.string().trim().url().or(z.literal('')); // permite vaciar el campo

// ── Scavenger Hunt ─────────────────────────────────────────────
const ScavengerTaskSchema = z
  .object({
    slug: z.string().min(1),
    type: z.enum(['photo', 'checkin', 'question']),
    name: z.string(),
    image: z.string().optional().default(''),
    address: z.string().optional(),
    coords: z.object({ lat: z.number(), lng: z.number() }),
    description: z.string().optional().default(''),
    directionsUrl: z.string().optional(),
    checkinRadius: z.number().min(0).optional(),
    question: z.string().optional(),
    options: z.array(z.string()).optional(),
    correctIndex: z.number().min(0).optional(),
  })
  .passthrough();

const ScavengerHuntSchema = z
  .object({
    slug: z.string().min(1),
    name: z.string(),
    image: z.string().optional().default(''),
    avatar: z.string().optional().default(''),
    taskCount: z.number().min(0).optional().default(0),
    tasks: z.array(ScavengerTaskSchema).default([]),
  })
  .passthrough();

export const PwaScavengerHuntConfigSchema = z
  .object({ hunts: z.array(ScavengerHuntSchema).optional() })
  .passthrough();

// ── Wayfinding ─────────────────────────────────────────────────
const WayfindingPointSchema = z.object({ x: z.number(), y: z.number() });

const WayfindingAmenitySchema = z
  .object({
    slug: z.string().min(1),
    name: z.string(),
    image: z.string().optional().default(''),
    destination: WayfindingPointSchema.optional().default({ x: 50, y: 50 }),
    routePoints: z.array(WayfindingPointSchema).default([]),
    steps: z
      .array(
        z.object({
          icon: z.enum(['location', 'left', 'right', 'straight', 'destination']),
          text: z.string(),
        }),
      )
      .default([]),
  })
  .passthrough();

const WayfindingFloorSchema = z
  .object({
    key: z.string().min(1),
    label: z.string(),
    floorPlanImage: z.string().optional().default(''),
    origin: WayfindingPointSchema.optional().default({ x: 50, y: 50 }),
    amenities: z.array(WayfindingAmenitySchema).default([]),
  })
  .passthrough();

export const PwaWayfindingConfigSchema = z
  .object({ floors: z.array(WayfindingFloorSchema).optional() })
  .passthrough();

// ── Notifications ──────────────────────────────────────────────
const PwaNotificationSchema = z
  .object({
    id: z.string().min(1),
    type: z.enum(['event', 'deal', 'info', 'alert']),
    title: z.string(),
    body: z.string().optional().default(''),
    image: z.string().optional(),
    timestamp: z.string(),
    action: z.object({ label: z.string(), href: z.string() }).optional(),
  })
  .passthrough();

export const PwaNotificationsConfigSchema = z
  .object({ seed: z.array(PwaNotificationSchema).optional() })
  .passthrough();

// ── Profile ────────────────────────────────────────────────────
const PwaProfileFavoriteSchema = z
  .object({
    title: z.string(),
    subcategory: z.string().optional().default(''),
    distance: z.string().optional().default(''),
    hours: z.string().optional().default(''),
    image: z.string().optional().default(''),
  })
  .passthrough();

const PwaProfileEventSchema = z
  .object({
    title: z.string(),
    time: z.string().optional().default(''),
    weekday: z.string().optional().default(''),
    day: z.string().optional().default(''),
    image: z.string().optional().default(''),
    accent: z.enum(['brand', 'pwa']).optional().default('brand'),
  })
  .passthrough();

export const PwaProfileConfigSchema = z
  .object({
    favorites: z
      .object({ items: z.array(PwaProfileFavoriteSchema).optional() })
      .passthrough()
      .optional(),
    upcomingEvents: z
      .object({ items: z.array(PwaProfileEventSchema).optional() })
      .passthrough()
      .optional(),
  })
  .passthrough();

// ── Connect With Us ────────────────────────────────────────────
export const PwaConnectWithUsConfigSchema = z
  .object({
    website: Url.optional(),
    social: z
      .object({
        x: Url.optional(),
        facebook: Url.optional(),
        instagram: Url.optional(),
        pinterest: Url.optional(),
      })
      .passthrough()
      .optional(),
  })
  .passthrough();

// ── Raíz ───────────────────────────────────────────────────────
export const PwaConfigSchema = z
  .object({
    scavengerHunt: PwaScavengerHuntConfigSchema.optional(),
    wayfinding: PwaWayfindingConfigSchema.optional(),
    notifications: PwaNotificationsConfigSchema.optional(),
    profile: PwaProfileConfigSchema.optional(),
    connectWithUs: PwaConnectWithUsConfigSchema.optional(),
  })
  .passthrough();
```

- [ ] **Step 2: Verificar typecheck.**

Run: `pnpm typecheck`
Expected: exit 0 (sin errores en `pwa-schema.ts`).

- [ ] **Step 3: Commit.**

```bash
git add src/lib/studio/pwa-schema.ts
git commit -m "feat(studio): schema Zod del slice PWA — permisivo, 5 slices clave (F-PWA-6)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

**Verify:** `pnpm typecheck` limpio; el archivo exporta `PwaConfigSchema`.
**Done:** existe `PwaConfigSchema` que parsea en detalle scavengerHunt/wayfinding/notifications/profile/connectWithUs y deja el resto passthrough.

---

### Task A2: Enganchar `safeParse` en el PATCH

**Files:**

- Modify: `src/app/api/studio/pwa/[slug]/route.ts:1-40`

- [ ] **Step 1: Importar el schema y reemplazar el check booleano.** Sustituir el bloque `if (!body || typeof body.pwa !== 'object' ...)` (líneas 35-37) por validación Zod siguiendo el patrón de `branding/route.ts:55-61`.

Reemplazar líneas 1-40 por:

```ts
import { NextResponse } from 'next/server';

import { loadPwaMeta, loadPwaSlice, savePwaSlice } from '@/lib/studio/pwa-config';
import { PwaConfigSchema } from '@/lib/studio/pwa-schema';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ slug: string }>;
}

/**
 * `GET /api/studio/pwa/[slug]` — devuelve la working copy del slice
 * `features.pwa` del editor PWA (KV → config.json del cliente → template).
 */
export async function GET(_req: Request, { params }: RouteParams) {
  const { slug } = await params;
  const [pwa, meta] = await Promise.all([loadPwaSlice(slug), loadPwaMeta(slug)]);
  return NextResponse.json({ slug, pwa, meta });
}

/**
 * `PATCH /api/studio/pwa/[slug]` — persiste la working copy del slice PWA en
 * KV (`pwa:<slug>`). Valida el slice con `PwaConfigSchema` (F-PWA-6); en error
 * devuelve 400 con el detalle de `flatten()`. No toca el `cfg:<slug>` del kiosk.
 */
export async function PATCH(req: Request, { params }: RouteParams) {
  const { slug } = await params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 });
  }

  const root = body as { pwa?: unknown } | null;
  if (!root || typeof root !== 'object' || root.pwa === undefined) {
    return NextResponse.json({ error: 'missing "pwa" object' }, { status: 400 });
  }

  const parsed = PwaConfigSchema.safeParse(root.pwa);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'validation failed', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const meta = await savePwaSlice(slug, parsed.data as Parameters<typeof savePwaSlice>[1]);
  return NextResponse.json({ slug, ok: true, meta });
}
```

> Nota: `parsed.data` es el slice con defaults aplicados + campos passthrough. El `as Parameters<...>[1]` evita fricción de tipos entre el inferido de Zod y `PwaConfig` (la estrategia permisiva no garantiza igualdad estructural); es seguro porque `savePwaSlice` persiste el objeto tal cual.

- [ ] **Step 2: Verificar typecheck + lint.**

Run: `pnpm typecheck && pnpm lint`
Expected: exit 0.

- [ ] **Step 3: Commit.**

```bash
git add src/app/api/studio/pwa/[slug]/route.ts
git commit -m "fix(studio): valida el PATCH del slice PWA con Zod (F-PWA-6)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

**Verify:** typecheck + lint limpios.
**Done:** el PATCH rechaza payloads con forma inválida (400) y acepta los válidos.

---

### Task A3: Smoke del schema contra configs reales (en dev)

**Files:** ninguno (verificación manual ejecutable).

- [ ] **Step 1: Levantar el dev server.**

Run: `pnpm dev` (en background) — el Studio vive en la misma app Next bajo `/studio` y `/api/studio/*`.
Expected: servidor en `http://localhost:3000`.

- [ ] **Step 2: Round-trip GET→PATCH con el config real de `default` (debe pasar).**

```bash
curl -s localhost:3000/api/studio/pwa/default | python3 -c 'import sys,json; d=json.load(sys.stdin); print(json.dumps({"pwa": d["pwa"]}))' > /tmp/pwa-default.json
curl -s -o /dev/null -w "%{http_code}\n" -X PATCH localhost:3000/api/studio/pwa/default \
  -H 'content-type: application/json' --data @/tmp/pwa-default.json
```

Expected: `200` (el slice real pasa el schema permisivo — prueba no-regresión).

- [ ] **Step 3: PATCH con forma inválida (debe fallar).**

```bash
curl -s -o /dev/null -w "%{http_code}\n" -X PATCH localhost:3000/api/studio/pwa/default \
  -H 'content-type: application/json' \
  --data '{"pwa":{"scavengerHunt":{"hunts":"not-an-array"}}}'
```

Expected: `400`.

- [ ] **Step 4: Repetir Step 2 para los otros clientes reales** (sustituir `default` por cada slug en `clients/` con `mobilePwa` activo). Todos deben dar `200`.

- [ ] **Step 5: Apagar el dev server.**

**Verify:** Step 2 y 4 → `200`; Step 3 → `400`.
**Done:** el schema valida sin rechazar ningún config existente y sí rechaza forma inválida. (No requiere commit.)

---

## PARTE B — Plumbing del token Mapbox

### Task B1: Propagar `mapboxToken` de page.tsx a los editores

**Files:**

- Modify: `src/app/studio/[slug]/mobile-pwa/page.tsx:41-73`
- Modify: `src/app/studio/[slug]/mobile-pwa/_components/PwaShell.tsx:87-130` + el render del panel (~319)
- Modify: `src/app/studio/[slug]/mobile-pwa/_components/PwaEditorPanel.tsx:47-125`

- [ ] **Step 1: page.tsx — extraer el token del fs config y pasarlo.** El page ya carga `fsClient` (línea 48). Añadir:

Tras la línea `const availableLocales = fsClient.config?.features?.languages?.available ?? null;` añadir:

```ts
const mapboxToken = fsClient.config?.integraciones?.mapbox_token ?? '';
```

Y en el JSX `<PwaShell ... />` añadir la prop:

```tsx
mapboxToken = { mapboxToken };
```

- [ ] **Step 2: PwaShell — recibir y reenviar la prop.** En la firma de props (objeto destructurado, líneas 87-107) añadir tras `availableLocales: string[] | null;`:

```ts
/** Token Mapbox del cliente (`integraciones.mapbox_token`) para los pickers de
 *  coords de Scavenger/Wayfinding. '' si no está configurado. */
mapboxToken: string;
```

Añadir `mapboxToken,` a la lista de parámetros destructurados (junto a `availableLocales,`).
En el render de `<PwaEditorPanel ... />` (~línea 319) añadir la prop `mapboxToken={mapboxToken}`.

- [ ] **Step 3: PwaEditorPanel — recibir y pasar a Scavenger/Wayfinding.** En la firma (líneas 47-64) añadir tras `availableLocales: string[] | null;`:

```ts
/** Token Mapbox para el picker de coords del Scavenger Hunt. */
mapboxToken: string;
```

Añadir `mapboxToken,` a los parámetros destructurados.
En el bloque `scavenger-hunt` (líneas 109-116) pasar `mapboxToken={mapboxToken}` al `<ScavengerHuntEditor>`.
(Wayfinding usa picker sobre imagen, NO necesita token — no se le pasa.)

- [ ] **Step 4: Verificar typecheck.** (ScavengerHuntEditor aún no acepta la prop → se añade en Task D1; para que typecheck pase ahora, hacer Step 4 DESPUÉS de D1, o añadir la prop opcional a ScavengerHuntEditor en este step.)

> **Orden:** ejecutar B1 Steps 1-3, luego D1 (que añade la prop a ScavengerHuntEditor), y verificar typecheck al cierre de D1. Si se quiere B1 verificable de forma aislada, añadir en este step la firma `mapboxToken?: string` a `ScavengerHuntEditor` antes de usarla.

- [ ] **Step 5: Commit (junto con D1 o aislado con la firma opcional).**

```bash
git add src/app/studio/[slug]/mobile-pwa/page.tsx src/app/studio/[slug]/mobile-pwa/_components/PwaShell.tsx src/app/studio/[slug]/mobile-pwa/_components/PwaEditorPanel.tsx
git commit -m "chore(studio): propaga mapboxToken al editor PWA (prep F-PWA-5)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

**Verify:** typecheck limpio (tras D1 o con firma opcional).
**Done:** `mapboxToken` llega como prop hasta `ScavengerHuntEditor`.

---

## PARTE C — Componentes reutilizables

### Task C1: `pwa-list-helpers.tsx` (uid + botones add/delete + makeBlank)

**Files:**

- Create: `src/app/studio/[slug]/mobile-pwa/_components/pwa-list-helpers.tsx`

- [ ] **Step 1: Escribir helpers.**

```tsx
'use client';

import { Plus, Trash2 } from 'lucide-react';

import type {
  PwaNotification,
  PwaProfileEvent,
  PwaProfileFavorite,
  ScavengerHunt,
  ScavengerTask,
  ScavengerTaskType,
  WayfindingAmenity,
  WayfindingFloor,
} from '@/lib/config';

/** ID estable corto para items nuevos (slug/id/key). Client-only. */
export function uid(prefix: string): string {
  const rand =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.floor(Math.random() * 1e9).toString(36);
  return `${prefix}-${rand}`;
}

/** Botón "+ Añadir" alineado con el tema zinc del editor PWA. */
export function AddItemButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-zinc-300 px-3 py-1.5 text-[12px] font-medium text-zinc-600 transition hover:border-sky-400 hover:text-sky-600 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-sky-500 dark:hover:text-sky-400"
    >
      <Plus className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}

/** Botón borrar (icono) para un item de lista. */
export function DeleteItemButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-zinc-400 transition hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400"
    >
      <Trash2 className="h-3.5 w-3.5" />
    </button>
  );
}

export function makeBlankTask(type: ScavengerTaskType = 'photo'): ScavengerTask {
  return {
    slug: uid('task'),
    type,
    name: '',
    image: '',
    coords: { lat: 0, lng: 0 },
    description: '',
    ...(type === 'checkin' ? { checkinRadius: 50 } : {}),
    ...(type === 'question' ? { question: '', options: ['', ''], correctIndex: 0 } : {}),
  };
}

export function makeBlankHunt(): ScavengerHunt {
  return { slug: uid('hunt'), name: '', image: '', avatar: '', taskCount: 0, tasks: [] };
}

export function makeBlankAmenity(): WayfindingAmenity {
  return {
    slug: uid('amenity'),
    name: '',
    image: '',
    destination: { x: 50, y: 50 },
    routePoints: [],
    steps: [],
  };
}

export function makeBlankFloor(): WayfindingFloor {
  return {
    key: uid('floor'),
    label: '',
    floorPlanImage: '',
    origin: { x: 50, y: 50 },
    amenities: [],
  };
}

export function makeBlankNotification(): PwaNotification {
  // timestamp fijo epoch-0; el operador lo edita. (No usar Date.now en SSR-safe paths.)
  return {
    id: uid('notif'),
    type: 'info',
    title: '',
    body: '',
    timestamp: '1970-01-01T00:00:00.000Z',
  };
}

export function makeBlankFavorite(): PwaProfileFavorite {
  return { title: '', subcategory: '', distance: '', hours: '', image: '' };
}

export function makeBlankProfileEvent(): PwaProfileEvent {
  return { title: '', time: '', weekday: '', day: '', image: '', accent: 'brand' };
}
```

> `ScavengerTaskType` se importa de `@/lib/config` (ya exportado, lo usa `ScavengerTask.type`). Si no estuviera exportado, exportarlo en config.ts.

- [ ] **Step 2: Verificar typecheck.**

Run: `pnpm typecheck`
Expected: exit 0. Si falla por `ScavengerTaskType` no exportado, añadir `export` a su declaración en `src/lib/config.ts` y reintentar.

- [ ] **Step 3: Commit.**

```bash
git add src/app/studio/[slug]/mobile-pwa/_components/pwa-list-helpers.tsx
git commit -m "feat(studio): helpers add/remove para listas del editor PWA (F-PWA-5)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

**Verify:** typecheck limpio.
**Done:** existen `uid`, `AddItemButton`, `DeleteItemButton` y los `makeBlank*` tipados.

---

### Task C2: `ScavengerCoordsField` (Mapbox single-point + fallback)

**Files:**

- Create: `src/app/studio/[slug]/mobile-pwa/_components/ScavengerCoordsField.tsx`

Patrón base: `src/app/studio/_components/TrailGeoJsonField.tsx` (init mapbox una vez, `onChangeRef`, fallback sin token). Aquí es un marker arrastrable + click-to-place, no una LineString.

- [ ] **Step 1: Escribir el componente.**

```tsx
'use client';

import 'mapbox-gl/dist/mapbox-gl.css';

import mapboxgl from 'mapbox-gl';
import { useEffect, useMemo, useRef } from 'react';

import { PwaNumberField } from './pwa-ui';

interface Coords {
  lat: number;
  lng: number;
}

/**
 * Picker de un punto geográfico (lat/lng) para una task de Scavenger Hunt.
 * Adaptado de TrailGeoJsonField: marker arrastrable + click-to-place. Sin token
 * Mapbox cae a inputs numéricos (graceful degradation). El token llega por prop
 * desde `config.integraciones.mapbox_token` (nunca process.env en client).
 */
export function ScavengerCoordsField({
  coords,
  mapboxToken,
  onChange,
}: {
  coords: Coords;
  mapboxToken: string;
  onChange: (next: Coords) => void;
}) {
  if (!mapboxToken) {
    return (
      <div className="space-y-2 rounded-md border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-950/40">
        <p className="text-[11px] text-amber-600 dark:text-amber-400">
          Map disabled — set <code>integrations.mapbox.token</code> in Integrations to place the
          point visually.
        </p>
        <div className="grid grid-cols-2 gap-2">
          <PwaNumberField
            label="Latitude"
            value={coords.lat}
            step={0.0001}
            onChange={(lat) => onChange({ ...coords, lat })}
          />
          <PwaNumberField
            label="Longitude"
            value={coords.lng}
            step={0.0001}
            onChange={(lng) => onChange({ ...coords, lng })}
          />
        </div>
      </div>
    );
  }
  return <ScavengerMap coords={coords} mapboxToken={mapboxToken} onChange={onChange} />;
}

function ScavengerMap({
  coords,
  mapboxToken,
  onChange,
}: {
  coords: Coords;
  mapboxToken: string;
  onChange: (n: Coords) => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const hasPoint =
    Number.isFinite(coords.lat) &&
    Number.isFinite(coords.lng) &&
    !(coords.lat === 0 && coords.lng === 0);
  const initialCenter = useMemo<[number, number]>(
    () => (hasPoint ? [coords.lng, coords.lat] : [-98.5, 39.5]),
    // solo el centro inicial; cambios posteriores via efecto de sync
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    mapboxgl.accessToken = mapboxToken;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: initialCenter,
      zoom: hasPoint ? 14 : 3,
      attributionControl: false,
    });
    mapRef.current = map;
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');

    const marker = new mapboxgl.Marker({ color: '#0ea5e9', draggable: true });
    markerRef.current = marker;
    if (hasPoint) marker.setLngLat([coords.lng, coords.lat]).addTo(map);

    marker.on('dragend', () => {
      const { lng, lat } = marker.getLngLat();
      onChangeRef.current({ lat, lng });
    });

    map.on('click', (e) => {
      marker.setLngLat(e.lngLat).addTo(map);
      onChangeRef.current({ lat: e.lngLat.lat, lng: e.lngLat.lng });
    });

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapboxToken]);

  // Sync externo (e.g. inputs numéricos) → marker.
  useEffect(() => {
    const marker = markerRef.current;
    const map = mapRef.current;
    if (!marker || !map) return;
    if (hasPoint) {
      marker.setLngLat([coords.lng, coords.lat]).addTo(map);
    }
  }, [coords.lat, coords.lng, hasPoint]);

  return (
    <div className="space-y-2 rounded-md border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-950/40">
      <div
        ref={containerRef}
        className="h-[240px] w-full overflow-hidden rounded-md ring-1 ring-zinc-200 dark:ring-zinc-800"
      />
      <p className="text-[11px] leading-snug text-zinc-500">
        Click on the map to place the point, or drag the marker. Coordinates:{' '}
        {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}.
      </p>
    </div>
  );
}
```

- [ ] **Step 2: Verificar typecheck + lint.**

Run: `pnpm typecheck && pnpm lint`
Expected: exit 0.

- [ ] **Step 3: Commit.**

```bash
git add src/app/studio/[slug]/mobile-pwa/_components/ScavengerCoordsField.tsx
git commit -m "feat(studio): picker Mapbox single-point para coords de Scavenger (F-PWA-5)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

**Verify:** typecheck + lint limpios.
**Done:** componente que renderiza mapa con marker arrastrable (o inputs si no hay token) y emite `{lat,lng}`.

---

### Task C3: `FloorPointField` (picker click-sobre-imagen + fallback)

**Files:**

- Create: `src/app/studio/[slug]/mobile-pwa/_components/FloorPointField.tsx`

- [ ] **Step 1: Escribir el componente.** Convierte el click en % del contenedor (0–100). Fallback a inputs si no hay imagen.

```tsx
'use client';

import { useRef } from 'react';

import { resolveAssetUrl } from '@/lib/assets';

import { PwaNumberField } from './pwa-ui';

interface Point {
  x: number;
  y: number;
}

/**
 * Picker de un punto sobre la imagen del floor plan del Wayfinding. Las coords
 * son porcentajes 0–100 (NO lat/lng → no usa Mapbox). Click sobre la imagen
 * coloca el punto; sin imagen cae a inputs numéricos. Pinta también un marcador
 * de cada punto extra (readOnlyPoints) para contexto (origin/otros).
 */
export function FloorPointField({
  label,
  point,
  imageUrl,
  accent = '#0ea5e9',
  onChange,
}: {
  label: string;
  point: Point;
  imageUrl: string;
  accent?: string;
  onChange: (next: Point) => void;
}) {
  const ref = useRef<HTMLDivElement | null>(null);

  if (!imageUrl) {
    return (
      <div className="space-y-1.5 rounded-md border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-950/40">
        <span className="block text-[12px] font-medium text-zinc-600 dark:text-zinc-400">
          {label}
        </span>
        <p className="text-[11px] text-amber-600 dark:text-amber-400">
          Set the floor plan image to place points visually.
        </p>
        <div className="grid grid-cols-2 gap-2">
          <PwaNumberField
            label="X (%)"
            value={point.x}
            min={0}
            step={1}
            onChange={(x) => onChange({ ...point, x })}
          />
          <PwaNumberField
            label="Y (%)"
            value={point.y}
            min={0}
            step={1}
            onChange={(y) => onChange({ ...point, y })}
          />
        </div>
      </div>
    );
  }

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 1000) / 10;
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 1000) / 10;
    onChange({ x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) });
  };

  return (
    <div className="space-y-1.5">
      <span className="block text-[12px] font-medium text-zinc-600 dark:text-zinc-400">
        {label}
      </span>
      <div
        ref={ref}
        onClick={handleClick}
        className="relative w-full cursor-crosshair overflow-hidden rounded-md ring-1 ring-zinc-200 dark:ring-zinc-800"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={resolveAssetUrl(imageUrl)}
          alt=""
          className="block w-full select-none"
          draggable={false}
        />
        <span
          className="pointer-events-none absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow"
          style={{ left: `${point.x}%`, top: `${point.y}%`, backgroundColor: accent }}
        />
      </div>
      <p className="text-[11px] text-zinc-500">
        Click to place. Position: {point.x.toFixed(1)}%, {point.y.toFixed(1)}%.
      </p>
    </div>
  );
}
```

> **Verificar el helper de assets:** confirmar que existe `resolveAssetUrl` en `@/lib/assets` (o el helper que el runtime PWA usa para resolver paths de assets del cliente). Si el nombre difiere, usar el que ya emplea `WayfindingScreen` para `floorPlanImage`. Localizar con: `grep -rn "floorPlanImage" src/components/pwa | head`.

- [ ] **Step 2: Verificar typecheck + lint.**

Run: `pnpm typecheck && pnpm lint`
Expected: exit 0.

- [ ] **Step 3: Commit.**

```bash
git add src/app/studio/[slug]/mobile-pwa/_components/FloorPointField.tsx
git commit -m "feat(studio): picker de punto sobre floor-plan (x/y %) para Wayfinding (F-PWA-5)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

**Verify:** typecheck + lint limpios.
**Done:** componente que coloca un punto en % sobre la imagen (o inputs si no hay imagen) y emite `{x,y}`.

---

## PARTE D — Editores con add/remove

### Task D1: ScavengerHuntEditor — add/remove hunts+tasks, tipo de task, coords

**Files:**

- Modify: `src/app/studio/[slug]/mobile-pwa/_components/ScavengerHuntEditor.tsx`

Reutiliza lo existente (`updateHunt`, `updateTask`, `move`, `ReorderButtons`). Añade: prop `mapboxToken`, `useToast`, add/remove de hunts y tasks, selector de tipo, campos condicionales y `ScavengerCoordsField`.

- [ ] **Step 1: Actualizar imports y firma.**

Cambiar el import de tipos para incluir `ScavengerTaskType`, y añadir imports:

```ts
import type {
  PwaScavengerHuntConfig,
  ScavengerHunt,
  ScavengerTask,
  ScavengerTaskType,
} from '@/lib/config';

import { useToast } from '../../../_components/Toast';
import { move, PwaField, PwaGroup, PwaNumberField, PwaPanelHeader, ReorderButtons } from './pwa-ui';
import { AddItemButton, DeleteItemButton, makeBlankHunt, makeBlankTask } from './pwa-list-helpers';
import { ScavengerCoordsField } from './ScavengerCoordsField';
```

Firma:

```ts
export function ScavengerHuntEditor({
  value,
  onChange,
  mapboxToken,
}: {
  value: PwaScavengerHuntConfig | undefined;
  onChange: (next: PwaScavengerHuntConfig) => void;
  mapboxToken: string;
}) {
  const { show } = useToast();
```

- [ ] **Step 2: Añadir handlers add/remove** (después de `updateTask`, dentro del componente):

```ts
const addHunt = () => onChange({ ...v, hunts: [...v.hunts, makeBlankHunt()] });
const removeHunt = (hi: number) => {
  const removed = v.hunts[hi];
  const prev = v.hunts;
  onChange({ ...v, hunts: v.hunts.filter((_, idx) => idx !== hi) });
  show(`Deleted hunt "${removed?.name || removed?.slug}"`, {
    variant: 'info',
    durationMs: 6000,
    action: { label: 'Undo', onClick: () => onChange({ ...v, hunts: prev }) },
  });
};
const addTask = (hi: number) => updateHunt(hi, { tasks: [...v.hunts[hi]!.tasks, makeBlankTask()] });
const removeTask = (hi: number, ti: number) => {
  const hunt = v.hunts[hi]!;
  const removed = hunt.tasks[ti];
  const prev = hunt.tasks;
  updateHunt(hi, { tasks: hunt.tasks.filter((_, j) => j !== ti) });
  show(`Deleted task "${removed?.name || removed?.slug}"`, {
    variant: 'info',
    durationMs: 6000,
    action: { label: 'Undo', onClick: () => updateHunt(hi, { tasks: prev }) },
  });
};
const setTaskType = (hi: number, ti: number, type: ScavengerTaskType) => {
  const patch: Partial<ScavengerTask> = { type };
  if (type === 'checkin') patch.checkinRadius = v.hunts[hi]!.tasks[ti]!.checkinRadius ?? 50;
  if (type === 'question') {
    patch.question = v.hunts[hi]!.tasks[ti]!.question ?? '';
    patch.options = v.hunts[hi]!.tasks[ti]!.options ?? ['', ''];
    patch.correctIndex = v.hunts[hi]!.tasks[ti]!.correctIndex ?? 0;
  }
  updateTask(hi, ti, patch);
};
```

- [ ] **Step 3: Reescribir el bloque "Hunts & tasks"** (el `<PwaGroup title="Hunts & tasks">` actual) para incluir: botón add hunt, botón delete por hunt, botón add task, delete por task, selector de tipo, campos condicionales y el coords field. Sustituir el contenido del grupo por:

```tsx
<PwaGroup title="Hunts & tasks">
  {v.hunts.length === 0 ? (
    <p className="text-[12px] text-zinc-400 dark:text-zinc-500">No hunts configured.</p>
  ) : (
    v.hunts.map((h, hi) => (
      <div
        key={h.slug}
        className="space-y-3 rounded-lg border border-zinc-200 p-3 dark:border-zinc-800"
      >
        <div className="flex items-start gap-2">
          <ReorderButtons
            index={hi}
            count={v.hunts.length}
            onMove={(to) => onChange({ ...v, hunts: move(v.hunts, hi, to) })}
          />
          <div className="flex-1">
            <PwaField
              label={`Hunt · ${h.slug}`}
              value={h.name}
              onChange={(name) => updateHunt(hi, { name })}
            />
          </div>
          <DeleteItemButton label="Delete hunt" onClick={() => removeHunt(hi)} />
        </div>
        <div className="ml-2 space-y-3 border-l border-zinc-200 pl-3 dark:border-zinc-800">
          {h.tasks.map((t, ti) => (
            <div key={t.slug} className="flex items-start gap-2">
              <ReorderButtons
                index={ti}
                count={h.tasks.length}
                onMove={(to) => updateHunt(hi, { tasks: move(h.tasks, ti, to) })}
              />
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <select
                    value={t.type}
                    onChange={(e) => setTaskType(hi, ti, e.target.value as ScavengerTaskType)}
                    className="rounded-lg border border-zinc-200 bg-white px-2 py-1 text-[12px] text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200"
                  >
                    <option value="photo">Photo</option>
                    <option value="checkin">Check-in</option>
                    <option value="question">Question</option>
                  </select>
                  <span className="text-[11px] text-zinc-400">{t.slug}</span>
                </div>
                <PwaField
                  label="Name"
                  value={t.name}
                  onChange={(name) => updateTask(hi, ti, { name })}
                />
                <PwaField
                  label="Description"
                  multiline
                  value={t.description}
                  onChange={(description) => updateTask(hi, ti, { description })}
                />
                {t.type === 'question' ? (
                  <PwaField
                    label="Question"
                    value={t.question ?? ''}
                    onChange={(question) => updateTask(hi, ti, { question })}
                  />
                ) : null}
                {t.type === 'checkin' ? (
                  <ScavengerCoordsField
                    coords={t.coords}
                    mapboxToken={mapboxToken}
                    onChange={(coords) => updateTask(hi, ti, { coords })}
                  />
                ) : null}
                {t.type === 'checkin' ? (
                  <PwaNumberField
                    label="Check-in radius"
                    value={t.checkinRadius ?? 50}
                    min={0}
                    step={5}
                    suffix="m"
                    onChange={(checkinRadius) => updateTask(hi, ti, { checkinRadius })}
                  />
                ) : null}
              </div>
              <DeleteItemButton label="Delete task" onClick={() => removeTask(hi, ti)} />
            </div>
          ))}
          <AddItemButton label="Add task" onClick={() => addTask(hi)} />
        </div>
      </div>
    ))
  )}
  <AddItemButton label="Add hunt" onClick={addHunt} />
</PwaGroup>
```

> **Decisión:** el coords picker se muestra para `checkin` (la única task con geofence real). Para `photo`/`question` las coords no son críticas, se omiten para no saturar (se pueden añadir igual editando a checkin). El editor ya no afirma que "coordinates come from the initial setup" — actualizar la `description` del `PwaPanelHeader` a: `"White-label texts plus full hunts / tasks: add, remove, reorder, set type, coordinates and geofence radius."`.

- [ ] **Step 4: Verificar typecheck + lint** (también valida B1 Steps 1-3).

Run: `pnpm typecheck && pnpm lint`
Expected: exit 0.

- [ ] **Step 5: Commit (incluye los cambios de B1).**

```bash
git add src/app/studio/[slug]/mobile-pwa/page.tsx src/app/studio/[slug]/mobile-pwa/_components/PwaShell.tsx src/app/studio/[slug]/mobile-pwa/_components/PwaEditorPanel.tsx src/app/studio/[slug]/mobile-pwa/_components/ScavengerHuntEditor.tsx
git commit -m "feat(studio): Scavenger Hunt — add/remove hunts+tasks, tipo y coords/geofence (F-PWA-5)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

**Verify:** typecheck + lint limpios.
**Done:** se pueden crear/borrar hunts y tasks, cambiar el tipo de task, y fijar coords + radio de check-in con mapa.

---

### Task D2: WayfindingEditor — add/remove floors+amenities+routePoints, picker x/y

**Files:**

- Modify: `src/app/studio/[slug]/mobile-pwa/_components/WayfindingEditor.tsx`

- [ ] **Step 1: Imports + toast.** Añadir:

```ts
import { useToast } from '../../../_components/Toast';
import {
  AddItemButton,
  DeleteItemButton,
  makeBlankAmenity,
  makeBlankFloor,
} from './pwa-list-helpers';
import { FloorPointField } from './FloorPointField';
```

Tras la línea `const v: PwaWayfindingModuleConfig = { ... }` añadir `const { show } = useToast();` al inicio del cuerpo del componente (antes de los update helpers).

- [ ] **Step 2: Handlers add/remove.** Tras `updateAmenity`:

```ts
const addFloor = () => onChange({ ...v, floors: [...v.floors, makeBlankFloor()] });
const removeFloor = (fi: number) => {
  const removed = v.floors[fi];
  const prev = v.floors;
  onChange({ ...v, floors: v.floors.filter((_, idx) => idx !== fi) });
  show(`Deleted floor "${removed?.label || removed?.key}"`, {
    variant: 'info',
    durationMs: 6000,
    action: { label: 'Undo', onClick: () => onChange({ ...v, floors: prev }) },
  });
};
const addAmenity = (fi: number) =>
  updateFloor(fi, { amenities: [...v.floors[fi]!.amenities, makeBlankAmenity()] });
const removeAmenity = (fi: number, ai: number) => {
  const floor = v.floors[fi]!;
  const removed = floor.amenities[ai];
  const prev = floor.amenities;
  updateFloor(fi, { amenities: floor.amenities.filter((_, j) => j !== ai) });
  show(`Deleted amenity "${removed?.name || removed?.slug}"`, {
    variant: 'info',
    durationMs: 6000,
    action: { label: 'Undo', onClick: () => updateFloor(fi, { amenities: prev }) },
  });
};
const addRoutePoint = (fi: number, ai: number) => {
  const a = v.floors[fi]!.amenities[ai]!;
  updateAmenity(fi, ai, { routePoints: [...a.routePoints, { x: 50, y: 50 }] });
};
const removeRoutePoint = (fi: number, ai: number, pi: number) => {
  const a = v.floors[fi]!.amenities[ai]!;
  updateAmenity(fi, ai, { routePoints: a.routePoints.filter((_, j) => j !== pi) });
};
const setRoutePoint = (fi: number, ai: number, pi: number, p: { x: number; y: number }) => {
  const a = v.floors[fi]!.amenities[ai]!;
  updateAmenity(fi, ai, { routePoints: a.routePoints.map((rp, j) => (j === pi ? p : rp)) });
};
```

- [ ] **Step 3: Reescribir el bloque "Floors & amenities".** Sustituir el contenido del `<PwaGroup title="Floors & amenities">` por (añade: image + origin picker por floor; image + destination picker + routePoints por amenity; add/remove en los 3 niveles):

```tsx
<PwaGroup title="Floors & amenities">
  {v.floors.length === 0 ? (
    <p className="text-[12px] text-zinc-400 dark:text-zinc-500">No floors configured.</p>
  ) : (
    v.floors.map((f, fi) => (
      <div
        key={f.key}
        className="space-y-3 rounded-lg border border-zinc-200 p-3 dark:border-zinc-800"
      >
        <div className="flex items-start gap-2">
          <ReorderButtons
            index={fi}
            count={v.floors.length}
            onMove={(to) => onChange({ ...v, floors: move(v.floors, fi, to) })}
          />
          <div className="flex-1">
            <PwaField
              label={`Floor · ${f.key}`}
              value={f.label}
              onChange={(label) => updateFloor(fi, { label })}
            />
          </div>
          <DeleteItemButton label="Delete floor" onClick={() => removeFloor(fi)} />
        </div>
        <PwaField
          label="Floor plan image (asset path)"
          value={f.floorPlanImage}
          onChange={(floorPlanImage) => updateFloor(fi, { floorPlanImage })}
        />
        <FloorPointField
          label="“You are here” origin"
          point={f.origin}
          imageUrl={f.floorPlanImage}
          accent="#10b981"
          onChange={(origin) => updateFloor(fi, { origin })}
        />
        <div className="ml-2 space-y-3 border-l border-zinc-200 pl-3 dark:border-zinc-800">
          {f.amenities.map((a, ai) => (
            <div
              key={a.slug}
              className="space-y-2 rounded-md border border-zinc-100 p-2 dark:border-zinc-900"
            >
              <div className="flex items-start gap-2">
                <ReorderButtons
                  index={ai}
                  count={f.amenities.length}
                  onMove={(to) => updateFloor(fi, { amenities: move(f.amenities, ai, to) })}
                />
                <div className="flex-1">
                  <PwaField
                    label={`Amenity · ${a.slug}`}
                    value={a.name}
                    onChange={(name) => updateAmenity(fi, ai, { name })}
                  />
                </div>
                <DeleteItemButton label="Delete amenity" onClick={() => removeAmenity(fi, ai)} />
              </div>
              <PwaField
                label="Image (asset path)"
                value={a.image}
                onChange={(image) => updateAmenity(fi, ai, { image })}
              />
              <FloorPointField
                label="Destination"
                point={a.destination}
                imageUrl={f.floorPlanImage}
                accent="#0ea5e9"
                onChange={(destination) => updateAmenity(fi, ai, { destination })}
              />
              <div className="space-y-2">
                <span className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                  Route points
                </span>
                {a.routePoints.map((rp, pi) => (
                  <div key={pi} className="flex items-start gap-2">
                    <div className="flex-1">
                      <FloorPointField
                        label={`Waypoint ${pi + 1}`}
                        point={rp}
                        imageUrl={f.floorPlanImage}
                        accent="#f59e0b"
                        onChange={(p) => setRoutePoint(fi, ai, pi, p)}
                      />
                    </div>
                    <DeleteItemButton
                      label="Delete waypoint"
                      onClick={() => removeRoutePoint(fi, ai, pi)}
                    />
                  </div>
                ))}
                <AddItemButton label="Add waypoint" onClick={() => addRoutePoint(fi, ai)} />
              </div>
            </div>
          ))}
          <AddItemButton label="Add amenity" onClick={() => addAmenity(fi)} />
        </div>
      </div>
    ))
  )}
  <AddItemButton label="Add floor" onClick={addFloor} />
</PwaGroup>
```

> Actualizar la `description` del `PwaPanelHeader` a: `"Indoor navigation: add/remove floors and amenities, set floor plan images and place origin, destination and route waypoints on the map."`.

- [ ] **Step 4: Verificar typecheck + lint.**

Run: `pnpm typecheck && pnpm lint`
Expected: exit 0.

- [ ] **Step 5: Commit.**

```bash
git add src/app/studio/[slug]/mobile-pwa/_components/WayfindingEditor.tsx
git commit -m "feat(studio): Wayfinding — add/remove floors/amenities/waypoints + picker x/y (F-PWA-5)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

**Verify:** typecheck + lint limpios.
**Done:** se pueden crear/borrar floors, amenities y waypoints, y colocar origin/destination/waypoints sobre la imagen del plano.

---

### Task D3: NotificationsEditor — add/remove del seed

**Files:**

- Modify: `src/app/studio/[slug]/mobile-pwa/_components/NotificationsEditor.tsx`

- [ ] **Step 1: Imports + toast.** Añadir:

```ts
import type { PwaNotification, PwaNotificationsConfig } from '@/lib/config';
import { useToast } from '../../../_components/Toast';
import { PwaField, PwaGroup, PwaPanelHeader } from './pwa-ui';
import { AddItemButton, DeleteItemButton, makeBlankNotification } from './pwa-list-helpers';
```

En el cuerpo, tras `const set = ...`, añadir:

```ts
const { show } = useToast();
const updateNotif = (i: number, patch: Partial<PwaNotification>) =>
  set({ seed: v.seed.map((n, idx) => (idx === i ? { ...n, ...patch } : n)) });
const addNotif = () => set({ seed: [...v.seed, makeBlankNotification()] });
const removeNotif = (i: number) => {
  const removed = v.seed[i];
  const prev = v.seed;
  set({ seed: v.seed.filter((_, idx) => idx !== i) });
  show(`Deleted notification "${removed?.title || removed?.id}"`, {
    variant: 'info',
    durationMs: 6000,
    action: { label: 'Undo', onClick: () => set({ seed: prev }) },
  });
};
```

- [ ] **Step 2: Añadir un `PwaGroup` "Example notifications"** antes del cierre del scroll container (después del grupo "Empty state"):

```tsx
<PwaGroup title="Example notifications (demo data — real ones come from the backend)">
  {v.seed.length === 0 ? (
    <p className="text-[12px] text-zinc-400 dark:text-zinc-500">No example notifications.</p>
  ) : (
    v.seed.map((n, i) => (
      <div
        key={n.id}
        className="flex items-start gap-2 rounded-lg border border-zinc-200 p-3 dark:border-zinc-800"
      >
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <select
              value={n.type}
              onChange={(e) => updateNotif(i, { type: e.target.value as PwaNotification['type'] })}
              className="rounded-lg border border-zinc-200 bg-white px-2 py-1 text-[12px] text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200"
            >
              <option value="info">Info</option>
              <option value="event">Event</option>
              <option value="deal">Deal</option>
              <option value="alert">Alert</option>
            </select>
          </div>
          <PwaField label="Title" value={n.title} onChange={(title) => updateNotif(i, { title })} />
          <PwaField
            label="Body"
            multiline
            value={n.body}
            onChange={(body) => updateNotif(i, { body })}
          />
          <PwaField
            label="Timestamp (ISO)"
            value={n.timestamp}
            onChange={(timestamp) => updateNotif(i, { timestamp })}
          />
        </div>
        <DeleteItemButton label="Delete notification" onClick={() => removeNotif(i)} />
      </div>
    ))
  )}
  <AddItemButton label="Add example notification" onClick={addNotif} />
</PwaGroup>
```

- [ ] **Step 3: Verificar typecheck + lint.**

Run: `pnpm typecheck && pnpm lint`
Expected: exit 0.

- [ ] **Step 4: Commit.**

```bash
git add src/app/studio/[slug]/mobile-pwa/_components/NotificationsEditor.tsx
git commit -m "feat(studio): Notifications — add/remove del seed de ejemplo (F-PWA-5)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

**Verify:** typecheck + lint limpios.
**Done:** se pueden añadir/borrar notificaciones de ejemplo, editando tipo/título/cuerpo/timestamp.

---

### Task D4: ProfileEditor — add/remove de favorites + upcomingEvents

**Files:**

- Modify: `src/app/studio/[slug]/mobile-pwa/_components/ProfileEditor.tsx`

- [ ] **Step 1: Imports + toast.** Añadir:

```ts
import type { PwaProfileConfig, PwaProfileEvent, PwaProfileFavorite } from '@/lib/config';
import { useToast } from '../../../_components/Toast';
import {
  AddItemButton,
  DeleteItemButton,
  makeBlankFavorite,
  makeBlankProfileEvent,
} from './pwa-list-helpers';
```

En el cuerpo, tras construir `v`, añadir:

```ts
const { show } = useToast();
const favItems = v.favorites.items;
const evtItems = v.upcomingEvents.items;
const updateFav = (i: number, patch: Partial<PwaProfileFavorite>) =>
  onChange({
    ...v,
    favorites: {
      ...v.favorites,
      items: favItems.map((it, idx) => (idx === i ? { ...it, ...patch } : it)),
    },
  });
const addFav = () =>
  onChange({ ...v, favorites: { ...v.favorites, items: [...favItems, makeBlankFavorite()] } });
const removeFav = (i: number) => {
  const prev = favItems;
  onChange({ ...v, favorites: { ...v.favorites, items: favItems.filter((_, idx) => idx !== i) } });
  show('Deleted favorite', {
    variant: 'info',
    durationMs: 6000,
    action: {
      label: 'Undo',
      onClick: () => onChange({ ...v, favorites: { ...v.favorites, items: prev } }),
    },
  });
};
const updateEvt = (i: number, patch: Partial<PwaProfileEvent>) =>
  onChange({
    ...v,
    upcomingEvents: {
      ...v.upcomingEvents,
      items: evtItems.map((it, idx) => (idx === i ? { ...it, ...patch } : it)),
    },
  });
const addEvt = () =>
  onChange({
    ...v,
    upcomingEvents: { ...v.upcomingEvents, items: [...evtItems, makeBlankProfileEvent()] },
  });
const removeEvt = (i: number) => {
  const prev = evtItems;
  onChange({
    ...v,
    upcomingEvents: { ...v.upcomingEvents, items: evtItems.filter((_, idx) => idx !== i) },
  });
  show('Deleted event', {
    variant: 'info',
    durationMs: 6000,
    action: {
      label: 'Undo',
      onClick: () => onChange({ ...v, upcomingEvents: { ...v.upcomingEvents, items: prev } }),
    },
  });
};
```

- [ ] **Step 2: Extender el grupo "Favorites section"** (tras el `PwaField` "View more") con la lista demo:

```tsx
{
  favItems.map((it, i) => (
    <div
      key={i}
      className="flex items-start gap-2 rounded-lg border border-zinc-200 p-2 dark:border-zinc-800"
    >
      <div className="flex-1 space-y-2">
        <PwaField label="Title" value={it.title} onChange={(title) => updateFav(i, { title })} />
        <PwaField
          label="Subcategory"
          value={it.subcategory}
          onChange={(subcategory) => updateFav(i, { subcategory })}
        />
        <PwaField
          label="Distance line"
          value={it.distance}
          onChange={(distance) => updateFav(i, { distance })}
        />
        <PwaField
          label="Hours line"
          value={it.hours}
          onChange={(hours) => updateFav(i, { hours })}
        />
        <PwaField
          label="Image (asset path)"
          value={it.image}
          onChange={(image) => updateFav(i, { image })}
        />
      </div>
      <DeleteItemButton label="Delete favorite" onClick={() => removeFav(i)} />
    </div>
  ));
}
<AddItemButton label="Add example favorite" onClick={addFav} />;
```

- [ ] **Step 3: Extender el grupo "Upcoming events section"** (tras "View more"):

```tsx
{
  evtItems.map((it, i) => (
    <div
      key={i}
      className="flex items-start gap-2 rounded-lg border border-zinc-200 p-2 dark:border-zinc-800"
    >
      <div className="flex-1 space-y-2">
        <PwaField label="Title" value={it.title} onChange={(title) => updateEvt(i, { title })} />
        <PwaField label="Time" value={it.time} onChange={(time) => updateEvt(i, { time })} />
        <PwaField
          label="Weekday"
          value={it.weekday}
          onChange={(weekday) => updateEvt(i, { weekday })}
        />
        <PwaField label="Day number" value={it.day} onChange={(day) => updateEvt(i, { day })} />
        <PwaField
          label="Image (asset path)"
          value={it.image}
          onChange={(image) => updateEvt(i, { image })}
        />
      </div>
      <DeleteItemButton label="Delete event" onClick={() => removeEvt(i)} />
    </div>
  ));
}
<AddItemButton label="Add example event" onClick={addEvt} />;
```

> Estos dos grupos son "demo data" — añadir una nota corta en la `description` del header: `"... The favorites / events below are example data (real items come from the user's account)."`.

- [ ] **Step 4: Verificar typecheck + lint.**

Run: `pnpm typecheck && pnpm lint`
Expected: exit 0.

- [ ] **Step 5: Commit.**

```bash
git add src/app/studio/[slug]/mobile-pwa/_components/ProfileEditor.tsx
git commit -m "feat(studio): Profile — add/remove de favoritos y eventos de ejemplo (F-PWA-5)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

**Verify:** typecheck + lint limpios.
**Done:** se pueden añadir/borrar items demo de favoritos y eventos del perfil.

---

### Task D5: ConnectWithUsEditor — validación inline de URLs/tel (F-PWA-6)

**Files:**

- Modify: `src/app/studio/[slug]/mobile-pwa/_components/ConnectWithUsEditor.tsx`

Connect no modela listas (objeto de keys fijas) → no recibe add/remove. Recibe la validación inline ligera del lado cliente: aviso si una URL no parece válida. (El PATCH ya valida el formato vía `PwaConnectWithUsConfigSchema`, esto es feedback inmediato.)

- [ ] **Step 1: Helper de aviso de URL.** Al inicio del archivo (tras imports) añadir:

```tsx
function urlHint(value: string): string | null {
  if (!value.trim()) return null;
  try {
    // eslint-disable-next-line no-new
    new URL(value);
    return null;
  } catch {
    return 'Looks invalid — include https://';
  }
}

function FieldHint({ hint }: { hint: string | null }) {
  if (!hint) return null;
  return <p className="mt-1 text-[11px] text-amber-600 dark:text-amber-400">{hint}</p>;
}
```

- [ ] **Step 2: Envolver los campos de URL con el hint.** Para "Website URL" y los 4 social, envolver cada `<PwaField .../>` en un fragmento con el hint debajo. Ejemplo para Website:

```tsx
<div>
  <PwaField
    label="Website URL"
    value={v.website ?? ''}
    onChange={(website) => onChange({ ...v, website })}
  />
  <FieldHint hint={urlHint(v.website ?? '')} />
</div>
```

Aplicar el mismo envoltorio a X / Facebook / Instagram / Pinterest (usando `social.x` etc.).

- [ ] **Step 3: Verificar typecheck + lint.**

Run: `pnpm typecheck && pnpm lint`
Expected: exit 0.

- [ ] **Step 4: Commit.**

```bash
git add src/app/studio/[slug]/mobile-pwa/_components/ConnectWithUsEditor.tsx
git commit -m "fix(studio): Connect — validación inline de URLs sociales/website (F-PWA-6)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

**Verify:** typecheck + lint limpios; una URL sin esquema muestra el aviso.
**Done:** los campos de URL avisan cuando el valor no parsea como URL.

---

## PARTE E — Verificación final

### Task E1: QA runtime + push + deploy

**Files:** ninguno.

- [ ] **Step 1: `pnpm typecheck && pnpm lint && pnpm validate:configs`** — todo limpio.

- [ ] **Step 2: QA con agent-browser del editor en dev** (no requiere auth en local). Levantar `pnpm dev`, abrir `/studio/default/mobile-pwa`, sección Scavenger Hunt: añadir un hunt, añadir una task checkin, colocar el punto en el mapa, verificar que el radio aparece; sección Wayfinding: añadir floor + amenity + waypoint, colocar puntos sobre la imagen; guardar (SaveBar) y confirmar `200` en `/api/studio/pwa/default`. Screenshots a `.planning/verifications/fase3b-*`.

- [ ] **Step 3: Smoke del schema** (Task A3 Steps 2-4) si no se corrió ya: round-trip 200 + inválido 400.

- [ ] **Step 4: Push incremental ya hecho por commit.** Confirmar que cada push disparó deploy Vercel READY (`mcp__claude_ai_Vercel__list_deployments` o el dashboard). Si algún deploy entra en ERROR, leer build logs y arreglar antes de continuar.

- [ ] **Step 5: Aviso a Rubén — QA visual del editor en prod.** El editor en producción pide login GitHub (agent-browser no entra). Pedir a Rubén que valide en `trueomni-studio.vercel.app`: add/remove en los 4 editores, pickers de coords, toasts Undo.

**Verify:** typecheck + lint + validate:configs limpios; QA dev OK; deploys READY.
**Done:** F-PWA-5 y F-PWA-6 cerrados; pendiente solo el QA visual del editor en prod por Rubén.

---

## Notas de cierre

- Actualizar `STATE.md` con la entrada de sesión (vía `/terminar`) y marcar F-PWA-5/F-PWA-6 como cerrados en el tracking del audit (Fase 3b).
- Si Zod marca fricción de tipos en A2 con `PwaConfig`, no relajar el `savePwaSlice`; el cast acotado del step es suficiente y está documentado.
- No endurecer el schema (rechazar campos desconocidos) en esta pasada — es trabajo posterior (fuera de alcance del spec).
