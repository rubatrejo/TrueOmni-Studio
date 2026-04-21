'use client';

/**
 * Teclado on-screen verbatim del SVG designs/Home/Search.svg.
 * Canvas 1080×398 blanco. Las teclas están posicionadas en absoluto con
 * (x, y) exactos del SVG. Normal keys 73×75 rx=7 #004f8b. Especiales en
 * azul claro #1796d6 o anchos variables.
 */

export type KeyboardKey =
  | string
  | 'BACKSPACE'
  | 'ENTER'
  | 'SPACE'
  | 'SHIFT'
  | 'SYMBOLS'
  | 'AT'
  | 'DOT_COM'
  | 'CLOSE';

interface KeySpec {
  label: string;
  x: number;
  y: number;
  w?: number;
  h?: number;
  bg?: string;
  fontSize?: number;
  onPress: KeyboardKey;
}

/** Layout verbatim del SVG Search (coords relativos al keyboard 1080×398). */
function buildLayout(shift: boolean): KeySpec[] {
  const apply = (l: string) => (shift ? l.toUpperCase() : l);
  const normal = { w: 73, h: 75, bg: '#004f8b', fontSize: 28 };

  // Row 1 (y=30): q..p + backspace
  const r1Letters = ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'];
  const row1: KeySpec[] = r1Letters.map((l, i) => ({
    label: apply(l),
    x: 59 + i * 88,
    y: 30,
    ...normal,
    onPress: apply(l),
  }));
  row1.push({
    label: '⌫',
    x: 939,
    y: 30,
    w: 73,
    h: 75,
    bg: '#1796d6',
    fontSize: 32,
    onPress: 'BACKSPACE',
  });

  // Row 2 (y=118): a..l + Enter
  const r2Letters = ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'];
  const row2: KeySpec[] = r2Letters.map((l, i) => ({
    label: apply(l),
    x: 95 + i * 88,
    y: 118,
    ...normal,
    onPress: apply(l),
  }));
  row2.push({
    label: 'Enter',
    x: 887,
    y: 118,
    w: 122,
    h: 75,
    bg: '#004f8b',
    fontSize: 26,
    onPress: 'ENTER',
  });

  // Row 3 (y=206): Shift + z..m + ! + ? + Shift-right(⇧)
  const r3Letters = ['z', 'x', 'c', 'v', 'b', 'n', 'm'];
  const row3: KeySpec[] = [
    {
      label: '↑',
      x: 46,
      y: 206,
      w: 171,
      h: 75,
      bg: '#1796d6',
      fontSize: 32,
      onPress: 'SHIFT',
    },
    ...r3Letters.map(
      (l, i): KeySpec => ({
        label: apply(l),
        x: 232 + i * 88,
        y: 206,
        ...normal,
        onPress: apply(l),
      }),
    ),
    { label: '!', x: 850, y: 206, ...normal, onPress: '!' },
    { label: '?', x: 937, y: 206, ...normal, onPress: '?' },
  ];

  // Row 4 (y=294): 123.,? + @ + Space + .com + ⌨
  const row4: KeySpec[] = [
    {
      label: '123.,?',
      x: 46,
      y: 294,
      w: 111,
      h: 75,
      bg: '#1796d6',
      fontSize: 22,
      onPress: 'SYMBOLS',
    },
    {
      label: '@',
      x: 172,
      y: 294,
      w: 73,
      h: 75,
      bg: '#1796d6',
      fontSize: 28,
      onPress: 'AT',
    },
    {
      label: ' ',
      x: 260,
      y: 294,
      w: 514,
      h: 75,
      bg: '#004f8b',
      fontSize: 28,
      onPress: 'SPACE',
    },
    {
      label: '.com',
      x: 789,
      y: 294,
      w: 86,
      h: 75,
      bg: '#004f8b',
      fontSize: 22,
      onPress: 'DOT_COM',
    },
    {
      label: '⌨',
      x: 890,
      y: 294,
      w: 111,
      h: 75,
      bg: '#1796d6',
      fontSize: 28,
      onPress: 'CLOSE',
    },
  ];

  return [...row1, ...row2, ...row3, ...row4];
}

export function OnScreenKeyboard({
  shift = false,
  onKey,
}: {
  shift?: boolean;
  onKey: (k: KeyboardKey) => void;
}) {
  const keys = buildLayout(shift);
  return (
    <div className="relative" style={{ width: '1080px', height: '398px', backgroundColor: '#fff' }}>
      {keys.map((k, i) => (
        <button
          key={`${k.label}-${i}`}
          type="button"
          onClick={() => onKey(k.onPress)}
          aria-label={
            k.onPress === 'SHIFT'
              ? 'Cambiar mayúsculas'
              : k.onPress === 'BACKSPACE'
                ? 'Borrar'
                : k.onPress === 'SPACE'
                  ? 'Espacio'
                  : k.onPress === 'ENTER'
                    ? 'Buscar'
                    : k.onPress === 'CLOSE'
                      ? 'Cerrar teclado'
                      : k.label
          }
          aria-pressed={k.onPress === 'SHIFT' ? shift : undefined}
          className="absolute flex items-center justify-center font-sans font-bold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
          style={{
            left: `${k.x}px`,
            top: `${k.y}px`,
            width: `${k.w ?? 73}px`,
            height: `${k.h ?? 75}px`,
            backgroundColor: k.onPress === 'SHIFT' && shift ? '#1796d6' : k.bg,
            borderRadius: '7px',
            fontSize: `${k.fontSize ?? 28}px`,
            letterSpacing: '0.01em',
          }}
        >
          {k.label}
        </button>
      ))}
    </div>
  );
}
