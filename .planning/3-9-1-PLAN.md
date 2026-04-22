# Plan 3-9-1 — Módulo Survey (overlay sobre Home Dashboard)

**Fase:** 3.9 · **Orden:** 1 · **Depende de:** fases 3.2-3.8 commiteadas (home + 5 módulos + ads).
**Cubre requerimientos:** R1 (pantallas del kiosk), R2 (white-label JSON-driven), R7 (UX del home), R8 (modales dentro del frame).
**Skills necesarios al ejecutar:** Tier 1 obligatorio (`frontend-design`, `ui-ux-pro-max`, `theme-factory`). Tier 2 (`web-design-guidelines`) al cerrar la pantalla.
**Spec de referencia:** `docs/superpowers/specs/2026-04-22-survey-module-design.md` (commit `69f2499`).

**Resumen:** Se implementa el módulo Survey como overlay modal dentro del `KioskCanvas`, montado desde `HomeShell` y disparado por el tile "Survey" del grid. Flow step-by-step con 5 tipos de pregunta (NPS, rating, single-choice, multi-choice, text), progress dots, contact capture opcional, confirm-exit al abandonar con respuestas, thank-you con auto-close y dispatch por `console.log` + `CustomEvent`. Cero hardcoded (tokens + `config.json` + `config.textos.survey_*`). El plan se ejecuta en 4 olas lógicas (Foundations → Shell → Questions → Integration) con 21 tasks atómicos. Cada ola termina con un `git add` específico + commit Conventional Commits (4 commits totales).

**Orden de ejecución:**
- Ola 1 (Foundations): tasks 1-3. Tipos + seed + lib.
- Ola 2 (Shell): tasks 4-8. Chrome del overlay.
- Ola 3 (Questions): tasks 9-14. 5 tipos + switch.
- Ola 4 (Integration): tasks 15-17. Home wiring + verificación.

---

<task type="auto">
  <name>Añadir tipos SurveyConfig a src/lib/config.ts</name>
  <files>src/lib/config.ts</files>
  <action>
    Abrir `src/lib/config.ts`. Añadir los tipos del survey justo antes de la interface `HomeModule` (o bloque de interfaces existentes). Mantener orden alfabético si aplica al patrón del archivo.

    ```ts
    /** Intro del Survey mostrado en el primer paso. */
    export interface SurveyIntro {
      title: string;
      subtitle?: string;
    }

    /** Pantalla de agradecimiento tras enviar el survey. */
    export interface SurveyThankYou {
      title: string;
      message: string;
      /** Ms antes de cerrar el overlay. Default 5000. */
      autoCloseMs?: number;
    }

    /** Captura opcional de datos de contacto en un paso extra final. */
    export interface SurveyContactCapture {
      enabled: boolean;
      email?: boolean;
      phone?: boolean;
      disclaimer: string;
    }

    /** Pregunta del survey — union discriminada por `type`. */
    export type SurveyQuestion =
      | {
          id: string;
          type: 'nps';
          prompt: string;
          optional?: boolean;
          labels?: { low: string; high: string };
        }
      | {
          id: string;
          type: 'rating';
          prompt: string;
          optional?: boolean;
          /** Número máximo de estrellas (default 5). */
          max?: 5;
        }
      | {
          id: string;
          type: 'single-choice';
          prompt: string;
          optional?: boolean;
          options: string[];
        }
      | {
          id: string;
          type: 'multi-choice';
          prompt: string;
          optional?: boolean;
          options: string[];
        }
      | {
          id: string;
          type: 'text';
          prompt: string;
          optional?: boolean;
          /** Caracteres máximos del textarea (default 500). */
          maxLength?: number;
        };

    /** Configuración completa del módulo Survey v1. */
    export interface SurveyConfig {
      enabled: boolean;
      /** Logo opcional; si falta se usa `client.logo` del cliente. */
      logo?: string;
      intro: SurveyIntro;
      questions: SurveyQuestion[];
      contactCapture?: SurveyContactCapture;
      thankYou: SurveyThankYou;
    }
    ```

    Luego localizar el bloque `features.home` (interface parcial `features?: { home?: { ... } }`) y añadir el campo `survey?: SurveyConfig` como sibling de `wayfinding`:

    ```ts
    home?: {
      tiles: HomeTile[];
      wayfinding?: {
        enabled: boolean;
        label: string;
        image: string;
      };
      survey?: SurveyConfig;   // ← NUEVO
      listings: HomeListing[];
      modules?: Record<string, HomeModuleVariant>;
    };
    ```

    **No modificar** nada más en este archivo. No tocar `HomeModule`, `HomeEventsModule`, etc.
  </action>
  <verify>
    - `pnpm typecheck` pasa limpio.
    - `grep -n "SurveyConfig\|SurveyQuestion" src/lib/config.ts` muestra los tipos exportados.
    - `grep -n "survey?:" src/lib/config.ts` muestra el campo dentro de `features.home`.
  </verify>
  <done>
    Los 5 tipos nuevos están exportados en `src/lib/config.ts` y `features.home.survey?` acepta `SurveyConfig`.
    Typecheck limpio.
    Nada más de la config tocada.
  </done>
</task>

<task type="auto">
  <name>Seed del survey + strings survey_* en clients/default/config.json</name>
  <files>clients/default/config.json</files>
  <action>
    Abrir `clients/default/config.json`. Dentro de `features.home`, añadir el bloque `survey` justo después de `wayfinding` (sibling). 5 preguntas (una de cada tipo), `contactCapture.enabled: false`, thank-you con autoClose 5s:

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
    },
    ```

    En el mismo archivo, dentro de `textos` (objeto plano top-level del config), añadir las claves `survey_*` que usará el UI:

    ```jsonc
    "survey_back": "BACK",
    "survey_next": "NEXT",
    "survey_send": "SEND FEEDBACK",
    "survey_step_label": "{current}/{total}",
    "survey_optional": "Optional",
    "survey_nps_number": "{n}",
    "survey_text_counter": "{count}/{max}",
    "survey_contact_email_label": "Email (optional)",
    "survey_contact_phone_label": "Phone (optional)",
    "survey_exit_confirm_title": "Leave survey?",
    "survey_exit_confirm_message": "You'll lose your answers if you leave now.",
    "survey_exit_confirm_cancel": "CANCEL",
    "survey_exit_confirm_exit": "LEAVE",
    "survey_thank_you_countdown": "Returning home in {seconds}s..."
    ```

    Añadir en el mismo orden alfabético/lógico que los demás `textos` existentes (map_*, etc.).

    **Verificar que el JSON sigue siendo válido** tras la edición (comas, llaves). Si tu editor tiene auto-format, úsalo.
  </action>
  <verify>
    - `node -e "JSON.parse(require('fs').readFileSync('clients/default/config.json'))"` no lanza error.
    - `grep -n '"survey":' clients/default/config.json` muestra el bloque dentro de `features.home`.
    - `grep -c '"survey_' clients/default/config.json` muestra ≥13 (los 13 textos añadidos).
    - `pnpm typecheck` pasa limpio.
  </verify>
  <done>
    El config valida como JSON.
    `features.home.survey.enabled === true` en el config cargado.
    Los 13 strings `survey_*` están en `textos`.
    Typecheck limpio.
  </done>
</task>

<task type="auto">
  <name>Crear src/lib/survey.ts con tipos internos + helpers + dispatch</name>
  <files>src/lib/survey.ts</files>
  <action>
    Crear el archivo nuevo `src/lib/survey.ts`:

    ```ts
    import type { SurveyConfig, SurveyQuestion } from './config';

    /** Valor de una respuesta del survey, depende del `type` de la pregunta. */
    export type SurveyAnswer =
      | number           // nps (0-10) | rating (1-5)
      | string           // single-choice | text
      | string[]         // multi-choice
      | null;            // sin responder

    /** Resultado final serializable, listo para dispatch. */
    export interface SurveyResult {
      /** ISO 8601 UTC timestamp. */
      timestamp: string;
      /** Slug del KIOSK_CLIENT activo. */
      client: string;
      /** Mapa de respuestas por questionId. */
      answers: Record<string, SurveyAnswer>;
      /** Datos opcionales de contacto (si contactCapture.enabled y usuario escribió). */
      contact?: { email?: string; phone?: string };
    }

    /** ¿La respuesta satisface la pregunta? Optional + vacío también pasa. */
    export function isAnswered(question: SurveyQuestion, answer: SurveyAnswer): boolean {
      if (question.optional) return true;
      if (answer === null || answer === undefined) return false;
      switch (question.type) {
        case 'nps':
        case 'rating':
          return typeof answer === 'number';
        case 'single-choice':
        case 'text':
          return typeof answer === 'string' && answer.length > 0;
        case 'multi-choice':
          return Array.isArray(answer) && answer.length > 0;
      }
    }

    /** ¿Hay AL MENOS una respuesta con valor? Para el confirm-exit. */
    export function hasAnyAnswer(answers: Record<string, SurveyAnswer>): boolean {
      return Object.values(answers).some((v) => {
        if (v === null || v === undefined) return false;
        if (typeof v === 'string') return v.length > 0;
        if (Array.isArray(v)) return v.length > 0;
        return true;
      });
    }

    /** Construye el resultado final. Elimina respuestas null para payload limpio. */
    export function buildResult(
      client: string,
      answers: Record<string, SurveyAnswer>,
      contact?: { email?: string; phone?: string },
    ): SurveyResult {
      const cleanAnswers: Record<string, SurveyAnswer> = {};
      for (const [k, v] of Object.entries(answers)) {
        if (v !== null && v !== undefined) cleanAnswers[k] = v;
      }
      const cleanContact =
        contact && (contact.email || contact.phone)
          ? {
              ...(contact.email ? { email: contact.email } : {}),
              ...(contact.phone ? { phone: contact.phone } : {}),
            }
          : undefined;
      return {
        timestamp: new Date().toISOString(),
        client,
        answers: cleanAnswers,
        ...(cleanContact ? { contact: cleanContact } : {}),
      };
    }

    /** Dispatch v1: console + CustomEvent. Sin persistencia. */
    export function dispatchResult(result: SurveyResult): void {
      // eslint-disable-next-line no-console
      console.log('[kiosk:survey]', result);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('kiosk:survey-submitted', { detail: result }));
      }
    }

    /** Total de pasos (N preguntas + 1 si contactCapture.enabled). */
    export function totalSteps(config: SurveyConfig): number {
      const base = config.questions.length;
      const contactStep = config.contactCapture?.enabled ? 1 : 0;
      return base + contactStep;
    }
    ```

    **No importar `server-only`** — este módulo se usa en client components.
  </action>
  <verify>
    - `pnpm typecheck` pasa limpio.
    - `pnpm lint` sin errores en `src/lib/survey.ts`.
    - `grep -n "export" src/lib/survey.ts` muestra: `SurveyAnswer`, `SurveyResult`, `isAnswered`, `hasAnyAnswer`, `buildResult`, `dispatchResult`, `totalSteps`.
  </verify>
  <done>
    `src/lib/survey.ts` existe con 7 exports (tipos + helpers).
    Typecheck + lint limpios.
    Sin `import 'server-only'`.
  </done>
</task>

<task type="auto">
  <name>Commit ola 1 (foundations)</name>
  <files>src/lib/config.ts, clients/default/config.json, src/lib/survey.ts</files>
  <action>
    ```bash
    git add src/lib/config.ts clients/default/config.json src/lib/survey.ts
    git commit -m "feat(survey): tipos SurveyConfig + seed default + lib/survey.ts

