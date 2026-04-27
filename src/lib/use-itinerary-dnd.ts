'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import type { ItineraryStopKind } from './config';
import type { ItineraryCatalogItem } from './itinerary-catalog';

/**
 * Estado del drag & drop del Itinerary Builder (Fase 3.17).
 *
 * Patrón verbatim de Photo Booth (`stickers-row.tsx` + `sticker-layer.tsx`):
 * los listeners pointermove/pointerup se registran en window al iniciar el
 * drag (no via useEffect, para no perder eventos entre el setState y el
 * próximo render). Estado en `useRef` para evitar stale closures.
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
  /** Si el pointer está sobre el rail. */
  overRail: boolean;
  /** Index del slot del rail bajo el pointer (0-based). null si no está sobre un slot. */
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
  // Listeners registrados, para poder removerlos en cleanup.
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
  }, []);

  const startCommon = useCallback(
    (payload: DragPayload, x: number, y: number) => {
      dragPayloadRef.current = payload;
      setDragPayload(payload);
      setCursorPos({ x, y });
      setIsDragging(true);

      const move = (ev: PointerEvent) => {
        setCursorPos({ x: ev.clientX, y: ev.clientY });
      };
      const up = (ev: PointerEvent) => {
        const p = dragPayloadRef.current;
        if (p) {
          const target = detectDropTarget(ev.clientX, ev.clientY);
          onDropRef.current(p, target);
        }
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

  // Cleanup al unmount.
  useEffect(() => {
    return () => cleanup();
  }, [cleanup]);

  const startDragCard = useCallback(
    (item: ItineraryCatalogItem, ev: React.PointerEvent) => {
      if (ev.button !== 0 && ev.pointerType === 'mouse') return;
      startCommon({ type: 'card', item }, ev.clientX, ev.clientY);
    },
    [startCommon],
  );

  const startDragStop = useCallback(
    (
      payload: Omit<Extract<DragPayload, { type: 'stop' }>, 'type'>,
      ev: React.PointerEvent,
    ) => {
      if (ev.button !== 0 && ev.pointerType === 'mouse') return;
      startCommon({ type: 'stop', ...payload }, ev.clientX, ev.clientY);
    },
    [startCommon],
  );

  return { isDragging, cursorPos, dragPayload, startDragCard, startDragStop };
}
