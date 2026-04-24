'use client';

import { useMemo } from 'react';

import type { PhotoBoothFrame } from '@/lib/config';

/**
 * Posiciones verbatim del SVG `0-Photo_Booth-Start.svg` para los círculos
 * del carrusel inferior. Coordenadas absolutas del viewport 1080×1920.
 * El 1er entry es el círculo central "START"; el resto son satélites.
 */
const CAROUSEL_CIRCLES = [
  { role: 'start' as const, cx: 540, cy: 1507, r: 126 },
  { role: 'satellite' as const, cx: -245, cy: 1507, r: 106, slotIndex: 0 },
  { role: 'satellite' as const, cx: 10, cy: 1507, r: 106, slotIndex: 1 },
  { role: 'satellite' as const, cx: 265, cy: 1507, r: 106, slotIndex: 2 },
  { role: 'satellite' as const, cx: 838, cy: 1507, r: 106, slotIndex: 3 },
  { role: 'satellite' as const, cx: 1077, cy: 1507, r: 106, slotIndex: 4 },
  { role: 'satellite' as const, cx: 1309, cy: 1507, r: 106, slotIndex: 5 },
];

interface StartScreenProps {
  /** Frames configurados por el cliente. Los slots del carrusel se llenan
   *  ciclando `frames[i % frames.length]`. */
  frames: Array<PhotoBoothFrame & { resolvedImage: string; resolvedThumbnail: string }>;
  selectedFrameId: string | null;
  onSelectFrame: (id: string) => void;
  onStart: () => void;
  onToggleTimer: () => void;
  onHome: () => void;
  timerLabel: string;
  experienceLabel: string;
  startLabel: string;
  ariaHome: string;
  ariaShutter: string;
}

/**
 * UI de la fase `'live'` del Photo Booth. Paths verbatim del SVG
 * `0-Photo_Booth-Start.svg` (el header y la live camera los pone el
 * módulo padre). Se compone de:
 *   - overlay gradient inferior (dark) para contraste de botones.
 *   - home button (semicircle izq).
 *   - carrusel de FRAMES + START central.
 *   - TIMER pill + EXPERIENCE pill.
 *
 * Al seleccionar un frame se debe renderizar su overlay sobre la cámara
 * (el módulo se encarga de esa capa).
 */
