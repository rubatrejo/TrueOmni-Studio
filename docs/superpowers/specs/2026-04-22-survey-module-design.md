# Spec — Módulo Survey (Fase 3.9)

**Fecha:** 2026-04-22
**Estado:** Draft para revisión
**Autor:** Claude + Rubén (brainstorming session)

---

## 1. Contexto y motivación

El kiosk Portrait tiene hoy 5 módulos funcionales en el Home Dashboard (listings · events · social-wall · digital-brochure · map) y un banner Wayfinding. El tile **Survey** del grid existe y se renderiza, pero al pulsarlo cae al stub "Coming soon" porque no hay implementación.

Este spec describe el módulo Survey v1: una encuesta breve de **satisfacción del visitante** que se abre como **overlay modal** sobre el Home Dashboard (no como ruta), con **N preguntas configurables** por cliente, **5 tipos de pregunta** soportados, un paso opcional de **contact capture**, y una pantalla de **thank-you** con auto-close.

El objetivo de v1 es cerrar una de las 10 deudas funcionales pendientes del Home, con una arquitectura que permita a cada cliente montar su propia encuesta solo editando `config.json` (regla cero-hardcoded) y que deje preparado el hook para conectar un backend real en v2.

## 2. Decisiones de diseño (cerradas en brainstorming)

| Decisión | Valor |
|---|---|
| Tipo de survey | Satisfacción del visitante |
| Longitud | N preguntas configurables en JSON |
| Tipos de pregunta | NPS 0-10 · Rating 1-5 estrellas · Single choice · Multi choice · Text libre |
| Layout global | Popup overlay con backdrop oscuro sobre el Home Dashboard |
| Navegación | Una pregunta por pantalla (step-by-step) con progress dots arriba |
| Progress dots | Sólo visibles si N≥2 |
| Backdrop tap | Dispara confirm-exit si hay respuestas |
| Contact capture | Configurable por cliente (paso extra después de la última pregunta, con su propio progress dot) |
| Salir a la mitad | Close X / Escape / backdrop con respuestas → confirm exit + descartar; sin respuestas → cierra directo |
| Trigger | Sólo desde el tile "Survey" del Home grid |
| Dispatch v1 | `console.log('[kiosk:survey]', result)` + `window.dispatchEvent(new CustomEvent('kiosk:survey-submitted', { detail }))`. Sin backend. |
| Thank-you | Pantalla dedicada con check animado + countdown (default 5s) → overlay cierra → home |
| Referencia visual | `~/Desktop/Survey Question.svg/.png` (NPS sobre card azul). Es referencia de patrón — hay que **diseñar mejor**, no clonar pixel-perfect. |
| Skills obligatorios | Tier 1 del proyecto: `frontend-design` · `ui-ux-pro-max` · `theme-factory` |

## 3. Arquitectura

### 3.1 El Survey NO es una ruta

No se añade rama en `src/app/(kiosk)/home/[module]/page.tsx`. El tile Survey **no navega**. Se intercepta en el Home y se monta un overlay modal encima del propio dashboard.

Patrón consistente con los overlays existentes validados en el kiosk: `WeatherPopup`, `SearchOverlay`, `LanguageDropdown`, `FilterOverlay`, `SortOverlay`. Todos son client components montados dentro del `KioskCanvas` con `absolute inset-0`, de forma que el `transform:scale` del canvas contiene el overlay al frame de 1080×1920.

### 3.2 Orquestación

- `HomeShell` (`src/components/home/home-shell.tsx`) añade state local `surveyOpen` + callbacks `openSurvey()` / `closeSurvey()`.
- El callback `openSurvey` se inyecta vía prop a `CategoryGrid` y de ahí a `CategoryTile`. Cuando `tile.key === 'survey'` y el config tiene `features.home.survey.enabled === true`, `CategoryTile` pasa de `<Link>` a `<button>` con `onClick={onSurveyOpen}`.
- Si el survey no está habilitado, `CategoryTile` mantiene el comportamiento default (link a `/home/survey` → stub "Coming soon").
- `<SurveyOverlay>` se monta condicionalmente dentro de `HomeShell` cuando `surveyOpen === true`, z-50, con backdrop `rgba(0,0,0,0.72)` `absolute inset-0`.
- El home dashboard queda visible detrás, estático.

