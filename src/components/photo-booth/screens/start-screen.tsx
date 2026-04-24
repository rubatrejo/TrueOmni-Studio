'use client';

import { useEffect, useRef } from 'react';

import type { PhotoBoothFrame } from '@/lib/config';

interface StartScreenProps {
  frames: Array<PhotoBoothFrame & { resolvedImage: string; resolvedThumbnail: string }>;
  selectedFrameId: string | null;
  onSelectFrame: (id: string) => void;
  onStart: () => void;
  onExperience: () => void;
  onToggleTimer: () => void;
  onHome: () => void;
  timerLabel: string;
  experienceLabel: string;
  startLabel: string;
  ariaHome: string;
  ariaShutter: string;
}

/**
 * UI de la fase `'live'` del Photo Booth.
 *
 * El carrusel de frames es scrollable horizontalmente y el botón START
 * ("TAKE PHOTO") es UN ITEM MÁS dentro del scroll, posicionado en la mitad
 * del array. El usuario puede scrollear y el START se mueve con los demás
 * thumbnails. Home button alineado al `top:1000` (consistente con
 * `FloatingHomeButton` del resto del kiosk).
 */
export function StartScreen({
  frames,
  selectedFrameId,
  onSelectFrame,
  onStart,
  onExperience,
  onToggleTimer,
  onHome,
  timerLabel,
  experienceLabel,
  ariaHome,
  ariaShutter,
}: StartScreenProps) {
  const CAROUSEL_TOP = 1507 - 130; // 1377
  const CAROUSEL_HEIGHT = 260;

  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    // Centrar el scroll para que el START item (en medio del array) quede
    // centrado en la vista inicial.
    const el = scrollRef.current;
    if (!el) return;
    el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2;
  }, [frames.length]);

  // Punto medio del array para insertar el START (como item del scroll).
  const midIndex = Math.ceil(frames.length / 2);
  const leftFrames = frames.slice(0, midIndex);
  const rightFrames = frames.slice(midIndex);

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

      {/* Home button — mismo patrón que `FloatingHomeButton` (top:1000,
          116×232, rounded right, #004f8b tokenizado). */}
      <button
        type="button"
        aria-label={ariaHome}
        onClick={onHome}
        className="absolute"
        style={{
          left: 0,
          top: 1000,
          width: 116,
          height: 232,
          padding: 0,
          border: 'none',
          borderTopRightRadius: 116,
          borderBottomRightRadius: 116,
          background: 'hsl(var(--photo-home-btn-bg))',
          boxShadow: '12px 0 28px rgba(0,0,0,0.22)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          paddingRight: 28,
          zIndex: 3,
        }}
      >
        <svg width={54} height={44} viewBox="0 0 54 44" aria-hidden="true">
          <path
            d="M33.6,42.08h0a1.391,1.391,0,0,1-1.078-.469,1.65,1.65,0,0,1-.515-1.03v-9c0-.041,0-.081,0-.122a1.278,1.278,0,0,0-.1-.629c-.088-.175-.5-.318-.825-.433a3.363,3.363,0,0,1-.338-.129A1.673,1.673,0,0,0,30,30.08H24a1.464,1.464,0,0,0-1.078.422c-.072.072-.166.149-.266.23-.3.245-.641.522-.641.848v9a1.4,1.4,0,0,1-.329,1.03,2.593,2.593,0,0,0-.166.208.5.5,0,0,1-.52.261H10.9a1.466,1.466,0,0,1-1.078-.422c-.05-.05-.109-.105-.172-.163-.285-.264-.675-.626-.675-.985v-15.4L26.25,10.955a1.595,1.595,0,0,1,1.5,0L45,25.04V40.509c0,.338-.342.635-.618.874-.083.072-.162.14-.226.2a1.469,1.469,0,0,1-1.078.421Zm16.931-16.5a1.019,1.019,0,0,1-.751-.282L27.75,7.111a1.595,1.595,0,0,0-1.5,0L4.218,25.3a.9.9,0,0,1-.656.282,1.157,1.157,0,0,1-.937-.469L.281,22.2A.9.9,0,0,1,0,21.549a1.278,1.278,0,0,1,.375-.938l23.719-19.5A4.612,4.612,0,0,1,27,.08a4.245,4.245,0,0,1,2.813,1.031l9.161,6.938V1.205c0-.041,0-.081,0-.121a.833.833,0,0,1,.182-.677A1.174,1.174,0,0,1,39.962,0h3.923a1.089,1.089,0,0,1,.8.328,1.089,1.089,0,0,1,.328.8L45,13.977l8.62,6.634a1.278,1.278,0,0,1,.375.938.9.9,0,0,1-.282.656l-2.344,2.906A1.078,1.078,0,0,1,50.531,25.58Z"
            fill="#fff"
          />
        </svg>
      </button>

      {/* Carrusel horizontal scrollable de frame thumbnails + shutter.
          El START es un item más dentro del scroll (no absolute fixed). */}
      <div
        ref={scrollRef}
        className="absolute"
        style={{
          left: 0,
          top: CAROUSEL_TOP,
          width: 1080,
          height: CAROUSEL_HEIGHT,
          overflowX: 'auto',
          overflowY: 'hidden',
          scrollbarWidth: 'none',
          WebkitOverflowScrolling: 'touch',
          zIndex: 1,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            height: '100%',
            gap: 24,
            padding: '0 48px',
            width: 'max-content',
          }}
        >
          {leftFrames.map((frame) => (
            <FrameThumb
              key={`l-${frame.id}`}
              frame={frame}
              selected={selectedFrameId === frame.id}
              onSelect={() => onSelectFrame(frame.id)}
            />
          ))}
          <ShutterItem ariaLabel={ariaShutter} onPress={onStart} />
          {rightFrames.map((frame) => (
            <FrameThumb
              key={`r-${frame.id}`}
              frame={frame}
              selected={selectedFrameId === frame.id}
              onSelect={() => onSelectFrame(frame.id)}
            />
          ))}
        </div>
      </div>

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
          zIndex: 3,
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

      {/* EXPERIENCE pill — abre popup cinematic "Coming Next" (placeholder
          de un futuro flujo de experiencias inmersivas). */}
      <button
        type="button"
        onClick={onExperience}
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
          zIndex: 3,
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

