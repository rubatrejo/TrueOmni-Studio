'use client';

import type { TrailConsiderations } from '@/lib/config';

/**
 * Panel "Considerations" del detail de Trails. Grid 2-col de filas
 * `{icon, label, value}`. Solo se renderean los campos definidos —
 * distance y difficulty son obligatorios; duration, elevationGain,
 * trailType y dogFriendly son opcionales.
 *
 * Se inyecta en el slot `extraDetails` del `ListingDetail` (top: 1470).
 */
export function ConsiderationsPanel({
  considerations,
  title,
  labels,
  dogFriendlyYes,
  dogFriendlyNo,
}: {
  considerations: TrailConsiderations;
  title: string;
  labels: {
    distance: string;
    difficulty: string;
    duration: string;
    elevation: string;
    type: string;
    dogFriendly: string;
  };
  dogFriendlyYes: string;
  dogFriendlyNo: string;
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
      value: considerations.dogFriendly ? dogFriendlyYes : dogFriendlyNo,
    });
  }

  return (
    <div style={{ paddingBottom: '24px' }}>
      <span
        className="block"
        style={{
          fontFamily: 'Helvetica, Arial, sans-serif',
          fontWeight: 700,
          fontSize: '24px',
          lineHeight: '24px',
          color: '#444',
          opacity: 0.85,
          letterSpacing: '0.02em',
          marginBottom: '18px',
        }}
      >
        {title}
      </span>
      <div
        className="grid"
        style={{
          gridTemplateColumns: 'repeat(2, 1fr)',
          columnGap: '32px',
          rowGap: '24px',
        }}
      >
        {rows.map((r) => (
          <Row key={r.key} icon={r.icon} label={r.label} value={r.value} />
        ))}
      </div>
    </div>
  );
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center" style={{ columnGap: '18px' }}>
      <span
        className="inline-flex items-center justify-center"
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          backgroundColor: 'hsl(var(--brand-primary) / 0.08)',
          flexShrink: 0,
        }}
      >
        {icon}
      </span>
      <div className="flex flex-col" style={{ rowGap: '4px' }}>
        <span
          style={{
            fontFamily: 'Helvetica, Arial, sans-serif',
            fontSize: '15px',
            lineHeight: '15px',
            fontWeight: 600,
            color: '#898989',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}
        >
          {label}
        </span>
        <span
          style={{
            fontFamily: 'Helvetica, Arial, sans-serif',
            fontSize: '22px',
            lineHeight: '26px',
            fontWeight: 700,
            color: '#1a1a1a',
          }}
        >
          {value}
        </span>
      </div>
    </div>
  );
}

function DistanceIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" aria-hidden>
      <path
        d="M4 20l16-16M6 8h4M14 18h4"
        stroke="hsl(var(--brand-primary))"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

function DifficultyIcon({ level }: { level: 'Easy' | 'Moderate' | 'Hard' }) {
  const bars = level === 'Easy' ? 1 : level === 'Moderate' ? 2 : 3;
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" aria-hidden>
      {[0, 1, 2].map((i) => (
        <rect
          key={i}
          x={4 + i * 6}
          y={20 - (i + 1) * 4}
          width="4"
          height={(i + 1) * 4}
          fill={i < bars ? 'hsl(var(--brand-primary))' : 'hsl(var(--brand-primary) / 0.2)'}
          rx="1"
        />
      ))}
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" aria-hidden>
      <circle cx="12" cy="12" r="9" fill="none" stroke="hsl(var(--brand-primary))" strokeWidth="2" />
      <path d="M12 7v5l3 2" stroke="hsl(var(--brand-primary))" strokeWidth="2" strokeLinecap="round" fill="none" />
    </svg>
  );
}

function ElevationIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" aria-hidden>
      <path d="M3 20l5-10 4 6 3-4 6 8H3z" fill="hsl(var(--brand-primary))" opacity="0.85" />
    </svg>
  );
}

function TypeIcon({ type }: { type: 'Loop' | 'Out & Back' | 'Point to Point' }) {
  if (type === 'Loop') {
    return (
      <svg width="30" height="30" viewBox="0 0 24 24" aria-hidden>
        <circle cx="12" cy="12" r="7" fill="none" stroke="hsl(var(--brand-primary))" strokeWidth="2" />
      </svg>
    );
  }
  if (type === 'Out & Back') {
    return (
      <svg width="30" height="30" viewBox="0 0 24 24" aria-hidden>
        <path
          d="M5 9h14M19 9l-3-3M19 9l-3 3M19 15H5M5 15l3-3M5 15l3 3"
          stroke="hsl(var(--brand-primary))"
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
    <svg width="30" height="30" viewBox="0 0 24 24" aria-hidden>
      <circle cx="5" cy="12" r="2.5" fill="hsl(var(--brand-primary))" />
      <path d="M7.5 12h9" stroke="hsl(var(--brand-primary))" strokeWidth="2" strokeLinecap="round" />
      <circle cx="19" cy="12" r="2.5" fill="hsl(var(--brand-primary))" />
    </svg>
  );
}

function DogIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" aria-hidden>
      <path
        d="M6 4c1.5 0 2.5 2 2 4l2 1 2-1c-.5-2 .5-4 2-4 1.5 0 2 2 2 3 0 2-1 3-2 3v3c0 2-2 4-5 4s-5-2-5-4v-3c-1 0-2-1-2-3 0-1 .5-3 2-3z"
        fill="hsl(var(--brand-primary))"
        opacity="0.9"
      />
      <circle cx="9" cy="11" r="0.9" fill="#fff" />
      <circle cx="13" cy="11" r="0.9" fill="#fff" />
    </svg>
  );
}
