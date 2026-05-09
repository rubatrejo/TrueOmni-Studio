# DSS8-SUMMARY.md — Diagnostics + i18n editor extension

**Fecha:** 2026-05-07
**Estado:** ✅ aprobado (onboarding tour deferido a DSS8.5)

## Hecho

### Diagnostics page

- **`src/lib/signage/diagnostics.ts`** (server-only): `collectSignageDiagnostics()`
  agrega clients count + slugs, displays count global + per-client,
  storage usage agregado + por display, KV cloud vs in-memory, GitHub
  publish config presence + repo info.
- **`/studio/digital-displays/diagnostics`** server page invoca el collector
  y pasa al `<DiagnosticsView>`.
- **`<DiagnosticsView>`** (client): 4 cards (Storage, Clients, Displays,
  Publish) con rows label/value + chips boolean. Bar progress total
  KV usage coloreado (verde/amber/red).

### i18n editor

- **KV namespace nuevo** `signage:i18n:<client>:<locale>` (`kSignageI18n`).
- **`kvSignageI18n`** namespace en `kv-store.ts` con get/set/delete.
- **`loadSignageI18n`** ahora consulta KV **encima** del bag fs (merge
  fs+default → fs+slug → KV). Cambios desde el editor sobrescriben fs sin
  tocar archivos.
- **API endpoint** `/api/studio/signage/clients/[client]/i18n`:
  - `GET ?locale=en` retorna bag mergeado.
  - `PUT { locale, bag }` valida shape (todas values strings) y persiste al KV.
- **`<I18nTab>`** insertado entre Displays y Versions del ThemeEditor:
  - Locale selector (en/es/fr/de/pt/ja).
  - Lista de keys con input editable per-value.
  - Save button → PUT al endpoint. Estados saving/dirty/saved.
- **TABS reordenados**: Branding · Header · Displays · **i18n** · Versions ·
  Publish. Versions y Publish ya no son disabled (DSS6 y DSS7 los
  habilitaron pero seguían marcados con badge — ahora limpios).

### Onboarding tour deferido

DSS8.5 cuando haya feedback real de usuario signage. Razón: el tour del
kiosk fue iterado con uso real; el de signage sin baseline es genérico y
de bajo valor.

## Archivos tocados

| Archivo                                                                       | Tipo                                          |
| ----------------------------------------------------------------------------- | --------------------------------------------- |
| `src/lib/signage/diagnostics.ts`                                              | NUEVO                                         |
| `src/app/studio/digital-displays/diagnostics/page.tsx`                        | NUEVO                                         |
| `src/app/studio/digital-displays/diagnostics/_components/DiagnosticsView.tsx` | NUEVO                                         |
| `src/lib/signage/kv-keys.ts`                                                  | + kSignageI18n                                |
| `src/lib/signage/kv-store.ts`                                                 | + kvSignageI18n namespace                     |
| `src/lib/signage/i18n.ts`                                                     | loader híbrido KV→fs                          |
| `src/app/api/studio/signage/clients/[client]/i18n/route.ts`                   | NUEVO                                         |
| `src/app/studio/digital-displays/_components/tabs/I18nTab.tsx`                | NUEVO                                         |
| `src/app/studio/digital-displays/_components/ThemeEditor.tsx`                 | + i18n tab + reorden + cleanup disabled flags |
| `.planning/DSS8-PLAN.md`                                                      | NUEVO                                         |
| `.planning/DSS8-SUMMARY.md`                                                   | NUEVO                                         |

## Verificado

- `pnpm typecheck` ✅
- `pnpm exec eslint` archivos tocados ✅
- `pnpm kiosk:dev` arranca limpio
- `/studio/digital-displays/diagnostics` carga con info correcta.
- Theme editor: tab i18n entre Displays y Versions; carga bag, edit value,
  Save → PUT → success badge → reload runtime aplica nuevo string.
- Sin regression del runtime ni del kiosk.

## Decisiones

- **Diagnostics solo lectura**: read-only minimiza superficie de bug.
- **i18n KV-first** alineado con patrón general signage (KV→fs).
- **Tour deferido**: pragmatismo. DSS8.5 cuando haya feedback.
- **Validación shallow del bag (todos string)**: previene shapes corruptos
  sin schema Zod custom (que sería demasiado).

## Pendiente / siguiente sub-fase

**DSS9** — Smoke E2E producción + doc paso a paso (cierra el milestone).