interface FrameThumbProps {
  frame: PhotoBoothFrame & { resolvedThumbnail: string };
  selected: boolean;
  onSelect: () => void;
}

function FrameThumb({ frame, selected, onSelect }: FrameThumbProps) {
  return (
    <button
      type="button"
      aria-label={frame.label}
      onClick={onSelect}
      style={{
        flex: '0 0 auto',
        width: 200,
        height: 200,
        padding: 0,
        borderRadius: '50%',
        border: '10px solid #fff',
        background: '#fff',
        overflow: 'hidden',
        boxShadow: selected
          ? '0 0 0 6px hsl(var(--photo-tabs-bg)), 0 0 32px 8px hsl(var(--photo-tabs-bg) / 0.6)'
          : undefined,
        transition: 'box-shadow 0.15s ease-out',
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
}

interface ShutterItemProps {
  ariaLabel: string;
  onPress: () => void;
}

/**
 * Botón shutter "TAKE PHOTO" como item del scroll. Más grande que los
 * thumbnails (260×260 vs 212×212) para destacar como acción principal. El
 * usuario puede scrollearlo junto con los frames (feedback de Rubén:
 * "Ese botón también es parte del carrusel scrollable y se mueve con los
 * demás thumbnails").
 */
function ShutterItem({ ariaLabel, onPress }: ShutterItemProps) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={onPress}
      style={{
        flex: '0 0 auto',
        width: 260,
        height: 260,
        padding: 0,
        borderRadius: '50%',
        border: '10px solid #fff',
        background: 'rgba(0,0,0,0.35)',
        color: '#fff',
        fontFamily: "'Open Sans', system-ui",
        fontSize: 28,
        fontWeight: 700,
        lineHeight: 1.1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
      }}
    >
      <svg width={72} height={62} viewBox="0 0 72 62" aria-hidden="true">
        <path
          d="M59.262,4.963V38.3a5.358,5.358,0,0,1-1.62,3.935,5.358,5.358,0,0,1-3.935,1.62H5.556a5.358,5.358,0,0,1-3.935-1.62A5.358,5.358,0,0,1,0,38.3V4.963A5.358,5.358,0,0,1,1.62,1.028,5.358,5.358,0,0,1,5.556-0.592H15.741l1.389-3.82a6.7,6.7,0,0,1,1.215-1.852,5.426,5.426,0,0,1,1.794-1.273,5.355,5.355,0,0,1,2.2-.463H36.923a5.278,5.278,0,0,1,3.125.984,6.033,6.033,0,0,1,2.083,2.6l1.389,3.82H53.706a5.358,5.358,0,0,1,3.935,1.62A5.358,5.358,0,0,1,59.262,4.963ZM39.469,31.469a13.394,13.394,0,0,0,4.051-9.838,13.394,13.394,0,0,0-4.051-9.838,13.394,13.394,0,0,0-9.838-4.051,13.394,13.394,0,0,0-9.838,4.051,13.394,13.394,0,0,0-4.051,9.838,13.394,13.394,0,0,0,4.051,9.838,13.394,13.394,0,0,0,9.838,4.051A13.394,13.394,0,0,0,39.469,31.469Z"
          transform="translate(6 10)"
          fill="#fff"
        />
      </svg>
      <div style={{ textAlign: 'center' }}>
        <div>TAKE</div>
        <div>PHOTO</div>
      </div>
    </button>
  );
}
