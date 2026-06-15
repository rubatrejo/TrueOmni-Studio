'use client';

import { forwardRef, useEffect, useRef } from 'react';

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
 * El carrusel de frames es scrollable horizontalmente. El frame SELECCIONADO
 * crece, recibe un borde de color brand y muestra DENTRO el botón "TAKE PHOTO"
 * (icono + texto): se dispara la foto tocando el propio frame elegido (feedback
 * de Rubén 2026-06-15 — ya no hay un shutter fijo separado en el centro). Home
 * button alineado al `top:1000` (consistente con `FloatingHomeButton`).
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
  const CAROUSEL_HEIGHT = 300;

  const scrollRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    // Centrar en la vista el frame seleccionado (es el que muestra el shutter).
    const el = scrollRef.current;
    const sel = selectedRef.current;
    if (!el) return;
    if (sel) {
      el.scrollLeft = sel.offsetLeft - (el.clientWidth - sel.offsetWidth) / 2;
    } else {
      el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2;
    }
  }, [frames.length, selectedFrameId]);

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
          <linearGradient
            id="pb-bottom-fade"
            x1="0.5"
            x2="0.5"
            y2="1"
            gradientUnits="objectBoundingBox"
          >
            <stop offset="0" stopColor="hsl(var(--brand-primary))" stopOpacity={0} />
            <stop offset="1" stopColor="hsl(var(--brand-primary))" stopOpacity={1} />
          </linearGradient>
        </defs>
        <rect x={0} y={0} width={1091} height={287} opacity={0.55} fill="url(#pb-bottom-fade)" />
      </svg>

      {/* Home button — mismo patrón que `FloatingHomeButton` (top:1000,
          116×232, rounded right, hsl(var(--brand-primary)) tokenizado). */}
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
            padding: '0 420px', // aire a los lados para poder centrar cualquier frame
            width: 'max-content',
          }}
        >
          {frames.map((frame) => {
            const selected = selectedFrameId === frame.id;
            return (
              <FrameThumb
                key={frame.id}
                ref={selected ? selectedRef : undefined}
                frame={frame}
                selected={selected}
                ariaShutter={ariaShutter}
                onSelect={() => onSelectFrame(frame.id)}
                onShoot={onStart}
              />
            );
          })}
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
  ariaShutter: string;
  onSelect: () => void;
  onShoot: () => void;
}

const THUMB_SIZE = 200;
const THUMB_SELECTED_SIZE = 264;

/**
 * Thumbnail de frame en el carrusel. El SELECCIONADO crece, su borde se pinta
 * con el color brand (`--photo-tabs-bg`) y muestra encima el shutter "TAKE
 * PHOTO" (icono + texto): tocarlo dispara la foto con ese frame. Los no
 * seleccionados, al tocarlos, solo se seleccionan.
 */
const FrameThumb = forwardRef<HTMLButtonElement, FrameThumbProps>(function FrameThumb(
  { frame, selected, ariaShutter, onSelect, onShoot },
  ref,
) {
  const size = selected ? THUMB_SELECTED_SIZE : THUMB_SIZE;
  return (
    <button
      ref={ref}
      type="button"
      aria-label={selected ? ariaShutter : frame.label}
      onClick={selected ? onShoot : onSelect}
      style={{
        position: 'relative',
        flex: '0 0 auto',
        width: size,
        height: size,
        padding: 0,
        borderRadius: '50%',
        border: selected ? '10px solid hsl(var(--photo-tabs-bg))' : '10px solid #fff',
        background: '#fff',
        overflow: 'hidden',
        boxShadow: selected
          ? '0 0 0 4px #fff, 0 0 36px 10px hsl(var(--photo-tabs-bg) / 0.55)'
          : undefined,
        transition: 'width 0.18s ease-out, height 0.18s ease-out, border-color 0.18s ease-out',
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={frame.resolvedThumbnail}
        alt=""
        draggable={false}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />
      {selected && (
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            background: 'rgba(0,0,0,0.42)',
            color: '#fff',
            fontFamily: "'Open Sans', system-ui",
            fontSize: 24,
            fontWeight: 700,
            lineHeight: 1.1,
            textShadow: '0 2px 6px rgba(0,0,0,0.45)',
          }}
        >
          <svg width={66} height={57} viewBox="0 0 72 62" aria-hidden="true">
            <path
              d="M59.262,4.963V38.3a5.358,5.358,0,0,1-1.62,3.935,5.358,5.358,0,0,1-3.935,1.62H5.556a5.358,5.358,0,0,1-3.935-1.62A5.358,5.358,0,0,1,0,38.3V4.963A5.358,5.358,0,0,1,1.62,1.028,5.358,5.358,0,0,1,5.556-0.592H15.741l1.389-3.82a6.7,6.7,0,0,1,1.215-1.852,5.426,5.426,0,0,1,1.794-1.273,5.355,5.355,0,0,1,2.2-.463H36.923a5.278,5.278,0,0,1,3.125.984,6.033,6.033,0,0,1,2.083,2.6l1.389,3.82H53.706a5.358,5.358,0,0,1,3.935,1.62A5.358,5.358,0,0,1,59.262,4.963ZM39.469,31.469a13.394,13.394,0,0,0,4.051-9.838,13.394,13.394,0,0,0-4.051-9.838,13.394,13.394,0,0,0-9.838-4.051,13.394,13.394,0,0,0-9.838,4.051,13.394,13.394,0,0,0-4.051,9.838,13.394,13.394,0,0,0,4.051,9.838,13.394,13.394,0,0,0,9.838,4.051A13.394,13.394,0,0,0,39.469,31.469Z"
              transform="translate(6 10)"
              fill="#fff"
            />
          </svg>
          <span style={{ textAlign: 'center' }}>
            TAKE
            <br />
            PHOTO
          </span>
        </span>
      )}
    </button>
  );
});
