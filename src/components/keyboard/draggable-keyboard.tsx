'use client';

import { Move } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';

/**
 * Wrapper draggable para los teclados on-screen del kiosk.
 *
 * Layout:
 *   - Wrapper con `position: absolute` dentro del padre (debe ser relative).
 *     Default: bottom-center, anclado al fondo del canvas.
 *   - Drag handle = botón flotante redondo en la esquina superior izquierda
 *     que sobresale por encima del keyboard. Icono Move + label aria. Color
 *     tokenizado, sombra, cursor grab.
 *   - Posición persistida en sessionStorage por `storageKey`.
 *   - Doble-click en el handle resetea a anchored bottom-center.
 *   - Bounded al rect del offsetParent (compensa el scale del kiosk canvas).
 */

export interface DraggableKeyboardProps {
  children: ReactNode;
  /** Clave de sessionStorage. Si no se da, no persiste. */
  storageKey?: string;
  /** Ancho del keyboard en px (para bounds). Default 1080. */
  width?: number;
  /** Alto total del keyboard en px (para bounds). Default 398. */
  height?: number;
  /** Z-index del wrapper. Default 90 (cubre overlays como Ask Anything pill). */
  zIndex?: number;
}

const DEFAULT_WIDTH = 1080;
const DEFAULT_HEIGHT = 398;
const HANDLE_SIZE = 64;
/** Overflow del handle por encima del keyboard. */
const HANDLE_OFFSET_TOP = 36;
/** Distancia desde el borde derecho del wrapper al handle. */
const HANDLE_OFFSET_RIGHT = 28;

interface Pos {
  x: number;
  y: number;
}

function readStored(storageKey: string | undefined): Pos | null {
  if (!storageKey || typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(storageKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Pos;
    if (typeof parsed.x === 'number' && typeof parsed.y === 'number') return parsed;
  } catch {
    // ignore
  }
  return null;
}

function writeStored(storageKey: string | undefined, pos: Pos | null) {
  if (!storageKey || typeof window === 'undefined') return;
  try {
    if (pos == null) window.sessionStorage.removeItem(storageKey);
    else window.sessionStorage.setItem(storageKey, JSON.stringify(pos));
  } catch {
    // ignore quota errors
  }
}

export function DraggableKeyboard({
  children,
  storageKey,
  width = DEFAULT_WIDTH,
  height = DEFAULT_HEIGHT,
  zIndex = 90,
}: DraggableKeyboardProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [pos, setPos] = useState<Pos | null>(() => readStored(storageKey));
  const dragStateRef = useRef<{
    pointerId: number;
    offsetX: number;
    offsetY: number;
  } | null>(null);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    writeStored(storageKey, pos);
  }, [storageKey, pos]);

  const onPointerMove = useCallback(
    (ev: PointerEvent) => {
      const drag = dragStateRef.current;
      if (!drag || ev.pointerId !== drag.pointerId) return;
      const wrapper = wrapperRef.current;
      const parent = wrapper?.offsetParent as HTMLElement | null;
      if (!parent) return;
      const parentRect = parent.getBoundingClientRect();
      const scaleX = parentRect.width / parent.clientWidth || 1;
      const scaleY = parentRect.height / parent.clientHeight || 1;
      const localX = (ev.clientX - parentRect.left) / scaleX - drag.offsetX;
      const localY = (ev.clientY - parentRect.top) / scaleY - drag.offsetY;
      const maxX = parent.clientWidth - width;
      // Reservar espacio arriba para que el handle no se salga del canvas.
      const minY = HANDLE_OFFSET_TOP;
      const maxY = parent.clientHeight - height;
      const x = Math.max(0, Math.min(maxX, localX));
      const y = Math.max(minY, Math.min(maxY, localY));
      setPos({ x, y });
    },
    [width, height],
  );

  const endDrag = useCallback(() => {
    dragStateRef.current = null;
    setDragging(false);
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', endDrag);
    window.removeEventListener('pointercancel', endDrag);
  }, [onPointerMove]);

  const onHandlePointerDown = useCallback(
    (ev: React.PointerEvent<HTMLButtonElement>) => {
      const wrapper = wrapperRef.current;
      const parent = wrapper?.offsetParent as HTMLElement | null;
      if (!wrapper || !parent) return;
      const wrapperRect = wrapper.getBoundingClientRect();
      const parentRect = parent.getBoundingClientRect();
      const scaleX = parentRect.width / parent.clientWidth || 1;
      const scaleY = parentRect.height / parent.clientHeight || 1;
      const localLeft = (wrapperRect.left - parentRect.left) / scaleX;
      const localTop = (wrapperRect.top - parentRect.top) / scaleY;
      const offsetX = (ev.clientX - wrapperRect.left) / scaleX;
      const offsetY = (ev.clientY - wrapperRect.top) / scaleY;
      setPos({ x: localLeft, y: localTop });
      dragStateRef.current = { pointerId: ev.pointerId, offsetX, offsetY };
      setDragging(true);
      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', endDrag);
      window.addEventListener('pointercancel', endDrag);
      ev.preventDefault();
    },
    [onPointerMove, endDrag],
  );

  // Cleanup
  useEffect(() => {
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', endDrag);
      window.removeEventListener('pointercancel', endDrag);
    };
  }, [onPointerMove, endDrag]);

  const wrapperStyle = useMemo<React.CSSProperties>(() => {
    if (pos) {
      return {
        position: 'absolute',
        left: `${pos.x}px`,
        top: `${pos.y}px`,
        width: `${width}px`,
        zIndex,
      };
    }
    return {
      position: 'absolute',
      left: '50%',
      bottom: 0,
      transform: 'translateX(-50%)',
      width: `${width}px`,
      zIndex,
    };
  }, [pos, width, zIndex]);

  return (
    <div ref={wrapperRef} style={wrapperStyle}>
      <button
        type="button"
        aria-label="Mover teclado"
        title="Mover teclado (doble-click para anclar)"
        onPointerDown={onHandlePointerDown}
        onDoubleClick={() => setPos(null)}
        className="absolute flex items-center justify-center focus:outline-none focus-visible:ring-4 focus-visible:ring-white/60"
        style={{
          top: `-${HANDLE_OFFSET_TOP}px`,
          right: `${HANDLE_OFFSET_RIGHT}px`,
          width: `${HANDLE_SIZE}px`,
          height: `${HANDLE_SIZE}px`,
          backgroundColor: 'hsl(var(--keyboard-handle-bg))',
          color: 'hsl(var(--keyboard-handle-fg))',
          borderRadius: '50%',
          boxShadow:
            '0 6px 18px rgba(0,0,0,0.28), 0 0 0 4px hsl(var(--keyboard-bg)) inset',
          cursor: dragging ? 'grabbing' : 'grab',
          touchAction: 'none',
          userSelect: 'none',
          zIndex: 1,
        }}
      >
        <Move size={26} strokeWidth={2.6} />
      </button>
      {children}
    </div>
  );
}
