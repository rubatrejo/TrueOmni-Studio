'use client';

import { useCallback, useEffect, useState } from 'react';

import { useTextosMap } from '@/components/i18n-provider';
import type { SurveyConfig, SurveyQuestion } from '@/lib/config';
import {
  buildResult,
  dispatchResult,
  hasAnyAnswer,
  isAnswered,
  totalSteps,
  type SurveyAnswer,
} from '@/lib/survey';

import { PwaAlertModal } from './pwa-alert-modal';
import { PwaSurveyContact, PwaSurveyQuestion } from './pwa-survey-question';

const PRIMARY = 'hsl(var(--pwa-primary))';
const SHEET_BG = 'hsl(var(--pwa-sheet-bg))';
const FG = 'hsl(var(--foreground))';
const MUTED = 'hsl(var(--foreground) / 0.6)';
const OPEN_SANS = 'var(--font-open-sans)';

interface Props {
  config: SurveyConfig;
  clientSlug: string;
  onClose: () => void;
}

/**
 * Survey de la PWA — **popup/overlay** (mobile) disparado desde el More. Réplica
 * mobile del overlay del kiosk (`components/survey/survey-overlay.tsx`): wizard
 * de una pregunta por paso con pantalla de bienvenida + thank-you. Reutiliza los
 * tipos (`SurveyConfig`) y la lógica (`@/lib/survey`); el contenido sale del kiosk
 * (`features.home.survey`). Cubre el canvas con backdrop; sin bottom nav.
 */
