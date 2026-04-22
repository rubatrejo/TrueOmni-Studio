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

import { QuestionContact } from './question-contact';
import { SurveyBackdrop } from './survey-backdrop';
import { SurveyCard } from './survey-card';
import { SurveyExitConfirm } from './survey-exit-confirm';
import { SurveyHeader } from './survey-header';
import { SurveyNavigation } from './survey-navigation';
import { SurveyProgress } from './survey-progress';
import { SurveyQuestionView } from './survey-question';
import { SurveyThankYou } from './survey-thank-you';

interface Props {
  config: SurveyConfig;
  client: { slug: string };
  textos: Record<string, string>;
  onClose: () => void;
}

/**
 * Root cinematic del survey. Card altura fija (1440px) con 3 zonas verticales:
 *   - top (progress + X)
 *   - center (intro + question como H1 display + input)
 *   - bottom (navigation)
 * La zona de contenido es scrollable sólo si su altura excede — en práctica
 * todos los tipos caben dentro del slot reservado.
 */
export function SurveyOverlay({ config, client, textos, onClose }: Props) {
  const total = totalSteps(config);
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
      if (e.key === 'Escape') handleCloseRequest();
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
    <div className="absolute inset-0 z-[70] flex items-center justify-center">
      <div className="survey-backdrop-anim absolute inset-0">
        <SurveyBackdrop onTap={handleCloseRequest} ariaLabel={textos.survey_exit_confirm_title} />
      </div>
      <div className="relative">
        <SurveyCard>
          {/* TOP BAR — progress + X */}
          <div
            className="relative flex items-center justify-center"
            style={{ paddingTop: '72px', paddingLeft: '96px', paddingRight: '96px' }}
          >
            <SurveyProgress current={step} total={total} />
            <SurveyHeader
              onClose={handleCloseRequest}
              closeAriaLabel={textos.survey_exit_confirm_title}
            />
          </div>

          {/* CENTER — intro + question + input */}
          <div
            className="flex flex-1 flex-col items-center justify-center"
            style={{
              paddingLeft: '96px',
              paddingRight: '96px',
              paddingTop: '40px',
              paddingBottom: '40px',
            }}
          >
            {submitted ? (
              <SurveyThankYou
                title={config.thankYou.title}
                message={config.thankYou.message}
                countdownTemplate={textos.survey_thank_you_countdown}
                autoCloseMs={config.thankYou.autoCloseMs ?? 5000}
                onAutoClose={onClose}
              />
            ) : (
              <div
                key={`step-${step}`}
                className="survey-step-anim flex w-full flex-col items-center"
                style={{ gap: '56px' }}
              >
                {step === 0 && config.intro?.subtitle ? (
                  <p
                    className="text-center font-sans uppercase"
                    style={{
                      fontSize: '14px',
                      letterSpacing: '0.28em',
                      opacity: 0.75,
                      marginBottom: '-32px',
                    }}
                  >
                    {config.intro.title}
                  </p>
                ) : null}

                {/* Pregunta como H1 display — el título del paso */}
                {currentQuestion ? (
                  <h1
                    className="text-center font-display font-bold"
                    style={{
                      fontSize: '64px',
                      lineHeight: 1.08,
                      letterSpacing: '-0.02em',
                      maxWidth: '720px',
                    }}
                  >
                    {currentQuestion.prompt}
                  </h1>
                ) : (
                  <h1
                    className="text-center font-display font-bold"
                    style={{
                      fontSize: '56px',
                      lineHeight: 1.1,
                      letterSpacing: '-0.015em',
                      maxWidth: '720px',
                    }}
                  >
                    {textos.survey_contact_email_label.replace(' (optional)', '') ||
                      'Stay in touch'}
                  </h1>
                )}

                {/* Input area */}
                <div className="flex w-full flex-col items-center">
                  {currentQuestion ? (
                    <SurveyQuestionView
                      question={currentQuestion}
                      value={answers[currentQuestion.id] ?? null}
                      onChange={(v) => setAnswer(currentQuestion.id, v)}
                      counterTemplate={textos.survey_text_counter}
                    />
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
              </div>
            )}
          </div>

          {/* BOTTOM — navigation (hidden cuando submitted) */}
          {!submitted ? (
            <div
              style={{
                paddingLeft: '96px',
                paddingRight: '96px',
                paddingBottom: '72px',
                paddingTop: '24px',
              }}
            >
              <SurveyNavigation
                onBack={step > 0 ? handleBack : undefined}
                onNext={handleNext}
                backLabel={textos.survey_back}
                nextLabel={nextLabel}
                nextDisabled={nextDisabled}
                isLastStep={isLastStep}
              />
            </div>
          ) : null}
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

export type { SurveyAnswer };
