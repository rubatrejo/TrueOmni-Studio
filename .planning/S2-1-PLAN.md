# S2-1 — Modules tab (Studio)

> Sub-fase **S2 completa**: toggle on/off + reorder drag&drop + inline label edit
> de los 16 tiles del Home (15 módulos + wayfinding) con live-preview <200 ms
> y persistencia en KV.

## Contexto

- S0/S1 ya cerradas (cloud + branding). Sidebar tiene tab "02 · Modules" pero
  cae en `<ComingSoon />`.
- Fuente de verdad runtime del kiosk: `config.features.home.tiles[]` y
  `config.features.home.wayfinding`. El Studio NO los toca directo en KV;
  almacena un objeto `modules.tiles[]` plano (16 entries con `wayfinding`
  como uno más) y la pasarela de publish (Fase S7) lo splittea al filesystem.

## Tasks

<task type="auto">
  <name>Schema + defaults de modules</name>
  <files>src/lib/studio/schema.ts</files>
  <action>
    Añadir `ModuleEntrySchema` `{ key, label, enabled }`, `ModulesSchema`
    `{ tiles: ModuleEntry[] }` (todas required en zod). Constante
    `KIOSK_MODULES` con los 16 entries default + helper `defaultModules()`.
    `KioskConfigSchema` ahora incluye `modules: ModulesSchema` (optional con
    default = defaultModules()). `makeBlankConfig` retorna también `modules`.
  </action>
  <verify>
    `pnpm typecheck` limpio.
  </verify>
  <done>
    Schema importa sin errores. `defaultModules()` devuelve 16 entries con
    los keys del kiosk en orden actual.
  </done>
</task>

<task type="auto">
  <name>API PATCH acepta modules</name>
  <files>
    src/app/api/studio/configs/[slug]/route.ts,
    src/app/api/studio/configs/route.ts,
    src/app/api/studio/seed/route.ts
  </files>
  <action>
    PATCH `[slug]` acepta `body.modules` con `ModulesSchema.safeParse`.
    POST `configs` (create) y POST `seed` (auto-default) llenan `modules`
    con `defaultModules()` si vienen vacíos.
  </action>
  <verify>
    Manual: `curl PATCH /api/studio/configs/default -d '{"modules":...}'`
    persiste y devuelve 200. Reload del editor mantiene el cambio.
  </verify>
  <done>
    Existing clients sin modules en KV reciben defaults al primer GET.
    Modules malformados → 400 con issues.
  </done>
</task>

<task type="auto">
  <name>API client: patchModules</name>
  <files>src/app/studio/_lib/api-client.ts</files>
  <action>
    `patchModules(slug, modules) → KioskConfig` análogo a `patchBranding`.
  </action>
  <verify>
    Tipos cuadran.
  </verify>
  <done>
    Llamable desde Shell.
  </done>
</task>

<task type="auto">
  <name>Bridge: pushModules</name>
  <files>src/app/studio/_lib/use-preview-bridge.ts</files>
  <action>
    Añadir `pushModules(modules)` debounced 80 ms con postMessage
    `studio:modules-update`. Mismo patrón que `pushBranding`. Re-emit en
    handshake `studio:ready`.
  </action>
  <verify>
    pnpm typecheck.
  </verify>
  <done>
    Mensaje llega al iframe en cada cambio (verificable con console.log
    temporal en StudioBridge).
  </done>
</task>

<task type="auto">
  <name>StudioBridge (kiosk side) escucha modules</name>
  <files>src/components/studio-bridge.tsx</files>
  <action>
    Añadir case `'studio:modules-update'` que `window.dispatchEvent(new
    CustomEvent('kiosk:modules-override', { detail: modules.tiles }))`.
  </action>
  <verify>
    Sin errores de runtime al recibir mensaje.
  </verify>
  <done>
    Otro componente puede subscribirse al evento `kiosk:modules-override`.
  </done>
</task>

<task type="auto">
  <name>HomeShell aplica override</name>
  <files>
    src/components/home/home-shell.tsx,
    src/app/(kiosk)/home/page.tsx
  </files>
  <action>
    `home/page.tsx` ahora pasa **todos** los tiles + wayfinding ya merged
    como `allTiles` a `HomeShell` (sin filtrar `enabled`). HomeShell guarda
    `tiles` en state, suscribe `kiosk:modules-override`: aplica el orden y
    `enabled` del payload, conservando `image` del original via map por key.
    Para entries del payload sin imagen conocida (improbable pero defensive)
    cae al placeholder.
  </action>
  <verify>
    Sin override → mismo render que ahora. Con override → grid se
    reordena/oculta sin recargar.
  </verify>
  <done>
    Cambiar order/enabled en Studio se refleja en el iframe en <200 ms.
  </done>
</task>

<task type="auto">
  <name>ModulesEditor (UI)</name>
  <files>
    src/app/studio/_components/ModulesEditor.tsx,
    src/app/studio/_components/EditorPanel.tsx
  </files>
  <action>
    Nuevo componente `ModulesEditor({ modules, onChange })`:
      - `Reorder.Group` de framer-motion con axis="y".
      - Cada `Reorder.Item`: drag handle (GripVertical), thumbnail con
        emoji/icono por key, label editable inline (click → input), toggle
        switch on/off al final.
      - Botón "Reset to defaults" arriba a la derecha del Group.
      - Counter "X of Y enabled" en el header del Group.
    `EditorPanel` renderiza `ModulesEditor` cuando `sectionKey === 'modules'`.
    Sin hardcoded fuera de utilidades del Studio (que vive fuera del
    white-label kiosk).
  </action>
  <verify>
    Drag reordena visualmente. Toggle dispara onChange. Inline edit guarda
    al blur o Enter, escape cancela.
  </verify>
  <done>
    UX fluida, dark mode soportado, foco accesible.
  </done>
</task>

<task type="auto">
  <name>Shell: estado modules + dirty + save</name>
  <files>src/app/studio/_components/Shell.tsx</files>
  <action>
    Añadir `savedModules`/`modules` state análogo a branding.
    `isDirty` ahora es OR de branding-dirty y modules-dirty.
    `handleSave` sólo manda al API la(s) sección(es) realmente sucias.
    `pushModules` se llama en effect cuando `modules` cambia.
    `EditorPanel` recibe `modules` + `onModulesChange`.
  </action>
  <verify>
    Editar branding → solo PATCH branding. Editar modules → solo PATCH
    modules. Editar ambos → un solo PATCH con ambos campos.
  </verify>
  <done>
    Cmd+S guarda. Discard revierte modules + branding. Save state correcto.
  </done>
</task>

## Verificación E2E

1. `pnpm dev` (kiosk:dev) → abrir `localhost:3000/studio/default` → tab Modules.
2. Toggle "Survey" off → tile desaparece del iframe en <200 ms.
3. Drag "Itinerary Builder" al primer puesto → reordena en iframe.
4. Click label "Restaurants" → cambiar a "Eat & Drink" → Enter → reflejo
   inmediato en el tile del Home.
5. Cmd+S → spinner → "Saved". Reload del editor → cambios persisten.
6. Discard sobre dirty → revierte.
7. `pnpm typecheck && pnpm lint` limpios (sin nuevos warnings).
