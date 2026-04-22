'use client';

interface Props {
  value: string | null;
  onChange: (v: string) => void;
  options: string[];
}

const FILL_DARK = 'color-mix(in oklch, hsl(var(--primary)) 45%, black 55%)';

/**
 * Pills single-choice. Selected = fill azul oscuro + border blanco.
 * Stagger entrance.
 */
export function QuestionSingleChoice({ value, onChange, options }: Props) {
  return (
    <div
      role="radiogroup"
      className="survey-stagger mx-auto flex flex-col"
      style={{ gap: '14px', width: '520px' }}
    >
      {options.map((opt) => {
        const selected = value === opt;
        return (
          <button
            key={opt}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(opt)}
            className="flex items-center rounded-full border-2 font-sans font-semibold transition-all duration-300 ease-out focus:outline-none focus-visible:ring-4 focus-visible:ring-white/60"
            style={{
              height: '68px',
              paddingLeft: '24px',
              paddingRight: '24px',
              gap: '16px',
              fontSize: '18px',
              borderColor: selected
                ? 'hsl(var(--primary-foreground))'
                : 'hsl(var(--primary-foreground) / 0.4)',
              backgroundColor: selected ? FILL_DARK : 'hsl(var(--primary-foreground) / 0.04)',
              color: 'hsl(var(--primary-foreground))',
              transform: selected ? 'translateX(4px)' : 'translateX(0)',
              boxShadow: selected
                ? '0 12px 28px -10px rgba(0,0,0,0.55)'
                : '0 2px 0 0 hsl(var(--primary-foreground) / 0.04)',
            }}
          >
            <span
              aria-hidden
              className="inline-block rounded-full border-2 transition-all duration-300"
              style={{
                width: '24px',
                height: '24px',
                flexShrink: 0,
                borderColor: 'hsl(var(--primary-foreground))',
                backgroundColor: selected ? 'hsl(var(--primary-foreground))' : 'transparent',
                boxShadow: selected ? `inset 0 0 0 6px ${FILL_DARK}` : 'none',
              }}
            />
            <span className="flex-1 text-left">{opt}</span>
          </button>
        );
      })}
    </div>
  );
}