Fase 3.9 ola 1 (foundations). Prepara el contrato white-label:
tipos en config.ts, 5 preguntas de ejemplo + 13 strings survey_* en
clients/default/config.json, helpers de validación + dispatch v1
(console + CustomEvent) en lib/survey.ts."
    ```
  </action>
  <verify>
    - `git log -1 --oneline` muestra el commit.
    - `git status --short` limpio (de estos archivos).
  </verify>
  <done>
    Commit creado.
    Tree limpio de los tres archivos tocados.
  </done>
</task>

<task type="auto">
  <name>Crear survey-backdrop + survey-card + survey-header</name>
  <files>src/components/survey/survey-backdrop.tsx, src/components/survey/survey-card.tsx, src/components/survey/survey-header.tsx</files>
  <action>
    **Importante:** los 3 componentes son presentacionales puros (no client components si no necesitan estado). Marcar como `'use client'` SOLO el backdrop porque recibe `onTap`.

    Crear `src/components/survey/survey-backdrop.tsx`:

    ```tsx
    'use client';

    interface Props {
      onTap: () => void;
    }

    /**
     * Capa oscura absoluta inset-0 dentro del KioskCanvas (contenido al frame
     * gracias al transform:scale del canvas — no escapa al viewport).
     * Tap dispara onTap; el padre decide si hay confirm-exit.
     */
    export function SurveyBackdrop({ onTap }: Props) {
      return (
        <button
          type="button"
          aria-label="Close survey"
          onClick={onTap}
          className="absolute inset-0 cursor-default"
          style={{ backgroundColor: 'rgba(0,0,0,0.72)' }}
        />
      );
    }
    ```

    Crear `src/components/survey/survey-card.tsx`:

    ```tsx
    import type { ReactNode } from 'react';

    interface Props {
      children: ReactNode;
    }

    /**
     * Contenedor visual del survey — card azul centrado en el canvas
     * (1080×1920). Ancho fijo 880px, alto auto, padding generoso.
     */
    export function SurveyCard({ children }: Props) {
      return (
        <div
          className="relative mx-auto bg-primary text-primary-foreground shadow-xl"
          style={{
            width: '880px',
            borderRadius: '24px',
            paddingTop: '56px',
            paddingBottom: '56px',
            paddingLeft: '72px',
            paddingRight: '72px',
          }}
        >
          {children}
        </div>
      );
    }
    ```

    Crear `src/components/survey/survey-header.tsx`:

    ```tsx
    'use client';

    interface Props {
      logo?: string;
      onClose: () => void;
      closeAriaLabel: string;
    }

    /**
     * Header del card: logo centrado arriba (si existe) + X top-right.
     */
    export function SurveyHeader({ logo, onClose, closeAriaLabel }: Props) {
      return (
        <div className="relative mb-8 flex items-center justify-center" style={{ height: '112px' }}>
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logo} alt="" className="h-full w-auto object-contain" />
          ) : null}
          <button
            type="button"
            aria-label={closeAriaLabel}
            onClick={onClose}
            className="absolute top-0 flex items-center justify-center rounded-full border-2 border-primary-foreground/80 text-primary-foreground transition hover:bg-primary-foreground/10"
            style={{ right: '0', width: '56px', height: '56px' }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
      );
    }
    ```
  </action>
  <verify>
    - Los 3 archivos existen.
    - `pnpm typecheck` + `pnpm lint` limpios.
    - `grep -RE "#[0-9a-fA-F]{3,8}" src/components/survey/` sale vacío (solo `rgba(0,0,0,...)` permitido en el backdrop para la opacidad, que no es hex de color branding).
  </verify>
  <done>
    3 componentes creados.
    Typecheck + lint limpios.
    Cero hex de color en los archivos (la rgba del backdrop es opacidad, no branding).
  </done>
</task>

<task type="auto">
  <name>Crear survey-progress (dots top)</name>
  <files>src/components/survey/survey-progress.tsx</files>
  <action>
    Crear `src/components/survey/survey-progress.tsx`:

    ```tsx
    interface Props {
      current: number; // 0-based index
      total: number;
    }

    /**
     * Dots arriba del card. Oculto si total<2. Activo = filled white + ring olive.
     * Pasados = filled white. Futuros = hollow (border white 40% opacity).
     */
    export function SurveyProgress({ current, total }: Props) {
      if (total < 2) return null;
      const dots = Array.from({ length: total }, (_, i) => i);
      return (
        <div className="mb-10 flex items-center justify-center" style={{ gap: '16px' }}>
          {dots.map((i) => {
            const isActive = i === current;
            const isPast = i < current;
            const size = isActive ? 16 : 12;
            return (
              <span
                key={i}
                aria-hidden
                className="inline-block rounded-full transition-all"
                style={{
                  width: `${size}px`,
                  height: `${size}px`,
                  backgroundColor:
                    isActive || isPast ? 'hsl(var(--primary-foreground))' : 'transparent',
                  boxShadow: isActive ? '0 0 0 3px hsl(var(--accent))' : 'none',
                  border: isPast || isActive ? 'none' : '2px solid hsl(var(--primary-foreground) / 0.4)',
                }}
              />
            );
          })}
        </div>
      );
    }
    ```
  </action>
  <verify>
    - `pnpm typecheck` + `pnpm lint` limpios.
    - Archivo existe y exporta `SurveyProgress`.
  </verify>
  <done>
    Componente creado.
    Typecheck + lint limpios.
  </done>
</task>

<task type="auto">
  <name>Crear survey-navigation (BACK / NEXT / SEND)</name>
  <files>src/components/survey/survey-navigation.tsx</files>
  <action>
    Crear `src/components/survey/survey-navigation.tsx`:

    ```tsx
    'use client';

    interface Props {
      onBack?: () => void;
      onNext: () => void;
      nextLabel: string;
      backLabel: string;
      nextDisabled?: boolean;
      isLastStep: boolean;
    }

    /**
     * Footer del card: BACK (outline) izquierda + NEXT o SEND (fill white) derecha.
     * BACK oculto si no hay onBack (paso 0). Disabled = opacity 40%.
     */
    export function SurveyNavigation({
      onBack,
      onNext,
      nextLabel,
      backLabel,
      nextDisabled = false,
      isLastStep,
    }: Props) {
      return (
        <div className="mt-12 flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            disabled={!onBack}
            className="inline-flex items-center justify-center rounded-full border-2 border-primary-foreground/80 px-10 py-4 font-display font-bold uppercase tracking-wide text-primary-foreground transition hover:bg-primary-foreground/10 disabled:cursor-not-allowed disabled:opacity-0"
            style={{ fontSize: '22px', minWidth: '180px' }}
          >
            ← {backLabel}
          </button>
          <button
            type="button"
            onClick={onNext}
            disabled={nextDisabled}
            className="inline-flex items-center justify-center rounded-full bg-primary-foreground font-display font-bold uppercase tracking-wide text-primary transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            style={{
              fontSize: '22px',
              paddingLeft: '40px',
              paddingRight: '40px',
              paddingTop: '18px',
              paddingBottom: '18px',
              minWidth: isLastStep ? '260px' : '180px',
            }}
          >
            {nextLabel} {isLastStep ? '' : '→'}
          </button>
        </div>
      );
    }
    ```

    **Nota:** `disabled:opacity-0` en BACK hace que desaparezca en step 0 (cuando `onBack` es undefined → `disabled`) manteniendo el layout simétrico sin romper el `justify-between`.
  </action>
  <verify>
    - `pnpm typecheck` + `pnpm lint` limpios.
    - Archivo existe y exporta `SurveyNavigation`.
  </verify>
  <done>
    Componente creado.
    Typecheck + lint limpios.
    Tokens (`bg-primary-foreground`, `text-primary`) usados; cero hex.
  </done>
</task>

<task type="auto">
  <name>Crear survey-exit-confirm (modal anidado)</name>
  <files>src/components/survey/survey-exit-confirm.tsx</files>
  <action>
    Crear `src/components/survey/survey-exit-confirm.tsx`:

    ```tsx
    'use client';

    interface Props {
      title: string;
      message: string;
      cancelLabel: string;
      exitLabel: string;
      onCancel: () => void;
      onExit: () => void;
    }

    /**
     * Modal de confirmación anidado sobre el SurveyOverlay. z-index ligeramente
     * mayor (absolute inset-0 dentro del overlay). Backdrop propio aún más oscuro.
     */
    export function SurveyExitConfirm({
      title,
      message,
      cancelLabel,
      exitLabel,
      onCancel,
      onExit,
    }: Props) {
      return (
        <div className="absolute inset-0 z-10 flex items-center justify-center">
          <button
            type="button"
            aria-label={cancelLabel}
            onClick={onCancel}
            className="absolute inset-0"
            style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
          />
          <div
            className="relative bg-primary-foreground text-foreground shadow-xl"
            style={{
              width: '640px',
              borderRadius: '20px',
              paddingTop: '40px',
              paddingBottom: '40px',
              paddingLeft: '48px',
              paddingRight: '48px',
            }}
          >
            <h3 className="mb-3 text-center font-display font-bold" style={{ fontSize: '32px' }}>
              {title}
            </h3>
            <p className="mb-8 text-center font-sans" style={{ fontSize: '20px', opacity: 0.8 }}>
              {message}
            </p>
            <div className="flex items-center justify-center" style={{ gap: '16px' }}>
              <button
                type="button"
                onClick={onCancel}
                className="inline-flex items-center justify-center rounded-full border-2 border-foreground/30 px-8 py-3 font-display font-bold uppercase text-foreground transition hover:bg-foreground/5"
                style={{ fontSize: '18px', minWidth: '160px' }}
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                onClick={onExit}
                className="inline-flex items-center justify-center rounded-full bg-destructive px-8 py-3 font-display font-bold uppercase text-destructive-foreground transition hover:opacity-90"
                style={{ fontSize: '18px', minWidth: '160px' }}
              >
                {exitLabel}
              </button>
            </div>
          </div>
        </div>
      );
    }
    ```

    **Nota tokens:** usa `bg-destructive` y `text-destructive-foreground`. Verificar que el template los define (deberían estar en `clients/_template/tokens.css`; si no, fallback a `bg-foreground` + `text-background`).
  </action>
  <verify>
    - `pnpm typecheck` + `pnpm lint` limpios.
    - `grep -n "destructive" clients/_template/tokens.css` muestra el token definido (o fallback aplicado).
    - Archivo existe y exporta `SurveyExitConfirm`.
  </verify>
  <done>
    Componente creado.
    Typecheck + lint limpios.
    Tokens de destructive verificados.
  </done>
</task>

<task type="auto">
  <name>Crear survey-thank-you (check + countdown)</name>
  <files>src/components/survey/survey-thank-you.tsx</files>
  <action>
    Crear `src/components/survey/survey-thank-you.tsx`. Clonar el patrón visual del `SendConfirmationPopup` (`src/components/listings/send-confirmation-popup.tsx`) pero adaptado al card azul del survey.

    ```tsx
    'use client';

    import { useEffect, useState } from 'react';

    interface Props {
      title: string;
      message: string;
      countdownTemplate: string;   // ej. "Returning home in {seconds}s..."
      autoCloseMs: number;
      onAutoClose: () => void;
    }

    /**
     * Pantalla final: check animado + countdown descendente + auto-close.
     * Reemplaza al último paso del survey cuando el dispatch ya se ejecutó.
     */
    export function SurveyThankYou({
      title,
      message,
      countdownTemplate,
      autoCloseMs,
      onAutoClose,
    }: Props) {
      const [remaining, setRemaining] = useState(Math.ceil(autoCloseMs / 1000));

      useEffect(() => {
        const interval = setInterval(() => {
          setRemaining((r) => Math.max(0, r - 1));
        }, 1000);
        const timeout = setTimeout(onAutoClose, autoCloseMs);
        return () => {
          clearInterval(interval);
          clearTimeout(timeout);
        };
      }, [autoCloseMs, onAutoClose]);

      return (
        <div className="flex flex-col items-center" style={{ paddingTop: '24px', paddingBottom: '24px' }}>
          {/* Check animado */}
          <div
            className="mb-8 flex items-center justify-center rounded-full bg-accent"
            style={{ width: '120px', height: '120px', boxShadow: '0 0 0 8px hsl(var(--accent) / 0.25)' }}
          >
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--accent-foreground))" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="5 12 10 17 19 7" />
            </svg>
          </div>
          <h2 className="mb-3 text-center font-display font-bold" style={{ fontSize: '44px' }}>
            {title}
          </h2>
          <p className="mb-6 text-center font-sans" style={{ fontSize: '22px', opacity: 0.9, maxWidth: '640px' }}>
            {message}
          </p>
          <p className="text-center font-sans" style={{ fontSize: '18px', opacity: 0.65 }}>
            {countdownTemplate.replace('{seconds}', String(remaining))}
          </p>
          {/* Progress bar visual */}
          <div
            className="mt-6 overflow-hidden rounded-full bg-primary-foreground/20"
            style={{ width: '320px', height: '6px' }}
          >
            <div
              className="h-full bg-accent transition-all ease-linear"
              style={{
                width: `${((autoCloseMs / 1000 - remaining) / (autoCloseMs / 1000)) * 100}%`,
                transitionDuration: '1000ms',
              }}
            />
          </div>
        </div>
      );
    }
    ```
  </action>
  <verify>
    - `pnpm typecheck` + `pnpm lint` limpios.
    - Archivo existe y exporta `SurveyThankYou`.
    - `grep -n "bg-accent\|text-destructive\|bg-primary" src/components/survey/survey-thank-you.tsx` confirma tokens.
  </verify>
  <done>
    Componente creado.
    Typecheck + lint limpios.
  </done>
</task>

<task type="auto">
  <name>Crear survey-overlay (root, sin questions aún)</name>
  <files>src/components/survey/survey-overlay.tsx</files>
  <action>
    Crear el root del overlay. En este task NO incluimos las 5 variantes de question aún — solo el chrome que se vaya a componer en las siguientes. El rendering de la pregunta activa queda como un placeholder `<div>TODO Q</div>` que se reemplazará en task 14.

    Crear `src/components/survey/survey-overlay.tsx`:

    ```tsx
    'use client';

    import { useCallback, useEffect, useState } from 'react';

    import type { SurveyConfig, SurveyQuestion } from '@/lib/config';
    import {
      buildResult,
      dispatchResult,
      hasAnyAnswer,
      isAnswered,
      totalSteps,
      type SurveyAnswer,
    } from '@/lib/survey';

    import { SurveyBackdrop } from './survey-backdrop';
    import { SurveyCard } from './survey-card';
    import { SurveyExitConfirm } from './survey-exit-confirm';
    import { SurveyHeader } from './survey-header';
    import { SurveyNavigation } from './survey-navigation';
    import { SurveyProgress } from './survey-progress';
    import { SurveyThankYou } from './survey-thank-you';

    interface Props {
      config: SurveyConfig;
      client: { slug: string; logo?: string };
      textos: Record<string, string>;
      onClose: () => void;
    }

    /**
     * Root del overlay. Maneja el state del paso, respuestas, confirm-exit y thank-you.
     * Las question variants se renderizan vía <SurveyQuestion /> (task 14).
     */
    export function SurveyOverlay({ config, client, textos, onClose }: Props) {
      const total = totalSteps(config);
      const [step, setStep] = useState(0);
      const [answers, setAnswers] = useState<Record<string, SurveyAnswer>>({});
      const [contact, setContact] = useState<{ email?: string; phone?: string }>({});
      const [showExitConfirm, setShowExitConfirm] = useState(false);
      const [submitted, setSubmitted] = useState(false);

      const isContactStep =
        config.contactCapture?.enabled === true && step === config.questions.length;
      const isLastStep = step === total - 1;
      const currentQuestion: SurveyQuestion | undefined = isContactStep
        ? undefined
        : config.questions[step];

      // Escape cierra (con confirm si aplica).
      useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
          if (e.key === 'Escape') {
            handleCloseRequest();
          }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [answers, submitted]);

      const handleCloseRequest = useCallback(() => {
        if (submitted) {
          onClose();
          return;
        }
        if (hasAnyAnswer(answers)) {
          setShowExitConfirm(true);
        } else {
          onClose();
        }
      }, [answers, onClose, submitted]);

      const handleExitConfirmed = useCallback(() => {
        setShowExitConfirm(false);
        onClose();
      }, [onClose]);

      const handleBack = useCallback(() => {
        setStep((s) => Math.max(0, s - 1));
      }, []);

      const handleNext = useCallback(() => {
        if (isLastStep) {
          const result = buildResult(client.slug, answers, contact);
          dispatchResult(result);
          setSubmitted(true);
          return;
        }
        setStep((s) => Math.min(total - 1, s + 1));
      }, [answers, client.slug, contact, isLastStep, total]);

      const setAnswer = useCallback((id: string, value: SurveyAnswer) => {
        setAnswers((prev) => ({ ...prev, [id]: value }));
      }, []);

      const nextDisabled = (() => {
        if (isContactStep) return false; // contact siempre opcional
        if (!currentQuestion) return true;
        return !isAnswered(currentQuestion, answers[currentQuestion.id] ?? null);
      })();

      const nextLabel = isLastStep ? textos.survey_send : textos.survey_next;

      return (
        <div className="absolute inset-0 z-50 flex items-center justify-center">
          <SurveyBackdrop onTap={handleCloseRequest} />
          <div className="relative">
            <SurveyCard>
              {submitted ? (
                <SurveyThankYou
                  title={config.thankYou.title}
                  message={config.thankYou.message}
                  countdownTemplate={textos.survey_thank_you_countdown}
                  autoCloseMs={config.thankYou.autoCloseMs ?? 5000}
                  onAutoClose={onClose}
                />
              ) : (
                <>
                  <SurveyHeader
                    logo={config.logo ?? client.logo}
                    onClose={handleCloseRequest}
                    closeAriaLabel={textos.survey_exit_confirm_title}
                  />
                  <SurveyProgress current={step} total={total} />
                  {step === 0 && config.intro.title ? (
                    <div className="mb-8 text-center">
                      <h2 className="mb-2 font-display font-bold" style={{ fontSize: '44px' }}>
                        {config.intro.title}
                      </h2>
                      {config.intro.subtitle ? (
                        <p className="font-sans" style={{ fontSize: '22px', opacity: 0.85 }}>
                          {config.intro.subtitle}
                        </p>
                      ) : null}
                    </div>
                  ) : null}

                  <div className="mb-4" style={{ minHeight: '420px' }}>
                    {/* Las variantes concretas se conectan en task 14 vía SurveyQuestion. */}
                    <div className="text-center font-display font-bold" style={{ fontSize: '28px' }}>
                      {currentQuestion ? currentQuestion.prompt : textos.survey_contact_email_label}
                    </div>
                    <div className="mt-4 text-center text-sm opacity-60">
                      [placeholder — question variant task 14]
                    </div>
                  </div>

                  <SurveyNavigation
                    onBack={step > 0 ? handleBack : undefined}
                    onNext={handleNext}
                    backLabel={textos.survey_back}
                    nextLabel={nextLabel}
                    nextDisabled={nextDisabled}
                    isLastStep={isLastStep}
                  />
                </>
              )}
            </SurveyCard>
          </div>

          {showExitConfirm ? (
            <SurveyExitConfirm
              title={textos.survey_exit_confirm_title}
              message={textos.survey_exit_confirm_message}
              cancelLabel={textos.survey_exit_confirm_cancel}
              exitLabel={textos.survey_exit_confirm_exit}
              onCancel={() => setShowExitConfirm(false)}
              onExit={handleExitConfirmed}
            />
          ) : null}
        </div>
      );
    }
    ```

    **Warnings aceptables:** el `useEffect` para el Escape tiene `eslint-disable-next-line react-hooks/exhaustive-deps` porque dependemos de valores capturados por el closure y el re-registro es innecesario (patrón ya aceptado en `directions-modal.tsx`).

    El `setContact` se prepara pero no se usa aún hasta `question-contact` (task 13). Se usará en el wiring del task 14.
  </action>
  <verify>
    - `pnpm typecheck` + `pnpm lint` limpios (excepto warnings ya aceptados).
    - Archivo existe y exporta `SurveyOverlay`.
  </verify>
  <done>
    Root creado con chrome completo.
    Placeholder para la question activa (se reemplaza en task 14).
    Typecheck + lint limpios.
  </done>
</task>

<task type="auto">
  <name>Commit ola 2 (shell)</name>
  <files>src/components/survey/*.tsx</files>
  <action>
    ```bash
    git add src/components/survey/survey-backdrop.tsx \
            src/components/survey/survey-card.tsx \
            src/components/survey/survey-header.tsx \
            src/components/survey/survey-progress.tsx \
            src/components/survey/survey-navigation.tsx \
            src/components/survey/survey-exit-confirm.tsx \
            src/components/survey/survey-thank-you.tsx \
            src/components/survey/survey-overlay.tsx
    git commit -m "feat(survey): shell del overlay (card + progress + nav + thank-you + exit-confirm)

