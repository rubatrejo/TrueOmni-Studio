'use client';

import { useState } from 'react';

import { OnScreenKeyboard, type KeyboardKey } from '@/components/home/on-screen-keyboard';

interface Props {
  value: string | null;
  onChange: (v: string) => void;
  maxLength?: number;
  counterTemplate: string;
  placeholder?: string;
}

/**
 * Textarea display + OnScreenKeyboard del home escalado para caber en el card.
 * El textarea es display-only; el input viene del teclado on-screen.
 */
export function QuestionText({
  value,
  onChange,
  maxLength = 500,
  counterTemplate,
  placeholder = 'Type here…',
}: Props) {
  const [shift, setShift] = useState(false);
  const current = value ?? '';

  const append = (s: string) => {
    onChange((current + s).slice(0, maxLength));
  };

  const handleKey = (k: KeyboardKey) => {
    if (k === 'BACKSPACE') {
      onChange(current.slice(0, -1));
      return;
    }
    if (k === 'SHIFT') {
      setShift((s) => !s);
      return;
    }
    if (k === 'SPACE') return append(' ');
    if (k === 'ENTER') return append('\n');
    if (k === 'AT') return append('@');
    if (k === 'DOT_COM') return append('.com');
    if (k === 'CLOSE' || k === 'SYMBOLS') return;
    if (typeof k === 'string' && k.length === 1) {
      append(k);
      if (shift) setShift(false);
    }
  };

  const counter = counterTemplate
    .replace('{count}', String(current.length))
    .replace('{max}', String(maxLength));

  return (
    <div className="flex w-full flex-col items-center" style={{ gap: '24px' }}>
      <div className="relative" style={{ width: '720px' }}>
        <div
          className="w-full rounded-2xl font-sans"
          style={{
            minHeight: '140px',
            padding: '24px',
            fontSize: '22px',
            lineHeight: 1.45,
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
          className="absolute font-sans"
          style={{
            right: '16px',
            bottom: '12px',
            fontSize: '13px',
            opacity: 0.7,
            letterSpacing: '0.04em',
          }}
        >
          {counter}
        </span>
      </div>
      <div
        style={{
          transform: 'scale(0.74)',
          transformOrigin: 'top center',
          marginBottom: '-50px',
        }}
      >
        <OnScreenKeyboard shift={shift} onKey={handleKey} />
      </div>
    </div>
  );
}
