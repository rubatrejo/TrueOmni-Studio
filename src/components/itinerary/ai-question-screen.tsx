'use client';

import Image from 'next/image';

import type { AiQuestion } from '@/lib/config';
import { resolveItineraryAsset } from '@/lib/itinerary-asset';

export interface AiQuestionScreenProps {
  question: AiQuestion;
  /** Selección actual: string para single, string[] para multi. */
  value: string | string[] | null;
  onChange: (value: string | string[]) => void;
  /** Index actual y total para el progress dots. */
  step: number;
  totalSteps: number;
  isFirst: boolean;
  isLast: boolean;
  backLabel: string;
  nextLabel: string;
  finishLabel: string;
  onBack: () => void;
  onNext: () => void;
  /** Botón Home en la esquina (vuelve a la pantalla principal del módulo). */
  onClose?: () => void;
  /** Logo del header (TrueOmni). */
  logoSrc?: string;
}

function ProgressDots({ count, current }: { count: number; current: number }) {
  return (
    <div className="flex items-center justify-center gap-2">
      {Array.from({ length: count }, (_, i) => (
        <span
          key={i}
          className="block h-[6px] rounded-full transition-all"
          style={{
            width: i === current ? 64 : 32,
            backgroundColor: i <= current ? 'hsl(var(--primary))' : 'hsl(220 14% 86%)',
          }}
        />
      ))}
    </div>
  );
}

export function AiQuestionScreen(props: AiQuestionScreenProps) {
  const { question, value, onChange, step, totalSteps, isFirst, isLast } = props;
  const isMulti = question.type === 'multi';
  const heroSrc = resolveItineraryAsset(question.hero_image);

  const isSelected = (optionValue: string) => {
    if (Array.isArray(value)) return value.includes(optionValue);
    return value === optionValue;
  };

  const onOptionTap = (optionValue: string) => {
    if (isMulti) {
      const arr = Array.isArray(value) ? [...value] : [];
      const idx = arr.indexOf(optionValue);
      if (idx >= 0) arr.splice(idx, 1);
      else arr.push(optionValue);
      onChange(arr);
    } else {
      onChange(optionValue);
    }
  };

  const canContinue = isMulti
    ? Array.isArray(value) && value.length > 0
    : typeof value === 'string' && value.length > 0;

  return (
    <div className="absolute inset-0 z-50 flex flex-col bg-background">
      {/* Hero image arriba 720×920 (parte superior de la pantalla 1080×1920). */}
      <div className="relative w-full" style={{ height: 760 }}>
        {heroSrc ? (
          <Image
            src={heroSrc}
            alt=""
            fill
            sizes="1080px"
            className="object-cover"
            unoptimized
            priority
          />
        ) : (
          <div className="absolute inset-0 bg-zinc-300" />
        )}
        {/* Header chrome simple con logo */}
        {props.logoSrc ? (
          <div className="absolute" style={{ left: 65, top: 44 }}>
            <Image
              src={props.logoSrc}
              alt="logo"
              width={200}
              height={70}
              className="h-[70px] w-auto"
              unoptimized
            />
          </div>
        ) : null}
      </div>

      {/* Body — pregunta + opciones */}
      <div className="flex flex-1 flex-col px-12 pt-10">
        <p
          className="text-center text-[24px] font-bold tracking-wide"
          style={{ color: 'hsl(var(--primary))' }}
        >
          {question.kicker}
        </p>
        <h2 className="mt-3 text-center text-[34px] font-semibold leading-tight text-foreground">
          {question.title}
        </h2>
        {question.subtitle ? (
          <p
            className="mt-3 text-center text-[18px] font-semibold"
            style={{ color: 'hsl(var(--primary))' }}
          >
            {question.subtitle}
          </p>
        ) : null}

        <div className="mt-8 flex flex-1 flex-col gap-4 overflow-y-auto pr-2">
          {question.options.map((opt) => {
            const sel = isSelected(opt.value);
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onOptionTap(opt.value)}
                aria-pressed={sel}
                className="flex h-[64px] items-center gap-3 rounded-md border-2 px-5 text-left text-[18px] font-medium transition"
                style={{
                  borderColor: sel ? 'hsl(var(--primary))' : 'hsl(220 14% 88%)',
                  backgroundColor: sel ? 'hsl(var(--primary) / 0.08)' : 'white',
                  color: 'hsl(var(--foreground))',
                }}
              >
                <span
                  className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2"
                  style={{
                    borderColor: sel ? 'hsl(var(--primary))' : 'hsl(220 14% 70%)',
                    backgroundColor: sel ? 'hsl(var(--primary))' : 'transparent',
                    color: 'white',
                  }}
                >
                  {sel ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        d="M5 12l5 5 9-9"
                        stroke="currentColor"
                        strokeWidth="3"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : null}
                </span>
                <span>{opt.label}</span>
              </button>
            );
          })}
        </div>

        <div className="my-6">
          <ProgressDots count={totalSteps} current={step} />
        </div>
      </div>

      {/* Botón back flotante a la izquierda */}
      <button
        type="button"
        onClick={isFirst ? props.onClose : props.onBack}
        aria-label={props.backLabel}
        className="absolute z-10 flex items-center justify-center bg-primary text-white shadow-lg transition hover:opacity-90"
        style={{
          left: 0,
          top: 1100,
          width: 100,
          height: 100,
          borderTopRightRadius: 9999,
          borderBottomRightRadius: 9999,
        }}
      >
        <svg width="32" height="32" viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M15 6l-6 6 6 6"
            stroke="currentColor"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
          />
        </svg>
      </button>

      {/* Footer con CTAs */}
      <div className="flex items-center justify-center gap-4 border-t border-zinc-200 bg-white px-12 py-5">
        {!isFirst ? (
          <button
            type="button"
            onClick={props.onBack}
            className="flex h-[56px] items-center justify-center rounded-full px-10 text-[18px] font-semibold text-white shadow-md"
            style={{ backgroundColor: 'hsl(var(--itinerary-olive))' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" className="mr-2" aria-hidden="true">
              <path
                d="M15 6l-6 6 6 6"
                stroke="currentColor"
                strokeWidth="2.5"
                fill="none"
                strokeLinecap="round"
              />
            </svg>
            {props.backLabel}
          </button>
        ) : null}
        <button
          type="button"
          onClick={props.onNext}
          disabled={!canContinue}
          className="flex h-[56px] items-center justify-center rounded-full px-10 text-[18px] font-semibold text-white shadow-md transition disabled:cursor-not-allowed disabled:opacity-40"
          style={{ backgroundColor: 'hsl(var(--primary))' }}
        >
          {isLast ? props.finishLabel : props.nextLabel}
        </button>
      </div>
    </div>
  );
}