Fase 3.9 ola 2 (shell). Chrome completo del survey modal:
backdrop, card azul, header con logo+X, progress dots, footer de
navegación BACK/NEXT/SEND, modal de confirm-exit anidado y pantalla
de thank-you con countdown. Root SurveyOverlay compone todo con
placeholder para las 5 question variants (ola 3)."
    ```
  </action>
  <verify>
    - `git log -1 --oneline` muestra el commit de ola 2.
    - `git status --short` limpio.
  </verify>
  <done>
    Commit creado.
    Tree limpio.
  </done>
</task>

<task type="auto">
  <name>Crear question-nps (11 círculos 0-10)</name>
  <files>src/components/survey/question-nps.tsx</files>
  <action>
    Crear `src/components/survey/question-nps.tsx`:

    ```tsx
    'use client';

    interface Props {
      value: number | null;
      onChange: (v: number) => void;
      labels?: { low: string; high: string };
    }

    const SCALE = Array.from({ length: 11 }, (_, i) => i); // 0..10

    export function QuestionNps({ value, onChange, labels }: Props) {
      return (
        <div className="flex flex-col items-center" style={{ gap: '20px' }}>
          <div
            role="radiogroup"
            aria-label="Rate from 0 to 10"
            className="flex items-center justify-center"
            style={{ gap: '10px' }}
          >
            {SCALE.map((n) => {
              const selected = value === n;
              return (
                <button
                  key={n}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => onChange(n)}
                  className="flex flex-col items-center justify-center rounded-full border-2 border-primary-foreground bg-primary-foreground font-display font-bold text-primary transition-all"
                  style={{
                    width: '56px',
                    height: '56px',
                    fontSize: '22px',
                    backgroundColor: selected
                      ? 'hsl(var(--accent))'
                      : 'hsl(var(--primary-foreground))',
                    color: selected
                      ? 'hsl(var(--accent-foreground))'
                      : 'hsl(var(--primary))',
                    boxShadow: selected ? '0 0 0 4px hsl(var(--primary-foreground))' : 'none',
                    transform: selected ? 'scale(1.12)' : 'scale(1)',
                  }}
                >
                  {n}
                </button>
              );
            })}
          </div>
          {labels ? (
            <div
              className="flex w-full items-center justify-between font-sans"
              style={{ fontSize: '16px', opacity: 0.85, maxWidth: '720px' }}
            >
              <span>{labels.low}</span>
              <span>{labels.high}</span>
            </div>
          ) : null}
        </div>
      );
    }
    ```
  </action>
  <verify>
    - `pnpm typecheck` + `pnpm lint` limpios.
    - Archivo existe y exporta `QuestionNps`.
  </verify>
  <done>
    Componente creado.
    Typecheck + lint limpios.
    Tokens only (cero hex).
  </done>
</task>

<task type="auto">
  <name>Crear question-rating (5 estrellas)</name>
  <files>src/components/survey/question-rating.tsx</files>
  <action>
    Crear `src/components/survey/question-rating.tsx`:

    ```tsx
    'use client';

    interface Props {
      value: number | null;
      onChange: (v: number) => void;
      max?: number;
    }

    function StarIcon({ filled }: { filled: boolean }) {
      return (
        <svg width="68" height="68" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round">
          <polygon points="12 2 15.1 8.6 22 9.3 16.8 14 18.2 21 12 17.3 5.8 21 7.2 14 2 9.3 8.9 8.6 12 2" />
        </svg>
      );
    }

    export function QuestionRating({ value, onChange, max = 5 }: Props) {
      const items = Array.from({ length: max }, (_, i) => i + 1);
      return (
        <div
          role="radiogroup"
          aria-label="Rate from 1 to 5"
          className="flex items-center justify-center"
          style={{ gap: '16px' }}
        >
          {items.map((n) => {
            const filled = value !== null && n <= value;
            return (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={value === n}
                aria-label={`${n} star${n === 1 ? '' : 's'}`}
                onClick={() => onChange(n)}
                className="transition-transform"
                style={{
                  color: filled ? 'hsl(var(--accent))' : 'hsl(var(--primary-foreground) / 0.85)',
                  transform: value === n ? 'scale(1.1)' : 'scale(1)',
                }}
              >
                <StarIcon filled={filled} />
              </button>
            );
          })}
        </div>
      );
    }
    ```
  </action>
  <verify>
    - `pnpm typecheck` + `pnpm lint` limpios.
    - Archivo existe y exporta `QuestionRating`.
  </verify>
  <done>
    Componente creado.
    Typecheck + lint limpios.
  </done>
</task>

<task type="auto">
  <name>Crear question-single-choice + question-multi-choice</name>
  <files>src/components/survey/question-single-choice.tsx, src/components/survey/question-multi-choice.tsx</files>
  <action>
    Ambas variantes comparten pill 560×72. Para mantener DRY creamos un helper inline en cada archivo (no un shared component porque la lógica de selección difiere y tenerlos separados facilita leer).

    Crear `src/components/survey/question-single-choice.tsx`:

    ```tsx
    'use client';

    interface Props {
      value: string | null;
      onChange: (v: string) => void;
      options: string[];
    }

    export function QuestionSingleChoice({ value, onChange, options }: Props) {
      return (
        <div
          role="radiogroup"
          className="mx-auto flex flex-col"
          style={{ gap: '14px', maxWidth: '560px' }}
        >
          {options.map((opt) => {
            const selected = value === opt;
            return (
              <button
                key={opt}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => onChange(opt)}
                className="flex items-center rounded-full border-2 font-sans font-semibold transition-all"
                style={{
                  height: '72px',
                  paddingLeft: '24px',
                  paddingRight: '24px',
                  gap: '16px',
                  fontSize: '22px',
                  borderColor: selected
                    ? 'hsl(var(--accent))'
                    : 'hsl(var(--primary-foreground) / 0.85)',
                  backgroundColor: selected
                    ? 'hsl(var(--accent))'
                    : 'transparent',
                  color: selected
                    ? 'hsl(var(--accent-foreground))'
                    : 'hsl(var(--primary-foreground))',
                }}
              >
                <span
                  aria-hidden
                  className="inline-block rounded-full border-2 transition-all"
                  style={{
                    width: '28px',
                    height: '28px',
                    borderColor: selected
                      ? 'hsl(var(--accent-foreground))'
                      : 'hsl(var(--primary-foreground))',
                    backgroundColor: selected
                      ? 'hsl(var(--accent-foreground))'
                      : 'transparent',
                    boxShadow: selected ? 'inset 0 0 0 6px hsl(var(--accent))' : 'none',
                  }}
                />
                <span className="flex-1 text-left">{opt}</span>
              </button>
            );
          })}
        </div>
      );
    }
    ```

    Crear `src/components/survey/question-multi-choice.tsx`:

    ```tsx
    'use client';

    interface Props {
      value: string[] | null;
      onChange: (v: string[]) => void;
      options: string[];
    }

    function CheckIcon() {
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="5 12 10 17 19 7" />
        </svg>
      );
    }

    export function QuestionMultiChoice({ value, onChange, options }: Props) {
      const selected = value ?? [];
      const toggle = (opt: string) => {
        if (selected.includes(opt)) {
          onChange(selected.filter((v) => v !== opt));
        } else {
          onChange([...selected, opt]);
        }
      };
      return (
        <div className="mx-auto flex flex-col" style={{ gap: '14px', maxWidth: '560px' }}>
          {options.map((opt) => {
            const isChecked = selected.includes(opt);
            return (
              <button
                key={opt}
                type="button"
                role="checkbox"
                aria-checked={isChecked}
                onClick={() => toggle(opt)}
                className="flex items-center rounded-full border-2 font-sans font-semibold transition-all"
                style={{
                  height: '72px',
                  paddingLeft: '24px',
                  paddingRight: '24px',
                  gap: '16px',
                  fontSize: '22px',
                  borderColor: isChecked
                    ? 'hsl(var(--accent))'
                    : 'hsl(var(--primary-foreground) / 0.85)',
                  backgroundColor: isChecked ? 'hsl(var(--accent))' : 'transparent',
                  color: isChecked
                    ? 'hsl(var(--accent-foreground))'
                    : 'hsl(var(--primary-foreground))',
                }}
              >
                <span
                  aria-hidden
                  className="inline-flex items-center justify-center rounded-md border-2 transition-all"
                  style={{
                    width: '28px',
                    height: '28px',
                    borderColor: isChecked
                      ? 'hsl(var(--accent-foreground))'
                      : 'hsl(var(--primary-foreground))',
                    backgroundColor: isChecked
                      ? 'hsl(var(--accent-foreground))'
                      : 'transparent',
                    color: isChecked ? 'hsl(var(--accent))' : 'transparent',
                  }}
                >
                  {isChecked ? <CheckIcon /> : null}
                </span>
                <span className="flex-1 text-left">{opt}</span>
              </button>
            );
          })}
        </div>
      );
    }
    ```
  </action>
  <verify>
    - `pnpm typecheck` + `pnpm lint` limpios.
    - Ambos archivos exportan sus componentes.
  </verify>
  <done>
    2 componentes creados.
    Typecheck + lint limpios.
  </done>
</task>

<task type="auto">
  <name>Crear question-text (textarea + OnScreenKeyboard)</name>
  <files>src/components/survey/question-text.tsx</files>
  <action>
    Crear `src/components/survey/question-text.tsx`. Reusa `OnScreenKeyboard` de `src/components/home/on-screen-keyboard.tsx`. Leer primero su API exacta:

    ```bash
    grep -n "export\|interface\|Props" src/components/home/on-screen-keyboard.tsx | head -10
    ```

    Basándonos en que `OnScreenKeyboard` expone `value` + `onChange` (o patrón similar — verificar al ejecutar):

    ```tsx
    'use client';

    import { OnScreenKeyboard } from '@/components/home/on-screen-keyboard';

    interface Props {
      value: string | null;
      onChange: (v: string) => void;
      placeholder?: string;
      maxLength?: number;
      counterTemplate: string; // ej. "{count}/{max}"
    }

    export function QuestionText({
      value,
      onChange,
      placeholder,
      maxLength = 500,
      counterTemplate,
    }: Props) {
      const current = value ?? '';
      const counter = counterTemplate
        .replace('{count}', String(current.length))
        .replace('{max}', String(maxLength));

      return (
        <div className="mx-auto flex flex-col" style={{ gap: '16px', maxWidth: '720px' }}>
          <div className="relative">
            <textarea
              value={current}
              onChange={(e) => onChange(e.target.value.slice(0, maxLength))}
              placeholder={placeholder}
              readOnly
              className="w-full resize-none rounded-2xl bg-primary-foreground/10 font-sans text-primary-foreground outline-none placeholder:text-primary-foreground/50"
              style={{
                height: '220px',
                padding: '20px',
                fontSize: '22px',
                borderColor: 'hsl(var(--primary-foreground) / 0.3)',
                borderWidth: '2px',
              }}
            />
            <span
              className="absolute font-sans text-primary-foreground"
              style={{ right: '14px', bottom: '10px', fontSize: '14px', opacity: 0.65 }}
            >
              {counter}
            </span>
          </div>
          <OnScreenKeyboard
            value={current}
            onChange={(next) => onChange(String(next).slice(0, maxLength))}
          />
        </div>
      );
    }
    ```

    **Importante — contrato de `OnScreenKeyboard`:** si al leer su API resulta que NO acepta `value`+`onChange` directamente, envolverlo en un wrapper adaptador dentro de este archivo. No modificar `on-screen-keyboard.tsx`. Si hay divergencia significativa, documentar en el SUMMARY de la fase y proponer un wrapper específico.

    `readOnly` en el textarea porque el foco del OnScreenKeyboard gobierna el input; el textarea es solo display.
  </action>
  <verify>
    - `pnpm typecheck` pasa (el typecheck revelará si la API de OnScreenKeyboard difiere — ajustar según).
    - `pnpm lint` limpio.
    - Archivo existe.
  </verify>
  <done>
    Componente creado.
    Typecheck + lint limpios.
    OnScreenKeyboard integrado (o adaptador documentado).
  </done>
</task>

<task type="auto">
  <name>Crear question-contact (email / phone subsecciones)</name>
  <files>src/components/survey/question-contact.tsx</files>
  <action>
    Crear `src/components/survey/question-contact.tsx`. Reusa `OnScreenKeyboard` (email) y `NumericKeypad` (`src/components/listings/numeric-keypad.tsx`) para phone. Verifica primero la API de `NumericKeypad`.

    ```tsx
    'use client';

    import { useState } from 'react';

    import { OnScreenKeyboard } from '@/components/home/on-screen-keyboard';
    import { NumericKeypad } from '@/components/listings/numeric-keypad';

    interface Props {
      email: boolean;
      phone: boolean;
      value: { email?: string; phone?: string };
      onChange: (next: { email?: string; phone?: string }) => void;
      emailLabel: string;
      phoneLabel: string;
      disclaimer: string;
    }

    type Focus = 'email' | 'phone';

    export function QuestionContact({
      email,
      phone,
      value,
      onChange,
      emailLabel,
      phoneLabel,
      disclaimer,
    }: Props) {
      const initialFocus: Focus = email ? 'email' : 'phone';
      const [focus, setFocus] = useState<Focus>(initialFocus);

      const showEmail = email;
      const showPhone = phone;

      return (
        <div className="mx-auto flex flex-col" style={{ gap: '20px', maxWidth: '720px' }}>
          {showEmail ? (
            <div>
              <label
                className="mb-2 block font-sans font-semibold text-primary-foreground"
                style={{ fontSize: '18px' }}
              >
                {emailLabel}
              </label>
              <input
                type="email"
                value={value.email ?? ''}
                onClick={() => setFocus('email')}
                onChange={(e) => onChange({ ...value, email: e.target.value })}
                readOnly
                className="w-full rounded-full bg-primary-foreground/10 font-sans text-primary-foreground outline-none"
                style={{
                  height: '64px',
                  paddingLeft: '24px',
                  paddingRight: '24px',
                  fontSize: '22px',
                  borderColor:
                    focus === 'email'
                      ? 'hsl(var(--accent))'
                      : 'hsl(var(--primary-foreground) / 0.3)',
                  borderWidth: '2px',
                }}
              />
            </div>
          ) : null}

          {showPhone ? (
            <div>
              <label
                className="mb-2 block font-sans font-semibold text-primary-foreground"
                style={{ fontSize: '18px' }}
              >
                {phoneLabel}
              </label>
              <input
                type="tel"
                value={value.phone ?? ''}
                onClick={() => setFocus('phone')}
                onChange={(e) => onChange({ ...value, phone: e.target.value })}
                readOnly
                className="w-full rounded-full bg-primary-foreground/10 font-sans text-primary-foreground outline-none"
                style={{
                  height: '64px',
                  paddingLeft: '24px',
                  paddingRight: '24px',
                  fontSize: '22px',
                  borderColor:
                    focus === 'phone'
                      ? 'hsl(var(--accent))'
                      : 'hsl(var(--primary-foreground) / 0.3)',
                  borderWidth: '2px',
                }}
              />
            </div>
          ) : null}

          {focus === 'email' && showEmail ? (
            <OnScreenKeyboard
              value={value.email ?? ''}
              onChange={(next) => onChange({ ...value, email: String(next) })}
            />
          ) : null}

          {focus === 'phone' && showPhone ? (
            <NumericKeypad
              value={value.phone ?? ''}
              onChange={(next: string) => onChange({ ...value, phone: next })}
            />
          ) : null}

          <p
            className="mt-2 text-center font-sans text-primary-foreground"
            style={{ fontSize: '14px', opacity: 0.65 }}
          >
            {disclaimer}
          </p>
        </div>
      );
    }
    ```

    **Nota API:** verificar exact props de `OnScreenKeyboard` y `NumericKeypad`. Si alguna espera diferente (`onKey`, `onText`, etc.), adaptar aquí sin tocar los componentes originales.
  </action>
  <verify>
    - `pnpm typecheck` pasa (ajustar props si difieren).
    - `pnpm lint` limpio.
    - Archivo existe.
  </verify>
  <done>
    Componente creado con subsecciones condicionales email/phone.
    Typecheck + lint limpios.
  </done>
</task>

<task type="auto">
  <name>Crear survey-question (switch) + wiring en survey-overlay</name>
  <files>src/components/survey/survey-question.tsx, src/components/survey/survey-overlay.tsx</files>
  <action>
    **Paso 1:** Crear `src/components/survey/survey-question.tsx`:

    ```tsx
    'use client';

    import type { SurveyQuestion } from '@/lib/config';
    import type { SurveyAnswer } from '@/lib/survey';

    import { QuestionMultiChoice } from './question-multi-choice';
    import { QuestionNps } from './question-nps';
    import { QuestionRating } from './question-rating';
    import { QuestionSingleChoice } from './question-single-choice';
    import { QuestionText } from './question-text';

    interface Props {
      question: SurveyQuestion;
      value: SurveyAnswer;
      onChange: (value: SurveyAnswer) => void;
      counterTemplate: string;
    }

    export function SurveyQuestionView({ question, value, onChange, counterTemplate }: Props) {
      switch (question.type) {
        case 'nps':
          return (
            <QuestionNps
              value={typeof value === 'number' ? value : null}
              onChange={(v) => onChange(v)}
              labels={question.labels}
            />
          );
        case 'rating':
          return (
            <QuestionRating
              value={typeof value === 'number' ? value : null}
              onChange={(v) => onChange(v)}
              max={question.max ?? 5}
            />
          );
        case 'single-choice':
          return (
            <QuestionSingleChoice
              value={typeof value === 'string' ? value : null}
              onChange={(v) => onChange(v)}
              options={question.options}
            />
          );
        case 'multi-choice':
          return (
            <QuestionMultiChoice
              value={Array.isArray(value) ? value : null}
              onChange={(v) => onChange(v)}
              options={question.options}
            />
          );
        case 'text':
          return (
            <QuestionText
              value={typeof value === 'string' ? value : null}
              onChange={(v) => onChange(v)}
              maxLength={question.maxLength ?? 500}
              counterTemplate={counterTemplate}
            />
          );
      }
    }
    ```

    **Paso 2:** modificar `src/components/survey/survey-overlay.tsx` para reemplazar el bloque placeholder:

    Remover:
    ```tsx
    <div className="mb-4" style={{ minHeight: '420px' }}>
      {/* Las variantes concretas se conectan en task 14 vía SurveyQuestion. */}
      <div className="text-center font-display font-bold" style={{ fontSize: '28px' }}>
        {currentQuestion ? currentQuestion.prompt : textos.survey_contact_email_label}
      </div>
      <div className="mt-4 text-center text-sm opacity-60">
        [placeholder — question variant task 14]
      </div>
    </div>
    ```

    Reemplazar con (asumiendo imports añadidos):

    ```tsx
    <div className="mb-4" style={{ minHeight: '420px' }}>
      {currentQuestion ? (
        <>
          <h2
            className="mb-8 text-center font-display font-bold"
            style={{ fontSize: '34px', lineHeight: 1.2 }}
          >
            {currentQuestion.prompt}
          </h2>
          <SurveyQuestionView
            question={currentQuestion}
            value={answers[currentQuestion.id] ?? null}
            onChange={(v) => setAnswer(currentQuestion.id, v)}
            counterTemplate={textos.survey_text_counter}
          />
        </>
      ) : config.contactCapture ? (
        <QuestionContact
          email={config.contactCapture.email ?? false}
          phone={config.contactCapture.phone ?? false}
          value={contact}
          onChange={setContact}
          emailLabel={textos.survey_contact_email_label}
          phoneLabel={textos.survey_contact_phone_label}
          disclaimer={config.contactCapture.disclaimer}
        />
      ) : null}
    </div>
    ```

    Añadir los imports nuevos arriba del archivo:

    ```tsx
    import { QuestionContact } from './question-contact';
    import { SurveyQuestionView } from './survey-question';
    ```
  </action>
  <verify>
    - `pnpm typecheck` + `pnpm lint` limpios.
    - `grep -n "SurveyQuestionView\|QuestionContact" src/components/survey/survey-overlay.tsx` muestra el wiring.
    - No queda el comentario "placeholder — question variant task 14" en el overlay.
  </verify>
  <done>
    Switch creado, overlay wireado a las 6 variantes (5 questions + contact).
    Typecheck + lint limpios.
  </done>
</task>

<task type="auto">
  <name>Commit ola 3 (question variants)</name>
  <files>src/components/survey/question-*.tsx, src/components/survey/survey-question.tsx, src/components/survey/survey-overlay.tsx</files>
  <action>
    ```bash
    git add src/components/survey/question-nps.tsx \
            src/components/survey/question-rating.tsx \
            src/components/survey/question-single-choice.tsx \
            src/components/survey/question-multi-choice.tsx \
            src/components/survey/question-text.tsx \
            src/components/survey/question-contact.tsx \
            src/components/survey/survey-question.tsx \
            src/components/survey/survey-overlay.tsx
    git commit -m "feat(survey): 5 question variants + contact step + switch wireado

