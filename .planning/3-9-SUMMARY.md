# 3-9 SUMMARY — Módulo Survey (overlay sobre Home Dashboard)

**Fecha:** 2026-04-22 · **Commits:** `525a33e` (ola 1) · `aca053d` (chore format) · `fcbad72` (ola 2) · `14a5237` (ola 3) · TBD (ola 4 + SUMMARY).
**Spec:** `docs/superpowers/specs/2026-04-22-survey-module-design.md` (`69f2499`).
**Plan:** `.planning/3-9-1-PLAN.md` (`3baf760`).

---

## Hecho

**Ola 1 — Foundations** (`525a33e`):

- `src/lib/config.ts` — tipos `SurveyConfig`, `SurveyQuestion` (union 5 tipos), `SurveyIntro`, `SurveyThankYou`, `SurveyContactCapture`. Campo `survey?: SurveyConfig` dentro de `features.home`.
- `clients/default/config.json` — seed con 5 preguntas (nps/rating/single/multi/text) + thankYou + 13 strings `survey_*` en `textos`.
- `src/lib/survey.ts` — `SurveyAnswer` type, `SurveyResult` shape, helpers `isAnswered`, `hasAnyAnswer`, `buildResult`, `dispatchResult`, `totalSteps`.

**Ola 2 — Shell del overlay** (`fcbad72`):

- `survey-backdrop.tsx` — capa oscura 72% opacity, tap dispara callback.
- `survey-card.tsx` — container 880×auto azul rounded-24 shadow.
- `survey-header.tsx` — logo + X close circular outline.
- `survey-progress.tsx` — N dots activo/pasado/futuro, oculto si N<2.
- `survey-navigation.tsx` — footer BACK outline + NEXT/SEND fill white text-primary.
- `survey-exit-confirm.tsx` — modal anidado con bg-destructive en el LEAVE.
- `survey-thank-you.tsx` — check animado + countdown + progress bar + auto-close.
- `survey-overlay.tsx` — root client con state step/answers/contact/submitted + handlers + wire de todos los subcomponentes.

**Ola 3 — Question variants** (`14a5237`):

- `question-nps.tsx` — 11 círculos 0-10 con labels extremos, seleccionado = olive + scale.
- `question-rating.tsx` — 5 estrellas 68×68 outline→filled olive.
- `question-single-choice.tsx` — pills radio columna 72px.
- `question-multi-choice.tsx` — pills checkbox columna con check icon.
- `question-text.tsx` — textarea display + `OnScreenKeyboard` reusado (scale 0.78).
- `question-contact.tsx` — email (QWERTY) y/o phone (NumericKeypad) con focus switch.
- `survey-question.tsx` — switch que delega a la variante según `type`.
- `survey-overlay.tsx` — wireado con `SurveyQuestionView` + `QuestionContact` (fin del placeholder).

**Ola 4 — Integration + verificación**:

- `src/components/home/category-tile.tsx` — variante action: renderiza `<button>` si `onClick` prop, `<Link>` por default. Marcado `'use client'`.
- `src/components/home/category-grid.tsx` — prop `onSurveyTap?`, inyectado al tile con `key === 'survey'`.
- `src/components/home/home-shell.tsx` — recibe `tiles`, `survey`, `client`, `textos` como props. Renderiza el grid internamente para inyectar el callback sin pasar funciones desde el server.
- `src/app/(kiosk)/home/page.tsx` — simplificado a pasar props directas (sin render-prop).

## Verificado

