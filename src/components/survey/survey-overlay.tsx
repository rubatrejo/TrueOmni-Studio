'use client';

import { useCallback, useEffect, useState } from 'react';

import { OnScreenKeyboard, type KeyboardKey } from '@/components/home/on-screen-keyboard';
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
 * Root del survey. Card 768×806 arriba/centro. Cuando la pregunta es `text`,
 * el OnScreenKeyboard se monta FUERA del card, pegado al bottom del canvas
 * (mismo patrón visual que SearchOverlay y SendToEmailModal).
 */
export function SurveyOverlay({ config, client, textos, onClose }: Props) {
  const total = totalSteps(config);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, SurveyAnswer>>({});
  const [contact, setContact] = useState<{ email?: string; phone?: string }>({});
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [shift, setShift] = useState(false);

  const isContactStep = config.contactCapture?.enabled === true && step === config.questions.length;
  const isLastStep = step === total - 1;
  const currentQuestion: SurveyQuestion | undefined = isContactStep
    ? undefined
    : config.questions[step];
  const isTextStep = currentQuestion?.type === 'text';

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

  // Reset shift al cambiar de paso
  useEffect(() => {
    setShift(false);
  }, [step]);

  const handleExitConfirmed = useCallback(() => {
    setShowExitConfirm(false);
    onClose();
  }, [onClose]);

  const handleBack = useCallback(() => setStep((s) => Math.max(0, s - 1)), []);

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

  const handleTextKey = useCallback(
    (k: KeyboardKey) => {
      if (!currentQuestion || currentQuestion.type !== 'text') return;
      const maxLength = currentQuestion.maxLength ?? 500;
      const cur = (answers[currentQuestion.id] as string | null) ?? '';
      const append = (s: string) => setAnswer(currentQuestion.id, (cur + s).slice(0, maxLength));

      if (k === 'BACKSPACE') return setAnswer(currentQuestion.id, cur.slice(0, -1));
      if (k === 'SHIFT') return setShift((s) => !s);
      if (k === 'SPACE') return append(' ');
      if (k === 'ENTER') return append('\n');
      if (k === 'AT') return append('@');
      if (k === 'DOT_COM') return append('.com');
      if (k === 'CLOSE' || k === 'SYMBOLS') return;
      if (typeof k === 'string' && k.length === 1) {
        append(k);
        if (shift) setShift(false);
      }
    },
    [answers, currentQuestion, setAnswer, shift],
  );

  const nextDisabled = (() => {
    if (isContactStep) return false;
    if (!currentQuestion) return true;
    return !isAnswered(currentQuestion, answers[currentQuestion.id] ?? null);
  })();

  const nextLabel = isLastStep ? textos.survey_send : textos.survey_next;

  return (
    <div
      className="absolute inset-0 z-[70] flex items-center justify-center"
      style={{ paddingBottom: isTextStep ? '420px' : '0px' }}
    >
      <div className="survey-backdrop-anim absolute inset-0">
        <SurveyBackdrop onTap={handleCloseRequest} ariaLabel={textos.survey_exit_confirm_title} />
      </div>

      <div className="relative flex flex-col items-center">
        <SurveyCard>
          <SurveyHeader
            onClose={handleCloseRequest}
            closeAriaLabel={textos.survey_exit_confirm_title}
          />

          {submitted ? (
            <div
              className="flex flex-1 flex-col items-center justify-center"
              style={{ paddingLeft: '48px', paddingRight: '48px' }}
            >
              <SurveyThankYou
                title={config.thankYou.title}
                message={config.thankYou.message}
                countdownTemplate={textos.survey_thank_you_countdown}
                autoCloseMs={config.thankYou.autoCloseMs ?? 5000}
                onAutoClose={onClose}
              />
            </div>
          ) : (
            <>
              <div
                className="flex flex-col items-center"
                style={{
                  paddingTop: '92px',
                  paddingLeft: '56px',
                  paddingRight: '56px',
                  paddingBottom: '12px',
                  gap: '14px',
                }}
              >
                <h1
                  key={`title-${step}`}
                  className="survey-step-anim text-center font-display font-bold"
                  style={{
                    fontSize: '38px',
                    lineHeight: 1.1,
                    letterSpacing: '-0.015em',
                    maxWidth: '520px',
                  }}
                >
                  {currentQuestion ? currentQuestion.prompt : 'Stay in touch'}
                </h1>
                {currentQuestion?.subtitle ? (
                  <p
                    key={`sub-${step}`}
                    className="survey-step-anim text-center font-sans"
                    style={{
                      fontSize: '16px',
                      lineHeight: 1.45,
                      opacity: 0.82,
                      maxWidth: '540px',
                    }}
                  >
                    {currentQuestion.subtitle}
                  </p>
                ) : null}
              </div>

              <div
                className="flex flex-1 flex-col items-center justify-center"
                style={{ paddingLeft: '48px', paddingRight: '48px', paddingBottom: '16px' }}
              >
                <div
                  key={`input-${step}`}
                  className="survey-step-anim flex w-full flex-col items-center"
                >
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

              <div
                style={{
                  paddingLeft: '48px',
                  paddingRight: '48px',
                  paddingBottom: '36px',
                  paddingTop: '8px',
                }}
              >
                <SurveyNavigation
                  onBack={step > 0 ? handleBack : undefined}
                  onNext={handleNext}
                  backLabel={textos.survey_back}
                  nextLabel={nextLabel}
                  nextDisabled={nextDisabled}
                  center={<SurveyProgress current={step} total={total} />}
                />
              </div>
            </>
          )}
        </SurveyCard>
      </div>

      {/* OnScreenKeyboard al bottom del canvas, fuera del card — sólo en text step */}
      {isTextStep && !submitted ? (
        <div className="absolute bottom-0 left-0 right-0 z-[71]">
          <OnScreenKeyboard shift={shift} onKey={handleTextKey} />
        </div>
      ) : null}

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
