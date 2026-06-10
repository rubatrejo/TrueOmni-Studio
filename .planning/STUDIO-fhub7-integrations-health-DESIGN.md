# DESIGN — Studio Audit F-HUB-7: monitor de salud de integraciones

> Fecha: 2026-06-10 · Audit origen: `STUDIO-AUDIT-2026-06-09` (hallazgo **F-HUB-7**).
> Cierra el último hallazgo abierto de la **Fase 3** del roadmap del audit.
> Estado: diseño aprobado por Rubén (brainstorming 2026-06-10).

## 1. Objetivo

El tab Integrations del Studio testea integraciones **on-demand y efímero** (cada test es un
`useState` con auto-dismiss). No hay "Test all", ni resultado persistido, ni forma de saber de un
vistazo si las llaves de un cliente siguen vivas. Existe `GET /api/studio/integrations/smoke`
(barrido global de todos los clientes) pero **no se consume** desde el editor.

Fix del audit: **"Test all"** + último resultado/timestamp persistido en KV + **badge de salud en
la ProductCard**.

## 2. Decisiones de diseño (brainstorming)

- **"Test all" cubre las 2 fuentes** (decisión de Rubén): un motor de checks compartido expuesto de
  dos formas — testear la **working copy** (lo que se edita, sin guardar) Y testear la **config
  guardada** (KV). Ambos escriben el **mismo** snapshot de salud; el snapshot lleva `source`
  (`'working-copy' | 'saved'`) para que la UI lo distinga. Gana el último que corrió.
- **Badge en card Kiosk + header del tab** (decisión de Rubén): badge resumen en la ProductCard de
  Kiosks del hub del cliente + línea de estado con timestamp en la cabecera del editor de
  Integrations.
- **Reuso sobre refactor**: el motor reusa el patrón de self-fetch a `/api/studio/integrations/check`
  que ya usa el smoke (no se extraen las funciones de check a lib pura — fuera de alcance, mayor
  churn/riesgo).
- **Sin historial**: solo el último snapshot por cliente (el audit no pide historial). KV de un solo
  valor con TTL, no lista rotada.

## 3. Arquitectura

### 3.1 Motor compartido — `src/lib/studio/integrations-health.ts` (nuevo)

Extrae la lógica de `runChecksForKiosk` que hoy vive inline en `smoke/route.ts`.

```ts
export type IntegrationKind =
  | 'mapbox' | 'api' | 'analytics' | 'openweather'
  | 'satisfi' | 'tavus' | 'bandwango' | 'crowdriff' | 'viator';

export type CheckStatus = 'ok' | 'failed' | 'skipped';

export interface IntegrationCheckResult {
  kind: IntegrationKind;
  status: CheckStatus;
  message?: string;
}

export type HealthSource = 'working-copy' | 'saved';
export type OverallHealth = 'healthy' | 'degraded' | 'untested';

export interface HealthTotals {
  ok: number; failed: number; skipped: number; configured: number;
}

export interface IntegrationHealthSnapshot {
  computedAt: string;            // ISO
  source: HealthSource;
  totals: HealthTotals;
  overall: OverallHealth;        // derived: failed>0 → degraded; configured>0 → healthy; else untested
  results: IntegrationCheckResult[];
}

// Construye la lista de checks {kind, payload} | skip(kind) desde la config.
// Cubre los 9 providers (el smoke actual omite bandwango/crowdriff/viator → de paso se añaden).
buildChecks(integrations): Array<{ kind; payload? }>

// Corre los checks (self-fetch a /check, concurrency 4) y devuelve resultados.
runIntegrationChecks(integrations, { origin }): Promise<IntegrationCheckResult[]>

// Totales + overall.
summarizeHealth(results): { totals; overall }
```

`smoke/route.ts` se refactoriza para consumir `runIntegrationChecks` + `summarizeHealth`. **Mismo
contrato de salida** (`{ computedAt, totals, clients }`) — refactor interno, sin cambio observable.
Único cambio funcional menor y deseable: el smoke pasa a cubrir bandwango/crowdriff/viator.

### 3.2 KV — `src/lib/studio/kv.ts`

Añadir a `kvKeys`:

```ts
/** Último snapshot de salud de integraciones del cliente (F-HUB-7).
 *  Un solo valor (sin historial). TTL 90d para auto-limpieza. */
integHealth: (slug: string) => `integ:${slug}:health`,
```

### 3.3 Endpoint — `src/app/api/studio/integrations/health/[slug]/route.ts` (nuevo)

