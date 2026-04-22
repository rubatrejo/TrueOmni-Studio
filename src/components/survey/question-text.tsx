'use client';

interface Props {
  value: string | null;
  maxLength?: number;
  counterTemplate: string;
  placeholder?: string;
}

/**
 * Display-only del text question. El OnScreenKeyboard se monta FUERA del
 * card, al bottom del canvas (mismo patrón que SearchOverlay / SendToEmailModal).
 */
export function QuestionText({
  value,
  maxLength = 500,
  counterTemplate,
  placeholder = 'Type here…',
}: Props) {
  const current = value ?? '';
  const counter = counterTemplate
    .replace('{count}', String(current.length))
    .replace('{max}', String(maxLength));

  return (
    <div className="mx-auto" style={{ width: '560px' }}>
      <div className="relative">
        <div
          className="w-full rounded-2xl font-sans"
          style={{
            minHeight: '220px',
            padding: '20px 20px 56px 20px',
            fontSize: '20px',
            lineHeight: 1.4,
            backgroundColor: 'hsl(var(--primary-foreground) / 0.08)',
            border: '2px solid hsl(var(--primary-foreground) / 0.25)',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            color: 'hsl(var(--primary-foreground))',
          }}
        >
          {current || <span style={{ opacity: 0.45 }}>{placeholder}</span>}
        </div>
        <span
          className="absolute font-sans font-bold"
          style={{
            right: '20px',
            bottom: '14px',
            fontSize: '18px',
            opacity: 0.92,
            letterSpacing: '0.04em',
            color: 'hsl(var(--primary-foreground))',
          }}
        >
          {counter}
        </span>
      </div>
    </div>
  );
}
