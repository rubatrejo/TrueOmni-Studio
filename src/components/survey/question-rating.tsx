'use client';

interface Props {
  value: number | null;
  onChange: (v: number) => void;
  max?: number;
}

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      width="88"
      height="88"
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinejoin="round"
    >
      <polygon points="12 2 15.1 8.6 22 9.3 16.8 14 18.2 21 12 17.3 5.8 21 7.2 14 2 9.3 8.9 8.6 12 2" />
    </svg>
  );
}

/**
 * 5 estrellas grandes (88×88). Rellena hasta N al tap.
 * Selected star = scale-up + glow. Stagger entrance.
 */
export function QuestionRating({ value, onChange, max = 5 }: Props) {
  const items = Array.from({ length: max }, (_, i) => i + 1);
  return (
    <div
      role="radiogroup"
      aria-label="Rate from 1 to 5"
      className="survey-stagger flex items-center justify-center"
      style={{ gap: '20px' }}
    >
      {items.map((n) => {
        const filled = value !== null && n <= value;
        const isLast = value === n;
        return (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={`${n} star${n === 1 ? '' : 's'}`}
            onClick={() => onChange(n)}
            className="rounded-lg transition-all duration-300 ease-out focus:outline-none focus-visible:ring-4 focus-visible:ring-white/60"
            style={{
              color: filled ? 'hsl(var(--accent))' : 'hsl(var(--primary-foreground) / 0.55)',
              transform: isLast ? 'scale(1.15)' : 'scale(1)',
              filter: filled ? 'drop-shadow(0 8px 24px hsl(var(--accent) / 0.5))' : 'none',
            }}
          >
            <StarIcon filled={filled} />
          </button>
        );
      })}
    </div>
  );
}