### 3.3 Config schema

Añadido a `src/lib/config.ts`:

```ts
interface SurveyIntro {
  title: string
  subtitle?: string
}

interface SurveyThankYou {
  title: string
  message: string
  autoCloseMs?: number // default 5000
}

interface SurveyContactCapture {
  enabled: boolean
  email?: boolean
  phone?: boolean
  disclaimer: string
}

type SurveyQuestion =
  | {
      id: string
      type: 'nps'
      prompt: string
      optional?: boolean
      labels?: { low: string; high: string }
    }
  | {
      id: string
      type: 'rating'
      prompt: string
      optional?: boolean
      max?: 5 // default 5
    }
  | {
      id: string
      type: 'single-choice'
      prompt: string
      optional?: boolean
      options: string[]
    }
  | {
      id: string
      type: 'multi-choice'
      prompt: string
      optional?: boolean
      options: string[]
    }
  | {
      id: string
      type: 'text'
      prompt: string
      optional?: boolean
      maxLength?: number // default 500
    }

interface SurveyConfig {
  enabled: boolean
  logo?: string // fallback al brand logo del cliente
  intro: SurveyIntro
  questions: SurveyQuestion[]
  contactCapture?: SurveyContactCapture
  thankYou: SurveyThankYou
}
```

El campo `survey` se añade dentro de `features.home` como sibling de `wayfinding`:

```ts
home: {
  tiles: HomeTile[]
  wayfinding?: { enabled; label; image }
  survey?: SurveyConfig   // ← nuevo
  listings: HomeListing[]
  modules?: Record<string, HomeModuleVariant>
}
```

### 3.4 Seed en `clients/default/config.json`

5 preguntas de ejemplo (una de cada tipo) + thank-you + `contactCapture` desactivado por default:

```jsonc
"survey": {
  "enabled": true,
  "intro": {
    "title": "We value your feedback",
    "subtitle": "Your answers help us improve this kiosk."
  },
  "questions": [
    {
      "id": "nps",
      "type": "nps",
      "prompt": "How likely are you to recommend this kiosk?",
      "labels": { "low": "Not at all likely", "high": "Extremely likely" }
    },
    {
      "id": "overall",
      "type": "rating",
      "prompt": "Overall, how would you rate your experience?"
    },
    {
      "id": "purpose",
      "type": "single-choice",
      "prompt": "What brought you here today?",
      "options": ["Tourism", "Business", "Local visit", "Other"]
    },
    {
      "id": "interests",
      "type": "multi-choice",
      "prompt": "What interests you most?",
      "options": ["Food & Drink", "Events", "History", "Nature", "Shopping"]
    },
    {
      "id": "comment",
      "type": "text",
      "prompt": "Any other feedback?",
      "optional": true,
      "maxLength": 500
    }
  ],
  "contactCapture": {
    "enabled": false,
    "email": true,
    "phone": false,
    "disclaimer": "We only use this to follow up if you asked for it."
  },
  "thankYou": {
    "title": "Thanks for your feedback",
    "message": "We read every response. Enjoy your visit!",
    "autoCloseMs": 5000
  }
}
```

Strings de UI (BACK, NEXT, SEND FEEDBACK, disclaimers, confirm-exit copy) van en `config.textos` con prefijo `survey_*`.

## 4. Componentes

### 4.1 Nuevos (`src/components/survey/`)

