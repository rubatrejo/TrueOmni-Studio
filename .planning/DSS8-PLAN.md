# DSS8-PLAN.md — Diagnostics + i18n editor extension

Atomic plan ejecutable en sesión fresca. Entrega:
1. Página `/studio/digital-displays/diagnostics` con info de sistema (KV
   size global, count clients/displays, GitHub config, bridge runtime).
2. i18n editor en el theme editor: tab que ya existe (5to tab) refactorizado
   a editor real con bag editable por locale (read-only en DSS1; ahora
   editable).
3. **Onboarding tour signage deferido a DSS8.5** — el patrón del kiosk
   onboarding tiene fricción alta y bajo retorno para signage en v1.

```xml
<task type="auto">
  <name>DSS8 — Diagnostics page + i18n editor tab editable (onboarding tour deferido)</name>
  <files>
    src/app/studio/digital-displays/diagnostics/page.tsx                          (NUEVO)
    src/app/studio/digital-displays/diagnostics/_components/DiagnosticsView.tsx   (NUEVO)
    src/lib/signage/diagnostics.ts                                                (NUEVO — server-side info collector)
    src/app/studio/digital-displays/_components/tabs/I18nTab.tsx                  (NUEVO — reemplaza placeholder + UI editable)
    src/app/studio/digital-displays/_components/ThemeEditor.tsx                   (registrar tab i18n + reordenar tabs)
    src/app/api/studio/signage/clients/[client]/i18n/route.ts                     (NUEVO — GET/PUT bag por locale)
    .planning/DSS8-SUMMARY.md
    .planning/SIGNAGE-ROADMAP.md
  </files>
  <action>
    ## 1. Diagnostics
    1.1. `diagnostics.ts` (server-only) `collectSignageDiagnostics()`:
         - clients count, list of slugs.
         - displays count global.
         - KV size aggregate (loop sobre todos los displays).
         - GitHub publish config presence (boolean).
         - KV cloud vs in-memory.
    1.2. Page server component `/studio/digital-displays/diagnostics`:
         - Llama `collectSignageDiagnostics()`.
         - Pasa al `<DiagnosticsView>` client.
    1.3. `<DiagnosticsView>`:
         - StudioPageHeader + breadcrumb.
         - Cards: "System status", "Storage", "Clients", "Publish".
         - Cada card con rows label/value + chip para booleans
           (configured/not configured).

    ## 2. i18n editor
    2.1. **Insertar tab i18n** entre Displays y Versions del ThemeEditor.
         (Reordenar TABS array: Branding · Header · Displays · i18n ·
         Versions · Publish.)
    2.2. `<I18nTab>`:
         - Props: `client.slug`, `client.locale`.
         - Locale selector (en | es | fr | de | pt | ja).
         - Lista de keys del bag con input editable por value.
         - Save button → PUT al endpoint nuevo.
         - Indicador "saved" tras éxito.
    2.3. API endpoint `/api/studio/signage/clients/[client]/i18n`:
         - GET ?locale=en → retorna bag actual.
         - PUT body `{ locale, bag }` → guarda al KV en
           `signage:i18n:<client>:<locale>`. (Nueva clave; añadir al
           `kv-keys.ts` y `kv-store.ts`.)
         - **Loader hibrido**: `loadSignageI18n` ahora consulta KV antes
           del fs (similar a otros loaders).

    ## 3. Onboarding tour
    3.1. **Deferido a DSS8.5**. Justificación: el kiosk tour tiene 5 pasos
         con copy detallado, instrumentado en flow real con usuarios. Para
         signage v1 no tenemos validación de UX y onboarding genérico
         tiene poco valor. Cuando llegue feedback de usuario real
         (post-Fase 4-equivalente del signage), retomar.

    ## 4. Out of scope
    - DeepL/Anthropic AI translate (DSS8.5+).
    - i18n bulk import/export — DSS7.5 si surge.
    - Onboarding tour signage.
  </action>
  <verify>
    - `pnpm typecheck` ✅
    - `pnpm exec eslint` ✅
    - `pnpm kiosk:dev` arranca limpio
    - `/studio/digital-displays/diagnostics` carga con info correcta.
    - Theme editor: tab i18n aparece entre Displays y Versions.
    - Cambiar key value en i18n tab → save → reload → persiste.
    - Locale switcher cambia el bag visible.
  </verify>
  <done>
    - Diagnostics page funcional.
    - i18n tab editable con KV persistence.
    - DSS8 marcado ✅ (onboarding tour deferido como DSS8.5 explícito).
  </done>
</task>
```

## Notas de diseño

- **Diagnostics es solo lectura (server-side)**: no modifica nada. Útil
  para QA y troubleshooting.
- **i18n KV-first**: alineado con el patrón del display (KV→fs fallback).
- **Onboarding diferido**: pragmatismo > completitud. La sesión ya
  acumulado mucho.

## Out of scope explícito

- AI translate (DeepL primario + Anthropic fallback) — DSS8.5+.
- Import/export del bag entero — DSS8.5.
- Bulk edit (cambiar todas las locales a la vez) — DSS8.5.
- Onboarding tour signage — DSS8.5.
