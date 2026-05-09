'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import type { ItineraryStopKind } from './config';
import type { ItineraryCatalogItem } from './itinerary-catalog';

/**
 * Drag & drop del Trip Builder con threshold de movimiento.
 *
 * El drag NO se activa visualmente al pointerdown — solo se arma. Si el
 * pointer se mueve más de `MOVE_THRESHOLD` px, se activa el drag (drag-ghost
 * aparece, el flag `isDragging` pasa a true). Esto permite que clicks/taps y
 * scroll del sidebar de listings convivan con el drag sin conflictos.
 *
 * Patrón: listeners en window al primer pointerdown (no via useEffect, para
 * no perder eventos entre setState y next render). Estado activo en `useRef`
 * para evitar stale closures durante el gesto.
 */

export type DragPayload =
  | { type: 'card'; item: ItineraryCatalogItem }
  | {
      type: 'stop';
      slug: string;
      kind: ItineraryStopKind;
      fromIndex: number;
      thumbnail: string | null;
      title: string;
    };

export interface DropTargetInfo {
  overRail: boolean;
  slotIndex: number | null;
}

export interface UseItineraryDndResult {
  isDragging: boolean;
  cursorPos: { x: number; y: number } | null;
  dragPayload: DragPayload | null;
  startDragCard: (item: ItineraryCatalogItem, ev: React.PointerEvent) => void;
  startDragStop: (
    payload: Omit<Extract<DragPayload, { type: 'stop' }>, 'type'>,
    ev: React.PointerEvent,
  ) => void;
}

export interface UseItineraryDndOptions {
  onDrop: (payload: DragPayload, target: DropTargetInfo) => void;
}

const RAIL_DATA_ATTR = 'data-itinerary-rail';
const SLOT_DATA_ATTR = 'data-itinerary-slot';
const MOVE_THRESHOLD = 6;

const detectDropTarget = (clientX: number, clientY: number): DropTargetInfo => {
  const els = document.elementsFromPoint(clientX, clientY);
  const slotEl = els.find(
    (el): el is HTMLElement => el instanceof HTMLElement && el.hasAttribute(SLOT_DATA_ATTR),
  );
  const railEl = els.find(
    (el): el is HTMLElement => el instanceof HTMLElement && el.hasAttribute(RAIL_DATA_ATTR),
  );
  const slotIndex = slotEl
    ? Number.parseInt(slotEl.getAttribute(SLOT_DATA_ATTR) ?? '-1', 10)
    : null;
  return {
    overRail: !!railEl,
    slotIndex:
      Number.isFinite(slotIndex) && slotIndex !== null && slotIndex >= 0 ? slotIndex : null,
  };
};

export function useItineraryDnd(options: UseItineraryDndOptions): UseItineraryDndResult {
  const onDropRef = useRef(options.onDrop);
  useEffect(() => {
    onDropRef.current = options.onDrop;
  }, [options.onDrop]);

  const [isDragging, setIsDragging] = useState(false);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);
  const [dragPayload, setDragPayload] = useState<DragPayload | null>(null);

  const dragPayloadRef = useRef<DragPayload | null>(null);
  const startPosRef = useRef<{ x: number; y: number } | null>(null);
  const armedRef = useRef(false);
  const activeRef = useRef(false);
  const listenersRef = useRef<{
    move: (ev: PointerEvent) => void;
    up: (ev: PointerEvent) => void;
    cancel: (ev: PointerEvent) => void;
  } | null>(null);

  const cleanup = useCallback(() => {
    if (listenersRef.current) {
      window.removeEventListener('pointermove', listenersRef.current.move);
      window.removeEventListener('pointerup', listenersRef.current.up);
      window.removeEventListener('pointercancel', listenersRef.current.cancel);
      listenersRef.current = null;
    }
    setIsDragging(false);
    setCursorPos(null);
    setDragPayload(null);
    dragPayloadRef.current = null;
    startPosRef.current = null;
    armedRef.current = false;
    activeRef.current = false;
  }, []);

  const arm = useCallback(
    (payload: DragPayload, x: number, y: number) => {
      dragPayloadRef.current = payload;
      startPosRef.current = { x, y };
      armedRef.current = true;
      activeRef.current = false;

      const move = (ev: PointerEvent) => {
        const p = dragPayloadRef.current;
        const start = startPosRef.current;
        if (!p || !start) return;
        // Activación tras superar el threshold.
        if (!activeRef.current) {
          const dx = ev.clientX - start.x;
          const dy = ev.clientY - start.y;
          if (Math.hypot(dx, dy) >= MOVE_THRESHOLD) {
            activeRef.current = true;
            setIsDragging(true);
            setDragPayload(p);
          }
        }
        if (activeRef.current) {
          setCursorPos({ x: ev.clientX, y: ev.clientY });
        }
      };
      const up = (ev: PointerEvent) => {
        const p = dragPayloadRef.current;
        if (p && activeRef.current) {
          const target = detectDropTarget(ev.clientX, ev.clientY);
          onDropRef.current(p, target);
        }
        // Si nunca activó (movement < threshold) → fue tap, no drop.
        cleanup();
      };
      const cancel = () => cleanup();

      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', up);
      window.addEventListener('pointercancel', cancel);
      listenersRef.current = { move, up, cancel };
    },
    [cleanup],
  );

  useEffect(() => {
    return () => cleanup();
  }, [cleanup]);

  const startDragCard = useCallback(
    (item: ItineraryCatalogItem, ev: React.PointerEvent) => {
      if (ev.button !== 0 && ev.pointerType === 'mouse') return;
      arm({ type: 'card', item }, ev.clientX, ev.clientY);
    },
    [arm],
  );

  const startDragStop = useCallback(
    (payload: Omit<Extract<DragPayload, { type: 'stop' }>, 'type'>, ev: React.PointerEvent) => {
      if (ev.button !== 0 && ev.pointerType === 'mouse') return;
      arm({ type: 'stop', ...payload }, ev.clientX, ev.clientY);
    },
    [arm],
  );

  return { isDragging, cursorPos, dragPayload, startDragCard, startDragStop };
}
