'use client';

interface Props {
  value: string[] | null;
  onChange: (v: string[]) => void;
  options: string[];
}

function CheckIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="5 12 10 17 19 7" />
    </svg>
  );
}

/**
 * Pills columna con checkbox. Varias seleccionables. Outline white → fill olive.
 */
export function QuestionMultiChoice({ value, onChange, options }: Props) {
  const selected = value ?? [];
  const toggle = (opt: string) => {
    if (selected.includes(opt)) {
      onChange(selected.filter((v) => v !== opt));
    } else {
      onChange([...selected, opt]);
    }
  };
  return (
    <div className="mx-auto flex flex-col" style={{ gap: '14px', maxWidth: '560px' }}>
      {options.map((opt) => {
        const isChecked = selected.includes(opt);
        return (
          <button
            key={opt}
            type="button"
            role="checkbox"
            aria-checked={isChecked}
            onClick={() => toggle(opt)}
            className="flex items-center rounded-full border-2 font-sans font-semibold transition-all"
            style={{
              height: '72px',
              paddingLeft: '24px',
              paddingRight: '24px',
              gap: '16px',
              fontSize: '22px',
              borderColor: isChecked
                ? 'hsl(var(--accent))'
                : 'hsl(var(--primary-foreground) / 0.85)',
              backgroundColor: isChecked ? 'hsl(var(--accent))' : 'transparent',
              color: isChecked ? 'hsl(var(--accent-foreground))' : 'hsl(var(--primary-foreground))',
            }}
          >
            <span
              aria-hidden
              className="inline-flex items-center justify-center rounded-md border-2 transition-all"
              style={{
                width: '28px',
                height: '28px',
                borderColor: isChecked
                  ? 'hsl(var(--accent-foreground))'
                  : 'hsl(var(--primary-foreground))',
                backgroundColor: isChecked ? 'hsl(var(--accent-foreground))' : 'transparent',
                color: isChecked ? 'hsl(var(--accent))' : 'transparent',
              }}
            >
              {isChecked ? <CheckIcon /> : null}
            </span>
            <span className="flex-1 text-left">{opt}</span>
          </button>
        );
      })}
    </div>
  );
}
