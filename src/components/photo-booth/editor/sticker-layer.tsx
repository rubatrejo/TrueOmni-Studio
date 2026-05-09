'use client';

import { useEffect, useRef, useState } from 'react';

export interface PlacedSticker {
  instanceId: string;
  stickerId: string;
  src: string;
  /** Centro en coordenadas del contenedor (photoRect) en px. */
  x: number;
  y: number;
  width: number;
  height: number;
}

interface StickerLayerProps {
  stickers: PlacedSticker[];
  /** Rectángulo del área de la foto — usado para bound check en drag/resize. */
  bounds: { width: number; height: number };
  onUpdate: (id: string, patch: Partial<PlacedSticker>) => void;
  onRemove: (id: string) => void;
}

const HANDLE_SIZE = 56;
const MIN_W = 80;
const MAX_W = 600;

/**
 * Capa DOM de stickers colocados sobre la foto. Cada sticker:
 *   - Tap simple → selecciona (muestra handles).
 *   - Drag del cuerpo → mover.
 *   - Drag del handle bottom-right → escalar (mantiene aspect-ratio).
 *   - Tap en botón [×] top-right → eliminar.
 *   - Tap fuera → deseleccionar.
 *
 * Los stickers son DOM (no canvas) hasta que el usuario pulsa Share;
 * ahí `composeFinal` los cuece en el blob final.
 */
