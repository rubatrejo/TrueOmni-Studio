'use client';

import type { SurveyQuestion } from '@/lib/config';
import type { SurveyAnswer } from '@/lib/survey';

import { CheckboxRow, RadioRow } from './form-controls';

const PRIMARY = 'hsl(var(--pwa-primary))';
const PRIMARY_TINT = 'hsl(var(--pwa-primary) / 0.10)';
const FG = 'hsl(var(--foreground))';
const MUTED = 'hsl(var(--foreground) / 0.5)';
const OPEN_SANS = 'var(--font-open-sans)';

/**
 * Renderer mobile de una pregunta del Survey en la PWA. Discrimina por `type` y
 * delega al control adecuado. Reutiliza los tipos del kiosk (`SurveyQuestion`,
 * `SurveyAnswer`); la lógica de validación vive en `@/lib/survey`. Estilo mobile
 * tokenizado (`--pwa-primary`, `--foreground`), sin colores hex en JSX.
 */
export function PwaSurveyQuestion({
  question,
  value,
  onChange,
  counterTemplate,
}: {
  question: SurveyQuestion;
  value: SurveyAnswer;
  onChange: (v: SurveyAnswer) => void;
  counterTemplate: string;
}) {
  switch (question.type) {
    case 'nps':
      return <NpsField question={question} value={value} onChange={onChange} />;
    case 'rating':
      return <RatingField question={question} value={value} onChange={onChange} />;
    case 'single-choice':
      return <SingleChoiceField question={question} value={value} onChange={onChange} />;
    case 'multi-choice':
      return <MultiChoiceField question={question} value={value} onChange={onChange} />;
    case 'text':
      return (
        <TextField
          question={question}
          value={value}
          onChange={onChange}
          counterTemplate={counterTemplate}
        />
      );
  }
}

function NpsField({
  question,
  value,
  onChange,
}: {
  question: Extract<SurveyQuestion, { type: 'nps' }>;
  value: SurveyAnswer;
  onChange: (v: SurveyAnswer) => void;
}) {
  const selected = typeof value === 'number' ? value : null;
  return (
    <div className="flex w-full flex-col items-center gap-2.5">
      <div className="flex flex-wrap items-center justify-center gap-1.5">
        {Array.from({ length: 11 }, (_, n) => {
          const active = selected === n;
          return (
            <button
              key={n}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(n)}
              className="flex items-center justify-center rounded-full font-bold transition-colors"
              style={{
                width: 20,
                height: 20,
                fontSize: 9.5,
                fontFamily: OPEN_SANS,
                border: `1.5px solid ${active ? PRIMARY : 'hsl(var(--foreground) / 0.25)'}`,
                backgroundColor: active ? PRIMARY : 'transparent',
                color: active ? '#fff' : FG,
              }}
            >
              {n}
            </button>
          );
        })}
      </div>
      {question.labels ? (
        <div className="flex w-full items-center justify-between px-1">
          <span style={{ fontSize: 7.5, color: MUTED, fontFamily: OPEN_SANS }}>
            {question.labels.low}
          </span>
          <span style={{ fontSize: 7.5, color: MUTED, fontFamily: OPEN_SANS }}>
            {question.labels.high}
          </span>
        </div>
      ) : null}
    </div>
  );
}

function RatingField({
  question,
  value,
  onChange,
}: {
  question: Extract<SurveyQuestion, { type: 'rating' }>;
  value: SurveyAnswer;
  onChange: (v: SurveyAnswer) => void;
}) {
  const max = question.max ?? 5;
  const selected = typeof value === 'number' ? value : 0;
  return (
    <div className="flex items-center justify-center gap-2">
      {Array.from({ length: max }, (_, i) => {
        const n = i + 1;
        const filled = n <= selected;
        return (
          <button key={n} type="button" aria-label={`${n}`} onClick={() => onChange(n)}>
            <svg width={31} height={31} viewBox="0 0 24 24" aria-hidden>
              <path
                d="M12 2.5l2.9 5.9 6.5.95-4.7 4.58 1.1 6.47L12 17.4l-5.8 3.05 1.1-6.47-4.7-4.58 6.5-.95z"
                fill={filled ? PRIMARY : 'transparent'}
                stroke={filled ? PRIMARY : 'hsl(var(--foreground) / 0.4)'}
                strokeWidth="1.4"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        );
      })}
    </div>
  );
}

