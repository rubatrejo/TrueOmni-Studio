'use client';

interface Props {
  value: string | null;
  onChange: (v: string) => void;
  options: string[];
}

/**
 * Pills grandes en columna con radio dot. Stagger entrance.
 * Selected = fill olive + lift + shadow colored.
 */
export function QuestionSingleChoice({ value, onChange, options }: Props) {
  return (
    <div
      role="radiogroup"
      className="survey-stagger mx-auto flex flex-col"
      style={{ gap: '16px', width: '600px' }}
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
              height: '80px',
              paddingLeft: '28px',
              paddingRight: '28px',
              gap: '20px',
              fontSize: '22px',
              borderColor: selected ? 'hsl(var(--accent))' : 'hsl(var(--primary-foreground) / 0.4)',
              backgroundColor: selected
                ? 'hsl(var(--accent))'
                : 'hsl(var(--primary-foreground) / 0.04)',
              color: selected ? 'hsl(var(--accent-foreground))' : 'hsl(var(--primary-foreground))',
              transform: selected ? 'translateX(6px)' : 'translateX(0)',
              boxShadow: selected
                ? '0 14px 32px -10px hsl(var(--accent) / 0.6)'
                : '0 2px 0 0 hsl(var(--primary-foreground) / 0.04)',
            }}
          >
            <span
              aria-hidden
              className="inline-block rounded-full border-2 transition-all duration-300"
              style={{
                width: '28px',
                height: '28px',
                flexShrink: 0,
                borderColor: selected
                  ? 'hsl(var(--accent-foreground))'
                  : 'hsl(var(--primary-foreground) / 0.5)',
                backgroundColor: selected ? 'hsl(var(--accent-foreground))' : 'transparent',
                boxShadow: selected ? 'inset 0 0 0 7px hsl(var(--accent))' : 'none',
              }}
            />
            <span className="flex-1 text-left">{opt}</span>
          </button>
        );
      })}
    </div>
  );
}
