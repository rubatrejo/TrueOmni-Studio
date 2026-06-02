'use client';

import type { TrailConsiderations } from '@/lib/config';

const BRAND = 'hsl(var(--brand-primary))';
const BRAND_TINT = 'hsl(var(--brand-primary) / 0.08)';
const FG = 'hsl(var(--foreground))';
const MUTED = 'hsl(var(--foreground) / 0.5)';
const OPEN_SANS = 'var(--font-open-sans)';

export interface ConsiderationsLabels {
  title: string;
  distance: string;
  difficulty: string;
  duration: string;
  elevation: string;
  type: string;
  dogFriendly: string;
  dogYes: string;
  dogNo: string;
}

/**
 * Panel "Considerations" del detalle de Trails (versión PWA mobile). Grid 2-col
 * de filas `icono + label + value`. Solo se renderean los campos definidos:
 * `distance` y `difficulty` son obligatorios; `duration`, `elevationGain`,
 * `trailType` y `dogFriendly` son opcionales. Réplica a escala mobile del panel
 * del kiosk (`components/trails/considerations-panel.tsx`).
 */
export function PwaConsiderations({
  considerations,
  labels,
}: {
  considerations: TrailConsiderations;
  labels: ConsiderationsLabels;
}) {
  const rows: { key: string; icon: React.ReactNode; label: string; value: string }[] = [
    {
      key: 'distance',
      icon: <DistanceIcon />,
      label: labels.distance,
      value: considerations.distance,
    },
    {
      key: 'difficulty',
      icon: <DifficultyIcon level={considerations.difficulty} />,
      label: labels.difficulty,
      value: considerations.difficulty,
    },
  ];
  if (considerations.duration) {
    rows.push({
      key: 'duration',
      icon: <ClockIcon />,
      label: labels.duration,
      value: considerations.duration,
    });
  }
  if (considerations.elevationGain) {
    rows.push({
      key: 'elevation',
      icon: <ElevationIcon />,
      label: labels.elevation,
      value: considerations.elevationGain,
    });
  }
  if (considerations.trailType) {
    rows.push({
      key: 'type',
      icon: <TypeIcon type={considerations.trailType} />,
      label: labels.type,
      value: considerations.trailType,
    });
  }
  if (considerations.dogFriendly != null) {
    rows.push({
      key: 'dog',
      icon: <DogIcon />,
      label: labels.dogFriendly,
      value: considerations.dogFriendly ? labels.dogYes : labels.dogNo,
    });
  }

  return (
    <div
      className="border-b px-[18px] py-4"
      style={{ borderColor: 'hsl(var(--foreground) / 0.1)' }}
    >
      <h2 className="mb-3 font-bold" style={{ fontSize: 17, color: FG, fontFamily: OPEN_SANS }}>
        {labels.title}
      </h2>
      <div className="grid grid-cols-2" style={{ columnGap: 14, rowGap: 16 }}>
        {rows.map((r) => (
          <div key={r.key} className="flex items-center" style={{ columnGap: 10 }}>
            <span
              className="inline-flex shrink-0 items-center justify-center rounded-full"
              style={{ width: 36, height: 36, backgroundColor: BRAND_TINT }}
            >
              {r.icon}
            </span>
            <div className="flex min-w-0 flex-col" style={{ rowGap: 1 }}>
              <span
                className="truncate font-semibold uppercase"
                style={{ fontSize: 10, letterSpacing: 0.5, color: MUTED, fontFamily: OPEN_SANS }}
              >
                {r.label}
              </span>
              <span
                className="truncate font-bold"
                style={{ fontSize: 14, color: FG, fontFamily: OPEN_SANS }}
              >
                {r.value}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DistanceIcon() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" aria-hidden>
      <path
        d="M4 20l16-16M6 8h4M14 18h4"
        stroke={BRAND}
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

function DifficultyIcon({ level }: { level: string }) {
  const bars = level === 'Easy' ? 1 : level === 'Moderate' ? 2 : 3;
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" aria-hidden>
      {[0, 1, 2].map((i) => (
        <rect
          key={i}
          x={4 + i * 6}
          y={20 - (i + 1) * 4}
          width="4"
          height={(i + 1) * 4}
          fill={i < bars ? BRAND : 'hsl(var(--brand-primary) / 0.2)'}
          rx="1"
        />
      ))}
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" aria-hidden>
      <circle cx="12" cy="12" r="9" fill="none" stroke={BRAND} strokeWidth="2" />
      <path d="M12 7v5l3 2" stroke={BRAND} strokeWidth="2" strokeLinecap="round" fill="none" />
    </svg>
  );
}

function ElevationIcon() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" aria-hidden>
      <path d="M3 20l5-10 4 6 3-4 6 8H3z" fill={BRAND} opacity="0.85" />
    </svg>
  );
}

function TypeIcon({ type }: { type: string }) {
  if (type === 'Loop') {
    return (
      <svg width={20} height={20} viewBox="0 0 24 24" aria-hidden>
        <circle cx="12" cy="12" r="7" fill="none" stroke={BRAND} strokeWidth="2" />
      </svg>
    );
  }
  if (type === 'Out & Back') {
    return (
      <svg width={20} height={20} viewBox="0 0 24 24" aria-hidden>
        <path
          d="M5 9h14M19 9l-3-3M19 9l-3 3M19 15H5M5 15l3-3M5 15l3 3"
          stroke={BRAND}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
    );
  }
  // Point to Point
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" aria-hidden>
      <circle cx="5" cy="12" r="2.5" fill={BRAND} />
      <path d="M7.5 12h9" stroke={BRAND} strokeWidth="2" strokeLinecap="round" />
      <circle cx="19" cy="12" r="2.5" fill={BRAND} />
    </svg>
  );
}

function DogIcon() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" aria-hidden>
      <path
        d="M6 4c1.5 0 2.5 2 2 4l2 1 2-1c-.5-2 .5-4 2-4 1.5 0 2 2 2 3 0 2-1 3-2 3v3c0 2-2 4-5 4s-5-2-5-4v-3c-1 0-2-1-2-3 0-1 .5-3 2-3z"
        fill={BRAND}
        opacity="0.9"
      />
      <circle cx="9" cy="11" r="0.9" fill="#fff" />
      <circle cx="13" cy="11" r="0.9" fill="#fff" />
    </svg>
  );
}
