# S3-1 — Survey editor (Studio)

> Editor visual del módulo Survey con CRUD de preguntas (5 tipos), intro,
> contact capture, thank-you. Live preview en el iframe del kiosk.

## Tasks

<task type="auto">
  <name>Schema zod del Survey + types</name>
  <files>src/lib/studio/schema.ts</files>
  <action>
    Replicar `SurveyConfig` del kiosk como `SurveySchema` zod (discriminated
    union por `type`: nps/rating/single-choice/multi-choice/text). Añadir
    `KioskConfigSchema.survey?: SurveySchema`.
    `DEFAULT_SURVEY` con preguntas mínimas tipo placeholder.
  </action>
</task>

<task type="auto">
  <name>API PATCH acepta survey</name>
  <files>
    src/app/api/studio/configs/[slug]/route.ts,
    src/app/studio/[slug]/page.tsx
  </files>
  <action>
    PATCH valida `body.survey` con SurveySchema. Backfill defensivo en GET +
    page server-side: si `cfg.survey` undefined → DEFAULT_SURVEY.
  </action>
</task>

<task type="auto">
  <name>Bridge: pushSurvey + studio:survey-update</name>
  <files>
    src/app/studio/_lib/use-preview-bridge.ts,
    src/components/studio-bridge.tsx
  </files>
  <action>
    `pushSurvey(survey)` debounced 120ms. StudioBridge kiosk dispatcha
    `kiosk:survey-override`. SurveyHost escucha y reemplaza config en vivo.
  </action>
</task>

<task type="auto">
  <name>SurveyEditor UI</name>
  <files>
    src/app/studio/_components/SurveyEditor.tsx,
    src/app/studio/_components/EditorPanel.tsx
  </files>
  <action>
    Componente con secciones: Intro, Questions (drag&drop reorder + add
    button con menú de tipo), Contact Capture, Thank You. Cada question
    expandible con campos específicos del type.
    Botón flotante "Preview survey" que dispatcha `kiosk:survey-open` al
    iframe para abrir el overlay y verlo en el preview.
  </action>
</task>

<task type="auto">
  <name>Shell: estado survey + dirty + save</name>
  <files>src/app/studio/_components/Shell.tsx</files>
  <action>
    `savedSurvey`/`survey` state, `surveyDirty`, push, dirty include en
    `isDirty`, save y discard.
  </action>
</task>

<task type="auto">
  <name>SurveyHost escucha override</name>
  <files>
    src/components/home/survey-host.tsx,
    src/app/(kiosk)/home/page.tsx
  </files>
  <action>
    SurveyHost mantiene state de `effectiveConfig` que arranca con la prop
    y se reemplaza al recibir `kiosk:survey-override`. Si `enabled=false`
    desde el override, no renderiza.
    home/page.tsx pasa survey config como antes.
  </action>
</task>

## Verificación

- `pnpm typecheck` limpio.
- En el iframe, ir a /home, click tile Survey → modal aparece.
- Cambiar prompt de "How likely…" en el editor → reflejo en <300ms.
- Add nueva pregunta single-choice → aparece en el flow.
- Reorder preguntas → orden refleja.
- Toggle contactCapture → step extra aparece/desaparece.
- Cmd+S → reload → cambios persisten.