Fase 3.9 ola 3 (questions). Implementa las 5 variantes del survey:
NPS 0-10, rating 1-5 estrellas, single/multi choice pills, text con
OnScreenKeyboard reusado, contact step con email (QWERTY) y phone
(NumericKeypad) en subsecciones condicionales. SurveyQuestionView
discrimina por type. Overlay wireado — fin del placeholder."
    ```
  </action>
  <verify>
    - `git log -1 --oneline` muestra el commit de ola 3.
    - `git status --short` limpio de survey/.
  </verify>
  <done>
    Commit creado.
    Tree limpio.
  </done>
</task>

<task type="auto">
  <name>Modificar CategoryTile para soportar onClick callback</name>
  <files>src/components/home/category-tile.tsx</files>
  <action>
    Abrir `src/components/home/category-tile.tsx`. Añadir prop opcional `onClick?: () => void`. Si está presente, renderizar `<button>` en lugar de `<Link>`. Si no, mantener el `<Link>` default.

    Reemplazar el componente completo:

    ```tsx
    'use client';

    import Link from 'next/link';

    import type { HomeTile } from '@/lib/config';

    interface Props {
      tile: HomeTile;
      /** Si se provee, el tile dispara el callback en lugar de navegar. */
      onClick?: () => void;
    }

    /**
     * Tile 460×460 rx=9 verbatim del SVG Dashboard. Foto + overlay #11100d al
     * 35.2% + label centrado. Click navega a /home/{key} por default, o dispara
     * onClick si se provee (patrón para overlays como Survey).
     */
    export function CategoryTile({ tile, onClick }: Props) {
      const content = (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={tile.image} alt="" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0" style={{ backgroundColor: 'rgba(17,16,13,0.352)' }} />
          <span
            className="absolute flex items-center justify-center text-center font-display font-bold uppercase leading-[1.22] text-white"
            style={{
              left: '0',
              right: '0',
              top: '0',
              bottom: '0',
              fontSize: '50px',
              letterSpacing: '0.02em',
              whiteSpace: 'pre-line',
            }}
          >
            {tile.label.toUpperCase()}
          </span>
        </>
      );

      const sharedClassName =
        'relative block overflow-hidden focus:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-white';
      const sharedStyle = { width: '460px', height: '460px', borderRadius: '9px' };

      if (onClick) {
        return (
          <button type="button" onClick={onClick} className={sharedClassName} style={sharedStyle}>
            {content}
          </button>
        );
      }

      return (
        <Link href={`/home/${tile.key}`} className={sharedClassName} style={sharedStyle}>
          {content}
        </Link>
      );
    }
    ```

    **Marcar `'use client'`** porque la variante button usa `onClick`.
  </action>
  <verify>
    - `pnpm typecheck` + `pnpm lint` limpios.
    - `grep -n "onClick\?: () => void" src/components/home/category-tile.tsx` lo muestra.
  </verify>
  <done>
    CategoryTile acepta prop opcional onClick.
    Default sigue siendo Link.
    Typecheck + lint limpios.
  </done>
</task>

<task type="auto">
  <name>Modificar CategoryGrid + HomeShell + home/page.tsx para orquestar el overlay</name>
  <files>src/components/home/category-grid.tsx, src/components/home/home-shell.tsx, src/app/(kiosk)/home/page.tsx</files>
  <action>
    **Paso 1:** `src/components/home/category-grid.tsx` — aceptar callback:

    ```tsx
    import type { HomeTile } from '@/lib/config';

    import { CategoryTile } from './category-tile';

    interface Props {
      tiles: readonly HomeTile[];
      /** Callback para el tile cuya key === 'survey'. Si null, tile actúa como link normal. */
      onSurveyTap?: () => void;
    }

    export function CategoryGrid({ tiles, onSurveyTap }: Props) {
      return (
        <div
          className="grid grid-cols-2"
          style={{
            columnGap: '30px',
            rowGap: '30px',
            width: '950px',
            marginLeft: '64px',
            marginRight: '66px',
          }}
        >
          {tiles.map((tile) => (
            <CategoryTile
              key={tile.key}
              tile={tile}
              onClick={tile.key === 'survey' && onSurveyTap ? onSurveyTap : undefined}
            />
          ))}
        </div>
      );
    }
    ```

    **Paso 2:** `src/components/home/home-shell.tsx` — añadir state + render overlay. Abrir el archivo y modificar para que acepte la config del survey y los textos, y renderice SurveyOverlay cuando `surveyOpen`:

    Modificar signature + body (referencia — conservar la lógica de SearchBar existente):

    ```tsx
    'use client';

    import type { ReactNode } from 'react';
    import { useState } from 'react';

    import { SurveyOverlay } from '@/components/survey/survey-overlay';
    import type { HomeListing, SurveyConfig } from '@/lib/config';

    import { SearchBar } from './search-bar';
    import { SearchOverlay } from './search-overlay';

    export function HomeShell({
      header,
      listings,
      survey,
      client,
      textos,
      children,
    }: {
      header: ReactNode;
      listings: readonly HomeListing[];
      survey?: SurveyConfig;
      client: { slug: string; logo?: string };
      textos: Record<string, string>;
      children: (handlers: { onSurveyTap?: () => void }) => ReactNode;
    }) {
      const [searchOpen, setSearchOpen] = useState(false);
      const [surveyOpen, setSurveyOpen] = useState(false);

      const openSurvey = survey?.enabled ? () => setSurveyOpen(true) : undefined;

      return (
        <div
          className="relative flex h-full w-full flex-col overflow-hidden"
          style={{ backgroundColor: '#f8f8f8' }}
        >
          {header}
          <SearchBar onOpen={() => setSearchOpen(true)} />
          <main
            className="scrollbar-hide flex-1 overflow-y-auto overflow-x-hidden overscroll-contain"
            style={{ paddingTop: '40px', paddingBottom: '120px' }}
          >
            {children({ onSurveyTap: openSurvey })}
          </main>
          <div
            aria-hidden
            className="pointer-events-none absolute bottom-0 left-0 right-0 z-20"
            style={{
              height: '180px',
              background:
                'linear-gradient(to top, #f8f8f8 0%, rgba(248,248,248,0.85) 30%, rgba(248,248,248,0) 100%)',
            }}
          />
          {searchOpen ? (
            <SearchOverlay listings={listings} onClose={() => setSearchOpen(false)} />
          ) : null}
          {surveyOpen && survey ? (
            <SurveyOverlay
              config={survey}
              client={client}
              textos={textos}
              onClose={() => setSurveyOpen(false)}
            />
          ) : null}
        </div>
      );
    }
    ```

    **Cambio de API:** `children` pasa de `ReactNode` a render-prop `(handlers) => ReactNode`. Esto permite inyectar el callback al grid sin wrappers. Efecto colateral — `page.tsx` del home debe adaptar.

    **Paso 3:** `src/app/(kiosk)/home/page.tsx` — pasar survey + client + textos al shell, y usar render-prop:

    Modificar el componente `HomePage`:

    ```tsx
    import { AdsSlot } from '@/components/ads/ads-slot';
    import { CategoryGrid } from '@/components/home/category-grid';
    import { HomeHeader } from '@/components/home/header';
    import { HomeShell } from '@/components/home/home-shell';
    import { KioskCanvas } from '@/components/kiosk-canvas';
    import { getAdsFromConfig } from '@/lib/ads';
    import { getConfig, type HomeTile } from '@/lib/config';

    export default async function HomePage() {
      const config = await getConfig();
      const home = config.features?.home;
      if (!home) {
        return (
          <KioskCanvas>
            <div className="p-12 text-center text-xl font-semibold text-gray-700">
              El cliente activo no tiene configurado `features.home`.
            </div>
          </KioskCanvas>
        );
      }
      const ads = getAdsFromConfig(config);
      const tiles: HomeTile[] = home.tiles.filter((t) => t.enabled);
      if (home.wayfinding?.enabled) {
        tiles.push({
          key: 'wayfinding',
          label: home.wayfinding.label,
          enabled: true,
          image: home.wayfinding.image,
        });
      }
      return (
        <KioskCanvas>
          <HomeShell
            header={<HomeHeader />}
            listings={home.listings}
            survey={home.survey}
            client={{ slug: config.client.slug, logo: config.branding.logo.default }}
            textos={config.textos}
          >
            {({ onSurveyTap }) => <CategoryGrid tiles={tiles} onSurveyTap={onSurveyTap} />}
          </HomeShell>
          <AdsSlot ads={ads} />
        </KioskCanvas>
      );
    }
    ```

    **Nota sobre el shape:** `config.client` hoy expone `{ slug, nombre, locale, timezone?, coords? }` (sin logo). El logo del cliente vive en `config.branding.logo.default`. `config.textos` es `Record<string, string>` required (no optional). Por eso el plan pasa `logo: config.branding.logo.default` y `textos: config.textos` sin fallback.
  </action>
  <verify>
    - `pnpm typecheck` + `pnpm lint` limpios.
    - `grep -n "SurveyOverlay" src/components/home/home-shell.tsx` lo muestra.
    - `grep -n "onSurveyTap" src/components/home/category-grid.tsx src/app/\(kiosk\)/home/page.tsx` lo muestra en ambos.
  </verify>
  <done>
    Orquestación completa: tile Survey dispara overlay desde HomeShell.
    Render-prop adaptado en home/page.tsx.
    Typecheck + lint limpios.
  </done>
</task>

<task type="auto">
  <name>Verificación visual + auditor white-label + commit final</name>
  <files>.planning/verifications/3-9-survey-*.png, .planning/3-9-SUMMARY.md</files>
  <action>
    **Paso 1:** `pnpm check` limpio (typecheck + lint + format).

    **Paso 2:** `pnpm kiosk:dev` en background. Abrir Playwright MCP (o browser manual) en `http://localhost:3000/home`.

    **Paso 3:** Test flow completo:
    - Tap tile "Survey" → overlay monta. Screenshot `.planning/verifications/3-9-survey-step1-nps.png`.
    - Tap "9" en NPS → olive ring, Next habilitado.
    - Next → step 2 rating. Screenshot `3-9-survey-step2-rating.png`.
    - Tap 4 estrellas → 4 filled. Next.
    - Step 3 single-choice. Screenshot `3-9-survey-step3-single.png`. Tap "Tourism" → filled. Next.
    - Step 4 multi-choice. Screenshot `3-9-survey-step4-multi.png`. Tap "Food" + "Events" → ambas filled. Next.
    - Step 5 text. Screenshot `3-9-survey-step5-text.png`. Foco en textarea → OnScreenKeyboard visible. Escribir "great!" → counter "6/500". Tap SEND FEEDBACK.
    - Thank-you visible con countdown. Screenshot `3-9-survey-thankyou.png`. Esperar 5s → overlay cierra, home visible.
    - Re-abrir survey, responder step 1, tap backdrop → confirm-exit. Screenshot `3-9-survey-exit-confirm.png`. Cancel mantiene. Re-tap backdrop → Exit → cierra.
    - DevTools console: verificar log `[kiosk:survey]` con shape correcto.
    - `window.addEventListener('kiosk:survey-submitted', (e) => console.log(e.detail))` → al enviar otro survey, detail coincide con shape.

    **Paso 4:** `KIOSK_CLIENT=demo-cliente-a pnpm kiosk:dev` → abrir survey → card naranja (primary del demo). Screenshot `3-9-survey-demo-cliente-a.png`.

    **Paso 5:** Auditar white-label:
    ```bash
    grep -REn "#[0-9a-fA-F]{3,8}" src/components/survey/
    ```
    Esperado: 0 resultados (o sólo comentarios documentales).

    Invocar subagent `auditor-white-label` con foco en `src/components/survey/**/*.tsx` y `src/app/(kiosk)/home/page.tsx`. Resolver hallazgos críticos antes del commit.

    **Paso 6:** Crear `.planning/3-9-SUMMARY.md` con:
    - Qué se hizo.
    - Qué se verificó (con links a los screenshots).
    - Pendientes / próximos.
    - Decisiones tomadas durante la ejecución.

    **Paso 7:** Commit final:

    ```bash
    git add src/components/home/category-tile.tsx \
            src/components/home/category-grid.tsx \
            src/components/home/home-shell.tsx \
            src/app/\(kiosk\)/home/page.tsx \
            .planning/3-9-SUMMARY.md \
            .planning/verifications/3-9-survey-*.png
    git commit -m "feat(survey): integración home + verificación visual

Fase 3.9 ola 4 (integration). Tile Survey del Home dispara el
overlay modal. Render-prop en HomeShell permite pasar el callback
al CategoryTile sin wrappers. Verificación visual con Playwright:
6 screenshots cubriendo los 5 tipos de pregunta, thank-you,
confirm-exit y branding por cliente (default + demo-cliente-a).
Auditor white-label sin hallazgos críticos."
    ```
  </action>
  <verify>
    - `pnpm check` limpio.
    - Los 7+ screenshots existen en `.planning/verifications/`.
    - `git log -3 --oneline` muestra los 4 commits de la fase 3.9.
    - `grep -REn "#[0-9a-fA-F]{3,8}" src/components/survey/` sin resultados.
    - Navegar `/home` con `KIOSK_CLIENT=demo-cliente-a` muestra card naranja sin edits en .tsx.
  </verify>
  <done>
    Módulo Survey funcional, 6 tipos (5 questions + contact) operativos.
    White-label respetado.
    Screenshots evidencian el flow completo en 2 clientes.
    SUMMARY.md escrito.
    Commit de cierre hecho.
  </done>
