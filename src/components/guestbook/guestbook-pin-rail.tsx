'use client';

import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';

import type { GuestbookPinOption } from '@/lib/config';

/**
 * Barra inferior horizontal con los 5 pins del catálogo del cliente,
 * dimensionada según mockup `5-Guestbook-Map_Pins_Draged.png`.
 *
 * Drag-and-drop:
 *   - `pointerdown` en el button: guardamos el offset cursor→tip del pin,
 *     marcamos `dragRef.current.active = true` y mostramos clone.
 *   - Listeners `pointermove`/`pointerup`/`pointercancel` a nivel `window`
 *     persistentes (montados una sola vez, no remontan). Leemos el estado
 *     del drag desde un ref, no del state → sin race conditions.
 *   - `pointerup`: reportamos al padre la posición de la punta del pin
 *     (cursor + offset). Si el padre acepta, abre el modal de comment.
 */

// Sizes — verbatim mockup.
const RAIL_PIN_H = 140;
const CLONE_H = 180;
// PNG natural ratio 113/183 ≈ 0.617 → width @ height 180 ≈ 111.
const CLONE_W = Math.round(CLONE_H * (113 / 183));

interface PinRailProps {
  title: string;
  subtitle: string;
  options: readonly GuestbookPinOption[];
  usedIds: readonly string[];
  onDrop: (optionId: string, clientX: number, clientY: number) => void;
  /** Contenido opcional debajo de la fila de pins (ej. botón FINISH). */
  finishSlot?: ReactNode;
}

export function GuestbookPinRail({
  title,
  subtitle,
  options,
  usedIds,
  onDrop,
  finishSlot,
}: PinRailProps) {
  return (
    <div
      className="flex w-full flex-col items-center"
      style={{
        backgroundColor: '#ffffff',
        paddingTop: '44px',
        paddingBottom: '56px',
      }}
    >
      <h3
        className="font-sans"
        style={{
          fontSize: '32px',
          lineHeight: '34px',
          fontWeight: 700,
          color: 'hsl(var(--brand-primary))',
          letterSpacing: '-0.01em',
          marginBottom: '10px',
        }}
      >
        {title}
      </h3>
      <p
        className="font-sans"
        style={{
          fontSize: '21px',
          lineHeight: '26px',
          color: '#6e6e6e',
          marginBottom: '30px',
        }}
      >
        {subtitle}
      </p>
      <div className="flex items-end justify-center" style={{ columnGap: '56px' }}>
        {options.map((o) => (
          <PinRailItem key={o.id} option={o} used={usedIds.includes(o.id)} onDrop={onDrop} />
        ))}
      </div>
      {finishSlot}
    </div>
  );
}

function PinRailItem({
  option,
  used,
  onDrop,
}: {
  option: GuestbookPinOption;
  used: boolean;
  onDrop: (optionId: string, clientX: number, clientY: number) => void;
}) {
  // Estado visible del clone durante drag.
  const [drag, setDrag] = useState<{ x: number; y: number } | null>(null);

  // Ref con el estado vivo del drag — inmune a stale closures en listeners.
  const dragRef = useRef<{
    active: boolean;
    offX: number;
    offY: number;
    pointerId: number | null;
  }>({
    active: false,
    offX: 0,
    offY: 0,
    pointerId: null,
  });

  const onDropRef = useRef(onDrop);
  useEffect(() => {
    onDropRef.current = onDrop;
  }, [onDrop]);

  const optionIdRef = useRef(option.id);
  useEffect(() => {
    optionIdRef.current = option.id;
  }, [option.id]);

  // Listeners persistentes a nivel window. Se montan UNA sola vez.
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const d = dragRef.current;
      if (!d.active) return;
      if (d.pointerId !== null && d.pointerId !== e.pointerId) return;
      setDrag({ x: e.clientX, y: e.clientY });
    };
    const onUp = (e: PointerEvent) => {
      const d = dragRef.current;
      if (!d.active) return;
      if (d.pointerId !== null && d.pointerId !== e.pointerId) return;
      // Pin tip está exactamente en el cursor (ver cloneStyle).
      const tipX = e.clientX;
      const tipY = e.clientY;
      d.active = false;
      d.pointerId = null;
      setDrag(null);
      onDropRef.current(optionIdRef.current, tipX, tipY);
    };
    const onCancel = () => {
      const d = dragRef.current;
      if (!d.active) return;
      d.active = false;
      d.pointerId = null;
      setDrag(null);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onCancel);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onCancel);
    };
  }, []);

  const startDrag = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (used) return;
    e.preventDefault();
    e.stopPropagation();
    dragRef.current = {
      active: true,
      offX: 0,
      offY: 0,
      pointerId: e.pointerId,
    };
    setDrag({ x: e.clientX, y: e.clientY });
  };

  // El kiosk tiene `transform: scale()` en un ancestro, lo que hace que
  // `position: fixed` del clone use al kiosk como containing block (no
  // al viewport). Por eso convertimos las coords del cursor (viewport)
  // a coords CSS del kiosk antes de posicionar — y usamos width/height
  // en CSS coords (el kiosk las escalará automáticamente al renderear).
  let cloneStyle: React.CSSProperties | null = null;
  if (drag) {
    const kioskEl = document.querySelector('[data-kiosk-canvas]') as HTMLElement | null;
    const kioskRect = kioskEl?.getBoundingClientRect();
    const scale = kioskEl
      ? (() => {
          const t = window.getComputedStyle(kioskEl).transform;
          if (t && t !== 'none') {
            const m = t.match(/matrix\(([-0-9.]+)/);
            if (m && m[1]) return parseFloat(m[1]);
          }
          return 1;
        })()
      : 1;
    const kx = kioskRect ? (drag.x - kioskRect.left) / scale : drag.x;
    const ky = kioskRect ? (drag.y - kioskRect.top) / scale : drag.y;
    cloneStyle = {
      left: `${kx - CLONE_W / 2}px`,
      top: `${ky - CLONE_H}px`,
      width: `${CLONE_W}px`,
      height: `${CLONE_H}px`,
    };
  }

  return (
    <>
      <button
        type="button"
        onPointerDown={startDrag}
        disabled={used}
        aria-label={option.label}
        className="focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-300"
        style={{
          height: `${RAIL_PIN_H}px`,
          opacity: used ? 0.25 : drag ? 0.3 : 1,
          cursor: used ? 'not-allowed' : 'grab',
          touchAction: 'none',
          backgroundColor: 'transparent',
          border: 'none',
          padding: 0,
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          transition: 'opacity 0.15s ease-out',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={option.image}
          alt={option.label}
          draggable={false}
          style={{
            height: `${RAIL_PIN_H}px`,
            width: 'auto',
            pointerEvents: 'none',
            filter: used ? 'grayscale(0.8)' : 'none',
            display: 'block',
          }}
        />
      </button>
      {cloneStyle ? (
        <div
          aria-hidden
          className="pointer-events-none fixed"
          style={{
            ...cloneStyle,
            zIndex: 70,
            filter: 'drop-shadow(0 12px 22px rgba(0,0,0,0.45))',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={option.image}
            alt=""
            draggable={false}
            style={{ width: '100%', height: '100%', display: 'block' }}
          />
        </div>
      ) : null}
    </>
  );
}