| Archivo | Rol |
|---|---|
| `survey-overlay.tsx` (client) | Root. Maneja step index, answers, loading / thank-you, confirm-exit. State local con `useState`. |
| `survey-backdrop.tsx` | Capa oscura `absolute inset-0` dentro del canvas. Tap dispara confirm-exit / close según haya respuestas. |
| `survey-card.tsx` | Contenedor azul (`hsl(var(--primary))`), rounded-2xl, ~880px ancho, padding 64px, shadow-xl. |
| `survey-header.tsx` | Logo (`client.logo` o `config.survey.logo`) + Close X top-right 56×56. |
| `survey-progress.tsx` | Dots top. Oculto si N<2. Activo = filled-white + ring olive. Pasados = filled-white. Futuros = hollow 40% opacity. |
| `survey-question.tsx` | Switch por `type`. Dispatcha a las 5 variantes. |
| `question-nps.tsx` | 11 círculos 56×56 con número dentro. Seleccionado = olive + scale-105. Labels extremos debajo. |
| `question-rating.tsx` | 5 estrellas 80×80 outline → filled. Tap fill 1..N. Animación en cada cambio. |
| `question-single-choice.tsx` | Pills columna 560×72. Radio dot + label. Seleccionada = filled olive. |
| `question-multi-choice.tsx` | Pills columna 560×72. Check icon + label. Seleccionadas = filled olive + check visible. |
| `question-text.tsx` | Textarea 680×220 con placeholder. Foco monta `OnScreenKeyboard` reusado. Counter `N/maxLength`. |
| `question-contact.tsx` | Paso extra. Email (OnScreenKeyboard) y/o phone (NumericKeypad). Disclaimer abajo. |
| `survey-navigation.tsx` | Footer `[← BACK]` (outline white) + `[NEXT →]` o `[SEND FEEDBACK]` (fill white text-primary). Disabled state = opacity 40%. |
| `survey-thank-you.tsx` | Check animado + countdown visible + auto-close. Clona patrón de `SendConfirmationPopup`. |
| `survey-exit-confirm.tsx` | Modal secundario sobre el overlay. "You'll lose your answers. Continue?" con [CANCEL] [EXIT]. |

### 4.2 Lib nueva

| Archivo | Rol |
|---|---|
| `src/lib/survey.ts` | Tipos internos (`SurveyAnswer`, `SurveyResult`). Helpers `isAnswered(q, a)`, `buildResult(client, answers, contact?)`, `dispatchResult(result)` (console + CustomEvent). Sin persistencia. |

### 4.3 Modificados

| Archivo | Cambio |
|---|---|
| `src/lib/config.ts` | Añadir tipos `SurveyConfig`, `SurveyQuestion` union, `SurveyContactCapture`, `SurveyIntro`, `SurveyThankYou`. Añadir `survey?: SurveyConfig` a `features.home`. |
| `src/components/home/home-shell.tsx` | State `surveyOpen`, callbacks, render condicional de `<SurveyOverlay>`. |
| `src/components/home/category-tile.tsx` | Render condicional: link default o button con `onClick` si `tile.key === 'survey'` y el parent pasa `onSurveyTap`. |
| `src/components/home/category-grid.tsx` | Recibe prop `onSurveyTap?: () => void` y la forwarda al tile correspondiente. |
| `src/app/(kiosk)/home/page.tsx` | Passthrough del survey config al HomeShell. |
| `clients/default/config.json` | Añadir bloque `features.home.survey` + strings `survey_*` en `textos`. |

### 4.4 Reuso

| Utility | Ruta | Uso |
|---|---|---|
| `OnScreenKeyboard` | `src/components/home/on-screen-keyboard.tsx` | `question-text` + `question-contact` (email) |
| `NumericKeypad` | `src/components/listings/numeric-keypad.tsx` | `question-contact` (phone) |
| `useEscapeToClose` | `src/components/listings/use-escape-to-close.ts` | Dispara confirm-exit o close en el overlay |
| Patrón `SendConfirmationPopup` | `src/components/listings/send-confirmation-popup.tsx` | Thank-you screen (clonar estilo, no importar) |
| `KioskCanvas` | `src/components/kiosk-canvas.tsx` | Frame ya existe; overlay es hijo del canvas |

## 5. Data flow

