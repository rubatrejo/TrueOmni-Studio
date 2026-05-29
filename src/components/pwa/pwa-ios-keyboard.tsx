'use client';

import { useState } from 'react';

/**
 * Teclado on-screen estilo iOS 26 para la PWA (canvas 390).
 *
 * Es *chrome del SO*, no UI del cliente: look neutro fijo (gris claro tipo
 * Liquid Glass, glifos oscuros, return tintado) vía tokens `--pwa-kb-*`, iguales
 * para todos los clientes. 3 capas (letters / numbers / symbols) con shift
 * auto-desactivado tras escribir una mayúscula (comportamiento iOS).
 *
 * API pública (el provider consume `onKey`):
 *   - `BACKSPACE` borra antes del caret.
 *   - `ENTER` confirma (provider hace blur / newline en textarea).
 *   - `SPACE` añade espacio.
 *   - `string` de 1+ caracteres → se inserta literal (incluye '@', '.com', etc.).
 */

export type KeyboardKey = string | 'BACKSPACE' | 'ENTER' | 'SPACE';

export type KbInputType = 'text' | 'email' | 'numeric';

type Mode = 'letters' | 'numbers' | 'symbols';

/* ---------------- métricas verbatim iOS 26 (portrait, 390pt) ---------------- */
const KEY_H = 41; // alto de cada tecla
const ROW_GAP = 9; // separación vertical entre filas
const KEY_GAP = 6; // separación horizontal entre teclas
const SIDE_PAD = 8; // margen lateral del teclado
const TOP_PAD = 8; // padding superior antes de la fila 1
const KEY_RADIUS = 10; // esquinas redondeadas iOS 26 (Liquid Glass)
const FUNC_ROW = 54; // tira inferior con emoji + micrófono (sin fondo de tecla)
const ROWS = 4;

/** Alto total del teclado en el espacio del canvas (px). */
export const PWA_KEYBOARD_HEIGHT = TOP_PAD + ROWS * KEY_H + (ROWS - 1) * ROW_GAP + FUNC_ROW;

interface KeySpec {
  label: string;
  emit: KeyboardKey | null;
  /** Peso flex (ancho relativo dentro de la fila). 1 = tecla de letra. */
  flex?: number;
  variant?: 'letter' | 'special' | 'return' | 'space';
  internal?: 'shift' | 'numbers' | 'symbols' | 'letters';
  icon?: 'shift' | 'shift-on' | 'backspace' | 'return-arrow' | 'emoji' | 'mic';
  aria?: string;
}

const LETTER: Pick<KeySpec, 'variant' | 'flex'> = { variant: 'letter', flex: 1 };

function rowFromChars(chars: string[], shift = false): KeySpec[] {
  return chars.map((c) => {
    const label = shift ? c.toUpperCase() : c;
    return { label, emit: label, ...LETTER };
  });
}

const KEY_SHIFT = (on: boolean): KeySpec => ({
  label: '',
  emit: null,
  internal: 'shift',
  variant: 'special',
  flex: 1.5,
  icon: on ? 'shift-on' : 'shift',
  aria: 'Mayúsculas',
});

const KEY_BACKSPACE: KeySpec = {
  label: '',
  emit: 'BACKSPACE',
  variant: 'special',
  flex: 1.5,
  icon: 'backspace',
  aria: 'Borrar',
};

function bottomRow(mode: Mode, inputType: KbInputType, enterLabel: string): KeySpec[] {
  const toggle: KeySpec =
    mode === 'letters'
      ? {
          label: '123',
          emit: null,
          internal: 'numbers',
          variant: 'special',
          flex: 1.7,
          aria: 'Números',
        }
      : {
          label: 'ABC',
          emit: null,
          internal: 'letters',
          variant: 'special',
          flex: 1.7,
          aria: 'Letras',
        };
  const space: KeySpec = {
    label: enterLabel === '' ? '' : 'space',
    emit: 'SPACE',
    variant: 'space',
    flex: 5,
    aria: 'Espacio',
  };
  const dot: KeySpec = { label: '.', emit: '.', variant: 'special', flex: 1 };
  const ret: KeySpec = {
    label: enterLabel === 'return' ? '' : enterLabel,
    emit: 'ENTER',
    variant: 'return',
    flex: 1.9,
    icon: enterLabel === 'return' ? 'return-arrow' : undefined,
    aria: 'Aceptar',
  };
  if (inputType === 'email' && mode === 'letters') {
    const at: KeySpec = { label: '@', emit: '@', variant: 'special', flex: 1 };
    return [toggle, at, space, dot, ret];
  }
  return [toggle, space, dot, ret];
}

