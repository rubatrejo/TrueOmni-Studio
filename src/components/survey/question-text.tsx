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

const KEYBOARD_SCALE = 0.6;
const KEYBOARD_NATIVE_W = 1080;
const KEYBOARD_NATIVE_H = 398;
const KEYBOARD_W = KEYBOARD_NATIVE_W * KEYBOARD_SCALE; // 648
const KEYBOARD_H = KEYBOARD_NATIVE_H * KEYBOARD_SCALE; // ~239

/**
 * Textarea display del mismo ancho que el OnScreenKeyboard escalado.
 * Counter 0/500 grande y prominente.
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
    <div className="flex w-full flex-col items-center" style={{ gap: '16px' }}>
      <div className="relative" style={{ width: `${KEYBOARD_W}px` }}>
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
      <div
        style={{
          width: `${KEYBOARD_W}px`,
          height: `${KEYBOARD_H}px`,
          position: 'relative',
        }}
      >
        <div
          style={{
            transform: `scale(${KEYBOARD_SCALE})`,
            transformOrigin: 'top left',
            position: 'absolute',
            top: 0,
            left: 0,
          }}
        >
          <OnScreenKeyboard shift={shift} onKey={handleKey} />
        </div>
      </div>
    </div>
  );
}
