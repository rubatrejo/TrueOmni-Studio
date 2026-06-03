'use client';

import { useState } from 'react';

import type { AiPreferences } from '@/lib/ai-itinerary';
import type { AiQuestion, PwaTripPlannerModuleConfig } from '@/lib/config';

import { Layer } from '../mobile-layer';

import { TpAiQuestion } from './tp-ai-question';

const OPEN_SANS = { fontFamily: 'var(--font-open-sans)' } as const;

export function TpAiWizard({
  questions,
  path,
  tp,
  textos,
  clientName,
  onFinish,
  onBack,
}: {
  questions: AiQuestion[];
  path: 'ai' | 'top';
  tp: PwaTripPlannerModuleConfig;
  textos: Record<string, string>;
  clientName: string;
  onFinish: (answers: AiPreferences) => void;
  onBack: () => void;
}) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<AiPreferences>({});

  const q = questions[step]!;
  const title =
    path === 'ai' ? tp.ai.itineraryTitle : (textos.itinerary_top_title ?? 'Top Suggestions');
  const value = answers[q.key];
  const answered = Array.isArray(value) ? value.length > 0 : Boolean(value);
  const isLast = step === questions.length - 1;

  const next = () => {
    if (isLast) onFinish(answers);
    else setStep((s) => s + 1);
  };
  const back = () => {
    if (step === 0) onBack();
    else setStep((s) => s - 1);
  };

  return (
    <div className="relative flex min-h-0 flex-1 flex-col bg-background">
      {/* Header */}
      <Layer
        h={90}
        className="relative z-10 shrink-0"
        style={{ backgroundColor: 'hsl(var(--brand-primary))' }}
      >
        <button
          type="button"
          aria-label="Back"
          onClick={back}
          className="absolute text-white"
          style={{ left: 18, top: 50, height: 28 }}
        >
          <svg width={11.87} height={20.36} viewBox="0 0 11.87 20.36" fill="#fff" aria-hidden>
            <path d="M.292,10.946a.975.975,0,0,1,0-1.392L9.537.417a1.456,1.456,0,0,1,2.041,0,1.415,1.415,0,0,1,0,2.016L3.669,10.25l7.909,7.815a1.417,1.417,0,0,1,0,2.017,1.456,1.456,0,0,1-2.041,0Z" />
          </svg>
        </button>
        <div
          className="pointer-events-none absolute text-center font-bold text-white"
          style={{ left: 60, top: 53, width: 255, fontSize: 17, ...OPEN_SANS }}
        >
          {title}
        </div>
      </Layer>

      {/* Pregunta */}
      <div className="scrollbar-hide min-h-0 flex-1 overflow-y-auto">
        <TpAiQuestion
          question={q}
          value={value}
          onChange={(v) => setAnswers((a) => ({ ...a, [q.key]: v }))}
          clientName={clientName}
        />
      </div>

      {/* Footer: Next + progress */}
      <div className="shrink-0 px-5 pb-4 pt-2" style={OPEN_SANS}>
        <div className="flex justify-center">
          <button
            type="button"
            onClick={next}
            disabled={!answered}
            className="rounded-full px-8 py-2.5 text-[14px] font-bold text-white disabled:opacity-40"
            style={{ backgroundColor: 'hsl(var(--brand-secondary))' }}
          >
            {isLast
              ? (textos.itinerary_ai_finish ?? 'Finish')
              : (textos.itinerary_ai_next ?? 'Next question')}
          </button>
        </div>
        <div className="mt-3 flex gap-1.5">
          {questions.map((_, i) => (
            <span
              key={i}
              className="h-[4px] flex-1 rounded-full"
              style={{
                backgroundColor:
                  i <= step ? 'hsl(var(--brand-secondary))' : 'hsl(var(--brand-secondary)/0.2)',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
