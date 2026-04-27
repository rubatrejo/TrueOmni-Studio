'use client';

import { useEffect, useRef, useState } from 'react';

import type { PhotoBoothSticker } from '@/lib/config';

interface StickersRowProps {
  stickers: Array<PhotoBoothSticker & { resolvedImage: string }>;
  /**
   * Llamado al soltar el sticker. `clientX/clientY` son coords del viewport
   * (no del kiosk-canvas). El consumidor decide si están dentro de la zona
   * de drop y convierte a sus propias coordenadas.
   */
  onDropAt: (
    sticker: PhotoBoothSticker & { resolvedImage: string },
    clientX: number,
    clientY: number,
  ) => void;
}

// Sizes verbatim del SVG: row 105×105 cada button.
const RAIL_H = 105;
// El clone durante drag se ve más grande para feedback claro.
const CLONE_SIZE = 200;

/**
 * Fila horizontal scrollable de stickers (y=455).
 *
 * Drag-and-drop tipo Guestbook:
 *   - `pointerdown` en un sticker → empieza drag con clone visible.
 *   - Listeners `pointermove`/`pointerup` a nivel `window` (montados una
 *     sola vez). El estado del drag vive en un ref → sin stale closures.
 *   - `pointerup` → reporta `(sticker, clientX, clientY)` al padre.
 *     El padre verifica si el drop está dentro del photo area y agrega
 *     el sticker en la posición exacta.
 *   - `pointercancel` → descarta el drag.
 */
export function StickersRow({ stickers, onDropAt }: StickersRowProps) {
  if (stickers.length === 0) return null;
  return (
    <div
      className="absolute overflow-x-auto"
      style={{
        left: 0,
        top: 455,
        width: 1080,
        height: 140,
        display: 'flex',
        alignItems: 'center',
        gap: 48,
        padding: '16px 48px',
        background: '#ffffff',
        scrollbarWidth: 'none',
      }}
    >
      {stickers.map((s) => (
        <StickerRailItem key={s.id} sticker={s} onDropAt={onDropAt} />
      ))}
    </div>
  );
}

function StickerRailItem({
  sticker,
  onDropAt,
}: {
  sticker: PhotoBoothSticker & { resolvedImage: string };
  onDropAt: (
    sticker: PhotoBoothSticker & { resolvedImage: string },
    clientX: number,
    clientY: number,
  ) => void;
}) {
  const [drag, setDrag] = useState<{ x: number; y: number } | null>(null);

  const dragRef = useRef<{ active: boolean; pointerId: number | null }>({
    active: false,
    pointerId: null,
  });

  const onDropRef = useRef(onDropAt);
  useEffect(() => {
    onDropRef.current = onDropAt;
  }, [onDropAt]);

  const stickerRef = useRef(sticker);
  useEffect(() => {
    stickerRef.current = sticker;
  }, [sticker]);

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
      d.active = false;
      d.pointerId = null;
      setDrag(null);
      onDropRef.current(stickerRef.current, e.clientX, e.clientY);
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
    e.preventDefault();
    e.stopPropagation();
    dragRef.current = { active: true, pointerId: e.pointerId };
    setDrag({ x: e.clientX, y: e.clientY });
  };

  // Compensar scale del kiosk-canvas (igual que guestbook-pin-rail).
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
      left: `${kx - CLONE_SIZE / 2}px`,
      top: `${ky - CLONE_SIZE / 2}px`,
      width: `${CLONE_SIZE}px`,
      height: `${CLONE_SIZE}px`,
    };
  }

  return (
    <>
      <button
        type="button"
        aria-label={sticker.label}
        onPointerDown={startDrag}
        style={{
          flex: '0 0 auto',
          width: RAIL_H,
          height: RAIL_H,
          padding: 0,
          border: 'none',
          background: 'transparent',
          cursor: 'grab',
          touchAction: 'none',
          opacity: drag ? 0.3 : 1,
          transition: 'opacity 0.15s ease-out',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={sticker.resolvedImage}
          alt=""
          draggable={false}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            pointerEvents: 'none',
          }}
        />
      </button>
      {cloneStyle ? (
        <div
          aria-hidden
          className="pointer-events-none fixed"
          style={{
            ...cloneStyle,
            zIndex: 80,
            filter: 'drop-shadow(0 14px 24px rgba(0,0,0,0.45))',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={sticker.resolvedImage}
            alt=""
            draggable={false}
            style={{ width: '100%', height: '100%', display: 'block' }}
          />
        </div>
      ) : null}
    </>
  );
}
