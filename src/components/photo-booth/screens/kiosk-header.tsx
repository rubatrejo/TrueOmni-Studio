'use client';

interface KioskHeaderProps {
  logoSrc: string;
  logoAlt: string;
  time: string;
  date: string;
  tempLabel?: string;
}

/**
 * Header verbatim de los SVGs del Photo Booth. Gradient azul fade-in arriba
 * + logo a la izquierda + weather/clock a la derecha. Idéntico en Start,
 * Countdown, Editor y Share para mantener consistencia visual.
 */
export function KioskHeader({ logoSrc, logoAlt, time, date, tempLabel }: KioskHeaderProps) {
  return (
    <>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={1080}
        height={397}
        viewBox="0 0 1080 397"
        style={{ position: 'absolute', left: 0, top: 0, pointerEvents: 'none' }}
      >
        <defs>
          <linearGradient
            id="pb-header-fade"
            x1="0.5"
            x2="0.5"
            y2="1"
            gradientUnits="objectBoundingBox"
          >
            <stop offset="0" stopColor="#0e518a" stopOpacity={1} />
            <stop offset="1" stopColor="#0e518a" stopOpacity={0} />
          </linearGradient>
        </defs>
        <rect x={0} y={0} width={1080} height={397} fill="url(#pb-header-fade)" />
      </svg>

      <div
        className="pointer-events-none absolute"
        style={{ left: 65, top: 43, right: 65, color: '#fff' }}
      >
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            fontFamily: "'Open Sans', system-ui",
            fontSize: 25,
            whiteSpace: 'nowrap',
          }}
        >
          <div style={{ lineHeight: 1.25, textAlign: 'right' }}>
            <div>{time}</div>
            <div style={{ fontSize: 23 }}>{date}</div>
          </div>
          <span
            aria-hidden="true"
            style={{
              width: 1,
              height: 25,
              background: 'hsl(var(--photo-header-fg))',
              display: 'inline-block',
            }}
          />
          {tempLabel ? <span>{tempLabel}</span> : null}
          <svg width={60} height={40} viewBox="0 0 60 40" aria-hidden="true">
            <path
              d="M51.711,19.2c.012-.227.018-.447.018-.663A15.5,15.5,0,0,0,22.311,11.664,8.2,8.2,0,0,0,17.76,10.3a8.287,8.287,0,0,0-8.252,7.715,11.424,11.424,0,0,0,3.9,22.156H50.5A10.52,10.52,0,0,0,51.711,19.2"
              fill="#fff"
            />
          </svg>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logoSrc}
          alt={logoAlt}
          draggable={false}
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = 'none';
          }}
          style={{ position: 'absolute', left: 0, top: 10, height: 64 }}
        />
      </div>
    </>
  );
}