```
User → tap tile "Survey"
  → HomeShell.openSurvey()
    → SurveyOverlay monta
      → step 0 → SurveyQuestion → valor en answers[id]
        → [Next] → step++
      → step N-1 (última question) → [Send Feedback] o
        (si contactCapture.enabled) → step N (contact) → [Send Feedback]
      → buildResult() → dispatchResult()
        → console.log + CustomEvent
      → SurveyThankYou
        → countdown autoCloseMs
          → closeSurvey()
            → overlay unmount → home visible
```

Shape del result dispatched:

```ts
interface SurveyResult {
  timestamp: string // ISO
  client: string // slug del KIOSK_CLIENT
  answers: Record<string, string | number | string[]>
  contact?: {
    email?: string
    phone?: string
  }
}
```

## 6. Visual design (elevación sobre la referencia)

- **Progress**: dots top del card, centrados. N dots (o N+1 si contact step activo). Activo filled-white + ring olive. Pasados filled-white. Futuros hollow 40%. Transición suave de 150ms entre steps.
- **Jerarquía**: `intro.title` sólo visible en step 0, encima del logo. Cada paso muestra `question.prompt` como H2 bold 40px.
- **NPS**: 11 círculos 56×56 con número dentro. Seleccionado = fill olive + scale-105 + ring white 2px. Labels extremos debajo (left: `labels.low` · right: `labels.high`).
- **Rating**: 5 estrellas 80×80 outline → filled olive. Tap fill 1..N. Animación spring.
- **Single/Multi**: pills columna 560×72 centradas horizontalmente. Outline white → fill olive al seleccionar. Check icon (multi) o radio dot (single).
- **Text**: textarea 680×220 con placeholder. Foco dispara `OnScreenKeyboard`. Counter `N/maxLength` bottom-right.
- **Nav footer**: `[← BACK]` izquierda (outline white) + `[NEXT →]` o `[SEND FEEDBACK]` derecha (fill white text-primary). Disabled = opacity 40%.
- **Typography**: Montserrat Bold para títulos (50/40/32), Montserrat Medium para prompts y options (28/22).
- **Close X**: círculo outline blanco top-right 56×56.

## 7. Reglas white-label respetadas

- Todos los strings del survey (intro, prompts, options, thankYou, disclaimer) en `config.json`.
- Strings de UI (BACK, NEXT, SEND FEEDBACK, confirm-exit copy) en `config.textos.survey_*`.
- Cero hex en JSX. Colores sólo vía tokens:
  - `--primary` → card background (azul brand)
  - `--accent` → olive (seleccionado)
  - `--primary-foreground` → white sobre primary
- Logo vía `client.logo` o override `survey.logo`.
- Auditor `auditor-white-label` debe pasar antes del commit.

## 8. Edge cases

| Caso | Comportamiento |
|---|---|
| N=1 pregunta | Progress dots ocultos. Botón directo `[SEND FEEDBACK]`. |
| Pregunta opcional sin valor | Next habilitado. En dispatch, el valor es `undefined` o `null`. |
| `contactCapture.enabled=false` | No hay paso extra. Última pregunta → SEND FEEDBACK. |
| `contactCapture.enabled=true` con email+phone false | El paso contact se omite (config tolerado sin crash). |
| `contactCapture.enabled=true` con email+phone ambos true | Paso contact muestra subsección email (arriba) + subsección phone (abajo), disclaimer único al fondo. Next/Send sólo requiere que AL MENOS uno sea válido (ambos opcionales si el usuario no quiere follow-up; el paso entero se puede saltar). |
| Texto vacío en question-text opcional | Next habilitado con string vacío. |
| Texto vacío en question-text requerido | Next deshabilitado hasta ≥1 carácter. |
| User tap backdrop con 0 respuestas | Overlay cierra directo (sin confirm). |
| User tap backdrop con ≥1 respuesta | Confirm exit modal. Cancel mantiene, Exit descarta. |
| User tap Escape | Equivalente a Close X. |
| User completa + SEND sin contact | `contact` es `undefined` en el result. |
| Thank-you countdown expira con tab inactiva | `setTimeout` se sigue ejecutando (React state). Overlay cierra al volver. |

