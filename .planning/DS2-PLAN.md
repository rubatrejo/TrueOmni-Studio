# DS2-PLAN.md — `<SignagePlayer>` rotación básica + 2 placeholder slides

Reemplaza el body vacío de DS1 por un player que rota slides según el playlist
del display. Sin dayparting (DS13), sin transitions reales (DS12) — solo `cut`
y duración por slide.

```xml
<task type="auto">
  <name>DS2 — SignagePlayer (rotación básica + registry de templates + 2 placeholder slides)</name>
  <files>
    src/components/signage/templates/types.ts                           (NEW: TemplateSlot, SignageTemplate, RenderProps)
    src/components/signage/templates/registry.ts                        (NEW: registerTemplate + lookup)
    src/components/signage/templates/PlaceholderA.tsx                   (NEW: slide A)
    src/components/signage/templates/PlaceholderB.tsx                   (NEW: slide B)
    src/components/signage/player/SignagePlayer.tsx                     (NEW: rotación client component)
    src/components/signage/runtime/SignageRuntime.tsx                   (NEW: rename de SignagePlaceholder, compone header + player)
    src/components/signage/runtime/SignagePlaceholder.tsx               (DELETE)
    src/app/(signage)/signage/[client]/[display]/page.tsx               (MODIFY: import SignageRuntime)
    clients-signage/default/displays/lobby-tv/display.json              (MODIFY: 2 slides placeholder, defaultDurationMs 5000)
    .planning/DS2-SUMMARY.md                                            (al final)
  </files>
  <action>
    1. **types.ts** — declaraciones públicas de templates:
       - `SlotKind = 'fullscreen' | 'hero' | 'sidebar' | 'strip' | 'tile'`
       - `TemplateSlot { key, kind, rect: {x,y,w,h}, acceptedModules: ModuleKind[] }`
       - `SignageTemplateRenderProps { slots: SignageSlotConfig[], client, display }`
       - `SignageTemplate { id, label, category 'fullscreen'|'composed', slots: TemplateSlot[], Render: React.FC<SignageTemplateRenderProps> }`

    2. **registry.ts** — singleton registry:
       - `registerTemplate(template)` añade al map.
       - `getTemplate(id) → SignageTemplate | undefined`
       - `getAllTemplates() → SignageTemplate[]`
       - Auto-registra los placeholders en import-time importando `./PlaceholderA` y `./PlaceholderB`.
       - Cuando arranque DS3, también auto-registra `01-full-events`.

    3. **PlaceholderA.tsx** + **PlaceholderB.tsx**:
       - Cada uno exporta un `SignageTemplate` con id "placeholder-a"/"placeholder-b", category 'fullscreen', slots vacíos, Render simple (gradient bg + label "Slide A"/"Slide B" centrado, font Open Sans Semibold gigante con paleta del cliente).
       - Llaman `registerTemplate(...)` al final del módulo.
       - Cero touch handlers, cero hex hardcoded (paleta vía tokens).

    4. **SignagePlayer.tsx**:
       - 'use client'.
       - Props: `playlist: SignageSlide[]`, `settings: SignageDisplaySettings`, `client: SignageClientResolved`, `display: SignageDisplayConfig`.
       - State: `currentIndex: number` (default 0).
       - useEffect: setInterval con duration = `playlist[currentIndex].durationMs ?? settings.defaultDurationMs`. Cuando expira, avanza al siguiente índice (wrap a 0). Cleanup en unmount + recompute si playlist cambia o currentIndex.
       - Si playlist está vacío: render mensaje "No slides configured. Add slides via the editor (DSS4+)".
       - Para el slide actual, busca template via `getTemplate(slide.templateId)`. Si no existe → render error visible "Unknown template: <id>".
       - Renderea `<template.Render slots={slide.slots} client={client} display={display} />`.
       - Sin transition real en DS2 — el cambio es instantáneo (cut). DS12 añade fade/slide.

    5. **SignageRuntime.tsx** — reemplaza SignagePlaceholder:
       - Server component que compone `<SignageHeader>` + `<SignagePlayer>`.
       - El area del player ocupa `1080 - header.height` cuando header.position === 'top'. Cuando 'bottom', el orden visual cambia (DS11 lo cablea; DS2 asume top).

    6. **Eliminar SignagePlaceholder.tsx** (rename efectivo).

    7. **Modificar page.tsx**: importar SignageRuntime en lugar de SignagePlaceholder.

    8. **Modificar `clients-signage/default/displays/lobby-tv/display.json`**:
       ```json
       {
         "slug": "lobby-tv",
         "name": "Lobby TV",
         "settings": { "targetResolution": "1080p", "audio": false, "defaultDurationMs": 5000, "defaultTransition": "cut" },
         "playlist": [
           { "id": "slide-a", "templateId": "placeholder-a", "slots": [], "durationMs": 5000, "schedule": { "kind": "always", "hideOutsideSchedule": true } },
           { "id": "slide-b", "templateId": "placeholder-b", "slots": [], "durationMs": 5000, "schedule": { "kind": "always", "hideOutsideSchedule": true } }
         ]
       }
       ```
  </action>
  <verify>
    - `pnpm typecheck && pnpm lint` limpios.
    - `pnpm kiosk:dev` arranca limpio.
    - GET `/signage/default/lobby-tv` → HTTP 200, render del header arriba + body con un slide visible (A o B según index 0).
    - Tras 5s aprox, el body cambia al otro slide (refresh manual o esperar — visible en navegador).
    - Cero touch handlers en signage/templates y signage/player.
    - Auditor no flagea nada nuevo.
    - Aprobación visual del usuario (player rota correctamente entre A↔B).
  </verify>
  <done>
    - SignagePlayer rota slides según durationMs.
    - 2 templates placeholder registrados en el registry.
    - SignageRuntime reemplaza SignagePlaceholder.
    - display.json default tiene 2 slides.
    - DS2-SUMMARY.md escrito.
    - Roadmap [x] DS2.
    - Commit propuesto.
  </done>
</task>
```

## Decisiones

- **Registry singleton import-time**: cada template `.tsx` se auto-registra al ser importado. El `registry.ts` re-exporta los placeholders para forzar import + registration. Cuando DS3 añada `01-full-events`, el registry crece sin tocar el player.
- **Sin transitions reales en DS2**: el cambio es instantáneo. Si los placeholders tienen colores distintos, el cambio será visible. DS12 introduce fade/slide.
- **Sin dayparting**: el player rota linealmente todo el playlist. DS13 cablea el filtro `effectivePlaylist`.
- **Slide vacío de slots OK**: los placeholders no consumen ningún módulo. La validación de templates contra módulos es responsabilidad del editor (DSS4); el runtime solo renderea.