Cubierto por el guard de auth de `/api/studio/*` (middleware, audit Fase 1: mutaciones → 503 sin
auth en prod).

- **`POST`** body opcional `{ integrations?: IntegrationsConfig }`:
  - con `integrations` → `source: 'working-copy'`, corre el motor sobre el body.
  - sin body → lee `cfg:<slug>` de KV → `source: 'saved'`.
  - persiste el `IntegrationHealthSnapshot` en `integHealth(slug)` (TTL 90d) y lo devuelve.
  - `slug` inexistente / sin cfg en modo saved → 404.
- **`GET`** → devuelve el snapshot persistido o `null`.

### 3.4 Cliente API — `src/app/studio/_lib/api-client.ts`

```ts
export async function getIntegrationsHealth(slug): Promise<IntegrationHealthSnapshot | null>;
export async function runIntegrationsHealth(
  slug,
  integrations?, // omitido → testea la config guardada
): Promise<IntegrationHealthSnapshot>;
```

## 4. UI

### 4.1 `IntegrationsEditor` (`_components/IntegrationsEditor.tsx`)

- Usa `useStudioSlug()` para el slug (ya disponible vía contexto; el componente padre `EditorPanel`
  lo usa).
- **Cabecera nueva** encima de las cards: botón **"Test all configured"** + línea de estado
  (`Last tested 5m ago · 6 ok · 1 failing · unsaved edits` / `saved config`). En mount hace
  `getIntegrationsHealth(slug)` para poblar la línea.
- **"Test all"** → `runIntegrationsHealth(slug, value)` (working copy) → distribuye los resultados a
  cada card y refresca la cabecera. Implementación: se sube un mapa `resultsByKind` al
  `IntegrationsEditor`; cada Card recibe un prop opcional `externalResult` que pinta en su `TestRow`
  ya existente (sin duplicar UI).
- Los botones **"Test" por card se mantienen** (efímeros; solo "Test all" persiste el snapshot).
- Estados: botón con `Loader2` mientras corre; error inline si el POST falla.

### 4.2 Badge en el hub — `page.tsx` → `ClientView` → `ProductCard`

- `src/app/studio/[slug]/page.tsx` (server) lee `kv.get(kvKeys.integHealth(slug))` y lo pasa como
  `initialIntegrationsHealth` a `ClientView` (SSR, sin flash; mismo patrón que `initialManifest`).
- `ClientView` (client) lo recibe y lo pasa a la **ProductCard de Kiosks** como prop opcional
  `integrationsHealth`.
- `ProductCard` renderiza una línea sutil **solo cuando el producto está activo y hay prop**:
  - `overall==='healthy'` → `✓ Integrations healthy` (emerald).
  - `overall==='degraded'` → `⚠ N integration(s) failing` (amber/red).
  - `overall==='untested'` o sin snapshot → `Integrations not tested` (zinc, sutil).
- Solo en la card Kiosks (las integraciones son del kiosk). Las demás cards no reciben el prop.

## 5. No-regresión

- `smoke/route.ts`: refactor interno, mismos tipos de salida; lo verifica el barrido `/diagnostics`.
- `IntegrationsEditor` sigue mutando vía `onChange(next)`; "Test all" **no** toca la config, solo
  lee la working copy + persiste salud aparte.
- `ProductCard`: el badge es un prop **opcional**; las 4 cards que no lo pasan no cambian.
- Colores: el editor/hub del Studio usa literales Tailwind (zinc/emerald/red/amber) — **chrome del
  Studio, no runtime de cliente**. La regla §7 (cero-hardcoded) aplica al kiosk/PWA, no al editor
  (consistente con todo el código existente del Studio).

## 6. Verificación

- `pnpm typecheck` + `pnpm lint` (sin warnings nuevos) + `pnpm validate:configs` por commit.
- El smoke por-cliente (modo `saved`) se puede verificar contra el runtime; el badge/Test-all del
  editor requiere login GitHub → QA visual de Rubén en prod.
- Push incremental: (1) motor + endpoint + KV, (2) UI editor + badge; cada uno con deploy Vercel
  READY antes del siguiente.

## 7. Fuera de alcance

- Cron / auto-refresh de salud (queda on-demand).
- Historial de salud (solo último snapshot).
- Extraer las funciones de check a lib pura (se mantiene self-fetch a `/check`).
- Endurecer schemas. Badge en productos distintos de Kiosks.
