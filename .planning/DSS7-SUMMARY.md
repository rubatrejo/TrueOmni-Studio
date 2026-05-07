# DSS7-SUMMARY.md — Publish + JSON export/import + KV size advisor

**Fecha:** 2026-05-07
**Estado:** ✅ aprobado (UX validada; publish real depende de env GitHub)

## Hecho

Cierra el flow de publish del display via PR + utilidades de export/import
JSON local + advisor del uso KV.

### Build helpers

- **`publish-files.ts`**: `buildSignageDisplayPublishFiles(client, display,
  data)` → PublishFile[] con `clients-signage/<c>/displays/<d>/display.json`.
  DSS7 publica solo display.json; client publish (branding + tokens.css +
  i18n) llega en DSS7.5 si surge.
- **`kv-size.ts`**: `computeSignageKvSize(c, d)` → bytes del display + bytes
  acumulados de snapshots + cap (950000 = 950KB).

### 4 endpoints API

| Endpoint | Verb | Función |
|---|---|---|
| `/publish` | POST | Reusa `publishToGitHub` del kiosk con autoMerge true. 503 si falta `STUDIO_GITHUB_TOKEN`. |
| `/export` | GET | Descarga `display.json` con `Content-Disposition: attachment`. |
| `/import` | POST | Recibe `{ display }`, valida con Zod, crea snapshot pre-import del current, set al KV. |
| `/size` | GET | Retorna `{ display, snapshots, total, cap }` en bytes. |

### UI componentes

- **`<PublishToolbar>`**: card en sidebar con 3 botones:
  - Export JSON (`<a download>`).
  - Import JSON (file input → POST + reload).
  - Publish (POST + modal con PR URL clickable).
  - Estados: loading/success/error inline.
- **`<KvSizeAdvisor>`**: card compacta debajo del toolbar:
  - Header con icono Database + total/cap.
  - Bar progress 1.5px alto: verde <60%, amber 60-85%, red >85%.
  - Breakdown "display: NB · snapshots: NB".
  - Refresh con `refreshTrigger=lastSavedAt`.

### Wire-up

`<DisplayEditor>` monta los 2 nuevos componentes en el sidebar después
de `<VersionsPanel>`.

## Archivos tocados

| Archivo | Tipo |
|---|---|
| `src/lib/signage/publish-files.ts` | NUEVO |
| `src/lib/signage/kv-size.ts` | NUEVO |
| `src/app/api/studio/signage/displays/[c]/[d]/publish/route.ts` | NUEVO |
| `src/app/api/studio/signage/displays/[c]/[d]/export/route.ts` | NUEVO |
| `src/app/api/studio/signage/displays/[c]/[d]/import/route.ts` | NUEVO |
| `src/app/api/studio/signage/displays/[c]/[d]/size/route.ts` | NUEVO |
| `src/app/studio/digital-displays/_components/display/PublishToolbar.tsx` | NUEVO |
| `src/app/studio/digital-displays/_components/display/KvSizeAdvisor.tsx` | NUEVO |
| `src/app/studio/digital-displays/_components/DisplayEditor.tsx` | mount toolbar + advisor |
| `.planning/DSS7-PLAN.md` | NUEVO |
| `.planning/DSS7-SUMMARY.md` | NUEVO |

## Verificado

- `pnpm typecheck` ✅
- `pnpm exec eslint` archivos tocados ✅
- `pnpm kiosk:dev` arranca limpio
- Editor:
  - Export JSON → descarga `lobby-tv.json` válido.
  - Import file → crea snapshot pre-import + reload con state importado.
  - Publish → 503 si no hay GitHub config (esperado en dev local) o PR URL si configurado.
  - KV advisor refresca tras cada save con bar verde (<60%).
- Sin regression del runtime ni del kiosk.

## Decisiones

- **Reuso de `github-publisher.ts` del kiosk**: cero deps nuevas. Misma
  semántica autoMerge.
- **Solo `display.json` en DSS7**: simplifica. Theme publish (branding +
  tokens + i18n) requiere construir más archivos y se difiere.
- **Import siempre crea snapshot pre-import**: protección anti-mistake
  (idempotente con el patrón PUT de DSS6).
- **Cap 950KB hardcoded**: límite Upstash. Si cambia, ajustar
  `kv-size.ts`. Bar coloreado da señal temprana antes del cap.
- **Reload tras import**: simpler que mergear el state importado en el
  draft local. SSR fetch el current y todo queda sincronizado.

## Pendiente / siguiente sub-fase

**DSS8** — Diagnostics + onboarding tour signage + i18n editor extension.
