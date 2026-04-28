'use client';

import { useState } from 'react';

/**
 * Teclado on-screen tipo iOS (3 capas):
 *   - LETTERS: QWERTY clásico + shift + backspace + 123 + @ + space + ⏎
 *   - NUMBERS: dígitos + símbolos comunes + #+= + ABC + @ + space + ⏎
 *   - SYMBOLS: símbolos avanzados ([] {} #% etc) + 123 + ABC + @ + space + ⏎
 *
 * Toggles 123 / ABC / #+= se manejan internamente. Shift también es estado
 * interno (los consumers reciben directamente el carácter ya en mayus/minus).
 *
 * API pública para el consumer:
 *   - `BACKSPACE` borra una letra (consumer hace `value.slice(0,-1)`).
 *   - `ENTER` se dispara con el botón submit azul (consumer envía/cierra).
 *   - `SPACE` añade espacio.
 *   - `string` de longitud 1+ → carácter literal a añadir (incluye '@', '.com', etc.).
 *
 * Canvas 1080×398 (4 filas), tokens `--keyboard-bg` / `--keyboard-key-bg`
 * / `--keyboard-key-special` / `--keyboard-submit-bg`.
 */

export type KeyboardKey = string | 'BACKSPACE' | 'ENTER' | 'SPACE';

type Mode = 'letters' | 'numbers' | 'symbols';

interface KeySpec {
  label: string;
  /** Si null, es una tecla interna que no llama onKey (toggles). */
  emit: KeyboardKey | null;
  x: number;
  y: number;
  w?: number;
  h?: number;
  variant?: 'normal' | 'special' | 'submit';
  fontSize?: number;
  /** Acción interna (toggle de modo / shift). */
  internal?: 'toggle-numbers' | 'toggle-symbols' | 'toggle-letters' | 'shift';
  /** Aria-label opcional override. */
  aria?: string;
}

const KEY_W = 73;
const KEY_H = 75;
const KEY_GAP = 15;
const KEY_STEP = KEY_W + KEY_GAP;

const KEYBOARD_WIDTH = 1080;
const KEYBOARD_HEIGHT = 398;

const ROW_Y = [30, 118, 206, 294] as const;

export const ON_SCREEN_KEYBOARD_WIDTH = KEYBOARD_WIDTH;
export const ON_SCREEN_KEYBOARD_HEIGHT = KEYBOARD_HEIGHT;

/* ---------------- LAYOUTS ---------------- */

function buildLetters(shift: boolean): KeySpec[] {
  const apply = (l: string) => (shift ? l.toUpperCase() : l);
  const normal = { w: KEY_W, h: KEY_H, variant: 'normal' as const, fontSize: 28 };

  const r1 = ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'];
  const row1: KeySpec[] = r1.map((l, i) => ({
    label: apply(l),
    emit: apply(l),
    x: 59 + i * KEY_STEP,
    y: ROW_Y[0],
    ...normal,
  }));

  const r2 = ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'];
  const row2: KeySpec[] = r2.map((l, i) => ({
    label: apply(l),
    emit: apply(l),
    x: 103 + i * KEY_STEP,
    y: ROW_Y[1],
    ...normal,
  }));

  const r3 = ['z', 'x', 'c', 'v', 'b', 'n', 'm'];
  // Row 3: shift y backspace anchos, letras centradas para reducir vacío lateral.
  const row3: KeySpec[] = [
    {
      label: '⇧',
      emit: null,
      internal: 'shift',
      x: 94,
      y: ROW_Y[2],
      w: 130,
      h: KEY_H,
      variant: 'special',
      fontSize: 30,
      aria: 'Cambiar mayúsculas',
    },
    ...r3.map(
      (l, i): KeySpec => ({
        label: apply(l),
        emit: apply(l),
        x: 239 + i * KEY_STEP,
        y: ROW_Y[2],
        ...normal,
      }),
    ),
    {
      label: '⌫',
      emit: 'BACKSPACE',
      x: 855,
      y: ROW_Y[2],
      w: 130,
      h: KEY_H,
      variant: 'special',
      fontSize: 30,
      aria: 'Borrar',
    },
  ];

  // Row 4: [123] [@] [SPACE wide] [⏎ submit]
  const row4: KeySpec[] = [
    {
      label: '123',
      emit: null,
      internal: 'toggle-numbers',
      x: 59,
      y: ROW_Y[3],
      w: 130,
      h: KEY_H,
      variant: 'special',
      fontSize: 24,
      aria: 'Mostrar números',
    },
    {
      label: '@',
      emit: '@',
      x: 204,
      y: ROW_Y[3],
      w: KEY_W,
      h: KEY_H,
      variant: 'normal',
      fontSize: 28,
    },
    {
      label: '',
      emit: 'SPACE',
      x: 292,
      y: ROW_Y[3],
      w: 540,
      h: KEY_H,
      variant: 'normal',
      fontSize: 24,
      aria: 'Espacio',
    },
    {
      label: '⏎',
      emit: 'ENTER',
      x: 847,
      y: ROW_Y[3],
      w: 174,
      h: KEY_H,
      variant: 'submit',
      fontSize: 32,
      aria: 'Enviar',
    },
  ];

  return [...row1, ...row2, ...row3, ...row4];
}

