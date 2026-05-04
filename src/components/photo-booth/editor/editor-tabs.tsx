'use client';

export type EditorTab = 'backgrounds' | 'frames' | 'filters';

interface EditorTabsProps {
  active: EditorTab;
  onSelect: (tab: EditorTab) => void;
  labels: { backgrounds: string; frames: string; filters: string };
}

/**
 * Barra de tabs Backgrounds | Frames | Filters verbatim del SVG
 * `4-Photo_Booth-Experience.svg`:
 *   - Bar: rect 1080×90 translate(0, 605) fill="hsl(var(--brand-secondary))".
 *   - Tab active: rect 317×58 rx=10 translate(392, 621) fill="hsl(var(--brand-primary))".
 *   - Texto active: fill=#fff font Montserrat-Bold 30px.
 *
 * El tab "Frames" aparece active en el SVG, pero la posición se calcula
 * dinámicamente según el active prop. La posición del highlight sigue el
 * texto seleccionado.
 */
export function EditorTabs({ active, onSelect, labels }: EditorTabsProps) {
  // Posiciones de cada tab x-centro según SVG (translate del <text>):
  //   backgrounds: 177 → label width 210 (~pixel correction)
  //   frames: 551
  //   filters: 892
  const positions: Record<EditorTab, { textX: number; rectX: number }> = {
    backgrounds: { textX: 177, rectX: 39 },
    frames: { textX: 551, rectX: 392 },
    filters: { textX: 892, rectX: 733 },
  };
  return (
    <div
      className="absolute"
      style={{
        left: 0,
        top: 605,
        width: 1080,
        height: 90,
        background: 'hsl(var(--photo-tabs-bg-light, 201 75% 46%))',
      }}
    >
      <svg
        width={1080}
        height={90}
        viewBox="0 0 1080 90"
        style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
      >
        {/* Bar blue secondary */}
        <rect x={0} y={0} width={1080} height={90} fill="hsl(var(--brand-secondary))" />
        {/* Active highlight */}
        <rect
          x={positions[active].rectX}
          y={16}
          width={317}
          height={58}
          rx={10}
          fill="hsl(var(--brand-primary))"
          style={{ transition: 'x 0.2s ease-out' }}
        />
      </svg>

      {(Object.keys(positions) as EditorTab[]).map((tab) => (
        <button
          key={tab}
          type="button"
          onClick={() => onSelect(tab)}
          className="absolute"
          style={{
            left: positions[tab].rectX,
            top: 16,
            width: 317,
            height: 58,
            padding: 0,
            border: 'none',
            background: 'transparent',
            color: '#fff',
            fontSize: 30,
            fontFamily: "'Montserrat', system-ui",
            fontWeight: 700,
          }}
        >
          {labels[tab]}
        </button>
      ))}
    </div>
  );
}
