'use client';

import { useCallback, useEffect, useSyncExternalStore } from 'react';

/**
 * Factoría de stores de favoritos persistidos en `sessionStorage`.
 *
 * Se borra al cerrar la pestaña/kiosk — consistente con el comportamiento
 * esperado en un kiosk público (cada sesión de usuario = un recorrido).
 * El Itinerary Builder (fase posterior) consume los mismos slugs.
 *
 * Cada store es independiente (bucket propio). Usamos esto para tener
 * `kiosk_favorites` (listings) y `kiosk_event_favorites` (events) por
 * separado sin interferir.
 *
 * Implementación con `useSyncExternalStore` para que cualquier componente
 * (card del grid, cell del detail, futuro itinerary) vea el mismo estado
 * sincrónicamente sin prop drilling.
 */

const EMPTY_SET: ReadonlySet<string> = new Set();

export interface UseFavoritesResult {
  /** Set readonly con slugs favoriteados. Cambia de referencia al toggle. */
  favorites: ReadonlySet<string>;
  isFavorited: (slug: string) => boolean;
  /** Toggle del slug; retorna la acción ('added' | 'removed') para feedback UI. */
  toggle: (slug: string) => 'added' | 'removed';
  clear: () => void;
}

export interface FavoritesStore {
  useStore: () => UseFavoritesResult;
  toggle: (slug: string) => 'added' | 'removed';
  clear: () => void;
  /** Tipo del bucket (usado por el CustomEvent). */
  kind: string;
}

function createFavoritesStore(options: { storageKey: string; kind: string }): FavoritesStore {
  const { storageKey, kind } = options;

  let currentSet: ReadonlySet<string> = EMPTY_SET;
  let hydrated = false;
  const listeners = new Set<() => void>();

  const notify = () => {
    for (const l of listeners) l();
  };
  const subscribe = (l: () => void) => {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  };
  const getSnapshot = () => currentSet;
  const getServerSnapshot = () => EMPTY_SET;

  const readFromStorage = (): ReadonlySet<string> => {
    if (typeof window === 'undefined') return EMPTY_SET;
    try {
      const raw = window.sessionStorage.getItem(storageKey);
      const parsed = raw ? (JSON.parse(raw) as unknown) : [];
      if (!Array.isArray(parsed)) return EMPTY_SET;
      return new Set(parsed.filter((s): s is string => typeof s === 'string'));
    } catch {
      return EMPTY_SET;
    }
  };

  const writeToStorage = (set: ReadonlySet<string>) => {
    if (typeof window === 'undefined') return;
    try {
      window.sessionStorage.setItem(storageKey, JSON.stringify([...set]));
    } catch {
      /* storage lleno o deshabilitado — ignorar */
    }
  };

  const hydrateIfNeeded = () => {
    if (hydrated || typeof window === 'undefined') return;
    hydrated = true;
    const fromStorage = readFromStorage();
    if (fromStorage.size > 0) {
      currentSet = fromStorage;
      notify();
    }
  };

  const toggle = (slug: string): 'added' | 'removed' => {
    const next = new Set(currentSet);
    let action: 'added' | 'removed';
    if (next.has(slug)) {
      next.delete(slug);
      action = 'removed';
    } else {
      next.add(slug);
      action = 'added';
    }
    currentSet = next;
    writeToStorage(next);
    notify();
    if (typeof window !== 'undefined' && action === 'added') {
      window.dispatchEvent(
        new CustomEvent('kiosk:favorite-added', {
          detail: { slug, count: next.size, kind },
        }),
      );
    }
    return action;
  };

  const clear = () => {
    if (currentSet.size === 0) return;
    currentSet = EMPTY_SET;
    writeToStorage(EMPTY_SET);
    notify();
  };

  const useStore = (): UseFavoritesResult => {
    const set = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

    useEffect(() => {
      hydrateIfNeeded();
    }, []);

    const isFavorited = useCallback((slug: string) => set.has(slug), [set]);

    return { favorites: set, isFavorited, toggle, clear };
  };

  return { useStore, toggle, clear, kind };
}

/* -------------------------------------------------------------------------- */
/* Stores concretos                                                            */
/* -------------------------------------------------------------------------- */

const listingFavorites = createFavoritesStore({
  storageKey: 'kiosk_favorites',
  kind: 'listing',
});

const eventFavorites = createFavoritesStore({
  storageKey: 'kiosk_event_favorites',
  kind: 'event',
});

/** Hook del bucket de listings (retrocompatible con Fase 3.3). */
export const useFavorites = listingFavorites.useStore;

/** Hook del bucket de events (Fase 3.4). */
export const useEventFavorites = eventFavorites.useStore;
