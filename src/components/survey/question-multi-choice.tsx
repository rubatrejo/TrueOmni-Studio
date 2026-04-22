'use client';

interface Props {
  value: string[] | null;
  onChange: (v: string[]) => void;
  options: string[];
}

const FILL_DARK = 'color-mix(in oklch, hsl(var(--primary)) 45%, black 55%)';

function CheckIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="5 12 10 17 19 7" />
    </svg>
  );
}

/**
 * Pills multi-choice. Checked = fill azul oscuro + border blanco + check visible.
 */
export function QuestionMultiChoice({ value, onChange, options }: Props) {
  const selected = value ?? [];
  const toggle = (opt: string) => {
    if (selected.includes(opt)) onChange(selected.filter((v) => v !== opt));
    else onChange([...selected, opt]);
  };
  return (
    <div className="survey-stagger mx-auto flex flex-col" style={{ gap: '14px', width: '520px' }}>
      {options.map((opt) => {
        const isChecked = selected.includes(opt);
        return (
          <button
            key={opt}
            type="button"
            role="checkbox"
            aria-checked={isChecked}
            onClick={() => toggle(opt)}
            className="flex items-center rounded-full border-2 font-sans font-semibold transition-all duration-300 ease-out focus:outline-none focus-visible:ring-4 focus-visible:ring-white/60"
            style={{
              height: '68px',
              paddingLeft: '24px',
              paddingRight: '24px',
              gap: '16px',
              fontSize: '18px',
              borderColor: isChecked
                ? 'hsl(var(--primary-foreground))'
                : 'hsl(var(--primary-foreground) / 0.4)',
              backgroundColor: isChecked ? FILL_DARK : 'hsl(var(--primary-foreground) / 0.04)',
              color: 'hsl(var(--primary-foreground))',
              transform: isChecked ? 'translateX(4px)' : 'translateX(0)',
              boxShadow: isChecked
                ? '0 12px 28px -10px rgba(0,0,0,0.55)'
                : '0 2px 0 0 hsl(var(--primary-foreground) / 0.04)',
            }}
          >
            <span
              aria-hidden
              className="inline-flex items-center justify-center rounded-md border-2 transition-all duration-300"
              style={{
                width: '24px',
                height: '24px',
                flexShrink: 0,
                borderColor: 'hsl(var(--primary-foreground))',
                backgroundColor: isChecked ? 'hsl(var(--primary-foreground))' : 'transparent',
                color: isChecked ? FILL_DARK : 'transparent',
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
