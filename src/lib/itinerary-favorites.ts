'use client';

import { useCallback, useEffect, useState } from 'react';

import type { ItineraryStopKind } from './config';
import { useEventFavorites, useFavorites, useTrailFavorites } from './favorites';

/**
 * Hook unificado del rail del Trip Builder (Fase 3.17).
 *
 * Combina los tres buckets de favoritos existentes (`useFavorites`,
 * `useEventFavorites`, `useTrailFavorites`) en una lista ordenada de stops.
 * El orden se persiste en `sessionStorage` bajo `kiosk_itinerary_order`
 * porque los Sets de favoritos no preservan orden de inserción.
 *
 * Reglas:
 * - heart filled de un item en cualquier módulo === está en el rail.
 * - `add(slug, kind)` y `remove(slug, kind)` son idempotentes y operan sobre
 *   el bucket correspondiente.
 * - `reorder(from, to)` es solo cosmético (no toca los Sets).
 * - `clear()` vacía los 3 buckets + el order (= "Remove All" del toolbar).
 *
 * Cuando un favorite se añade desde otro módulo (ej. tap heart en
 * `/home/restaurants`), el effect de sincronización detecta la nueva entry
 * en el Set y la appendea al final del order.
 */

const ORDER_STORAGE_KEY = 'kiosk_itinerary_order';

export interface ItineraryRailEntry {
  slug: string;
  kind: ItineraryStopKind;
}

export interface UseItineraryRailResult {
  /** Stops del rail en orden de inserción/reorder. */
  stops: ItineraryRailEntry[];
  count: number;
  has: (slug: string, kind: ItineraryStopKind) => boolean;
  /** Idempotente — añade al bucket si no está. */
  add: (slug: string, kind: ItineraryStopKind) => void;
  /** Idempotente — quita del bucket si está. */
  remove: (slug: string, kind: ItineraryStopKind) => void;
  /** Reordena el array. No-op si los índices son inválidos o iguales. */
  reorder: (fromIndex: number, toIndex: number) => void;
  /** Vacía los 3 buckets + el order. */
  clear: () => void;
}

const entryKey = (slug: string, kind: ItineraryStopKind) => `${kind}:${slug}`;

const readOrderFromStorage = (): ItineraryRailEntry[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.sessionStorage.getItem(ORDER_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (e): e is ItineraryRailEntry =>
        typeof e === 'object' &&
        e !== null &&
        typeof (e as { slug?: unknown }).slug === 'string' &&
        ((e as { kind?: unknown }).kind === 'listing' ||
          (e as { kind?: unknown }).kind === 'event' ||
          (e as { kind?: unknown }).kind === 'trail'),
    );
  } catch {
    return [];
  }
};

const writeOrderToStorage = (order: ItineraryRailEntry[]) => {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(order));
  } catch {
    /* storage lleno o deshabilitado — ignorar */
  }
};

export function useItineraryRail(): UseItineraryRailResult {
  const list = useFavorites();
  const evts = useEventFavorites();
  const tr = useTrailFavorites();

  const [order, setOrder] = useState<ItineraryRailEntry[]>([]);

  useEffect(() => {
    setOrder(readOrderFromStorage());
  }, []);

  useEffect(() => {
    setOrder((prev) => {
      const surviving = prev.filter((e) => {
        const set =
          e.kind === 'listing'
            ? list.favorites
            : e.kind === 'event'
              ? evts.favorites
              : tr.favorites;
        return set.has(e.slug);
      });
      const seen = new Set(surviving.map((e) => entryKey(e.slug, e.kind)));
      const additions: ItineraryRailEntry[] = [];
      list.favorites.forEach((slug) => {
        if (!seen.has(entryKey(slug, 'listing'))) additions.push({ slug, kind: 'listing' });
      });
      evts.favorites.forEach((slug) => {
        if (!seen.has(entryKey(slug, 'event'))) additions.push({ slug, kind: 'event' });
      });
      tr.favorites.forEach((slug) => {
        if (!seen.has(entryKey(slug, 'trail'))) additions.push({ slug, kind: 'trail' });
      });
      if (surviving.length === prev.length && additions.length === 0) return prev;
      const next = [...surviving, ...additions];
      writeOrderToStorage(next);
      return next;
    });
  }, [list.favorites, evts.favorites, tr.favorites]);

  const has = useCallback(
    (slug: string, kind: ItineraryStopKind) => {
      const set =
        kind === 'listing' ? list.favorites : kind === 'event' ? evts.favorites : tr.favorites;
      return set.has(slug);
    },
    [list.favorites, evts.favorites, tr.favorites],
  );

  const add = useCallback(
    (slug: string, kind: ItineraryStopKind) => {
      const store = kind === 'listing' ? list : kind === 'event' ? evts : tr;
      if (!store.favorites.has(slug)) store.toggle(slug);
    },
    [list, evts, tr],
  );

  const remove = useCallback(
    (slug: string, kind: ItineraryStopKind) => {
      const store = kind === 'listing' ? list : kind === 'event' ? evts : tr;
      if (store.favorites.has(slug)) store.toggle(slug);
    },
    [list, evts, tr],
  );

  const reorder = useCallback((fromIndex: number, toIndex: number) => {
    setOrder((prev) => {
      if (
        fromIndex === toIndex ||
        fromIndex < 0 ||
        toIndex < 0 ||
        fromIndex >= prev.length ||
        toIndex >= prev.length
      ) {
        return prev;
      }
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      writeOrderToStorage(next);
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    list.clear();
    evts.clear();
    tr.clear();
    setOrder([]);
    writeOrderToStorage([]);
  }, [list, evts, tr]);

  return { stops: order, count: order.length, has, add, remove, reorder, clear };
}
