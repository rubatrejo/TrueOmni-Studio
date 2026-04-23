'use client';

import type { MapSource } from '@/lib/config';

/**
 * Fila de chips de categoría del Map.
 *
 * Comportamiento:
 *   - Chip "Select All" al inicio — al tocar:
 *       · Si no están TODOS activos → activa todos (reset a estado completo).
 *       · Si TODOS activos → los deja todos activos (no hace nada).
 *   - Chips por categoría (Play/Eat/Stay/Events):
 *       · Activo: relleno sólido del color de la categoría + texto blanco + ×.
 *       · Inactivo: outline con el color de la categoría + texto difuminado
 *         (opacidad ~0.55) — indica visualmente que está apagada.
 *   - Paddings alineados con el logo TrueOmni (65 px left).
 */
interface ChipDef {
  source: MapSource;
  label: string;
  bgColor: string;
}

interface MapChipsProps {
  chips: ChipDef[];
  active: ReadonlySet<MapSource>;
  onToggle: (source: MapSource) => void;
  onSelectAll: () => void;
  selectAllLabel: string;
  availableSources?: ReadonlySet<MapSource>;
}

const CHIP_HEIGHT = 54;
const CHIP_RADIUS = 8;
const SELECT_ALL_COLOR = '#555555'; // neutro (gris oscuro) para distinguirlo de las categorías

export function MapChips({
  chips,
  active,
  onToggle,
  onSelectAll,
  selectAllLabel,
  availableSources,
}: MapChipsProps) {
  const visibleChips = chips.filter((c) => !availableSources || availableSources.has(c.source));
  const allActive = visibleChips.every((c) => active.has(c.source));

  return (
    <div
      className="flex w-full flex-shrink-0 items-center overflow-x-auto py-2"
      style={{
        scrollbarWidth: 'none',
        paddingLeft: '65px',
        paddingRight: '32px',
        gap: '16px',
      }}
      role="group"
      aria-label="Filter categories"
    >
      <ChipButton
        label={selectAllLabel}
        color={SELECT_ALL_COLOR}
        active={allActive}
        onClick={onSelectAll}
        showX={false}
      />

      {visibleChips.map((chip) => {
        const isActive = active.has(chip.source);
        return (
          <ChipButton
            key={chip.source}
            label={chip.label}
            color={chip.bgColor}
            active={isActive}
            showX
            onClick={() => onToggle(chip.source)}
          />
        );
      })}
    </div>
  );
}

function ChipButton({
  label,
  color,
  active,
  showX,
  onClick,
}: {
  label: string;
  color: string;
  active: boolean;
  showX: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={active ? `Remove ${label} filter` : `Add ${label} filter`}
      onClick={onClick}
      className="inline-flex flex-shrink-0 items-center transition-all focus:outline-none focus-visible:ring-4 focus-visible:ring-white/60"
      style={{
        height: `${CHIP_HEIGHT}px`,
        borderRadius: `${CHIP_RADIUS}px`,
        paddingLeft: '18px',
        paddingRight: showX && active ? '14px' : '20px',
        backgroundColor: active ? color : 'rgba(255,255,255,0.75)',
        color: active ? '#ffffff' : color,
        border: active ? `2px solid ${color}` : `2px solid ${color}`,
        opacity: active ? 1 : 0.55,
        fontFamily: "'Open Sans', var(--font-sans)",
        fontSize: '20px',
        fontWeight: 600,
        boxShadow: active ? '0 4px 10px rgba(0,0,0,0.18)' : 'none',
      }}
    >
      <FilterIcon stroke={active ? '#ffffff' : color} />
      <span
        aria-hidden="true"
        style={{
          width: '1px',
          height: '22px',
          backgroundColor: active ? 'rgba(255,255,255,0.6)' : `${color}`,
          margin: '0 12px',
          opacity: active ? 1 : 0.4,
        }}
      />
      <span style={{ lineHeight: 1 }}>{label}</span>
      {showX && active ? (
        <span
          aria-hidden="true"
          className="ml-3 inline-flex items-center justify-center"
          style={{ width: '18px', height: '18px' }}
        >
          <svg width="14" height="14" viewBox="0 0 18 18" aria-hidden="true">
            <path
              d="M2.6,0C2.4,0 2.2,0.1 2,0.3L0.3,2C0.1,2.2 0,2.4 0,2.6C0,2.8 0.1,3 0.3,3.5L5.8,9L0.3,14.5C0.1,14.7 0,14.9 0,15.1C0,15.3 0.1,15.5 0.3,16L1.9,17.6C2.1,17.8 2.3,17.9 2.5,17.9C2.7,17.9 2.9,17.8 3.4,17.6L9,12.2L14.5,17.6C14.7,17.8 14.9,17.9 15.1,17.9C15.3,17.9 15.5,17.8 16,17.6L17.7,15.9C17.9,15.7 18,15.5 18,15.3C18,15.1 17.9,14.9 17.7,14.5L12.2,9L17.7,3.5C17.9,3.3 18,3.1 18,2.9C18,2.7 17.9,2.5 17.7,2L16.1,0.3C15.9,0.1 15.7,0 15.5,0C15.3,0 15.1,0.1 14.5,0.3L9,5.8L3.5,0.3C3.3,0.1 3.1,0 2.6,0Z"
              fill="#ffffff"
            />
          </svg>
        </span>
      ) : null}
    </button>
  );
}

/** Ícono `fic_filter_default` verbatim del SVG (embudo). */
function FilterIcon({ stroke }: { stroke: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 25" aria-hidden="true">
      <path
        d="M14.71,25h-.074a.339.339,0,0,1-.234-.051L9.26,21.688a.576.576,0,0,1-.271-.493V12.99h6.229V24.457a.575.575,0,0,1-.271.492A.438.438,0,0,1,14.71,25Zm-.036-13.043H9.239a.582.582,0,0,1-.374-.17L.17,2.547A.487.487,0,0,1,0,2.174V.544A.515.515,0,0,1,.544,0H23.37a.515.515,0,0,1,.544.544v1.63a.487.487,0,0,1-.17.374l-8.7,9.239A.489.489,0,0,1,14.674,11.957Z"
        fill={stroke}
      />
    </svg>
  );
}