## 9. Verificación end-to-end

1. `pnpm check` (typecheck + lint + format) limpio.
2. `pnpm kiosk:dev` → `/home` → tap tile "Survey":
   - Overlay monta con fade-in + card slide-up.
   - Progress dots muestran 1/5.
   - NPS: tap 9 → olive ring + Next habilitado.
   - Paso 2 rating: tap 4 estrellas → 4 filled.
   - Paso 3 single-choice: tap "Tourism" → solo una seleccionada.
   - Paso 4 multi-choice: tap "Food" + "Events" → dos checked.
   - Paso 5 text: foco dispara OnScreenKeyboard → escribir → counter visible.
   - Tap SEND FEEDBACK → thank-you con check + countdown → overlay cierra → home.
3. Back desde paso 2+ preserva respuestas anteriores.
4. Tap backdrop con respuestas → confirm exit. Cancel mantiene, Exit descarta y cierra.
5. Escape key = equivalente a Close X.
6. `KIOSK_CLIENT=demo-cliente-a` → card toma el primary del cliente (naranja). Cero edits en `.tsx`.
7. `grep -REn "#[0-9a-fA-F]{3,8}" src/components/survey/` → 0 resultados.
8. Playwright MCP screenshots en `.planning/verifications/3-9-survey-*.png`: step1-nps / step2-rating / step3-single / step4-multi / step5-text / thank-you / confirm-exit.
9. Auditor white-label sin hallazgos críticos.
10. DevTools Console muestra `[kiosk:survey]` con shape correcto al enviar. CustomEvent detectable con `window.addEventListener('kiosk:survey-submitted', ...)`.

## 10. Fuera de alcance (v2+)

- Backend real (HTTP POST). v1 sólo console + CustomEvent.
- Rating con halves (0.5 estrellas).
- Lógica condicional / skip (si responde X, saltar Y).
- Analytics de tiempo por pregunta / drop-off rate.
- Multi-idioma real. v1: strings en `config.textos` como los demás módulos.
- Randomizar orden de options en single/multi-choice.
- Versionado de survey (tracking cuando cambia el cuestionario).

## 11. Archivos tocados (resumen)

### Crear

- `src/components/survey/survey-overlay.tsx`
- `src/components/survey/survey-backdrop.tsx`
- `src/components/survey/survey-card.tsx`
- `src/components/survey/survey-header.tsx`
- `src/components/survey/survey-progress.tsx`
- `src/components/survey/survey-question.tsx`
- `src/components/survey/question-nps.tsx`
- `src/components/survey/question-rating.tsx`
- `src/components/survey/question-single-choice.tsx`
- `src/components/survey/question-multi-choice.tsx`
- `src/components/survey/question-text.tsx`
- `src/components/survey/question-contact.tsx`
- `src/components/survey/survey-navigation.tsx`
- `src/components/survey/survey-thank-you.tsx`
- `src/components/survey/survey-exit-confirm.tsx`
- `src/lib/survey.ts`

### Modificar

- `src/lib/config.ts` — añadir tipos SurveyConfig + integrar en HomeConfig.
- `src/components/home/home-shell.tsx` — state surveyOpen + render overlay.
- `src/components/home/category-tile.tsx` — variante action.
- `src/components/home/category-grid.tsx` — forward onSurveyTap.
- `src/app/(kiosk)/home/page.tsx` — pass survey config al shell.
- `clients/default/config.json` — bloque `survey` + strings `survey_*` en `textos`.

## 12. Próximos pasos

1. Commit este spec con `docs(survey): spec módulo Survey fase 3.9`.
2. Invocar skill `superpowers:writing-plans` para crear plan atómico en `.planning/3-9-1-PLAN.md`.
3. Ejecutar la fase en contexto fresco con `/iniciar` + plan atómico, cargando skills Tier 1 (`frontend-design`, `ui-ux-pro-max`, `theme-factory`).