function SingleChoiceField({
  question,
  value,
  onChange,
}: {
  question: Extract<SurveyQuestion, { type: 'single-choice' }>;
  value: SurveyAnswer;
  onChange: (v: SurveyAnswer) => void;
}) {
  const selected = typeof value === 'string' ? value : null;
  return (
    <div className="w-full">
      {question.options.map((opt) => (
        <RadioRow
          key={opt}
          label={opt}
          selected={selected === opt}
          onSelect={() => onChange(opt)}
          compact
        />
      ))}
    </div>
  );
}

function MultiChoiceField({
  question,
  value,
  onChange,
}: {
  question: Extract<SurveyQuestion, { type: 'multi-choice' }>;
  value: SurveyAnswer;
  onChange: (v: SurveyAnswer) => void;
}) {
  const selected = Array.isArray(value) ? value : [];
  const toggle = (opt: string) =>
    onChange(selected.includes(opt) ? selected.filter((x) => x !== opt) : [...selected, opt]);
  return (
    <div className="w-full">
      {question.options.map((opt) => (
        <CheckboxRow
          key={opt}
          label={opt}
          checked={selected.includes(opt)}
          onToggle={() => toggle(opt)}
          compact
        />
      ))}
    </div>
  );
}

function TextField({
  question,
  value,
  onChange,
  counterTemplate,
}: {
  question: Extract<SurveyQuestion, { type: 'text' }>;
  value: SurveyAnswer;
  onChange: (v: SurveyAnswer) => void;
  counterTemplate: string;
}) {
  const text = typeof value === 'string' ? value : '';
  const max = question.maxLength ?? 500;
  const counter = counterTemplate
    .replace('{count}', String(text.length))
    .replace('{max}', String(max));
  return (
    <div className="w-full">
      <textarea
        value={text}
        maxLength={max}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        className="w-full resize-none rounded-[10px] p-2 outline-none"
        style={{
          fontSize: 10,
          fontFamily: OPEN_SANS,
          color: FG,
          backgroundColor: PRIMARY_TINT,
          border: '1px solid hsl(var(--foreground) / 0.12)',
        }}
      />
      <div
        className="mt-1 text-right"
        style={{ fontSize: 8.5, color: MUTED, fontFamily: OPEN_SANS }}
      >
        {counter}
      </div>
    </div>
  );
}

/**
 * Paso opcional de captura de contacto (email/phone). Inputs reales → el teclado
 * iOS de la PWA (`PwaKeyboardProvider`) aparece solo al enfocar.
 */
export function PwaSurveyContact({
  email,
  phone,
  value,
  onChange,
  emailLabel,
  phoneLabel,
  disclaimer,
}: {
  email: boolean;
  phone: boolean;
  value: { email?: string; phone?: string };
  onChange: (v: { email?: string; phone?: string }) => void;
  emailLabel: string;
  phoneLabel: string;
  disclaimer: string;
}) {
  return (
    <div className="flex w-full flex-col gap-3">
      {email ? (
        <input
          type="email"
          inputMode="email"
          placeholder={emailLabel}
          value={value.email ?? ''}
          onChange={(e) => onChange({ ...value, email: e.target.value })}
          className="w-full rounded-[10px] px-3 py-2 outline-none"
          style={{
            fontSize: 10,
            fontFamily: OPEN_SANS,
            color: FG,
            backgroundColor: PRIMARY_TINT,
            border: '1px solid hsl(var(--foreground) / 0.12)',
          }}
        />
      ) : null}
      {phone ? (
        <input
          type="tel"
          inputMode="tel"
          placeholder={phoneLabel}
          value={value.phone ?? ''}
          onChange={(e) => onChange({ ...value, phone: e.target.value })}
          className="w-full rounded-[10px] px-3 py-2 outline-none"
          style={{
            fontSize: 10,
            fontFamily: OPEN_SANS,
            color: FG,
            backgroundColor: PRIMARY_TINT,
            border: '1px solid hsl(var(--foreground) / 0.12)',
          }}
        />
      ) : null}
      <p style={{ fontSize: 8.5, lineHeight: 1.4, color: MUTED, fontFamily: OPEN_SANS }}>
        {disclaimer}
      </p>
    </div>
  );
}
