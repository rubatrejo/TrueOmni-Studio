'use client';

interface Props {
  value: string | null;
  onChange: (v: string) => void;
  options: string[];
}

/**
 * Pills columna con radio dot. Outline white → fill olive al seleccionar.
 */
export function QuestionSingleChoice({ value, onChange, options }: Props) {
  return (
    <div
      role="radiogroup"
      className="mx-auto flex flex-col"
      style={{ gap: '14px', maxWidth: '560px' }}
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
            className="flex items-center rounded-full border-2 font-sans font-semibold transition-all"
            style={{
              height: '72px',
              paddingLeft: '24px',
              paddingRight: '24px',
              gap: '16px',
              fontSize: '22px',
              borderColor: selected
                ? 'hsl(var(--accent))'
                : 'hsl(var(--primary-foreground) / 0.85)',
              backgroundColor: selected ? 'hsl(var(--accent))' : 'transparent',
              color: selected ? 'hsl(var(--accent-foreground))' : 'hsl(var(--primary-foreground))',
            }}
          >
            <span
              aria-hidden
              className="inline-block rounded-full border-2 transition-all"
              style={{
                width: '28px',
                height: '28px',
                borderColor: selected
                  ? 'hsl(var(--accent-foreground))'
                  : 'hsl(var(--primary-foreground))',
                backgroundColor: selected ? 'hsl(var(--accent-foreground))' : 'transparent',
                boxShadow: selected ? 'inset 0 0 0 6px hsl(var(--accent))' : 'none',
              }}
            />
            <span className="flex-1 text-left">{opt}</span>
          </button>
        );
      })}
    </div>
  );
}