export function StartScreen({
  frames,
  selectedFrameId,
  onSelectFrame,
  onStart,
  onToggleTimer,
  onHome,
  timerLabel,
  experienceLabel,
  startLabel,
  ariaHome,
  ariaShutter,
}: StartScreenProps) {
  const satellites = useMemo(
    () => CAROUSEL_CIRCLES.filter((c) => c.role === 'satellite'),
    [],
  );

  return (
    <>
      {/* Overlay inferior fade-to-dark (verbatim SVG Rectangle_679) */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={1091}
        height={287}
        viewBox="0 0 1091 287"
        style={{ position: 'absolute', left: -11, top: 1633, pointerEvents: 'none' }}
      >
        <defs>
          <linearGradient id="pb-bottom-fade" x1="0.5" x2="0.5" y2="1" gradientUnits="objectBoundingBox">
            <stop offset="0" stopColor="#0e518a" stopOpacity={0} />
            <stop offset="1" stopColor="#0e518a" stopOpacity={1} />
          </linearGradient>
        </defs>
        <rect x={0} y={0} width={1091} height={287} opacity={0.55} fill="url(#pb-bottom-fade)" />
      </svg>

      {/* Home button (semicircle left edge) */}
      <button
        type="button"
        aria-label={ariaHome}
        onClick={onHome}
        className="absolute"
        style={{
          left: 0,
          top: 1125,
          width: 116,
          height: 232,
          padding: 0,
          border: 'none',
          borderRadius: '0 116px 116px 0',
          background: 'hsl(var(--photo-home-btn-bg))',
          boxShadow: '0 8px 24px rgb(0 0 0 / 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg width={54} height={42} viewBox="0 0 54 42" aria-hidden="true">
          <path
            d="M33.6,42.08h0a1.391,1.391,0,0,1-1.078-.469,1.65,1.65,0,0,1-.515-1.03v-9c0-.041,0-.081,0-.122a1.278,1.278,0,0,0-.1-.629c-.088-.175-.5-.318-.825-.433a3.363,3.363,0,0,1-.338-.129A1.673,1.673,0,0,0,30,30.08H24a1.464,1.464,0,0,0-1.078.422c-.072.072-.166.149-.266.23-.3.245-.641.522-.641.848v9a1.4,1.4,0,0,1-.329,1.03,2.593,2.593,0,0,0-.166.208.5.5,0,0,1-.52.261H10.9a1.466,1.466,0,0,1-1.078-.422c-.05-.05-.109-.105-.172-.163-.285-.264-.675-.626-.675-.985v-15.4L26.25,10.955a1.595,1.595,0,0,1,1.5,0L45,25.04V40.509c0,.338-.342.635-.618.874-.083.072-.162.14-.226.2a1.469,1.469,0,0,1-1.078.421Zm16.931-16.5a1.019,1.019,0,0,1-.751-.282L27.75,7.111a1.595,1.595,0,0,0-1.5,0L4.218,25.3a.9.9,0,0,1-.656.282,1.157,1.157,0,0,1-.937-.469L.281,22.2A.9.9,0,0,1,0,21.549a1.278,1.278,0,0,1,.375-.938l23.719-19.5A4.612,4.612,0,0,1,27,.08a4.245,4.245,0,0,1,2.813,1.031l9.161,6.938V1.205c0-.041,0-.081,0-.121a.833.833,0,0,1,.182-.677A1.174,1.174,0,0,1,39.962,0h3.923a1.089,1.089,0,0,1,.8.328,1.089,1.089,0,0,1,.328.8L45,13.977l8.62,6.634a1.278,1.278,0,0,1,.375.938.9.9,0,0,1-.282.656l-2.344,2.906A1.078,1.078,0,0,1,50.531,25.58Z"
            fill="#fff"
          />
        </svg>
      </button>

      {/* Círculos del carrusel (stroke blanco) + START central con icono cámara + label */}
      <svg
        width={1080}
        height={260}
        viewBox="0 0 1080 260"
        style={{ position: 'absolute', left: 0, top: 1507 - 130, pointerEvents: 'none' }}
      >
        {satellites.map((c, i) => (
          <circle
            key={`sat-${i}`}
            cx={c.cx}
            cy={130}
            r={c.r}
            fill="none"
            stroke="#fff"
            strokeWidth={10}
          />
        ))}
        <circle cx={540} cy={130} r={126} fill="rgba(0,0,0,0.12)" stroke="#fff" strokeWidth={10} />
        {/* Camera icon inside START */}
        <g transform={`translate(${540 - 30}, ${130 - 34})`}>
          <path
            d="M59.262-55.037V-21.7a5.358,5.358,0,0,1-1.62,3.935,5.358,5.358,0,0,1-3.935,1.62H5.556a5.358,5.358,0,0,1-3.935-1.62A5.358,5.358,0,0,1,0-21.7V-55.037a5.358,5.358,0,0,1,1.62-3.935,5.358,5.358,0,0,1,3.935-1.62H15.741l1.389-3.82a6.7,6.7,0,0,1,1.215-1.852,5.426,5.426,0,0,1,1.794-1.273,5.355,5.355,0,0,1,2.2-.463H36.923a5.278,5.278,0,0,1,3.125.984,6.033,6.033,0,0,1,2.083,2.6l1.389,3.82H53.706a5.358,5.358,0,0,1,3.935,1.62A5.358,5.358,0,0,1,59.262-55.037ZM39.469-28.531a13.394,13.394,0,0,0,4.051-9.838,13.394,13.394,0,0,0-4.051-9.838,13.394,13.394,0,0,0-9.838-4.051,13.394,13.394,0,0,0-9.838,4.051,13.394,13.394,0,0,0-4.051,9.838,13.394,13.394,0,0,0,4.051,9.838,13.394,13.394,0,0,0,9.838,4.051A13.394,13.394,0,0,0,39.469-28.531ZM36.807-45.545a9.8,9.8,0,0,1,3.009,7.176,9.8,9.8,0,0,1-3.009,7.176,9.8,9.8,0,0,1-7.176,3.009,9.8,9.8,0,0,1-7.176-3.009,9.8,9.8,0,0,1-3.009-7.176,9.8,9.8,0,0,1,3.009-7.176,9.8,9.8,0,0,1,7.176-3.009A9.8,9.8,0,0,1,36.807-45.545Z"
            transform="translate(0 68)"
            fill="#fff"
          />
        </g>
        <text
          x={540}
          y={218}
          textAnchor="middle"
          fill="#fff"
          fontSize={19}
          fontFamily="'Open Sans', system-ui"
          fontWeight={700}
        >
          {startLabel}
        </text>
      </svg>

      {/* Thumbnails de frames como botones (ciclan si hay menos de 6). */}
      {satellites.map((c, i) => {
        if (frames.length === 0) return null;
        const frameIdx = (c.slotIndex ?? i) % frames.length;
        const frame = frames[frameIdx]!;
        const selected = selectedFrameId === frame.id;
        return (
          <button
            key={`sat-btn-${i}`}
            type="button"
            aria-label={frame.label}
            onClick={() => onSelectFrame(frame.id)}
            className="absolute"
            style={{
              left: c.cx - 90,
              top: 1507 - 90,
              width: 180,
              height: 180,
              padding: 0,
              border: 'none',
              background: 'transparent',
              borderRadius: '50%',
              overflow: 'hidden',
              boxShadow: selected
                ? '0 0 0 6px hsl(var(--photo-accent-from))'
                : undefined,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={frame.resolvedThumbnail}
              alt=""
              draggable={false}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </button>
        );
      })}

      {/* Click target encima del START circle */}
      <button
        type="button"
        aria-label={ariaShutter}
        onClick={onStart}
        className="absolute"
        style={{
          left: 540 - 126,
          top: 1507 - 126,
          width: 252,
          height: 252,
          padding: 0,
          border: 'none',
          background: 'transparent',
          borderRadius: '50%',
        }}
      />

      {/* TIMER pill */}
      <button
        type="button"
        onClick={onToggleTimer}
        className="absolute"
        style={{
          left: 37,
          top: 1717,
          width: 369,
          height: 128,
          padding: 0,
          border: '4px solid #fff',
          borderRadius: 64,
          background: 'rgba(0,0,0,0.12)',
          color: '#fff',
          fontFamily: "'Open Sans', system-ui",
          fontSize: 39,
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 14,
        }}
      >
        <svg width={64} height={68} viewBox="-1 0 68 68" aria-hidden="true">
          <path
            d="M32.094,40.629V26.582M63.7,16.047,56.676,9.023M25.07,2H39.117M32.094,68.723A28.094,28.094,0,1,1,60.188,40.629,28.094,28.094,0,0,1,32.094,68.723Z"
            fill="none"
            stroke="#fff"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={6}
          />
        </svg>
        <span>{timerLabel}</span>
      </button>

      {/* EXPERIENCE pill */}
      <button
        type="button"
        onClick={onStart}
        className="absolute"
        style={{
          left: 657,
          top: 1716,
          width: 369,
          height: 128,
          padding: 0,
          border: '4px solid #fff',
          borderRadius: 64,
          background: 'rgba(0,0,0,0.12)',
          color: '#fff',
          fontFamily: "'Open Sans', system-ui",
          fontSize: 33,
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 24,
        }}
      >
        <span>{experienceLabel}</span>
        <span
          aria-hidden="true"
          style={{
            width: 100,
            height: 100,
            borderRadius: '50%',
            border: '3px solid #fff',
            background: 'rgba(255,255,255,0.1)',
            display: 'inline-block',
          }}
        />
      </button>
    </>
  );
}
