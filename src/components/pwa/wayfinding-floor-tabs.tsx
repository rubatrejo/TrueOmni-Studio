'use client';

import type { WayfindingFloor } from '@/lib/config';

const OPEN_SANS = { fontFamily: 'var(--font-open-sans)' } as const;

interface WayfindingFloorTabsProps {
  floors: WayfindingFloor[];
  activeKey: string;
  onSelect: (key: string) => void;
}

/**
 * Tabs horizontales para cambiar de piso en Wayfinding. Verbatim del XD:
 * pills redondeadas, activo = navy sólido (--brand-primary) con texto blanco,
 * inactivo = fondo gris claro con texto oscuro. Agrupados al centro con gap
 * compacto.
 */
export function WayfindingFloorTabs({ floors, activeKey, onSelect }: WayfindingFloorTabsProps) {
  return (
    <div className="flex items-center justify-center gap-[6px] px-6 py-3">
      {floors.map((f) => {
        const active = f.key === activeKey;
        return (
          <button
            key={f.key}
            type="button"
            onClick={() => onSelect(f.key)}
            className="rounded-full px-[14px] py-[7px] text-[10px] font-bold uppercase tracking-wide transition-colors"
            style={{
              ...OPEN_SANS,
              backgroundColor: active ? 'hsl(var(--brand-primary))' : 'hsl(0 0% 90%)',
              color: active ? '#fff' : 'hsl(0 0% 35%)',
            }}
          >
            {f.label}
          </button>
        );
      })}
    </div>
  );
}
