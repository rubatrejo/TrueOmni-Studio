'use client';

import Image from 'next/image';
import { createPortal } from 'react-dom';
import { useEffect, useState } from 'react';

import type { DragPayload } from '@/lib/use-itinerary-dnd';

export interface DragGhostProps {
  payload: DragPayload | null;
  cursor: { x: number; y: number } | null;
}

/**
 * Clone flotante que sigue al cursor durante un drag activo. Renderizado en
 * un Portal al body para que no quede recortado por el kiosk-canvas (1080×1920
 * con scale + overflow:hidden).
 */
export function DragGhost({ payload, cursor }: DragGhostProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  if (!mounted || !payload || !cursor) return null;

  const title = payload.type === 'card' ? payload.item.title : payload.title;
  const image = payload.type === 'card' ? payload.item.image : payload.thumbnail;

  return createPortal(
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        left: cursor.x,
        top: cursor.y,
        transform: 'translate(-50%, -50%) rotate(-2deg)',
        pointerEvents: 'none',
        zIndex: 9999,
        width: 200,
        height: 130,
        borderRadius: 12,
        overflow: 'hidden',
        boxShadow: '0 18px 38px rgba(0,0,0,0.45)',
        background: 'hsl(var(--itinerary-drag-ghost-bg))',
      }}
    >
      {image ? (
        <Image
          src={image}
          alt=""
          fill
          sizes="200px"
          className="object-cover"
          unoptimized
        />
      ) : null}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(180deg, rgba(0,0,0,0) 50%, rgba(0,0,0,0.75) 100%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 10,
          right: 10,
          bottom: 8,
          color: 'white',
          fontWeight: 600,
          fontSize: 14,
          textShadow: '0 2px 6px rgba(0,0,0,0.6)',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {title}
      </div>
    </div>,
    document.body,
  );
}
