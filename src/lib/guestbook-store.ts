'use client';

import { useCallback, useEffect, useSyncExternalStore } from 'react';

/**
 * Pin dejado por el usuario actual en su sesión. Persiste en
 * `sessionStorage` (bucket `kiosk_guestbook_user_pins`). Al cerrar la
 * pestaña del kiosk se limpia — backend real se implementará en Fase 5+.
 */
export interface GuestbookUserPin {
  id: string;
  authorName: string;
  zipCode: string;
  coords: { lat: number; lng: number };
  /** ID del pin del catálogo usado. */
  pinOptionId: string;
  /** Path/URL del avatar (copiado del pinOption al momento de crear). */
  pinImage: string;
  comment?: string;
  /** ISO timestamp de cuando se creó. */
  createdAt: string;
  /** Dirección legible (usada en el modal del pin). */
  address?: string;
}

const STORAGE_KEY = 'kiosk_guestbook_user_pins';
const EMPTY: readonly GuestbookUserPin[] = Object.freeze([]);

let current: readonly GuestbookUserPin[] = EMPTY;
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

const getSnapshot = () => current;
const getServerSnapshot = () => EMPTY;

function readFromStorage(): readonly GuestbookUserPin[] {
  if (typeof window === 'undefined') return EMPTY;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    if (!Array.isArray(parsed)) return EMPTY;
    return parsed.filter(
      (p): p is GuestbookUserPin =>
        typeof p === 'object' &&
        p != null &&
        typeof (p as GuestbookUserPin).id === 'string' &&
        typeof (p as GuestbookUserPin).authorName === 'string',
    );
  } catch {
    return EMPTY;
  }
}

function writeToStorage(pins: readonly GuestbookUserPin[]) {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(pins));
  } catch {
    /* storage lleno/deshabilitado — ignorar */
  }
}

function hydrateIfNeeded() {
  if (hydrated || typeof window === 'undefined') return;
  hydrated = true;
  const fromStorage = readFromStorage();
  if (fromStorage.length > 0) {
    current = fromStorage;
    notify();
  }
}

export function addUserPin(pin: GuestbookUserPin) {
  current = [...current, pin];
  writeToStorage(current);
  notify();
}

export function clearUserPins() {
  if (current.length === 0) return;
  current = EMPTY;
  writeToStorage(EMPTY);
  notify();
}

/** Hook para leer los pins del usuario actual con reactividad. */
export function useGuestbookUserPins() {
  const pins = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    hydrateIfNeeded();
  }, []);

  const add = useCallback((p: GuestbookUserPin) => addUserPin(p), []);
  const clear = useCallback(() => clearUserPins(), []);

  return { pins, add, clear };
}
