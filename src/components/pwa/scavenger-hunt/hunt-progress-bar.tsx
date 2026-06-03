'use client';

const OPEN_SANS = { fontFamily: 'var(--font-open-sans)' } as const;

interface HuntProgressBarProps {
  percent: number;
  completedCount: number;
  totalTasks: number;
}

/**
 * Barra de progreso del hunt. Mejora B: muestra "X of Y tasks" además del
 * porcentaje, con transición animada del width.
 */
export function HuntProgressBar({ percent }: HuntProgressBarProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-2" style={OPEN_SANS}>
      <span className="text-[10px] font-bold uppercase tracking-wide text-gray-700">
        Completion
      </span>
      <div className="relative h-[8px] flex-1 overflow-hidden rounded-full bg-gray-200">
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-700 ease-out"
          style={{ width: `${percent}%`, backgroundColor: 'hsl(var(--brand-tertiary))' }}
        />
      </div>
      <span className="text-[11px] font-bold text-gray-700">{percent}%</span>
    </div>
  );
}
