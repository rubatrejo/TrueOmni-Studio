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
 * Las question variants se conectan en ola 3 vía SurveyQuestionView.
 */
export function SurveyOverlay({ config, client, textos, onClose }: Props) {
  const total = totalSteps(config);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, SurveyAnswer>>({});
  // setContact se usa en ola 3 cuando se conecta QuestionContact.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [contact, setContact] = useState<{ email?: string; phone?: string }>({});
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const isContactStep = config.contactCapture?.enabled === true && step === config.questions.length;
  const isLastStep = step === total - 1;
  const currentQuestion: SurveyQuestion | undefined = isContactStep
    ? undefined
    : config.questions[step];

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

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleCloseRequest();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleCloseRequest]);

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

  // setAnswer se conecta en ola 3 vía SurveyQuestionView. Se define aquí
  // para no tener que reintroducir useState + callback al wirear.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const setAnswer = useCallback((id: string, value: SurveyAnswer) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  }, []);

  const nextDisabled = (() => {
    if (isContactStep) return false;
    if (!currentQuestion) return true;
    return !isAnswered(currentQuestion, answers[currentQuestion.id] ?? null);
  })();

  const nextLabel = isLastStep ? textos.survey_send : textos.survey_next;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center">
      <SurveyBackdrop onTap={handleCloseRequest} ariaLabel={textos.survey_exit_confirm_title} />
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
                <div className="text-center font-display font-bold" style={{ fontSize: '28px' }}>
                  {currentQuestion ? currentQuestion.prompt : textos.survey_contact_email_label}
                </div>
                <div className="mt-4 text-center text-sm opacity-60">
                  [placeholder — question variant ola 3]
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

// Exposed to be wired in ola 3.
export type { SurveyAnswer };