- `pnpm check` (typecheck + lint + format) limpio.
- Cero hex en `src/components/survey/` (grep `#[0-9a-fA-F]{3,8}` sin resultados).
- Flow completo verificado con Playwright MCP en `KIOSK_CLIENT=default`:
  - `3-9-survey-step1-nps.png` — step 1 NPS 0-10 con labels, card azul, progress dots 5 visibles.
  - `3-9-survey-step2-rating.png` — step 2 rating 5 estrellas outline, BACK aparece, NEXT disabled hasta responder.
  - `3-9-survey-step3-single.png` — step 3 single-choice "What brought you here today?" con 4 opciones pill.
  - `3-9-survey-step4-multi.png` — step 4 multi-choice "What interests you most?" con 5 opciones checkbox.
  - `3-9-survey-step5-text.png` — step 5 text "Any other feedback?" con OnScreenKeyboard escalado dentro del card, SEND FEEDBACK (no NEXT) en el footer, progress dot 5 con ring olive.
  - `3-9-survey-thankyou.png` — check animado + "Thanks for your feedback" + countdown 3s + progress bar olive.
  - `3-9-survey-exit-confirm.png` — modal blanco sobre overlay oscurecido con "Leave survey?" + CANCEL/LEAVE (destructive rojo).
- Dispatch en consola al enviar: `[kiosk:survey]` con `timestamp` + `client` + `answers` + `contact`.
- Escape key dispara confirm-exit (mismo código que backdrop tap).

## Pendiente / siguiente

- **Logo del card no renderiza** — `branding.logo.default` es `"assets/logo.svg"` (path relativo sin `/` inicial). En otros componentes del kiosk probablemente se prefija. Investigar cómo se resuelven los paths en client components y arreglar (probablemente añadir `/` al inicio en `home/page.tsx`).
- **Screenshots pendientes**: `demo-cliente-a` (card naranja) y verificación de Fast Refresh en `/home/restaurants` sin regresiones.
- **Popup ad "History of Art"** aparece ENCIMA del backdrop del survey porque el `AdsSlot` es sibling del `HomeShell` (fuera del shell client). Evaluar si el backdrop del survey debe montarse a nivel KioskCanvas o si se deja así intencionalmente (ads deben seguir visibles por imperativos de negocio).
- Backend real (POST) — v2.
- Rating halves (0.5), lógica condicional, analytics — v2.
- Actualizar `STATE.md` al cerrar la sesión con `/terminar`.

## Decisiones tomadas durante la ejecución

- **Render-prop en HomeShell descartado**: la primera implementación pasaba `children: (handlers) => ReactNode` desde el server component `home/page.tsx`. React Server Components no pueden serializar funciones al cliente → error 500. Cambiado a props directos (`tiles`, `survey`, `client`, `textos`) y el shell renderiza `<CategoryGrid>` internamente para poder inyectar el `onSurveyTap` callback del state local. Patrón repetible si en futuras fases hace falta más orquestación.
- **OnScreenKeyboard escalado 0.78**: el teclado es 1080×398 nativamente y no cabía en el card 880×auto. En vez de rediseñar el teclado o montarlo fuera del card, se envuelve en un `transform: scale(0.78)` con `transformOrigin: top center`. Simple, sin tocar el componente shared, visualmente coherente.
- **Textarea como `<div>` display-only**: el textarea HTML real no acepta onKey del keyboard custom (el OnScreenKeyboard emite strings, no teclado real). Se usa un `<div>` con `whitespace: pre-wrap` para mostrar el valor construido y el counter en position absolute.
- **NumericKeypad para phone**: mismo patrón, escalado 0.82.
- **setContact en `survey-overlay.tsx`**: en ola 2 quedó como dead code con `eslint-disable`; al wirear `QuestionContact` en ola 3 se activa.
- **Commit separado de format**: `aca053d` (chore format) se hizo antes del de la ola 2 para mantener el commit de la ola 2 limpio.

## Fase 3.9 cerrada — 5 commits hasta aquí

```
525a33e feat(survey): tipos SurveyConfig + seed default + lib/survey.ts
aca053d chore(format): prettier fix en plan 3-9-1 + spec survey
fcbad72 feat(survey): shell del overlay
14a5237 feat(survey): 5 question variants + contact step + switch wireado
TBD     feat(survey): integración home + verificación visual
```