export function StickerLayer({ stickers, bounds, onUpdate, onRemove }: StickerLayerProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Modo activo del gesto en curso. `move` = drag del cuerpo; `resize` =
  // drag del handle BR. Cuando es null no hay gesto activo.
  const gestureRef = useRef<
    | { mode: 'move'; id: string; offsetX: number; offsetY: number }
    | {
        mode: 'resize';
        id: string;
        startW: number;
        startCX: number;
        startCY: number;
        aspect: number;
      }
    | null
  >(null);

  // Listeners window-level únicos (patrón Guestbook): el ref evita stale closures.
  const stickersRef = useRef(stickers);
  useEffect(() => {
    stickersRef.current = stickers;
  }, [stickers]);
  const onUpdateRef = useRef(onUpdate);
  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);
  const boundsRef = useRef(bounds);
  useEffect(() => {
    boundsRef.current = bounds;
  }, [bounds]);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const g = gestureRef.current;
      if (!g) return;
      // Necesitamos el parent (photo container) para convertir client coords
      // a coords del photoRect (compensando scale del kiosk).
      const parent = document.querySelector(
        '[data-photo-stickers-container]',
      ) as HTMLElement | null;
      if (!parent) return;
      const pRect = parent.getBoundingClientRect();
      const b = boundsRef.current;
      const scaleX = pRect.width / b.width;
      const scaleY = pRect.height / b.height;
      const px = (e.clientX - pRect.left) / scaleX;
      const py = (e.clientY - pRect.top) / scaleY;

      if (g.mode === 'move') {
        const x = Math.max(0, Math.min(b.width, px - g.offsetX));
        const y = Math.max(0, Math.min(b.height, py - g.offsetY));
        onUpdateRef.current(g.id, { x, y });
      } else {
        // resize: distancia del centro al cursor → nuevo width.
        const dx = px - g.startCX;
        const dy = py - g.startCY;
        // Diagonal distance → escala lineal del width inicial.
        const dist = Math.sqrt(dx * dx + dy * dy);
        // Diagonal del rect inicial: sqrt(2) * (startW/2).
        const startDiag = (g.startW / 2) * Math.SQRT2;
        const scale = startDiag === 0 ? 1 : dist / startDiag;
        const newW = Math.max(MIN_W, Math.min(MAX_W, g.startW * scale));
        const newH = newW / g.aspect;
        onUpdateRef.current(g.id, { width: newW, height: newH });
      }
    };
    const onUp = () => {
      gestureRef.current = null;
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, []);

  // Tap en background del photo container → deseleccionar.
  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement;
      // Si click sucedió fuera de cualquier sticker o handle, desseleccionar.
      if (!target.closest('[data-sticker-instance]')) {
        setSelectedId(null);
      }
    };
    window.addEventListener('pointerdown', onPointerDown, true);
    return () => window.removeEventListener('pointerdown', onPointerDown, true);
  }, []);

  const startMove = (e: React.PointerEvent, s: PlacedSticker) => {
    e.stopPropagation();
    setSelectedId(s.instanceId);
    const parent = (e.currentTarget as HTMLElement).closest(
      '[data-photo-stickers-container]',
    ) as HTMLElement | null;
    if (!parent) return;
    const pRect = parent.getBoundingClientRect();
    const scaleX = pRect.width / bounds.width;
    const scaleY = pRect.height / bounds.height;
    const px = (e.clientX - pRect.left) / scaleX;
    const py = (e.clientY - pRect.top) / scaleY;
    gestureRef.current = {
      mode: 'move',
      id: s.instanceId,
      offsetX: px - s.x,
      offsetY: py - s.y,
    };
  };

  const startResize = (e: React.PointerEvent, s: PlacedSticker) => {
    e.stopPropagation();
    e.preventDefault();
    gestureRef.current = {
      mode: 'resize',
      id: s.instanceId,
      startW: s.width,
      startCX: s.x,
      startCY: s.y,
      aspect: s.width / Math.max(1, s.height),
    };
  };

  const handleDelete = (e: React.PointerEvent, s: PlacedSticker) => {
    e.stopPropagation();
    e.preventDefault();
    setSelectedId(null);
    onRemove(s.instanceId);
  };

  return (
    <>
      {stickers.map((s) => {
        const isSelected = s.instanceId === selectedId;
        return (
          <div
            key={s.instanceId}
            data-sticker-instance={s.instanceId}
            className="absolute"
            style={{
              left: s.x - s.width / 2,
              top: s.y - s.height / 2,
              width: s.width,
              height: s.height,
              touchAction: 'none',
              filter: 'drop-shadow(0 6px 12px rgba(0,0,0,0.32))',
            }}
          >
            {/* Body — tap selecciona, drag mueve */}
            <button
              type="button"
              onPointerDown={(e) => startMove(e, s)}
              aria-label={`Move ${s.stickerId}`}
              style={{
                width: '100%',
                height: '100%',
                padding: 0,
                border: isSelected ? '2px dashed hsl(var(--brand-secondary))' : 'none',
                borderRadius: 8,
                background: 'transparent',
                cursor: 'grab',
                display: 'block',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={s.src}
                alt=""
                draggable={false}
                style={{
                  width: '100%',
                  height: '100%',
                  pointerEvents: 'none',
                  objectFit: 'contain',
                }}
              />
            </button>

            {isSelected ? (
              <>
                {/* Delete button — top-right */}
                <button
                  type="button"
                  onPointerDown={(e) => handleDelete(e, s)}
                  aria-label="Remove sticker"
                  style={{
                    position: 'absolute',
                    top: -HANDLE_SIZE / 2,
                    right: -HANDLE_SIZE / 2,
                    width: HANDLE_SIZE,
                    height: HANDLE_SIZE,
                    borderRadius: '50%',
                    background: '#ef4444',
                    border: '4px solid #ffffff',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.35)',
                    color: '#ffffff',
                    fontSize: 28,
                    fontWeight: 800,
                    lineHeight: 1,
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    touchAction: 'none',
                  }}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      d="M6 6L18 18M18 6L6 18"
                      stroke="#ffffff"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>

                {/* Resize handle — bottom-right */}
                <button
                  type="button"
                  onPointerDown={(e) => startResize(e, s)}
                  aria-label="Resize sticker"
                  style={{
                    position: 'absolute',
                    bottom: -HANDLE_SIZE / 2,
                    right: -HANDLE_SIZE / 2,
                    width: HANDLE_SIZE,
                    height: HANDLE_SIZE,
                    borderRadius: '50%',
                    background: 'hsl(var(--brand-secondary))',
                    border: '4px solid #ffffff',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.35)',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'nwse-resize',
                    touchAction: 'none',
                  }}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      d="M21 9V3H15M3 15V21H9M21 3L13 11M3 21L11 13"
                      stroke="#ffffff"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      fill="none"
                    />
                  </svg>
                </button>
              </>
            ) : null}
          </div>
        );
      })}
    </>
  );
}
