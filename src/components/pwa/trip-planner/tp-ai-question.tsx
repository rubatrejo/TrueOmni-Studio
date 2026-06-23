'use client';

import { resolveAssetUrl } from '@/lib/asset-url';
import type { AiQuestion } from '@/lib/config';

const OPEN_SANS = { fontFamily: 'var(--font-open-sans)' } as const;

/** Pantalla de una pregunta del wizard (hero + kicker + título + opciones). */
export function TpAiQuestion({
  question,
  value,
  onChange,
  clientName,
  isTablet,
}: {
  question: AiQuestion;
  value: string | string[] | undefined;
  onChange: (v: string | string[]) => void;
  clientName: string;
  /** Tablet: hero más alto para no recortar la imagen en el canvas ancho. */
  isTablet?: boolean;
}) {
  const fill = (s: string) => s.replaceAll('{client_name}', clientName);
  const isMulti = question.type === 'multi';
  const selected = (val: string) =>
    isMulti ? Array.isArray(value) && value.includes(val) : value === val;

  const toggle = (val: string) => {
    if (!isMulti) {
      onChange(val);
      return;
    }
    const arr = Array.isArray(value) ? [...value] : [];
    const i = arr.indexOf(val);
    if (i >= 0) arr.splice(i, 1);
    else arr.push(val);
    onChange(arr);
  };

  return (
    <div className="flex flex-col" style={OPEN_SANS}>
      {/* Hero */}
      <div
        className="w-full bg-cover bg-center"
        style={{
          height: isTablet ? 320 : 170,
          backgroundImage: `url("${resolveAssetUrl(question.hero_image)}")`,
        }}
      />

      <div className={isTablet ? 'mx-auto max-w-[560px] px-5 pt-6' : 'px-5 pt-5'}>
        <h2
          className="text-center text-[22px] font-extrabold"
          style={{ color: 'hsl(var(--brand-secondary))' }}
        >
          {fill(question.kicker)}
        </h2>
        <p
          className="mx-auto mt-1 max-w-[300px] text-center text-[15px] leading-snug"
          style={{ color: 'hsl(var(--brand-secondary))' }}
        >
          {fill(question.title)}
        </p>
        {question.subtitle ? (
          <p className="mt-1 text-center text-[11px] text-foreground/50">
            {fill(question.subtitle)}
          </p>
        ) : null}

        {/* Opciones */}
        <div className="mt-5 flex flex-col gap-2.5">
          {question.options.map((opt) => {
            const on = selected(opt.value);
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => toggle(opt.value)}
                className="flex items-center gap-3 rounded-full border px-4 py-3 text-left text-[14px] font-semibold"
                style={{
                  borderColor: 'hsl(var(--brand-secondary))',
                  backgroundColor: on ? 'hsl(var(--brand-secondary))' : 'transparent',
                  color: on ? '#fff' : 'hsl(var(--foreground)/0.55)',
                }}
              >
                <span
                  className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border-2"
                  style={{ borderColor: on ? '#fff' : 'hsl(var(--foreground)/0.3)' }}
                >
                  {on ? (
                    <svg width={10} height={10} viewBox="0 0 12 12" fill="none">
                      <path
                        d="M2 6l2.5 2.5L10 3"
                        stroke="#fff"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : null}
                </span>
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