export function PwaSurveyOverlay({ config, clientSlug, onClose }: Props) {
  const textos = useTextosMap();
  const total = totalSteps(config);
  const [started, setStarted] = useState(false);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, SurveyAnswer>>({});
  const [contact, setContact] = useState<{ email?: string; phone?: string }>({});
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const isContactStep = config.contactCapture?.enabled === true && step === config.questions.length;
  const isLastStep = step === total - 1;
  const currentQuestion: SurveyQuestion | undefined = isContactStep
    ? undefined
    : config.questions[step];

  const requestClose = useCallback(() => {
    if (submitted || !hasAnyAnswer(answers)) {
      onClose();
      return;
    }
    setShowExitConfirm(true);
  }, [answers, onClose, submitted]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') requestClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [requestClose]);

  const handleBack = useCallback(() => {
    if (step === 0) setStarted(false);
    else setStep((s) => Math.max(0, s - 1));
  }, [step]);

  const handleNext = useCallback(() => {
    if (isLastStep) {
      dispatchResult(buildResult(clientSlug, answers, contact));
      setSubmitted(true);
      return;
    }
    setStep((s) => Math.min(total - 1, s + 1));
  }, [answers, clientSlug, contact, isLastStep, total]);

  const setAnswer = useCallback(
    (id: string, value: SurveyAnswer) => setAnswers((p) => ({ ...p, [id]: value })),
    [],
  );

  const nextDisabled =
    !isContactStep &&
    (!currentQuestion || !isAnswered(currentQuestion, answers[currentQuestion.id] ?? null));
  const nextLabel = isLastStep ? textos.survey_send : textos.survey_next;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <button
        type="button"
        aria-label={textos.survey_exit_confirm_title}
        onClick={requestClose}
        className="pwa-sheet-backdrop-anim absolute inset-0 cursor-default"
        style={{ backgroundColor: 'rgba(18,18,18,0.55)' }}
      />

      {/* Card — centrado. El slide de bienvenida es más bajo (28%); al avanzar
          crece a 40%. Se oculta (opacity) cuando se abre el confirm de salida.
          `data-kb-lift`: al enfocar el textarea del último paso, el teclado eleva
          el card por su borde inferior dejando `data-kb-margin` px de gap. */}
      <div
        data-kb-lift
        data-kb-margin="40"
        className="pwa-sheet-up-anim relative flex w-[calc(100%-24px)] flex-col overflow-hidden rounded-[20px] shadow-2xl"
        style={{
          height: !started && !submitted ? '28%' : '40%',
          backgroundColor: SHEET_BG,
          opacity: showExitConfirm ? 0 : 1,
          pointerEvents: showExitConfirm ? 'none' : undefined,
          transition: 'height 220ms cubic-bezier(0.2,0.8,0.2,1), opacity 160ms ease',
        }}
      >
        {/* Header: X + progreso */}
        <div className="relative flex shrink-0 items-center justify-center pb-2 pt-4">
          {started && !submitted ? (
            <div className="flex items-center gap-1.5">
              {Array.from({ length: total }, (_, i) => (
                <span
                  key={i}
                  className="rounded-full transition-all"
                  style={{
                    width: i === step ? 14 : 6,
                    height: 6,
                    backgroundColor: i === step ? PRIMARY : 'hsl(var(--foreground) / 0.18)',
                  }}
                />
              ))}
            </div>
          ) : null}
          <button
            type="button"
            aria-label={textos.survey_exit_confirm_title}
            onClick={requestClose}
            className="absolute flex items-center justify-center rounded-full"
            style={{
              top: 12,
              right: 14,
              width: 32,
              height: 32,
              backgroundColor: 'hsl(var(--foreground) / 0.06)',
            }}
          >
            <svg width={14} height={14} viewBox="0 0 24 24" aria-hidden>
              <path d="M6 6l12 12M18 6L6 18" stroke={FG} strokeWidth="2.2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Cuerpo */}
        {submitted ? (
          <ThankYou
            title={config.thankYou.title}
            message={config.thankYou.message}
            countdownTemplate={textos.survey_thank_you_countdown}
            autoCloseMs={config.thankYou.autoCloseMs ?? 5000}
            doneLabel={textos.survey_done}
            onDone={onClose}
          />
        ) : !started ? (
          <Welcome
            title={config.intro.title}
            subtitle={config.intro.subtitle}
            startLabel={textos.survey_start}
            onStart={() => setStarted(true)}
          />
        ) : (
          <>
            <div className="scrollbar-hide flex flex-1 flex-col justify-center overflow-y-auto px-6 pb-4 pt-2">
              {currentQuestion ? (
                <h1
                  key={`title-${step}`}
                  className="survey-step-anim text-center font-bold"
                  style={{
                    fontSize: 15,
                    lineHeight: 1.2,
                    color: FG,
                    fontFamily: OPEN_SANS,
                    whiteSpace: 'pre-line',
                  }}
                >
                  {currentQuestion.prompt}
                </h1>
              ) : null}
              {currentQuestion?.subtitle ? (
                <p
                  key={`sub-${step}`}
                  className="survey-step-anim mt-2 text-center"
                  style={{ fontSize: 11, lineHeight: 1.45, color: MUTED, fontFamily: OPEN_SANS }}
                >
                  {currentQuestion.subtitle}
                </p>
              ) : null}
              <div
                key={`input-${step}`}
                className="survey-step-anim mt-4 flex flex-col items-center"
              >
                {currentQuestion ? (
                  <PwaSurveyQuestion
                    question={currentQuestion}
                    value={answers[currentQuestion.id] ?? null}
                    onChange={(v) => setAnswer(currentQuestion.id, v)}
                    counterTemplate={textos.survey_text_counter}
                  />
                ) : config.contactCapture ? (
                  <PwaSurveyContact
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
            </div>

            {/* Footer */}
            <div
              className="flex shrink-0 items-center gap-3 px-6 pb-7 pt-3"
              style={{ borderTop: '1px solid hsl(var(--foreground) / 0.08)' }}
            >
              <button
                type="button"
                onClick={handleBack}
                className="font-bold"
                style={{ fontSize: 12, color: PRIMARY, fontFamily: OPEN_SANS }}
              >
                {textos.survey_back}
              </button>
              <button
                type="button"
                onClick={handleNext}
                disabled={nextDisabled}
                className="ml-auto flex items-center justify-center rounded-full font-bold text-white disabled:opacity-40"
                style={{
                  minWidth: 104,
                  height: 38,
                  backgroundColor: PRIMARY,
                  fontSize: 12,
                  letterSpacing: '0.04em',
                  fontFamily: OPEN_SANS,
                }}
              >
                {nextLabel}
              </button>
            </div>
          </>
        )}
      </div>

      <PwaAlertModal
        open={showExitConfirm}
        onClose={() => setShowExitConfirm(false)}
        title={textos.survey_exit_confirm_title}
        body={textos.survey_exit_confirm_message}
        primaryCta={textos.survey_exit_confirm_cancel}
        onPrimary={() => setShowExitConfirm(false)}
        secondaryCta={textos.survey_exit_confirm_exit}
        onSecondary={() => {
          setShowExitConfirm(false);
          onClose();
        }}
        scale={0.85}
      />
    </div>
  );
}

function Welcome({
  title,
  subtitle,
  startLabel,
  onStart,
}: {
  title: string;
  subtitle?: string;
  startLabel: string;
  onStart: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-8 pb-8 text-center">
      <h1
        className="font-bold"
        style={{ fontSize: 21, lineHeight: 1.2, color: FG, fontFamily: OPEN_SANS }}
      >
        {title}
      </h1>
      {subtitle ? (
        <p
          className="mt-2.5"
          style={{ fontSize: 12, lineHeight: 1.5, color: MUTED, fontFamily: OPEN_SANS }}
        >
          {subtitle}
        </p>
      ) : null}
      <button
        type="button"
        onClick={onStart}
        className="mt-7 flex items-center justify-center rounded-full font-bold uppercase text-white"
        style={{
          width: '100%',
          maxWidth: 192,
          height: 42,
          backgroundColor: PRIMARY,
          fontSize: 13,
          letterSpacing: '0.06em',
          fontFamily: OPEN_SANS,
        }}
      >
        {startLabel}
      </button>
    </div>
  );
}

function ThankYou({
  title,
  message,
  countdownTemplate,
  autoCloseMs,
  doneLabel,
  onDone,
}: {
  title: string;
  message: string;
  countdownTemplate: string;
  autoCloseMs: number;
  doneLabel: string;
  onDone: () => void;
}) {
  const [remaining, setRemaining] = useState(Math.ceil(autoCloseMs / 1000));

  useEffect(() => {
    const id = setInterval(() => setRemaining((r) => r - 1), 1000);
    const close = setTimeout(onDone, autoCloseMs);
    return () => {
      clearInterval(id);
      clearTimeout(close);
    };
  }, [autoCloseMs, onDone]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-8 pb-8 text-center">
      <span
        className="mb-4 flex items-center justify-center rounded-full"
        style={{ width: 61, height: 61, backgroundColor: 'hsl(var(--pwa-primary) / 0.12)' }}
      >
        <svg width={32} height={32} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M5 13l4 4L19 7"
            stroke={PRIMARY}
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <h1
        className="font-bold"
        style={{ fontSize: 19, lineHeight: 1.2, color: FG, fontFamily: OPEN_SANS }}
      >
        {title}
      </h1>
      <p
        className="mt-2.5"
        style={{ fontSize: 12, lineHeight: 1.5, color: MUTED, fontFamily: OPEN_SANS }}
      >
        {message}
      </p>
      <button
        type="button"
        onClick={onDone}
        className="mt-7 flex items-center justify-center rounded-full font-bold uppercase text-white"
        style={{
          width: '100%',
          maxWidth: 192,
          height: 42,
          backgroundColor: PRIMARY,
          fontSize: 13,
          letterSpacing: '0.06em',
          fontFamily: OPEN_SANS,
        }}
      >
        {doneLabel}
      </button>
      <p className="mt-3.5" style={{ fontSize: 11, color: MUTED, fontFamily: OPEN_SANS }}>
        {countdownTemplate.replace('{seconds}', String(Math.max(0, remaining)))}
      </p>
    </div>
  );
}
