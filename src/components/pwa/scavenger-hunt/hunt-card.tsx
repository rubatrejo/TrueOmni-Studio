'use client';

import { useRouter } from 'next/navigation';

import { resolveAssetUrl } from '@/lib/asset-url';

const OPEN_SANS = { fontFamily: 'var(--font-open-sans)' } as const;

// Circunferencia del anillo de progreso (r=16).
const RING_R = 16;
const RING_C = 2 * Math.PI * RING_R;

interface HuntCardProps {
  slug: string;
  name: string;
  image: string;
  completionPercent: number;
  completedCount: number;
  totalTasks: number;
  /** Sufijo de la pill de conteo (config.dashboard.tasksLabel), ej. "TASKS". */
  tasksLabel: string;
  /** Banner de hunt completado (config.dashboard.completedBanner). */
  completedBanner: string;
}

/**
 * Card de un hunt en el dashboard. Verbatim del diseño XD:
 * - Anillo top-left con fracción "X/Y" (completados/total) + arco de progreso.
 * - Pill olive "{N} TASKS" centrada sobre el título.
 * - Completado: banner olive "Fantastic, Impressive work!" centrado + nombre del hunt.
 * Colores = brand tokens (cascadean con el branding del cliente).
 */
export function HuntCard({
  slug,
  name,
  image,
  completionPercent,
  completedCount,
  totalTasks,
  tasksLabel,
  completedBanner,
}: HuntCardProps) {
  const router = useRouter();
  const bg = resolveAssetUrl(image);

  const isComplete = completionPercent === 100;
  const arc = (completionPercent / 100) * RING_C;

  return (
    <button
      type="button"
      onClick={() => router.push(`/pwa/scavenger-hunt/${slug}`)}
      className="relative h-[230px] w-full overflow-hidden rounded-[12px] bg-cover bg-center"
      style={{ backgroundImage: `url(${bg})` }}
    >
      {/* Gradiente (más oscuro cuando está completado para el banner) */}
      <span
        className={
          isComplete
            ? 'absolute inset-0 bg-gradient-to-t from-black/80 via-black/55 to-black/40'
            : 'absolute inset-0 bg-gradient-to-t from-black/65 via-black/20 to-black/10'
        }
      />

      {/* Anillo de progreso con fracción (top-left) */}
      <div className="absolute left-[10px] top-[10px]">
        <svg width={38} height={38} viewBox="0 0 38 38">
          <circle
            cx="19"
            cy="19"
            r={RING_R}
            fill="none"
            stroke="white"
            strokeWidth="2"
            opacity="0.35"
          />
          {completedCount > 0 && (
            <circle
              cx="19"
              cy="19"
              r={RING_R}
              fill="none"
              stroke="white"
              strokeWidth="2.5"
              strokeDasharray={`${arc} ${RING_C}`}
              strokeLinecap="round"
              transform="rotate(-90 19 19)"
            />
          )}
          <text
            x="19"
            y="22.5"
            textAnchor="middle"
            fontSize="10"
            fontWeight="bold"
            fill="white"
            fontFamily="var(--font-open-sans)"
          >
            {completedCount}/{totalTasks}
          </text>
        </svg>
      </div>

      {isComplete ? (
        /* Completado: banner olive centrado + nombre del hunt */
        <div
          className="absolute inset-0 flex flex-col items-center justify-center px-3 text-center"
          style={OPEN_SANS}
        >
          <p
            className="text-[15px] font-bold leading-tight drop-shadow"
            style={{ color: 'hsl(var(--brand-tertiary))' }}
          >
            {completedBanner}
          </p>
          <p className="mt-1.5 text-[11px] font-semibold text-white/85">{name}</p>
        </div>
      ) : (
        /* En progreso / no empezado: pill TASKS + título */
        <div
          className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-1.5 px-2 pb-3"
          style={OPEN_SANS}
        >
          <span
            className="rounded-[4px] px-[7px] py-[2px] text-[10px] font-bold uppercase tracking-wide text-white"
            style={{ backgroundColor: 'hsl(var(--brand-tertiary))' }}
          >
            {totalTasks} {tasksLabel}
          </span>
          <span className="text-center text-[14px] font-bold text-white drop-shadow-md">
            {name}
          </span>
        </div>
      )}
    </button>
  );
}
