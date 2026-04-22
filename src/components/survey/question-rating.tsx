'use client';

interface Props {
  value: number | null;
  onChange: (v: number) => void;
  max?: number;
}

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      width="68"
      height="68"
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
    >
      <polygon points="12 2 15.1 8.6 22 9.3 16.8 14 18.2 21 12 17.3 5.8 21 7.2 14 2 9.3 8.9 8.6 12 2" />
    </svg>
  );
}

/**
 * 5 estrellas 68×68 outline → filled olive. Tap fill 1..N. Scale 1.1 en la tap.
 */
export function QuestionRating({ value, onChange, max = 5 }: Props) {
  const items = Array.from({ length: max }, (_, i) => i + 1);
  return (
    <div
      role="radiogroup"
      aria-label="Rate from 1 to 5"
      className="flex items-center justify-center"
      style={{ gap: '16px' }}
    >
      {items.map((n) => {
        const filled = value !== null && n <= value;
        return (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={`${n} star${n === 1 ? '' : 's'}`}
            onClick={() => onChange(n)}
            className="transition-transform"
            style={{
              color: filled ? 'hsl(var(--accent))' : 'hsl(var(--primary-foreground) / 0.85)',
              transform: value === n ? 'scale(1.1)' : 'scale(1)',
            }}
          >
            <StarIcon filled={filled} />
          </button>
        );
      })}
    </div>
  );
}
