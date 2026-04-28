'use client';

import { useCallback, useState } from 'react';

import type { AiQuestion } from '@/lib/config';
import type { WeatherData } from '@/lib/weather';

import { AiQuestionScreen } from './ai-question-screen';

export type AiAnswers = Record<string, string | string[]>;

export interface AiWizardTextos {
  back: string;
  next: string;
  finish: string;
}

export interface AiWizardProps {
  questions: AiQuestion[];
  textos: AiWizardTextos;
  /** Variables a interpolar en title (ej. {client_name: "Arizona"}). */
  templateVars?: Record<string, string>;
  /** Weather + locale + tz para el WeatherClock del header de cada pregunta. */
  weather?: WeatherData | null;
  locale?: string;
  timezone?: string;
  /** Disparado cuando el usuario completa la última pregunta. */
  onFinish: (answers: AiAnswers) => void;
  /** Disparado cuando el usuario pulsa el floating back button → mostrar
   *  warning de "perderías el progreso". El parent decide si confirmar o no. */
  onRequestLeave: () => void;
}

const interp = (tpl: string, vars: Record<string, string>) =>
  Object.entries(vars).reduce((acc, [k, v]) => acc.replaceAll(`{${k}}`, v), tpl);

/**
 * Orquestador del wizard AI. Mantiene el step actual + las respuestas
 * acumuladas. Pasa cada pregunta al QuestionScreen con back/next handlers.
 */
export function AiWizard(props: AiWizardProps) {
  const { questions, textos, onFinish } = props;
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<AiAnswers>({});

  const current = questions[step];

  const handleChange = useCallback(
    (value: string | string[]) => {
      if (!current) return;
      setAnswers((prev) => ({ ...prev, [current.key]: value }));
    },
    [current],
  );

  const handleNext = useCallback(() => {
    if (step >= questions.length - 1) {
      onFinish(answers);
    } else {
      setStep((s) => s + 1);
    }
  }, [step, questions.length, answers, onFinish]);

  const handleBack = useCallback(() => {
    if (step > 0) setStep((s) => s - 1);
  }, [step]);

  if (!current) return null;
  const value = answers[current.key] ?? null;
  const vars = props.templateVars ?? {};
  const interpolated: AiQuestion = {
    ...current,
    title: interp(current.title, vars),
    subtitle: current.subtitle ? interp(current.subtitle, vars) : current.subtitle,
  };

  return (
    <AiQuestionScreen
      question={interpolated}
      value={value}
      onChange={handleChange}
      step={step}
      totalSteps={questions.length}
      isFirst={step === 0}
      isLast={step === questions.length - 1}
      backLabel={textos.back}
      nextLabel={textos.next}
      finishLabel={textos.finish}
      onBack={handleBack}
      onNext={handleNext}
      onRequestLeave={props.onRequestLeave}
      weather={props.weather}
      locale={props.locale}
      timezone={props.timezone}
    />
  );
}
