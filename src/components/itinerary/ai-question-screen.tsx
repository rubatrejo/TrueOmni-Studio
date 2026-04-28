'use client';

import Image from 'next/image';

import { TrueOmniLogo } from '@/components/brand/true-omni-logo';
import { WeatherClock } from '@/components/home/weather-clock';
import { useTextos } from '@/components/i18n-provider';
import type { AiQuestion } from '@/lib/config';
import { resolveItineraryAsset } from '@/lib/itinerary-asset';
import type { WeatherData } from '@/lib/weather';

/**
 * Componente helper que resuelve un campo de pregunta AI vía i18n con fallback
 * al literal del config. Convención: `ai_question_${qkey}_${field}`.
 */
function QField({
  qkey,
  field,
  fallback,
}: {
  qkey: string;
  field: string;
  fallback: string;
}) {
  const t = useTextos();
  const k = `ai_question_${qkey}_${field}`;
  const r = t(k);
  return <>{r === k ? fallback : r}</>;
}

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
  /** Volver a la pregunta anterior (footer back). */
  onBack: () => void;
  /** Avanzar a la siguiente pregunta (footer next). */
  onNext: () => void;
  /** Salir del wizard (floating back) — debe disparar warning antes de cerrar. */
  onRequestLeave: () => void;
  /** Weather + locale + tz para el WeatherClock del header (estándar kiosk). */
  weather?: WeatherData | null;
  locale?: string;
  timezone?: string;
}

