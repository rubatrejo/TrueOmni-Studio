'use client';

import { useRef } from 'react';

export interface PlacedSticker {
  instanceId: string;
  stickerId: string;
  src: string;
  /** Centro en coordenadas del contenedor (photoRect) en px. */
  x: number;
  y: number;
  width: number;
  height: number;
  /** Para Ola 5+: rotation/scale. */
}

interface StickerLayerProps {
  stickers: PlacedSticker[];
  /** Rectángulo del área de la foto — usado para bound check en drag. */
  bounds: { width: number; height: number };
  onUpdate: (id: string, patch: Partial<PlacedSticker>) => void;
  onRemove: (id: string) => void;
}

/**
 * Capa DOM de stickers colocados sobre la foto. Cada sticker es
 * draggable con pointer events nativos (patrón de `guestbook-pin-rail`).
 * Double-tap elimina el sticker.
 *
 * Los stickers son DOM (no canvas) hasta que el usuario pulsa Share;
 * ahí `composeFinal` los cuece en el blob final.
 */
export function StickerLayer({ stickers, bounds, onUpdate, onRemove }: StickerLayerProps) {
  const draggingRef = useRef<{ id: string; offsetX: number; offsetY: number } | null>(null);

  const onPointerDown = (e: React.PointerEvent, s: PlacedSticker) => {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    draggingRef.current = {
      id: s.instanceId,
      offsetX: e.clientX - rect.left - s.width / 2,
      offsetY: e.clientY - rect.top - s.height / 2,
    };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const d = draggingRef.current;
    if (!d) return;
    const parent = (e.currentTarget as HTMLElement).parentElement;
    if (!parent) return;
    const pRect = parent.getBoundingClientRect();
    // Convertir a coords relativas al parent, compensando por el scale del kiosk-canvas.
    const scale = pRect.width / bounds.width;
    const x = (e.clientX - pRect.left) / scale - d.offsetX;
    const y = (e.clientY - pRect.top) / scale - d.offsetY;
    onUpdate(d.id, {
      x: Math.max(0, Math.min(bounds.width, x)),
      y: Math.max(0, Math.min(bounds.height, y)),
    });
  };

  const onPointerUp = (e: React.PointerEvent) => {
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    draggingRef.current = null;
  };

  return (
    <>
      {stickers.map((s) => (
        <button
          key={s.instanceId}
          type="button"
          onPointerDown={(e) => onPointerDown(e, s)}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onDoubleClick={() => onRemove(s.instanceId)}
          aria-label="Move sticker (double-tap to remove)"
          className="absolute"
          style={{
            left: s.x - s.width / 2,
            top: s.y - s.height / 2,
            width: s.width,
            height: s.height,
            padding: 0,
            border: 'none',
            background: 'transparent',
            cursor: 'grab',
            touchAction: 'none',
            filter: 'drop-shadow(0 4px 8px hsl(var(--photo-sticker-shadow) / 0.25))',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={s.src}
            alt=""
            draggable={false}
            style={{ width: '100%', height: '100%', pointerEvents: 'none' }}
          />
        </button>
      ))}
    </>
  );
}
