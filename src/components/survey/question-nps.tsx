'use client';

interface Props {
  value: number | null;
  onChange: (v: number) => void;
  labels?: { low: string; high: string };
}

const SCALE = Array.from({ length: 11 }, (_, i) => i); // 0..10

/**
 * 11 círculos 0-10 airy con labels semánticos en los extremos.
 * Selected = fill olive + glow pulse ring + scale-up.
 * Stagger entrance al cambiar de paso.
 */
export function QuestionNps({ value, onChange, labels }: Props) {
  return (
    <div className="flex w-full flex-col items-center" style={{ gap: '28px' }}>
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
                backgroundColor: selected
                  ? 'hsl(var(--accent))'
                  : 'hsl(var(--primary-foreground) / 0.95)',
                color: selected ? 'hsl(var(--accent-foreground))' : 'hsl(var(--primary))',
                boxShadow: selected
                  ? '0 0 0 4px hsl(var(--primary-foreground)), 0 10px 28px -8px hsl(var(--accent) / 0.6)'
                  : '0 4px 14px -4px hsl(0 0% 0% / 0.2)',
                transform: selected ? 'scale(1.18) translateY(-4px)' : 'scale(1)',
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