function ProgressDots({ count, current }: { count: number; current: number }) {
  return (
    <div className="flex items-center justify-center gap-3">
      {Array.from({ length: count }, (_, i) => (
        <span
          key={i}
          className="block h-[8px] rounded-full transition-all"
          style={{
            width: i === current ? 80 : 40,
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
      {/* Hero image arriba con header chrome estándar (logo + weather + gradient) */}
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
        <div
          aria-hidden="true"
          className="pointer-events-none absolute"
          style={{
            left: 0,
            top: 0,
            width: '100%',
            height: 397,
            background:
              'linear-gradient(180deg, rgba(0,79,139,0.9) 0%, rgba(0,79,139,0.55) 30%, rgba(0,79,139,0) 100%)',
            zIndex: 5,
          }}
        />
        <div className="absolute" style={{ left: 65, top: 44, zIndex: 6 }}>
          <TrueOmniLogo className="h-[70px] w-auto text-white" />
        </div>
        {props.weather ? (
          <div
            className="absolute"
            style={{ left: 744, top: 40, width: 300, height: 85, zIndex: 6 }}
          >
            <WeatherClock
              initialWeather={props.weather}
              locale={props.locale ?? 'en-US'}
              timezone={props.timezone}
            />
          </div>
        ) : null}
      </div>

      {/* Body — contenido centrado con max-width acotado para no chocar con el
       *  floating back button (left:0..116) en `top:1000-1232`. */}
      <div className="flex flex-1 flex-col px-16 pt-12">
        <div className="mx-auto w-full max-w-[720px]">
          <p
            className="text-center text-[28px] font-bold tracking-wide"
            style={{ color: 'hsl(var(--primary))' }}
          >
            <QField qkey={question.key} field="kicker" fallback={question.kicker} />
          </p>
          <h2
            className="mt-4 text-center text-[42px] font-bold leading-tight text-foreground"
            style={{ whiteSpace: 'pre-line' }}
          >
            <QField qkey={question.key} field="title" fallback={question.title} />
          </h2>
          {question.subtitle ? (
            <p
              className="mt-3 text-center text-[20px] font-semibold"
              style={{ color: 'hsl(var(--primary))' }}
            >
              <QField qkey={question.key} field="subtitle" fallback={question.subtitle} />
            </p>
          ) : null}

          <div className="mt-10 flex flex-col gap-5">
            {question.options.map((opt) => {
              const sel = isSelected(opt.value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onOptionTap(opt.value)}
                  aria-pressed={sel}
                  className="flex h-[78px] items-center gap-4 rounded-md border-2 px-6 text-left text-[22px] font-medium transition"
                  style={{
                    borderColor: sel ? 'hsl(var(--primary))' : 'hsl(220 14% 88%)',
                    backgroundColor: sel ? 'hsl(var(--primary) / 0.08)' : 'white',
                    color: 'hsl(var(--foreground))',
                  }}
                >
                  <span
                    className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border-2"
                    style={{
                      borderColor: sel ? 'hsl(var(--primary))' : 'hsl(220 14% 70%)',
                      backgroundColor: sel ? 'hsl(var(--primary))' : 'transparent',
                      color: 'white',
                    }}
                  >
                    {sel ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
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
                  <span>
                    <QField
                      qkey={question.key}
                      field={`option_${opt.value.replace(/-/g, '_')}`}
                      fallback={opt.label}
                    />
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Floating BackButton — pill `#004f8b` 116×232 al estilo `BackButton`
       *  estándar. Click → dispara warning (perderías el progreso). */}
      <button
        type="button"
        onClick={props.onRequestLeave}
        aria-label={props.backLabel}
        className="absolute z-30 flex items-center justify-end focus:outline-none focus-visible:ring-4 focus-visible:ring-white/60"
        style={{
          left: 0,
          top: '1000px',
          width: '116px',
          height: '232px',
          backgroundColor: '#004f8b',
          borderTopRightRadius: '116px',
          borderBottomRightRadius: '116px',
          paddingRight: '30px',
          boxShadow: '12px 0 28px rgba(0,0,0,0.22)',
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="46"
          height="52"
          viewBox="0 0 44.824 50.443"
          aria-hidden
        >
          <path
            d="M23.489,0a4.559,4.559,0,0,1,2.242,1.624c.65.749,1.334,1.461,2,2.2a3.462,3.462,0,0,1-.015,4.885q-4.87,5.345-9.749,10.68c-.113.124-.221.253-.412.474h.614q11.722,0,23.445-.006A2.855,2.855,0,0,1,44.5,21.67a4.867,4.867,0,0,1,.31,1.708c.04,1.245.005,2.492-.005,3.738-.018,2.132-1.228,3.458-3.18,3.465-2.68.009-5.36,0-8.039,0h-16c.184.215.3.354.415.484q4.851,5.3,9.7,10.592a3.172,3.172,0,0,1,.614,4,27.824,27.824,0,0,1-3.874,4.261,2.455,2.455,0,0,1-3.356-.341c-.114-.106-.224-.217-.33-.333Q10.9,38.462,1.057,27.677a3.427,3.427,0,0,1-.636-4.1A4.415,4.415,0,0,1,1.07,22.7q9.824-10.772,19.651-21.54A4.305,4.305,0,0,1,22.5,0Z"
            fill="#ffffff"
          />
        </svg>
      </button>

      {/* Progress dots + footer con CTAs Back/Next */}
      <div className="border-t border-zinc-200 bg-white px-12 pb-8 pt-6">
        <div className="mb-6">
          <ProgressDots count={totalSteps} current={step} />
        </div>
        <div className="flex items-center justify-center gap-5">
          {!isFirst ? (
            <button
              type="button"
              onClick={props.onBack}
              className="flex h-[76px] items-center justify-center rounded-xl px-14 text-[22px] font-bold text-white shadow-md transition hover:opacity-95"
              style={{ backgroundColor: 'hsl(var(--itinerary-olive))' }}
            >
              {props.backLabel}
            </button>
          ) : null}
          <button
            type="button"
            onClick={props.onNext}
            disabled={!canContinue}
            className="flex h-[76px] items-center justify-center rounded-xl px-14 text-[22px] font-bold text-white shadow-md transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-40"
            style={{ backgroundColor: 'hsl(var(--primary))' }}
          >
            {isLast ? props.finishLabel : props.nextLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