function buildNumbers(): KeySpec[] {
  const normal = { w: KEY_W, h: KEY_H, variant: 'normal' as const, fontSize: 28 };

  const r1 = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];
  const row1: KeySpec[] = r1.map((l, i) => ({
    label: l,
    emit: l,
    x: 59 + i * KEY_STEP,
    y: ROW_Y[0],
    ...normal,
  }));

  const r2 = ['-', '/', ':', ';', '(', ')', '$', '&', '@', '"'];
  const row2: KeySpec[] = r2.map((l, i) => ({
    label: l,
    emit: l,
    x: 59 + i * KEY_STEP,
    y: ROW_Y[1],
    ...normal,
  }));

  // Row 3: [#+=] . , ? ! ' ⌫ — alineado con row3 de letters
  const r3Symbols = ['.', ',', '?', '!', "'"];
  const row3: KeySpec[] = [
    {
      label: '#+=',
      emit: null,
      internal: 'toggle-symbols',
      x: 94,
      y: ROW_Y[2],
      w: 130,
      h: KEY_H,
      variant: 'special',
      fontSize: 24,
      aria: 'Más símbolos',
    },
    ...r3Symbols.map(
      (l, i): KeySpec => ({
        label: l,
        emit: l,
        x: 269 + i * 117, // 5 keys distribuidos entre x=269 y x=737 (mismo span que zxcvbnm)
        y: ROW_Y[2],
        ...normal,
      }),
    ),
    {
      label: '⌫',
      emit: 'BACKSPACE',
      x: 855,
      y: ROW_Y[2],
      w: 130,
      h: KEY_H,
      variant: 'special',
      fontSize: 30,
      aria: 'Borrar',
    },
  ];

  // Row 4: [ABC] [.com] [SPACE] [⏎]
  const row4: KeySpec[] = [
    {
      label: 'ABC',
      emit: null,
      internal: 'toggle-letters',
      x: 59,
      y: ROW_Y[3],
      w: 130,
      h: KEY_H,
      variant: 'special',
      fontSize: 22,
      aria: 'Volver al teclado',
    },
    {
      label: '.com',
      emit: '.com',
      x: 204,
      y: ROW_Y[3],
      w: KEY_W,
      h: KEY_H,
      variant: 'normal',
      fontSize: 18,
    },
    {
      label: '',
      emit: 'SPACE',
      x: 292,
      y: ROW_Y[3],
      w: 540,
      h: KEY_H,
      variant: 'normal',
      fontSize: 24,
      aria: 'Espacio',
    },
    {
      label: '⏎',
      emit: 'ENTER',
      x: 847,
      y: ROW_Y[3],
      w: 174,
      h: KEY_H,
      variant: 'submit',
      fontSize: 32,
      aria: 'Enviar',
    },
  ];

  return [...row1, ...row2, ...row3, ...row4];
}