</task>

---

## Checklist de cierre de fase

Al completar los 17 tasks:

- [ ] 4 commits en `git log` (uno por ola).
- [ ] `pnpm check` limpio.
- [ ] Cero hex en `src/components/survey/` (salvo `rgba(0,0,0,*)` de opacidad documentada).
- [ ] 7+ screenshots en `.planning/verifications/3-9-survey-*.png`.
- [ ] `.planning/3-9-SUMMARY.md` escrito.
- [ ] Auditor white-label sin hallazgos críticos.
- [ ] Al ejecutar `/terminar`, `STATE.md` se actualiza con la entrada de la sesión.

## Riesgos + mitigaciones

| Riesgo | Mitigación |
|---|---|
| API de `OnScreenKeyboard` / `NumericKeypad` no encaja con los props asumidos | Task 12/13 lo detecta primero via `grep`. Adaptar con wrapper en el archivo del question; nunca modificar el componente shared. |
| El `config.textos` no contiene las claves `survey_*` | Task 2 las añade explícitamente. El overlay accede via `textos.survey_back` etc. — si falta una, Next.js muestra `undefined` en UI (detectado en Playwright del task 21). |
| El tile "Survey" renderiza antes de que el `survey.enabled` sea true | CategoryGrid sólo pasa `onSurveyTap` si el home lo recibió. Tile sin callback vuelve a Link → stub "Coming soon" (comportamiento documentado). |
| Thank-you countdown con tab inactiva | React sigue ejecutando `setTimeout` en background. Al volver, overlay cierra. Edge case aceptado, documentado en spec §8. |
| Textarea no arroja `focus()` automático | El `OnScreenKeyboard` monta siempre en paso text; el input es `readOnly` y no necesita foco nativo. |
