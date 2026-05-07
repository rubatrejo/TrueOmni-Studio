# DSS7-PLAN.md — Publish + JSON export/import + KV size advisor

Atomic plan ejecutable en sesión fresca. Cierra el flow de exportar el
working copy del KV a `clients-signage/<slug>/...` via GitHub PR
auto-merge (mismo patrón que el kiosk publish), más export/import JSON
local y un advisor del tamaño KV.

```xml
<task type="auto">
  <name>DSS7 — Publish via GitHub PR auto-merge + JSON export/import + KV size advisor</name>
  <files>
    src/lib/signage/publish-files.ts                                                 (NUEVO — construye PublishFile[] del display)
    src/app/api/studio/signage/displays/[client]/[displaySlug]/publish/route.ts       (NUEVO — POST publish via github-publisher)
    src/app/api/studio/signage/displays/[client]/[displaySlug]/export/route.ts        (NUEVO — GET descarga JSON)
    src/app/api/studio/signage/displays/[client]/[displaySlug]/import/route.ts        (NUEVO — POST recibe JSON y guarda al KV)
    src/lib/signage/kv-size.ts                                                        (NUEVO — calcula bytes del display + snapshots)
    src/app/studio/digital-displays/_components/display/PublishToolbar.tsx            (NUEVO — Export/Import/Publish buttons)
    src/app/studio/digital-displays/_components/display/KvSizeAdvisor.tsx             (NUEVO — bar de bytes/950KB)
    src/app/studio/digital-displays/_components/DisplayEditor.tsx                     (montar PublishToolbar + KvSizeAdvisor)
    .planning/DSS7-SUMMARY.md
    .planning/SIGNAGE-ROADMAP.md
  </files>
  <action>
    ## 1. Publish-files builder
    1.1. `publish-files.ts` exporta `buildSignageDisplayPublishFiles(client,
         displaySlug, displayData): PublishFile[]`:
         - Path: `clients-signage/<client>/displays/<displaySlug>/display.json`.
         - Content: `JSON.stringify(displayData, null, 2)` con schema válido.
    1.2. **Out of scope DSS7**: publicar también client.json, events/social/news,
         tokens.css. Solo display.json en DSS7. DSS7.5 puede extender.

    ## 2. API Publish endpoint
    2.1. `POST .../publish` valida que existe `getGitHubPublishConfig()`. Si
         no → 503 con mensaje claro.
    2.2. Lee el display del KV (current). Si null → 404 (no hay nada que publicar).
    2.3. Construye `PublishFile[]` y llama a `publishToGitHub(...)` con:
         - Branch: `signage/<client>/<display>/<timestamp>`.
         - Commit message: `feat(signage): publish ${client}/${display}`.
         - Title PR: `Signage: ${client} / ${display}`.
         - autoMerge: true por default.
    2.4. Retorna `{ prUrl, prNumber, branch }`.

    ## 3. API Export endpoint
    3.1. `GET .../export` lee KV (con fallback fs si no hay KV). Retorna
         JSON con `Content-Disposition: attachment; filename="<display>.json"`.

    ## 4. API Import endpoint
    4.1. `POST .../import` body `{ display: SignageDisplayConfig }`.
    4.2. Valida con SignageDisplayConfigSchema.
    4.3. **Defensa de slug**: el body.display.slug debe coincidir con path.
    4.4. Crea snapshot del current si existe (mismo flow que PUT).
    4.5. Set al KV.
    4.6. Retorna `{ ok }`.

    ## 5. KV size advisor
    5.1. `kv-size.ts`: `computeSignageKvSize(client, display)`:
         - Lee display KV → calcula bytes via `JSON.stringify(...).length`.
         - Lee snapshots → suma bytes de cada uno.
         - Retorna `{ display: bytes, snapshots: bytes, total: bytes, cap: 950000 }`.
    5.2. API `GET .../size` retorna ese summary.
    5.3. Cliente fetch helper en `kv-size-api.ts`.

    ## 6. UI PublishToolbar
    6.1. Card en sidebar (entre Settings y Playlist) con 3 botones:
         - "Export JSON" — `<a download>` apuntando a /export endpoint.
         - "Import JSON" — file input que parsea + POST a /import.
         - "Publish to repo" — POST a /publish + modal con result (PR URL).
    6.2. Estados: loading, success (PR URL clickable), error (mensaje claro).

    ## 7. UI KvSizeAdvisor
    7.1. Card pequeña debajo de VersionsPanel:
         - Header: "KV usage" + total/cap.
         - Bar progress (verde <60%, amber 60-85%, red >85%).
         - Breakdown: "display: 4.2KB / snapshots: 38.1KB" (compact).
    7.2. Refresh con `refreshTrigger=lastSavedAt`.

    ## 8. Touch theme editor PublishTab
    8.1. PublishTab del theme editor: actualizar copy mencionando que el
         publish es per-display (DSS7 no publica el client completo).
    8.2. Mantener placeholder: "Per-display publish lives inside each display
         editor. Theme-level publish (branding/header) lands in DSS7.5."
  </action>
  <verify>
    - `pnpm typecheck` ✅
    - `pnpm exec eslint` ✅
    - `pnpm kiosk:dev` arranca limpio
    - Editor:
      - Export JSON → descarga lobby-tv.json válido.
      - Import el mismo JSON → "imported" toast → editor recarga.
      - Publish → si STUDIO_GITHUB_TOKEN no está → modal explica config
        necesaria. Si está → PR URL clickable.
      - KV usage bar refresca tras cada save.
    - PublishTab del theme editor muestra el copy nuevo.
  </verify>
  <done>
    - 4 endpoints API (publish, export, import, size).
    - PublishToolbar UI funcional con 3 actions.
    - KvSizeAdvisor con bar de uso.
    - Out-of-scope claro (client.json publish va a DSS7.5).
    - DSS7 ✅ en roadmap.
  </done>
</task>
```

## Notas de diseño

- **Reuso de `github-publisher.ts`** del kiosk: cero deps nuevas. Mismo
  approval gate.
- **Solo display.json en DSS7**: simplifica. Client publish (branding +
  tokens.css + i18n) lo cubre DSS7.5 si surge necesidad.
- **Import requiere mismo slug**: previene confusión.

## Out of scope explícito

- Client (theme) publish (branding + tokens.css + i18n) — DSS7.5.
- Bulk import (múltiples displays a la vez) — DSS7.5.
- Diff visual antes de publish — DSS7.5.