function buildSymbols(): KeySpec[] {
  const normal = { w: KEY_W, h: KEY_H, variant: 'normal' as const, fontSize: 28 };

  const r1 = ['[', ']', '{', '}', '#', '%', '^', '*', '+', '='];
  const row1: KeySpec[] = r1.map((l, i) => ({
    label: l,
    emit: l,
    x: 59 + i * KEY_STEP,
    y: ROW_Y[0],
    ...normal,
  }));

  const r2 = ['_', '\\', '|', '~', '<', '>', '€', '£', '¥', '•'];
  const row2: KeySpec[] = r2.map((l, i) => ({
    label: l,
    emit: l,
    x: 59 + i * KEY_STEP,
    y: ROW_Y[1],
    ...normal,
  }));

  const r3Symbols = ['.', ',', '?', '!', "'"];
  const row3: KeySpec[] = [
    {
      label: '123',
      emit: null,
      internal: 'toggle-numbers',
      x: 94,
      y: ROW_Y[2],
      w: 130,
      h: KEY_H,
      variant: 'special',
      fontSize: 24,
      aria: 'Volver a números',
    },
    ...r3Symbols.map(
      (l, i): KeySpec => ({
        label: l,
        emit: l,
        x: 269 + i * 117,
        y: ROW_Y[2],
        ...normal,
      }),
    ),
    {
      label: '⌫',
      emit: 'BACKSPACE',
      x: 855,
      y: ROW_Y[2],
      w: 130,
      h: KEY_H,
      variant: 'special',
      fontSize: 30,
      aria: 'Borrar',
    },
  ];

  const row4: KeySpec[] = [
    {
      label: 'ABC',
      emit: null,
      internal: 'toggle-letters',
      x: 59,
      y: ROW_Y[3],
      w: 130,
      h: KEY_H,
      variant: 'special',
      fontSize: 22,
      aria: 'Volver al teclado',
    },
    {
      label: '@',
      emit: '@',
      x: 204,
      y: ROW_Y[3],
      w: KEY_W,
      h: KEY_H,
      variant: 'normal',
      fontSize: 28,
    },
    {
      label: '',
      emit: 'SPACE',
      x: 292,
      y: ROW_Y[3],
      w: 540,
      h: KEY_H,
      variant: 'normal',
      fontSize: 24,
      aria: 'Espacio',
    },
    {
      label: '⏎',
      emit: 'ENTER',
      x: 847,
      y: ROW_Y[3],
      w: 174,
      h: KEY_H,
      variant: 'submit',
      fontSize: 32,
      aria: 'Enviar',
    },
  ];

  return [...row1, ...row2, ...row3, ...row4];
}

/* ---------------- COMPONENT ---------------- */

export function OnScreenKeyboard({ onKey }: { onKey: (k: KeyboardKey) => void }) {
  const [mode, setMode] = useState<Mode>('letters');
  const [shift, setShift] = useState(false);

  const keys =
    mode === 'letters' ? buildLetters(shift) : mode === 'numbers' ? buildNumbers() : buildSymbols();

  function handleKey(spec: KeySpec) {
    if (spec.internal === 'shift') {
      setShift((s) => !s);
      return;
    }
    if (spec.internal === 'toggle-numbers') {
      setMode('numbers');
      setShift(false);
      return;
    }
    if (spec.internal === 'toggle-symbols') {
      setMode('symbols');
      return;
    }
    if (spec.internal === 'toggle-letters') {
      setMode('letters');
      return;
    }
    if (spec.emit == null) return;
    onKey(spec.emit);
    if (mode === 'letters' && shift && typeof spec.emit === 'string' && spec.emit.length === 1) {
      // tras escribir una mayúscula, desactivar shift (comportamiento iOS).
      setShift(false);
    }
  }

  return (
    <div
      className="relative"
      style={{
        width: `${KEYBOARD_WIDTH}px`,
        height: `${KEYBOARD_HEIGHT}px`,
        backgroundColor: 'hsl(var(--keyboard-bg))',
      }}
    >
      {keys.map((k, i) => {
        const isShiftActive = mode === 'letters' && k.internal === 'shift' && shift;
        const bg =
          k.variant === 'submit'
            ? 'hsl(var(--keyboard-submit-bg))'
            : k.variant === 'special' || isShiftActive
              ? 'hsl(var(--keyboard-key-special))'
              : 'hsl(var(--keyboard-key-bg))';
        return (
          <button
            key={`${mode}-${k.label}-${i}`}
            type="button"
            onClick={() => handleKey(k)}
            aria-label={k.aria ?? k.label}
            aria-pressed={k.internal === 'shift' ? shift : undefined}
            className="absolute flex items-center justify-center font-sans font-bold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
            style={{
              left: `${k.x}px`,
              top: `${k.y}px`,
              width: `${k.w ?? KEY_W}px`,
              height: `${k.h ?? KEY_H}px`,
              backgroundColor: bg,
              borderRadius: '8px',
              fontSize: `${k.fontSize ?? 28}px`,
              letterSpacing: '0.01em',
            }}
          >
            {k.label}
          </button>
        );
      })}
    </div>
  );
}
