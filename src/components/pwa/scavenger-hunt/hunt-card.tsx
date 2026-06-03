'use client';

import { useRouter } from 'next/navigation';

import { resolveAssetUrl } from '@/lib/asset-url';

const OPEN_SANS = { fontFamily: 'var(--font-open-sans)' } as const;

interface HuntCardProps {
  slug: string;
  name: string;
  image: string;
  completionPercent: number;
  completedCount: number;
  totalTasks: number;
}

/**
 * Card de un hunt en el dashboard. Verbatim del diseño XD:
 * - Completado: banner amber/dorado "Fantastic, Impressive work!" + nombre del hunt
 * - En progreso: ring circular con número + badge "X/Y"
 * - No empezado: solo imagen + nombre
 */
export function HuntCard({
  slug,
  name,
  image,
  completionPercent,
  completedCount,
  totalTasks,
}: HuntCardProps) {
  const router = useRouter();
  const bg = resolveAssetUrl(image);

  const isComplete = completionPercent === 100;
  const inProgress = completedCount > 0 && !isComplete;

  return (
    <button
      type="button"
      onClick={() => router.push(`/pwa/scavenger-hunt/${slug}`)}
      className="relative h-[230px] w-full overflow-hidden rounded-[12px] bg-cover bg-center"
      style={{ backgroundImage: `url(${bg})` }}
    >
      {/* Gradiente */}
      <span className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/20 to-black/10" />

      {/* Progress ring (top-left) — en progreso o no empezado */}
      {!isComplete && (
        <div className="absolute left-[10px] top-[10px]">
          <svg width={32} height={32} viewBox="0 0 32 32">
            <circle
              cx="16"
              cy="16"
              r="14"
              fill="none"
              stroke="white"
              strokeWidth="2"
              opacity="0.35"
            />
            {inProgress && (
              <circle
                cx="16"
                cy="16"
                r="14"
                fill="none"
                stroke="white"
                strokeWidth="2.5"
                strokeDasharray={`${(completionPercent / 100) * 88} 88`}
                strokeLinecap="round"
                transform="rotate(-90 16 16)"
              />
            )}
            {inProgress && (
              <text x="16" y="19" textAnchor="middle" fontSize="9" fontWeight="bold" fill="white">
                {completedCount}
              </text>
            )}
          </svg>
        </div>
      )}

      {/* Completado: badge amber dorado (top-right) */}
      {isComplete && (
        <div className="absolute left-0 right-0 top-0 flex justify-end p-[8px]">
          <div
            className="rounded-[6px] px-[8px] py-[4px] text-center"
            style={{ backgroundColor: 'hsl(38 75% 55% / 0.9)', ...OPEN_SANS }}
          >
            <p className="text-[8px] font-bold leading-tight text-white">
              Fantastic, Impressive work!
            </p>
          </div>
        </div>
      )}

      {/* Badge progreso (top-right) */}
      {inProgress && (
        <div className="absolute right-2 top-2">
          <span
            className="rounded-full px-[8px] py-[3px] text-[10px] font-bold text-white"
            style={{ backgroundColor: 'hsl(var(--brand-primary) / 0.85)', ...OPEN_SANS }}
          >
            {completedCount}/{totalTasks}
          </span>
        </div>
      )}

      {/* Completado: check icon (top-left) */}
      {isComplete && (
        <div className="absolute left-[10px] top-[10px]">
          <div
            className="flex h-[28px] w-[28px] items-center justify-center rounded-full"
            style={{ backgroundColor: 'hsl(var(--brand-primary))' }}
          >
            <svg width={14} height={14} viewBox="0 0 14 14" fill="none">
              <path
                d="M2 7l3.5 3.5L12 4"
                stroke="white"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
      )}

      {/* Nombre + hunt name for completed */}
      {isComplete ? (
        <div className="absolute bottom-2 left-0 right-0 text-center" style={OPEN_SANS}>
          <p className="text-[8px] font-bold uppercase tracking-wider text-white/70">completed</p>
          <p className="text-[13px] font-bold text-white drop-shadow-md">{name}</p>
        </div>
      ) : (
        <span
          className="absolute bottom-3 left-0 right-0 text-center text-[14px] font-bold text-white drop-shadow-md"
          style={OPEN_SANS}
        >
          {name}
        </span>
      )}
    </button>
  );
}
