'use client';

import type { WayfindingStep } from '@/lib/config';

const OPEN_SANS = { fontFamily: 'var(--font-open-sans)' } as const;

/** Icono SVG por tipo de paso — verbatim del diseño XD. */
function StepIcon({ icon }: { icon: WayfindingStep['icon'] }) {
  const cls = 'h-[22px] w-[22px] text-gray-500';

  switch (icon) {
    case 'location':
    case 'destination':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={cls}>
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z" />
        </svg>
      );
    case 'left':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={cls}>
          <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
        </svg>
      );
    case 'right':
    case 'straight':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={cls}>
          <path d="M4 11h12.17l-5.59-5.59L12 4l8 8-8 8-1.41-1.41L16.17 13H4v-2z" />
        </svg>
      );
    default:
      return null;
  }
}

interface WayfindingStepListProps {
  steps: WayfindingStep[];
}

/**
 * Lista de pasos de dirección con iconos. Verbatim del XD: cada paso es un
 * row con icono + texto, separados por líneas finas de 1px. Último paso en
 * bold. El paso "destination" es el último y cierra la lista.
 */
export function WayfindingStepList({ steps }: WayfindingStepListProps) {
  return (
    <div className="flex flex-col" style={OPEN_SANS}>
      {steps.map((s, i) => {
        const isLast = i === steps.length - 1;
        return (
          <div
            key={i}
            className={`flex items-start gap-3 px-5 py-[14px] ${
              !isLast ? 'border-b border-gray-200' : ''
            }`}
          >
            <div className="mt-[1px] shrink-0">
              <StepIcon icon={s.icon} />
            </div>
            <span
              className={`flex-1 text-[14px] leading-snug ${
                isLast ? 'font-bold text-gray-900' : 'text-gray-700'
              }`}
            >
              {s.text}
            </span>
          </div>
        );
      })}
    </div>
  );
}
