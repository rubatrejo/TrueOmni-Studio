'use client';

interface Props {
  value: number | null;
  onChange: (v: number) => void;
  labels?: { low: string; high: string };
}

const SCALE = Array.from({ length: 11 }, (_, i) => i); // 0..10
const FILL_DARK = 'color-mix(in oklch, hsl(var(--primary)) 45%, black 55%)';

/**
 * 11 círculos 0-10. Selected = fill azul oscuro con borde blanco + scale.
 * Stagger entrance.
 */
export function QuestionNps({ value, onChange, labels }: Props) {
  return (
    <div className="flex w-full flex-col items-center" style={{ gap: '24px' }}>
      <div
        role="radiogroup"
        aria-label="Rate from 0 to 10"
        className="survey-stagger flex items-center justify-center"
        style={{ gap: '8px' }}
      >
        {SCALE.map((n) => {
          const selected = value === n;
          return (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(n)}
              className="flex items-center justify-center rounded-full font-display font-bold transition-all duration-300 ease-out focus:outline-none focus-visible:ring-4 focus-visible:ring-white/60"
              style={{
                width: '52px',
                height: '52px',
                fontSize: '18px',
                backgroundColor: selected ? FILL_DARK : 'hsl(var(--primary-foreground) / 0.95)',
                color: selected ? 'hsl(var(--primary-foreground))' : 'hsl(var(--primary))',
                border: selected
                  ? '2px solid hsl(var(--primary-foreground))'
                  : '2px solid transparent',
                boxShadow: selected
                  ? '0 12px 24px -8px rgba(0,0,0,0.55)'
                  : '0 4px 14px -4px rgba(0,0,0,0.2)',
                transform: selected ? 'scale(1.15) translateY(-4px)' : 'scale(1)',
              }}
            >
              {n}
            </button>
          );
        })}
      </div>
      {labels ? (
        <div
          className="flex w-full items-center justify-between font-sans font-medium"
          style={{
            fontSize: '13px',
            opacity: 0.75,
            maxWidth: '620px',
            letterSpacing: '0.02em',
          }}
        >
          <span>{labels.low}</span>
          <span>{labels.high}</span>
        </div>
      ) : null}
    </div>
  );
}
