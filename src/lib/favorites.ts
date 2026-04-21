'use client';

import { useCallback, useEffect, useSyncExternalStore } from 'react';

/**
 * Store global de favoritos persistido en `sessionStorage`.
 *
 * Se borra al cerrar la pestaña/kiosk — consistente con el comportamiento
 * esperado en un kiosk público (cada sesión de usuario = un recorrido).
 * El Itinerary Builder (fase posterior) consume los mismos slugs.
 *
 * Implementación con `useSyncExternalStore` para que cualquier componente
 * (card del grid, cell del detail, futuro itinerary) vea el mismo estado
 * sincrónicamente sin prop drilling.
 */

const STORAGE_KEY = 'kiosk_favorites';

const EMPTY_SET: ReadonlySet<string> = new Set();

let currentSet: ReadonlySet<string> = EMPTY_SET;
let hydrated = false;

const listeners = new Set<() => void>();

function notify() {
  for (const l of listeners) l();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return currentSet;
}

function getServerSnapshot() {
  return EMPTY_SET;
}

function readFromStorage(): ReadonlySet<string> {
  if (typeof window === 'undefined') return EMPTY_SET;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    if (!Array.isArray(parsed)) return EMPTY_SET;
    return new Set(parsed.filter((s): s is string => typeof s === 'string'));
  } catch {
    return EMPTY_SET;
  }
}

function writeToStorage(set: ReadonlySet<string>) {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify([...set]));
  } catch {
    /* storage lleno o deshabilitado — ignorar */
  }
}

function hydrateIfNeeded() {
  if (hydrated || typeof window === 'undefined') return;
  hydrated = true;
  const fromStorage = readFromStorage();
  if (fromStorage.size > 0) {
    currentSet = fromStorage;
    notify();
  }
}

function toggle(slug: string): 'added' | 'removed' {
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
  // Signal para toasts "añadido al itinerary"
  if (typeof window !== 'undefined' && action === 'added') {
    window.dispatchEvent(
      new CustomEvent('kiosk:favorite-added', { detail: { slug, count: next.size } }),
    );
  }
  return action;
}

function clear() {
  if (currentSet.size === 0) return;
  currentSet = EMPTY_SET;
  writeToStorage(EMPTY_SET);
  notify();
}

export interface UseFavoritesResult {
  /** Set readonly con slugs favoriteados. Cambia de referencia al toggle. */
  favorites: ReadonlySet<string>;
  isFavorited: (slug: string) => boolean;
  /** Toggle del slug; retorna la acción ('added' | 'removed') para feedback UI. */
  toggle: (slug: string) => 'added' | 'removed';
  clear: () => void;
}

export function useFavorites(): UseFavoritesResult {
  const set = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // Hydrate en cliente al primer mount. No-op si ya se hizo.
  useEffect(() => {
    hydrateIfNeeded();
  }, []);

  const isFavorited = useCallback((slug: string) => set.has(slug), [set]);

  return { favorites: set, isFavorited, toggle, clear };
}
