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
 * Textarea display + OnScreenKeyboard del home. El keyboard se escala a 0.78
 * para caber en el ancho del card (880px ≈ 1080×0.78). Sigue el patrón de
 * SendToEmailModal / SearchOverlay — el texto se construye desde handleKey.
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
    if (current.length + s.length > maxLength) {
      onChange((current + s).slice(0, maxLength));
    } else {
      onChange(current + s);
    }
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
    if (k === 'SPACE') {
      append(' ');
      return;
    }
    if (k === 'ENTER') {
      append('\n');
      return;
    }
    if (k === 'AT') {
      append('@');
      return;
    }
    if (k === 'DOT_COM') {
      append('.com');
      return;
    }
    if (k === 'CLOSE' || k === 'SYMBOLS') {
      return;
    }
    if (typeof k === 'string' && k.length === 1) {
      append(k);
      if (shift) setShift(false);
    }
  };

  const counter = counterTemplate
    .replace('{count}', String(current.length))
    .replace('{max}', String(maxLength));

  return (
    <div className="flex flex-col items-center" style={{ gap: '16px' }}>
      <div className="relative" style={{ width: '100%', maxWidth: '720px' }}>
        <div
          className="w-full rounded-2xl font-sans"
          style={{
            minHeight: '160px',
            padding: '20px',
            fontSize: '22px',
            lineHeight: 1.4,
            backgroundColor: 'hsl(var(--primary-foreground) / 0.1)',
            border: '2px solid hsl(var(--primary-foreground) / 0.3)',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            color: 'hsl(var(--primary-foreground))',
          }}
        >
          {current || <span style={{ opacity: 0.5 }}>{placeholder}</span>}
        </div>
        <span
          className="absolute font-sans"
          style={{
            right: '14px',
            bottom: '10px',
            fontSize: '14px',
            opacity: 0.7,
            color: 'hsl(var(--primary-foreground))',
          }}
        >
          {counter}
        </span>
      </div>
      <div
        style={{
          transform: 'scale(0.78)',
          transformOrigin: 'top center',
          marginBottom: '-44px',
        }}
      >
        <OnScreenKeyboard shift={shift} onKey={handleKey} />
      </div>
    </div>
  );
}
