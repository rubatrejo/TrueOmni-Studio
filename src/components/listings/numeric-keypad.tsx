'use client';

/**
 * Numeric keypad 4×4 verbatim SVG `Send to Phone`.
 *   Row 1: 7 8 9 -
 *   Row 2: 4 5 6 $
 *   Row 3: 1 2 3 keyboard-toggle
 *   Row 4: . 0 Send (double-wide)
 *
 * Estilo consistente con `OnScreenKeyboard`: teclas 73×75 rx=7 fondo hsl(var(--brand-primary)),
 * teclas especiales hsl(var(--brand-secondary)).
 */

export type NumericKey =
  | string // '0'..'9' | '.' | '-' | '$'
  | 'KEYBOARD'
  | 'SEND';

interface KeySpec {
  label: string;
  onPress: NumericKey;
  x: number;
  y: number;
  w: number;
  h: number;
  bg: string;
  fontSize: number;
}

/**
 * Layout 4×4 centrado. Cada tecla es 73×75, gap 15 entre columnas y filas.
 * Ancho total: 4*73 + 3*15 = 337. Alto: 4*75 + 3*15 = 345.
 */
const KEY_W = 73;
const KEY_H = 75;
const GAP = 15;
const BG = 'hsl(var(--keyboard-key-bg))';
const BG_SPECIAL = 'hsl(var(--keyboard-key-special))';

function buildLayout(): KeySpec[] {
  const cell = (col: number, row: number) => ({
    x: col * (KEY_W + GAP),
    y: row * (KEY_H + GAP),
    w: KEY_W,
    h: KEY_H,
  });

  return [
    // Row 0: 7 8 9 -
    { label: '7', onPress: '7', ...cell(0, 0), bg: BG, fontSize: 28 },
    { label: '8', onPress: '8', ...cell(1, 0), bg: BG, fontSize: 28 },
    { label: '9', onPress: '9', ...cell(2, 0), bg: BG, fontSize: 28 },
    { label: '-', onPress: '-', ...cell(3, 0), bg: BG, fontSize: 28 },
    // Row 1: 4 5 6 $
    { label: '4', onPress: '4', ...cell(0, 1), bg: BG, fontSize: 28 },
    { label: '5', onPress: '5', ...cell(1, 1), bg: BG, fontSize: 28 },
    { label: '6', onPress: '6', ...cell(2, 1), bg: BG, fontSize: 28 },
    { label: '$', onPress: '$', ...cell(3, 1), bg: BG, fontSize: 28 },
    // Row 2: 1 2 3 keyboard-toggle
    { label: '1', onPress: '1', ...cell(0, 2), bg: BG, fontSize: 28 },
    { label: '2', onPress: '2', ...cell(1, 2), bg: BG, fontSize: 28 },
    { label: '3', onPress: '3', ...cell(2, 2), bg: BG, fontSize: 28 },
    { label: '⌨', onPress: 'KEYBOARD', ...cell(3, 2), bg: BG_SPECIAL, fontSize: 28 },
    // Row 3: . 0 Send (double-wide)
    { label: '.', onPress: '.', ...cell(0, 3), bg: BG, fontSize: 28 },
    { label: '0', onPress: '0', ...cell(1, 3), bg: BG, fontSize: 28 },
    {
      label: 'Send',
      onPress: 'SEND',
      x: 2 * (KEY_W + GAP),
      y: 3 * (KEY_H + GAP),
      w: KEY_W * 2 + GAP,
      h: KEY_H,
      bg: BG,
      fontSize: 24,
    },
  ];
}

export function NumericKeypad({ onKey }: { onKey: (k: NumericKey) => void }) {
  const keys = buildLayout();
  const width = 4 * KEY_W + 3 * GAP; // 337
  const height = 4 * KEY_H + 3 * GAP; // 345

  return (
    <div
      className="relative mx-auto"
      style={{
        width: `${width}px`,
        height: `${height}px`,
      }}
    >
      {keys.map((k) => (
        <button
          key={`${k.label}-${k.x}-${k.y}`}
          type="button"
          onClick={() => onKey(k.onPress)}
          aria-label={
            k.onPress === 'KEYBOARD'
              ? 'Cambiar a teclado alfabético'
              : k.onPress === 'SEND'
                ? 'Enviar'
                : k.label
          }
          className="absolute flex items-center justify-center font-sans font-bold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
          style={{
            left: `${k.x}px`,
            top: `${k.y}px`,
            width: `${k.w}px`,
            height: `${k.h}px`,
            backgroundColor: k.bg,
            borderRadius: '7px',
            fontSize: `${k.fontSize}px`,
            letterSpacing: '0.01em',
          }}
        >
          {k.label}
        </button>
      ))}
    </div>
  );
}