function buildRows(
  mode: Mode,
  shift: boolean,
  inputType: KbInputType,
  enterLabel: string,
): { rows: KeySpec[][]; indent: number[] } {
  if (mode === 'numbers') {
    return {
      rows: [
        rowFromChars(['1', '2', '3', '4', '5', '6', '7', '8', '9', '0']),
        rowFromChars(['-', '/', ':', ';', '(', ')', '$', '&', '@', '"']),
        [
          { label: '#+=', emit: null, internal: 'symbols', variant: 'special', flex: 1.5 },
          ...rowFromChars(['.', ',', '?', '!', "'"]),
          KEY_BACKSPACE,
        ],
        bottomRow('numbers', inputType, enterLabel),
      ],
      indent: [0, 0, 0, 0],
    };
  }
  if (mode === 'symbols') {
    return {
      rows: [
        rowFromChars(['[', ']', '{', '}', '#', '%', '^', '*', '+', '=']),
        rowFromChars(['_', '\\', '|', '~', '<', '>', '€', '£', '¥', '•']),
        [
          { label: '123', emit: null, internal: 'numbers', variant: 'special', flex: 1.5 },
          ...rowFromChars(['.', ',', '?', '!', "'"]),
          KEY_BACKSPACE,
        ],
        bottomRow('symbols', inputType, enterLabel),
      ],
      indent: [0, 0, 0, 0],
    };
  }
  // letters
  return {
    rows: [
      rowFromChars(['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'], shift),
      rowFromChars(['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'], shift),
      [
        KEY_SHIFT(shift),
        ...rowFromChars(['z', 'x', 'c', 'v', 'b', 'n', 'm'], shift),
        KEY_BACKSPACE,
      ],
      bottomRow('letters', inputType, enterLabel),
    ],
    // Fila 2 (9 letras) indentada media tecla a cada lado, como iOS.
    indent: [0, 18, 0, 0],
  };
}

