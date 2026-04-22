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
      strokeWidth="3.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="5 12 10 17 19 7" />
    </svg>
  );
}

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
    <div className="survey-stagger mx-auto flex flex-col" style={{ gap: '16px', width: '600px' }}>
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
              height: '80px',
              paddingLeft: '28px',
              paddingRight: '28px',
              gap: '20px',
              fontSize: '22px',
              borderColor: isChecked
                ? 'hsl(var(--accent))'
                : 'hsl(var(--primary-foreground) / 0.4)',
              backgroundColor: isChecked
                ? 'hsl(var(--accent))'
                : 'hsl(var(--primary-foreground) / 0.04)',
              color: isChecked ? 'hsl(var(--accent-foreground))' : 'hsl(var(--primary-foreground))',
              transform: isChecked ? 'translateX(6px)' : 'translateX(0)',
              boxShadow: isChecked
                ? '0 14px 32px -10px hsl(var(--accent) / 0.6)'
                : '0 2px 0 0 hsl(var(--primary-foreground) / 0.04)',
            }}
          >
            <span
              aria-hidden
              className="inline-flex items-center justify-center rounded-md border-2 transition-all duration-300"
              style={{
                width: '28px',
                height: '28px',
                flexShrink: 0,
                borderColor: isChecked
                  ? 'hsl(var(--accent-foreground))'
                  : 'hsl(var(--primary-foreground) / 0.5)',
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
