'use client';

interface Props {
  value: number | null;
  onChange: (v: number) => void;
  labels?: { low: string; high: string };
}

const SCALE = Array.from({ length: 11 }, (_, i) => i); // 0..10

/**
 * 11 círculos 56×56 con número dentro. Seleccionado = fill olive + scale.
 * Labels extremos debajo ("Not at all likely" / "Extremely likely").
 */
export function QuestionNps({ value, onChange, labels }: Props) {
  return (
    <div className="flex flex-col items-center" style={{ gap: '20px' }}>
      <div
        role="radiogroup"
        aria-label="Rate from 0 to 10"
        className="flex items-center justify-center"
        style={{ gap: '10px' }}
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
              className="flex items-center justify-center rounded-full border-2 font-display font-bold transition-all"
              style={{
                width: '56px',
                height: '56px',
                fontSize: '22px',
                backgroundColor: selected ? 'hsl(var(--accent))' : 'hsl(var(--primary-foreground))',
                color: selected ? 'hsl(var(--accent-foreground))' : 'hsl(var(--primary))',
                borderColor: selected ? 'hsl(var(--accent))' : 'hsl(var(--primary-foreground))',
                boxShadow: selected ? '0 0 0 4px hsl(var(--primary-foreground))' : 'none',
                transform: selected ? 'scale(1.12)' : 'scale(1)',
              }}
            >
              {n}
            </button>
          );
        })}
      </div>
      {labels ? (
        <div
          className="flex w-full items-center justify-between font-sans"
          style={{ fontSize: '16px', opacity: 0.85, maxWidth: '720px' }}
        >
          <span>{labels.low}</span>
          <span>{labels.high}</span>
        </div>
      ) : null}
    </div>
  );
}