function KeyGlyph({ icon }: { icon: NonNullable<KeySpec['icon']> }) {
  const stroke = 'hsl(var(--pwa-kb-glyph))';
  if (icon === 'shift' || icon === 'shift-on') {
    const fill = icon === 'shift-on' ? 'hsl(var(--pwa-kb-glyph))' : 'none';
    return (
      <svg width="20" height="22" viewBox="0 0 20 22" fill={fill} aria-hidden>
        <path
          d="M10 2 L18 10 H14 V17 H6 V10 H2 Z"
          stroke={stroke}
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (icon === 'backspace') {
    return (
      <svg width="25" height="20" viewBox="0 0 25 20" fill="none" aria-hidden>
        <path
          d="M8 2 H22 A2 2 0 0 1 24 4 V16 A2 2 0 0 1 22 18 H8 L1 10 Z"
          stroke={stroke}
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <path
          d="M12 7 L18 13 M18 7 L12 13"
          stroke={stroke}
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  if (icon === 'return-arrow') {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M4 12 H20 M14 6 L20 12 L14 18"
          stroke="hsl(var(--pwa-kb-return-fg))"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (icon === 'mic') {
    return (
      <svg width="20" height="22" viewBox="0 0 20 22" fill="none" aria-hidden>
        <rect x="7" y="2" width="6" height="11" rx="3" stroke={stroke} strokeWidth="1.6" />
        <path
          d="M4 10 A6 6 0 0 0 16 10 M10 16 V20 M6.5 20 H13.5"
          stroke={stroke}
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  // emoji
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden>
      <circle cx="11" cy="11" r="9" stroke={stroke} strokeWidth="1.6" />
      <circle cx="8" cy="9" r="1.1" fill={stroke} />
      <circle cx="14" cy="9" r="1.1" fill={stroke} />
      <path
        d="M7 13.5 A4 4 0 0 0 15 13.5"
        stroke={stroke}
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function PwaIosKeyboard({
  visible,
  inputType = 'text',
  enterLabel = 'return',
  onKey,
  bottomInset = 0,
}: {
  visible: boolean;
  inputType?: KbInputType;
  enterLabel?: string;
  onKey: (k: KeyboardKey) => void;
  /** Espacio reservado bajo las teclas (home indicator iOS). */
  bottomInset?: number;
}) {
  const [mode, setMode] = useState<Mode>(inputType === 'numeric' ? 'numbers' : 'letters');
  const [shift, setShift] = useState(false);

  const { rows, indent } = buildRows(mode, shift, inputType, enterLabel);

  function press(k: KeySpec) {
    if (k.internal === 'shift') return setShift((s) => !s);
    if (k.internal === 'numbers') return setMode('numbers');
    if (k.internal === 'symbols') return setMode('symbols');
    if (k.internal === 'letters') return setMode('letters');
    if (k.emit == null) return;
    onKey(k.emit);
    if (mode === 'letters' && shift && typeof k.emit === 'string' && k.emit.length === 1) {
      setShift(false); // auto-off tras una mayúscula (iOS)
    }
  }

  return (
    <div
      aria-hidden={!visible}
      role="presentation"
      // Guard de foco: evita que tocar los huecos entre teclas haga blur del input.
      // eslint-disable-next-line jsx-a11y/no-static-element-interactions
      onMouseDown={(e) => e.preventDefault()}
      className="absolute inset-x-0 bottom-0 z-[1000] select-none"
      style={{
        height: PWA_KEYBOARD_HEIGHT,
        paddingBottom: bottomInset,
        backgroundColor: 'hsl(var(--pwa-kb-bg))',
        backdropFilter: 'blur(18px) saturate(160%)',
        WebkitBackdropFilter: 'blur(18px) saturate(160%)',
        transform: visible ? 'translateY(0)' : `translateY(${PWA_KEYBOARD_HEIGHT + 8}px)`,
        transition: 'transform 260ms cubic-bezier(0.32, 0.72, 0, 1)',
        boxShadow: '0 -1px 0 hsl(var(--pwa-kb-shadow) / 0.18)',
      }}
    >
      <div
        className="flex flex-col"
        style={{ gap: ROW_GAP, paddingLeft: SIDE_PAD, paddingRight: SIDE_PAD, paddingTop: TOP_PAD }}
      >
        {rows.map((row, ri) => (
          <div
            key={ri}
            className="flex items-stretch"
            style={{
              height: KEY_H,
              gap: KEY_GAP,
              paddingLeft: indent[ri],
              paddingRight: indent[ri],
            }}
          >
            {row.map((k, ki) => {
              // iOS 26: todas las teclas son blancas; solo el return va tintado.
              const isReturn = k.variant === 'return';
              const bg = isReturn ? 'hsl(var(--pwa-kb-return))' : 'hsl(var(--pwa-kb-key))';
              const fg = isReturn ? 'hsl(var(--pwa-kb-return-fg))' : 'hsl(var(--pwa-kb-glyph))';
              return (
                <button
                  key={`${mode}-${ri}-${ki}-${k.label}-${k.icon ?? ''}`}
                  type="button"
                  // Evita que el input pierda el foco al tocar una tecla.
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => press(k)}
                  aria-label={k.aria ?? k.label}
                  className="flex items-center justify-center"
                  style={{
                    flexGrow: k.flex ?? 1,
                    flexBasis: 0,
                    borderRadius: KEY_RADIUS,
                    backgroundColor: bg,
                    color: fg,
                    fontSize: k.variant === 'space' ? 14 : k.label.length > 1 ? 15 : 21,
                    fontWeight: isReturn ? 500 : 400,
                    boxShadow: '0 1px 1px hsl(var(--pwa-kb-shadow) / 0.4)',
                  }}
                >
                  {k.icon ? <KeyGlyph icon={k.icon} /> : k.label}
                </button>
              );
            })}
          </div>
        ))}
      </div>
      {/* Tira de funciones iOS 26: emoji (izq) + micrófono (der), sin fondo de tecla. */}
      <div
        className="absolute inset-x-0 bottom-0 flex items-center justify-between"
        style={{ height: FUNC_ROW, paddingLeft: 16, paddingRight: 16 }}
      >
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          aria-label="Emoji"
          className="flex h-9 w-9 items-center justify-center"
        >
          <KeyGlyph icon="emoji" />
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          aria-label="Dictado"
          className="flex h-9 w-9 items-center justify-center"
        >
          <KeyGlyph icon="mic" />
        </button>
      </div>
    </div>
  );
}
